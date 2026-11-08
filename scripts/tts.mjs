// Genera una voz sintética para remotion/video.json y sus subtítulos palabra a palabra.
// Uso: npm run video:tts            (TTS_VOICE=mb-es4 TTS_SPEED=165 por defecto)
//
// Cada escena se sintetiza por separado, así que su `duration` pasa a ser la de su frase
// (+ una pausa) y los subtítulos quedan sincronizados escena a escena. Dentro de cada frase,
// las palabras se reparten según lo que dura cada una sintetizada sola.
// Requiere espeak-ng (y mbrola + mbrola-es4 para la voz por defecto) y ffmpeg.
// Para tu propia voz usa `npm run video:transcribe` (Whisper) en su lugar.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const voice = process.env.TTS_VOICE ?? "mb-es4";
const speed = process.env.TTS_SPEED ?? "165";
const GAP = 0.25; // pausa tras cada frase (s)

const root = process.cwd();
const configPath = path.join(root, "remotion", "video.json");
const publicDir = path.join(root, "public", "video");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tts-"));
fs.mkdirSync(publicDir, { recursive: true });

const run = (cmd, args) => execFileSync(cmd, args, { stdio: ["ignore", "pipe", "pipe"] }).toString();
const duration = (file) =>
  Number(run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]));
const speak = (text, file) => run("espeak-ng", ["-v", voice, "-s", speed, "-w", file, text]);

const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const captions = [];
const padded = [];
let offset = 0;

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
    return Math.max(duration(f) - 0.12, 0.08);
  });
  const total = weights.reduce((a, b) => a + b, 0);
  const speechStart = 0.04;
  const speechEnd = Math.max(clipDur - 0.12, speechStart + 0.2);
  let t = speechStart;
  tokens.forEach((tok, j) => {
    const len = (weights[j] / total) * (speechEnd - speechStart);
    captions.push({
      text: ` ${tok.hl ? `*${tok.text}*` : tok.text}`,
      startMs: Math.round((offset + t) * 1000),
      endMs: Math.round((offset + t + len) * 1000),
      timestampMs: Math.round((offset + t + len / 2) * 1000),
      confidence: null,
    });
    t += len;
  });

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

console.log(`Voz: public/video/voz.mp3 (${offset.toFixed(2)} s, ${voice})`);
console.log(`Subtítulos: public/video/captions.json y captions.srt (${captions.length} palabras)`);
