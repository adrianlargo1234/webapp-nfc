import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, fonts } from "../theme";
import { AccentSpan, parseAccent } from "./RichText";

export const Title: React.FC<{ text: string; step?: number; startFrame: number }> = ({ text, step, startFrame }) => {
  const frame = useCurrentFrame() - startFrame;
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 14 });
  const accentIn = spring({ frame: frame - 6, fps, config: { damping: 14, mass: 0.6 } });
  const parts = parseAccent(text);

  return (
    <div
      style={{
        position: "absolute",
        top: 150,
        left: 60,
        right: 60,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 22,
        opacity: enter,
        transform: `translateY(${interpolate(enter, [0, 1], [24, 0])}px)`,
      }}
    >
      {step !== undefined && (
        <div
          style={{
            flexShrink: 0,
            width: 64,
            height: 64,
            borderRadius: 32,
            background: colors.accent,
            color: "white",
            fontFamily: fonts.sans,
            fontWeight: 700,
            fontSize: 36,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: `scale(${accentIn})`,
          }}
        >
          {step}
        </div>
      )}
      <div
        style={{
          fontFamily: fonts.sans,
          fontWeight: 700,
          fontSize: 70,
          lineHeight: 1.15,
          letterSpacing: "-0.03em",
          color: colors.ink,
          textAlign: "center",
          textWrap: "balance",
        }}
      >
        {parts.map((p, i) =>
          p.accent ? (
            <span
              key={i}
              style={{
                display: "inline-block",
                opacity: accentIn,
                transform: `translateY(${interpolate(accentIn, [0, 1], [18, 0])}px)`,
                whiteSpace: "pre",
              }}
            >
              <AccentSpan text={p.text} />
            </span>
          ) : (
            <span key={i} style={{ whiteSpace: "pre-wrap" }}>
              {p.text}
            </span>
          ),
        )}
      </div>
    </div>
  );
};
