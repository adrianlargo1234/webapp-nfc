import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { fonts } from "../theme";

export const Stamp: React.FC<{ text: string; startFrame: number }> = ({ text, startFrame }) => {
  const frame = useCurrentFrame() - startFrame - 10;
  const { fps } = useVideoConfig();
  const hit = spring({ frame, fps, config: { damping: 11, mass: 0.6 } });
  if (frame < 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        top: 720,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          fontFamily: fonts.sans,
          fontWeight: 800,
          fontSize: 120,
          letterSpacing: "0.04em",
          color: "rgba(80, 74, 70, 0.55)",
          border: "10px solid rgba(80, 74, 70, 0.55)",
          borderRadius: 24,
          padding: "0 40px",
          transform: `rotate(-12deg) scale(${interpolate(hit, [0, 1], [1.8, 1])})`,
          opacity: interpolate(hit, [0, 0.3], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        {text}
      </div>
    </div>
  );
};
