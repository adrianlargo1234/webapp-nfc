// Genera una voz sintética para remotion/video.json y sus subtítulos palabra a palabra.
// Uso: npm run video:tts            (TTS_ENGINE=pico, TTS_TEMPO=1.12 por defecto)
//
// Cada escena se sintetiza por separado, así que su `duration` pasa a ser la de su frase
// (+ una pausa) y los subtítulos quedan sincronizados escena a escena. Dentro de cada frase,
// las palabras se reparten según lo que dura cada una sintetizada sola.
// Requiere ffmpeg y SVOX Pico (apt-get install libttspico-utils). Con TTS_ENGINE=espeak usa
// espeak-ng (TTS_VOICE, TTS_SPEED), que suena peor.
// Para tu propia voz usa `npm run video:transcribe` (Whisper) en su lugar.
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const engine = process.env.TTS_ENGINE ?? "pico";
const voice = process.env.TTS_VOICE ?? (engine === "pico" ? "es-ES" : "es");
const speed = process.env.TTS_SPEED ?? "165";
const tempo = process.env.TTS_TEMPO ?? "1.12";
const GAP = 0.3; // pausa tras cada frase (s)

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

const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const captions = [];
const padded = [];
let offset = 0;
let aligned = 0;

config.scenes.forEach((scene, i) => {
  // Palabras con su marca de resaltado (*palabra*).
  const tokens = [];
  scene.say.split(/(\*[^*]+\*)/).forEach((chunk) => {
    const hl = chunk.startsWith("*") && chunk.endsWith("*") && chunk.length > 2;
    (hl ? chunk.slice(1, -1) : chunk)
      .split(/\s+/)
      .filter(Boolean)
      .forEach((w) => {
        if (!hl && /^[.,:;!?…]+$/.test(w) && tokens.length) tokens[tokens.length - 1].text += w;
        else tokens.push({ text: w, hl });
      });
  });
  const plain = tokens.map((t) => t.text).join(" ");

  const clip = path.join(tmp, `scene-${i}.wav`);
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
      captions.push({
        text: ` ${tok.hl ? `*${tok.text}*` : tok.text}`,
        startMs: Math.round((offset + t) * 1000),
        endMs: Math.round((offset + t + len) * 1000),
        timestampMs: Math.round((offset + t + len / 2) * 1000),
        confidence: null,
      });
      t += len;
    }
  }
  aligned += groups.length > 1 || phrases.length === 1 ? 1 : 0;

  scene.duration = Math.round((clipDur + GAP) * 100) / 100;
  const out = path.join(tmp, `pad-${i}.wav`);
  run("ffmpeg", ["-y", "-v", "error", "-i", clip, "-af", "apad", "-t", String(scene.duration), "-ar", "44100", "-ac", "1", out]);
  padded.push(out);
  offset += scene.duration;
});

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

console.log(`Voz: public/video/voz.mp3 (${offset.toFixed(2)} s, ${engine} ${voice})`);
console.log(`Escenas alineadas por frases: ${aligned}/${config.scenes.length}`);
console.log(`Subtítulos: public/video/captions.json y captions.srt (${captions.length} palabras)`);
