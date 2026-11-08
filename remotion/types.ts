import type { Caption } from "@remotion/captions";

/** Lo que se ve en el centro de la pantalla durante una escena. */
export type Visual =
  /** Emoji grande en una tarjeta. `strike` lo tacha; `badge` añade una píldora debajo. */
  | { type: "icon"; emoji: string; strike?: boolean; badge?: string }
  /** Tarjeta con cabecera tipo código y filas que van apareciendo. */
  | { type: "list"; header: string; items: string[] }
  /** Cuadrícula de mosaicos (emoji + etiqueta) que aparecen uno a uno. */
  | { type: "grid"; items: { emoji: string; label: string }[] }
  /** Tarjeta de puntuaciones con barras que se rellenan (valores 0–100). */
  | { type: "bars"; header: string; bars: { label: string; value: number }[] }
  /** Captura (en public/) dentro de una ventana de navegador. */
  | { type: "image"; src: string; url?: string }
  /** Portada naranja con texto grande, tipo miniatura. */
  | { type: "cover"; text: string; caption?: string; emoji?: string }
  | { type: "none" };

export type Scene = {
  /** Segundos que dura la escena. */
  duration: number;
  /** Título de arriba. Las palabras entre *asteriscos* salen en cursiva naranja. */
  title: string;
  /** Número del círculo naranja junto al título (1, 2, 3…). */
  step?: number;
  visual: Visual;
  /** Sello girado encima del visual, p. ej. "GRATIS". */
  stamp?: string;
  /**
   * Lo que dice la voz en esta escena. Si no hay subtítulos de Whisper se usa
   * para generar subtítulos repartidos en la duración de la escena.
   * Las palabras entre *asteriscos* se resaltan en naranja.
   */
  say: string;
};

export type VideoProps = {
  /** Audio de la voz en public/, p. ej. "video/voz.mp3". */
  audio: string | null;
  /** Subtítulos generados con `npm run video:transcribe`, p. ej. "video/captions.json". */
  captionsFile: string | null;
  /** Palabras extra a resaltar en los subtítulos de Whisper. */
  highlight: string[];
  scenes: Scene[];
  /** Se rellena solo (calculateMetadata) a partir de captionsFile. */
  captions?: Caption[] | null;
};
