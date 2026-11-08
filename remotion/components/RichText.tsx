import { colors, fonts } from "../theme";

/** Pinta "texto con *acento*": lo de los asteriscos en cursiva serif naranja. */
export const parseAccent = (text: string) =>
  text
    .split(/(\*[^*]+\*)/)
    .filter(Boolean)
    .map((part) =>
      part.startsWith("*") && part.endsWith("*")
        ? { text: part.slice(1, -1), accent: true }
        : { text: part, accent: false },
    );

export const AccentSpan: React.FC<{ text: string; scale?: number }> = ({ text, scale = 1.12 }) => (
  <span
    style={{
      fontFamily: fonts.serif,
      fontStyle: "italic",
      fontWeight: 400,
      color: colors.accent,
      fontSize: `${scale}em`,
      letterSpacing: "-0.01em",
    }}
  >
    {text}
  </span>
);
