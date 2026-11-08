import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { CaptionPage } from "../timeline";
import { colors, fonts } from "../theme";

export const Captions: React.FC<{ pages: CaptionPage[] }> = ({ pages }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ms = (frame / fps) * 1000;
  const page = pages.find((p) => ms >= p.startMs && ms < p.endMs);
  if (!page) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: 1300,
        left: 70,
        right: 70,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "center",
        columnGap: 16,
        rowGap: 8,
        fontFamily: fonts.sans,
        fontWeight: 700,
        fontSize: 60,
        letterSpacing: "-0.02em",
        color: colors.ink,
      }}
    >
      {page.words.map((w, i) => {
        if (ms < w.startMs) return null;
        const local = ((ms - w.startMs) / 1000) * fps;
        const appear = interpolate(local, [0, 4], [0, 1], { extrapolateRight: "clamp" });
        if (!w.highlight) {
          return (
            <span key={i} style={{ opacity: interpolate(appear, [0, 1], [0.25, 1]) }}>
              {w.text}
            </span>
          );
        }
        const pop = spring({ frame: local, fps, config: { damping: 12, mass: 0.5 } });
        return (
          <span
            key={i}
            style={{
              background: colors.accent,
              color: "white",
              padding: "0 14px",
              borderRadius: 12,
              transform: `scale(${interpolate(pop, [0, 1], [0.7, 1])}) rotate(-1.5deg)`,
              display: "inline-block",
            }}
          >
            {w.text}
          </span>
        );
      })}
    </div>
  );
};
