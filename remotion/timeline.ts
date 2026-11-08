import type { Caption } from "@remotion/captions";
import type { Scene } from "./types";

export type SceneSpan = Scene & {
  index: number;
  startFrame: number;
  endFrame: number;
  /** Frame en el que empezó este título (si se repite en escenas seguidas, no se reanima). */
  titleStartFrame: number;
  /** Lo mismo para el visual. */
  visualStartFrame: number;
  /** Frame en el que este visual deja de verse. */
  visualEndFrame: number;
};

export const buildTimeline = (scenes: Scene[], fps: number): SceneSpan[] => {
  const spans: SceneSpan[] = [];
  let cursor = 0;
  scenes.forEach((scene, index) => {
    const startFrame = Math.round(cursor * fps);
    cursor += scene.duration;
    const endFrame = Math.round(cursor * fps);
    const prev = spans[index - 1];
    const sameTitle = prev && prev.title === scene.title && prev.step === scene.step;
    const sameVisual = prev && JSON.stringify(prev.visual) === JSON.stringify(scene.visual);
    spans.push({
      ...scene,
      index,
      startFrame,
      endFrame,
      titleStartFrame: sameTitle ? prev.titleStartFrame : startFrame,
      visualStartFrame: sameVisual ? prev.visualStartFrame : startFrame,
      visualEndFrame: endFrame,
    });
  });
  // Un visual que se repite en escenas seguidas se mantiene hasta la última.
  for (let i = spans.length - 2; i >= 0; i--) {
    if (spans[i + 1].visualStartFrame === spans[i].visualStartFrame) {
      spans[i].visualEndFrame = spans[i + 1].visualEndFrame;
    }
  }
  return spans;
};

export type Word = { text: string; startMs: number; endMs: number; highlight: boolean };
export type CaptionPage = { words: Word[]; startMs: number; endMs: number };

const normalize = (w: string) =>
  w
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\p{L}\p{N}]/gu, "");

/** Palabras entre *asteriscos* en los textos `say` de las escenas. */
export const starredWords = (scenes: Scene[]) =>
  scenes.flatMap((s) => [...s.say.matchAll(/\*([^*]+)\*/g)].flatMap((m) => m[1].split(/\s+/)));

/** Sin Whisper: reparte las palabras de `say` dentro de la duración de cada escena. */
export const wordsFromScenes = (scenes: Scene[]): Word[] => {
  const words: Word[] = [];
  let cursorMs = 0;
  for (const scene of scenes) {
    const durationMs = scene.duration * 1000;
    const tokens: { text: string; highlight: boolean }[] = [];
    // Separa en palabras respetando los tramos *resaltados*.
    scene.say.split(/(\*[^*]+\*)/).forEach((chunk) => {
      const highlight = chunk.startsWith("*") && chunk.endsWith("*") && chunk.length > 2;
      const clean = highlight ? chunk.slice(1, -1) : chunk;
      clean
        .split(/\s+/)
        .filter(Boolean)
        .forEach((text) => {
          // Puntuación pegada al resaltado ("*digital*.") se une a la palabra anterior.
          if (!highlight && /^[.,:;!?…]+$/.test(text) && tokens.length) {
            tokens[tokens.length - 1].text += text;
          } else {
            tokens.push({ text, highlight });
          }
        });
    });
    const weights = tokens.map((t) => t.text.length + 3);
    const total = weights.reduce((a, b) => a + b, 0) || 1;
    const speechMs = durationMs * 0.9;
    let t = cursorMs + durationMs * 0.04;
    tokens.forEach((tok, i) => {
      const len = (weights[i] / total) * speechMs;
      words.push({ text: tok.text, startMs: t, endMs: t + len, highlight: tok.highlight });
      t += len;
    });
    cursorMs += durationMs;
  }
  return words;
};

/** Con Whisper: convierte los captions (tokens) en palabras. */
export const wordsFromCaptions = (captions: Caption[], highlight: string[]): Word[] => {
  const set = new Set(highlight.map(normalize).filter(Boolean));
  const words: Word[] = [];
  for (const c of captions) {
    const raw = c.text;
    if (!raw.trim()) continue;
    const startsWord = /^\s/.test(raw) || words.length === 0;
    if (!startsWord) {
      // Trozo de la palabra anterior (Whisper parte algunas palabras en tokens).
      const last = words[words.length - 1];
      last.text += raw.trim();
      last.endMs = c.endMs;
      last.highlight = set.has(normalize(last.text));
      continue;
    }
    const text = raw.trim();
    words.push({ text, startMs: c.startMs, endMs: c.endMs, highlight: set.has(normalize(text)) });
  }
  return words;
};

/** Agrupa las palabras en "páginas" cortas de 1–4 palabras, como en TikTok. */
export const buildPages = (words: Word[], maxChars = 18): CaptionPage[] => {
  const pages: CaptionPage[] = [];
  let current: Word[] = [];
  const flush = () => {
    if (!current.length) return;
    pages.push({ words: current, startMs: current[0].startMs, endMs: current[current.length - 1].endMs });
    current = [];
  };
  words.forEach((word, i) => {
    const prev = words[i - 1];
    const chars = current.reduce((a, w) => a + w.text.length + 1, 0);
    if (
      current.length &&
      (chars + word.text.length > maxChars || current.length >= 4 || (prev && word.startMs - prev.endMs > 400))
    ) {
      flush();
    }
    current.push(word);
    if (/[.!?…:]$/.test(word.text)) flush();
  });
  flush();
  // Cada página se queda en pantalla hasta que empieza la siguiente (máx. 0,6 s de hueco).
  pages.forEach((p, i) => {
    const next = pages[i + 1];
    p.endMs = next ? Math.min(next.startMs, p.endMs + 600) : p.endMs + 600;
  });
  return pages;
};
