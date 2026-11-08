import { AbsoluteFill, useCurrentFrame } from "remotion";
import { colors } from "../theme";

export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 90) * 40;
  return (
    <AbsoluteFill style={{ backgroundColor: colors.bgLight, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 70% 45% at ${50 + drift / 20}% 0%, #fff8f1 0%, transparent 70%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 1300,
          height: 1100,
          left: -110 + drift,
          top: 1050 - drift / 2,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${colors.bgWarm} 0%, rgba(246, 201, 163, 0) 65%)`,
          filter: "blur(30px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 700,
          height: 700,
          right: -260 - drift,
          top: 420,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(244, 176, 120, 0.45) 0%, rgba(244, 176, 120, 0) 65%)",
          filter: "blur(30px)",
        }}
      />
    </AbsoluteFill>
  );
};
