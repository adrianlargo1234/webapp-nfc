// Genera la voz de remotion/video.json y sus subtítulos palabra a palabra.
//
//   npm run video:tts                  Azure si hay AZURE_SPEECH_KEY, si no ElevenLabs si hay
//                                      ELEVENLABS_API_KEY (ambas en .env.local), si no SVOX Pico
//                                      (voz local, suena robótica)
//   TTS_ENGINE=azure|elevenlabs|pico|espeak  para forzar uno
//
// Azure (barata, capa gratis): AZURE_SPEECH_KEY, AZURE_SPEECH_REGION, AZURE_SPEECH_VOICE
// (es-ES-AlvaroNeural), AZURE_SPEECH_RATE (+12%), AZURE_SPEECH_PITCH, AZURE_SPEECH_STYLE.
// Devuelve el tiempo de cada palabra, así que los subtítulos salen exactos sin Whisper.
//
// ElevenLabs (voz tipo TikTok): ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID (voz de tu Voice Library),
// ELEVENLABS_MODEL (eleven_multilingual_v2 por defecto), ELEVENLABS_SPEED (1.1). Devuelve el tiempo
// de cada letra, así que los subtítulos salen exactos sin Whisper.
//
// Cada escena se sintetiza por separado, así que su `duration` pasa a ser la de su frase
// (+ una pausa) y los subtítulos quedan sincronizados escena a escena.
// Requiere ffmpeg. Pico: apt-get install libttspico-utils. espeak: espeak-ng.
// Para tu propia voz usa `npm run video:transcribe` (Whisper) en su lugar.
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { azureConfigFromEnv, speakAzure } from "./tts-azure.mjs";

const engine =
  process.env.TTS_ENGINE ??
  (process.env.AZURE_SPEECH_KEY ? "azure" : process.env.ELEVENLABS_API_KEY ? "elevenlabs" : "pico");
const voice = process.env.TTS_VOICE ?? (engine === "pico" ? "es-ES" : "es");
const speed = process.env.TTS_SPEED ?? "165";
const tempo = process.env.TTS_TEMPO ?? "1.12";
// Pausa tras cada frase (s). ElevenLabs ya deja un respiro al final de cada clip.
const neural = engine === "elevenlabs" || engine === "azure";
const GAP = Number(process.env.TTS_GAP ?? (neural ? 0.08 : 0.3));
const eleven = {
  key: process.env.ELEVENLABS_API_KEY,
  // "Adam", voz masculina prediseñada. Para acento de España elige una en la Voice Library.
  voiceId: process.env.ELEVENLABS_VOICE_ID ?? "pNInz6obpgDQGcFmaJgB",
  model: process.env.ELEVENLABS_MODEL ?? "eleven_multilingual_v2",
  speed: Number(process.env.ELEVENLABS_SPEED ?? 1.1),
};
if (engine === "elevenlabs" && !eleven.key) {
  console.error("Falta ELEVENLABS_API_KEY (ponla en .env.local).");
  process.exit(1);
}
const azure = azureConfigFromEnv();
if (engine === "azure" && (!azure.key || !azure.region)) {
  console.error("Faltan AZURE_SPEECH_KEY y/o AZURE_SPEECH_REGION (ponlas en .env.local).");
  process.exit(1);
}
const azureSdk = engine === "azure" ? await import("microsoft-cognitiveservices-speech-sdk") : null;

const root = process.cwd();
const configPath = path.join(root, "remotion", "video.json");
const publicDir = path.join(root, "public", "video");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tts-"));
fs.mkdirSync(publicDir, { recursive: true });

const run = (cmd, args) => execFileSync(cmd, args, { stdio: ["ignore", "pipe", "pipe"] }).toString();
const duration = (file) =>
  Number(run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]));
// Sintetiza, recorta el silencio de los extremos, acelera sin cambiar el tono y suaviza
// los bordes (sin clics al unir escenas).
const speak = (text, file) => {
  const raw = `${file}.raw.wav`;
  if (engine === "pico") run("pico2wave", ["-l", voice, "-w", raw, text]);
  else run("espeak-ng", ["-v", voice, "-s", speed, "-w", raw, text]);
  const trim = "silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.02";
  run("ffmpeg", [
    "-y", "-v", "error", "-i", raw,
    "-af", `${trim},areverse,${trim},afade=t=in:d=0.03,areverse,afade=t=in:d=0.01,atempo=${tempo}`,
    "-ar", "44100", "-ac", "1", file,
  ]);
  fs.rmSync(raw);
};

/**
 * ElevenLabs: guarda el audio en `file` (wav) y devuelve [inicio, fin] en segundos de cada
 * palabra, a partir de los tiempos por carácter de /with-timestamps.
 */
const speakEleven = async (text, file, previousText, nextText) => {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${eleven.voiceId}/with-timestamps?output_format=mp3_44100_128`;
  const body = {
    text,
    model_id: eleven.model,
    voice_settings: { stability: 0.4, similarity_boost: 0.8, style: 0.35, use_speaker_boost: true, speed: eleven.speed },
  };
  // Contexto de las frases vecinas para que la entonación fluya entre escenas.
  if (eleven.model !== "eleven_v3") {
    if (previousText) body.previous_text = previousText;
    if (nextText) body.next_text = nextText;
  }
  const res = await fetch(url, {
    method: "POST",
    headers: { "xi-api-key": eleven.key, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`);
  const json = await res.json();
  const mp3 = `${file}.mp3`;
  fs.writeFileSync(mp3, Buffer.from(json.audio_base64, "base64"));
  run("ffmpeg", ["-y", "-v", "error", "-i", mp3, "-ar", "44100", "-ac", "1", file]);
  fs.rmSync(mp3);

  const a = json.alignment;
  const words = [];
  let w = null;
  a.characters.forEach((ch, k) => {
    if (/\s/.test(ch)) {
      if (w) words.push(w);
      w = null;
    } else if (!w) w = [a.character_start_times_seconds[k], a.character_end_times_seconds[k]];
    else w[1] = a.character_end_times_seconds[k];
  });
  if (w) words.push(w);
  return words;
};

const tokenize = (say) => {
  const tokens = [];
  say.split(/(\*[^*]+\*)/).forEach((chunk) => {
    const hl = chunk.startsWith("*") && chunk.endsWith("*") && chunk.length > 2;
    (hl ? chunk.slice(1, -1) : chunk)
      .split(/\s+/)
      .filter(Boolean)
      .forEach((w) => {
        if (!hl && /^[.,:;!?…]+$/.test(w) && tokens.length) tokens[tokens.length - 1].text += w;
        else tokens.push({ text: w, hl });
      });
  });
  return tokens;
};
const plainText = (say) => tokenize(say).map((t) => t.text).join(" ");

const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const captions = [];
const padded = [];
let offset = 0;
let aligned = 0;

const pushCaption = (tok, from, to) =>
  captions.push({
    text: ` ${tok.hl ? `*${tok.text}*` : tok.text}`,
    startMs: Math.round((offset + from) * 1000),
    endMs: Math.round((offset + to) * 1000),
    timestampMs: Math.round((offset + (from + to) / 2) * 1000),
    confidence: null,
  });

const finishScene = (scene, clip, clipDur) => {
  scene.duration = Math.round((clipDur + GAP) * 100) / 100;
  const out = path.join(tmp, `pad-${padded.length}.wav`);
  run("ffmpeg", ["-y", "-v", "error", "-i", clip, "-af", "apad", "-t", String(scene.duration), "-ar", "44100", "-ac", "1", out]);
  padded.push(out);
  offset += scene.duration;
};

for (const [i, scene] of config.scenes.entries()) {
  const tokens = tokenize(scene.say);
  const plain = tokens.map((t) => t.text).join(" ");
  const clip = path.join(tmp, `scene-${i}.wav`);

  if (neural) {
    const prev = config.scenes[i - 1];
    const next = config.scenes[i + 1];
    const words =
      engine === "azure"
        ? await speakAzure(plain, clip, azure, azureSdk.default ?? azureSdk)
        : await speakEleven(plain, clip, prev && plainText(prev.say), next && plainText(next.say));
    const clipDur = duration(clip);
    if (words.length === tokens.length) {
      tokens.forEach((tok, j) => pushCaption(tok, words[j][0], words[j][1]));
      aligned++;
    } else {
      // No debería pasar: reparte en el tramo hablado.
      const from = words[0]?.[0] ?? 0;
      const to = words[words.length - 1]?.[1] ?? clipDur;
      tokens.forEach((tok, j) =>
        pushCaption(tok, from + ((to - from) * j) / tokens.length, from + ((to - from) * (j + 1)) / tokens.length),
      );
    }
    finishScene(scene, clip, clipDur);
    console.log(`  escena ${i + 1}/${config.scenes.length} ✓`);
    continue;
  }

  speak(plain, clip);
  const clipDur = duration(clip);

  // Peso de cada palabra = lo que dura sintetizada sola.
  const weights = tokens.map((t, j) => {
    const f = path.join(tmp, `w-${i}-${j}.wav`);
    speak(t.text.replace(/[¿¡]/g, ""), f);
    return Math.max(duration(f), 0.08);
  });
  // Tramos con voz del clip (separados por las pausas de comas y puntos).
  const silences = [];
  const det = spawnSync("ffmpeg", ["-hide_banner", "-i", clip, "-af", "silencedetect=n=-45dB:d=0.12", "-f", "null", "-"], {
    encoding: "utf8",
  }).stderr;
  for (const m of det.matchAll(/silence_start: ([\d.]+)[\s\S]*?silence_end: ([\d.]+)/g)) {
    silences.push([Number(m[1]), Number(m[2])]);
  }
  const segments = [];
  let segStart = 0;
  for (const [a, b] of silences) {
    if (a - segStart > 0.05) segments.push([segStart, a]);
    segStart = b;
  }
  if (clipDur - segStart > 0.05) segments.push([segStart, clipDur]);

  // Frases = grupos de palabras hasta una coma o un punto.
  const phrases = [];
  let cur = [];
  tokens.forEach((tok, j) => {
    cur.push(j);
    if (/[.,:;!?…]$/.test(tok.text)) {
      phrases.push(cur);
      cur = [];
    }
  });
  if (cur.length) phrases.push(cur);

  // Si cada frase tiene su tramo de voz, se reparte dentro de él; si no, en todo el clip.
  const groups =
    phrases.length === segments.length
      ? phrases.map((idx, k) => ({ idx, from: segments[k][0], to: segments[k][1] }))
      : [{ idx: tokens.map((_, j) => j), from: 0, to: clipDur }];

  for (const g of groups) {
    const total = g.idx.reduce((a, j) => a + weights[j], 0);
    let t = g.from;
    for (const j of g.idx) {
      const tok = tokens[j];
      const len = (weights[j] / total) * (g.to - g.from);
      pushCaption(tok, t, t + len);
      t += len;
    }
  }
  aligned += groups.length > 1 || phrases.length === 1 ? 1 : 0;
  finishScene(scene, clip, clipDur);
}

const list = path.join(tmp, "list.txt");
fs.writeFileSync(list, padded.map((f) => `file '${f}'`).join("\n"));
run("ffmpeg", ["-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", list, "-af", "loudnorm=I=-16:TP=-1.5", "-ar", "44100", "-b:a", "160k", path.join(publicDir, "voz.mp3")]);

fs.writeFileSync(path.join(publicDir, "captions.json"), JSON.stringify(captions, null, 2));

// SRT (útil para /yt-edit, /yt-chapters o para subirlo a TikTok).
const ts = (ms) => {
  const d = new Date(ms);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}:${String(d.getUTCSeconds()).padStart(2, "0")},${String(d.getUTCMilliseconds()).padStart(3, "0")}`;
};
const srt = captions
  .map((c, i) => `${i + 1}\n${ts(c.startMs)} --> ${ts(c.endMs)}\n${c.text.trim().replace(/\*/g, "")}\n`)
  .join("\n");
fs.writeFileSync(path.join(publicDir, "captions.srt"), srt);

config.audio = "video/voz.mp3";
config.captionsFile = "video/captions.json";
fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n");
fs.rmSync(tmp, { recursive: true, force: true });

console.log(`Voz: public/video/voz.mp3 (${offset.toFixed(2)} s, ${engine === "elevenlabs" ? `elevenlabs ${eleven.voiceId}` : engine === "azure" ? `azure ${azure.voice}` : `${engine} ${voice}`})`);
console.log(`Escenas alineadas por frases: ${aligned}/${config.scenes.length}`);
console.log(`Subtítulos: public/video/captions.json y captions.srt (${captions.length} palabras)`);
