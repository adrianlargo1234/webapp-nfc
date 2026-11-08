// Azure Speech (voces neuronales de Microsoft) para scripts/tts.mjs.
// Devuelve el audio en WAV y [inicio, fin] en segundos de cada palabra (eventos WordBoundary).
import fs from "node:fs";

const TICKS_PER_SECOND = 10_000_000; // el SDK mide en unidades de 100 ns

const escapeXml = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const azureConfigFromEnv = (env = process.env) => ({
  key: env.AZURE_SPEECH_KEY,
  region: env.AZURE_SPEECH_REGION,
  voice: env.AZURE_SPEECH_VOICE ?? "es-ES-AlvaroNeural",
  rate: env.AZURE_SPEECH_RATE ?? "+12%",
  pitch: env.AZURE_SPEECH_PITCH ?? "+0%",
  /** Estilo opcional (mstts:express-as), solo si la voz lo admite. */
  style: env.AZURE_SPEECH_STYLE ?? "",
});

export const buildSsml = (text, cfg) => {
  const lang = cfg.voice.split("-").slice(0, 2).join("-");
  let inner = `<prosody rate="${cfg.rate}" pitch="${cfg.pitch}">${escapeXml(text)}</prosody>`;
  if (cfg.style) inner = `<mstts:express-as style="${escapeXml(cfg.style)}">${inner}</mstts:express-as>`;
  return (
    `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" ` +
    `xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="${lang}">` +
    `<voice name="${cfg.voice}">${inner}</voice></speak>`
  );
};

/**
 * @param {string} text
 * @param {string} file  WAV de salida
 * @param {ReturnType<typeof azureConfigFromEnv>} cfg
 * @param {typeof import("microsoft-cognitiveservices-speech-sdk")} sdk
 * @returns {Promise<[number, number][]>}
 */
export const speakAzure = (text, file, cfg, sdk) =>
  new Promise((resolve, reject) => {
    const speechConfig = sdk.SpeechConfig.fromSubscription(cfg.key, cfg.region);
    speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Riff24Khz16BitMonoPcm;
    // Sin AudioConfig: el audio vuelve en result.audioData en vez de sonar por los altavoces.
    const synth = new sdk.SpeechSynthesizer(speechConfig, null);
    const words = [];
    synth.wordBoundary = (_s, e) => {
      if (e.boundaryType !== sdk.SpeechSynthesisBoundaryType.Word) return;
      const start = e.audioOffset / TICKS_PER_SECOND;
      words.push([start, start + e.duration / TICKS_PER_SECOND]);
    };
    synth.speakSsmlAsync(
      buildSsml(text, cfg),
      (result) => {
        synth.close();
        if (result.reason !== sdk.ResultReason.SynthesizingAudioCompleted) {
          const details = sdk.CancellationDetails.fromResult(result);
          reject(new Error(`Azure Speech: ${details.errorDetails || result.errorDetails || "síntesis cancelada"}`));
          return;
        }
        fs.writeFileSync(file, Buffer.from(result.audioData));
        resolve(words);
      },
      (err) => {
        synth.close();
        reject(new Error(`Azure Speech: ${err}`));
      },
    );
  });
