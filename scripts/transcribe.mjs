// Transcribe la voz con whisper.cpp y prepara el vídeo de TikTok.
// Uso: npm run video:transcribe -- ruta/a/voz.mp3
//   1. Copia el audio a public/video/
//   2. Genera public/video/captions.json con tiempos por palabra
//   3. Apunta remotion/video.json a ese audio y esos subtítulos
// Requiere `npm run whisper:install` antes (y ffmpeg instalado).
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { toCaptions, transcribe } from "@remotion/install-whisper-cpp";

const input = process.argv[2];
if (!input) {
  console.error("Uso: npm run video:transcribe -- ruta/a/voz.mp3");
  process.exit(1);
}

const root = process.cwd();
const whisperPath = path.join(root, "whisper.cpp");
const model = process.env.WHISPER_MODEL ?? "medium";
const language = process.env.WHISPER_LANG ?? "es";
const publicDir = path.join(root, "public", "video");
fs.mkdirSync(publicDir, { recursive: true });

const audioName = `voz${path.extname(input) || ".mp3"}`;
fs.copyFileSync(input, path.join(publicDir, audioName));

// whisper.cpp necesita WAV mono a 16 kHz.
const wav = path.join(whisperPath, "tmp-voz.wav");
execFileSync("ffmpeg", ["-y", "-v", "error", "-i", input, "-ar", "16000", "-ac", "1", wav], { stdio: "inherit" });

const output = await transcribe({
  inputPath: wav,
  whisperPath,
  whisperCppVersion: "1.5.5",
  model,
  modelFolder: whisperPath,
  tokenLevelTimestamps: true,
  language,
  splitOnWord: true,
});
fs.rmSync(wav);

const { captions } = toCaptions({ whisperCppOutput: output });
fs.writeFileSync(path.join(publicDir, "captions.json"), JSON.stringify(captions, null, 2));

const configPath = path.join(root, "remotion", "video.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
config.audio = `video/${audioName}`;
config.captionsFile = "video/captions.json";
fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n");

// Lista de palabras con su segundo, para ajustar la `duration` de cada escena.
console.log("\nPalabras (segundo → texto):");
for (const c of captions) console.log(`${(c.startMs / 1000).toFixed(2).padStart(6)}  ${c.text.trim()}`);
console.log(`\nListo: public/video/captions.json (${captions.length} palabras). Ajusta las escenas en remotion/video.json.`);
