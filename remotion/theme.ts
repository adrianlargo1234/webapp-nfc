import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// Fuentes guardadas en public/video/fonts (licencia OFL) para renderizar sin conexión.
const font = (family: string, file: string, weight: string, style: "normal" | "italic" = "normal") =>
  loadFont({ family, url: staticFile(`video/fonts/${file}`), weight, style });

Promise.all([
  ...["500", "600", "700", "800"].map((w) => font("Poppins", `poppins-latin-${w}-normal.woff2`, w)),
  font("Instrument Serif", "instrument-serif-latin-400-italic.woff2", "400", "italic"),
  ...["500", "700"].map((w) => font("JetBrains Mono", `jetbrains-mono-latin-${w}-normal.woff2`, w)),
]).catch((err) => console.error("No se pudieron cargar las fuentes", err));

export const fonts = {
  sans: "Poppins, sans-serif",
  serif: "'Instrument Serif', serif",
  mono: "'JetBrains Mono', monospace",
};

export const colors = {
  ink: "#1f1a17",
  muted: "#9b8f86",
  accent: "#f0782d",
  accentSoft: "#fde3cf",
  card: "#fffaf5",
  cardBorder: "rgba(31, 26, 23, 0.06)",
  bgLight: "#fbefe3",
  bgWarm: "#f6c9a3",
};

export const shadow = "0 18px 50px rgba(120, 60, 20, 0.14), 0 2px 6px rgba(120, 60, 20, 0.08)";
