// Descarga y compila whisper.cpp y su modelo en ./whisper.cpp
// Uso: npm run whisper:install
import path from "node:path";
import { installWhisperCpp, downloadWhisperModel } from "@remotion/install-whisper-cpp";

const to = path.join(process.cwd(), "whisper.cpp");
const model = process.env.WHISPER_MODEL ?? "medium";

await installWhisperCpp({ to, version: "1.5.5" });
await downloadWhisperModel({ model, folder: to });
console.log(`whisper.cpp listo en ${to} (modelo ${model})`);
