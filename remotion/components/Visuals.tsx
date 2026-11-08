import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { Visual } from "../types";
import { colors, fonts, shadow } from "../theme";

const Card: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div
    style={{
      background: colors.card,
      borderRadius: 36,
      boxShadow: shadow,
      border: `1px solid ${colors.cardBorder}`,
      ...style,
    }}
  >
    {children}
  </div>
);

const MonoHeader: React.FC<{ text: string }> = ({ text }) => (
  <div
    style={{
      fontFamily: fonts.mono,
      fontWeight: 700,
      fontSize: 24,
      letterSpacing: "0.08em",
      color: colors.muted,
      marginBottom: 22,
    }}
  >
    {text}
  </div>
);

const useEnter = (delay = 0) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping: 14, mass: 0.7 } });
};

const IconVisual: React.FC<Extract<Visual, { type: "icon" }>> = ({ emoji, strike, badge }) => {
  const frame = useCurrentFrame();
  const enter = useEnter();
  const strikeProgress = interpolate(frame, [12, 22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const badgeIn = useEnter(16);
  const float = Math.sin(frame / 14) * 8;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 50 }}>
      <div
        style={{
          position: "relative",
          fontSize: 330,
          lineHeight: 1,
          transform: `scale(${enter}) translateY(${float}px)`,
          filter: `drop-shadow(0 30px 40px rgba(120,60,20,0.25)) ${strike ? `saturate(${1 - strikeProgress * 0.5})` : ""}`,
        }}
      >
        {emoji}
        {strike && (
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: 460 * strikeProgress,
              height: 34,
              borderRadius: 17,
              background: colors.accent,
              transform: "translate(-50%, -50%) rotate(-35deg)",
              boxShadow: "0 6px 16px rgba(0,0,0,0.15)",
            }}
          />
        )}
      </div>
      {badge && (
        <div
          style={{
            background: colors.accent,
            color: "white",
            fontFamily: fonts.sans,
            fontWeight: 700,
            fontSize: 44,
            padding: "10px 36px",
            borderRadius: 999,
            transform: `scale(${badgeIn}) rotate(-3deg)`,
            boxShadow: "0 10px 24px rgba(240,120,45,0.35)",
          }}
        >
          {badge}
        </div>
      )}
    </div>
  );
};

const ListVisual: React.FC<Extract<Visual, { type: "list" }>> = ({ header, items }) => {
  const frame = useCurrentFrame();
  const enter = useEnter();
  const rowH = 76;
  const visibleRows = 5;
  const revealed = Math.max(0, (frame - 6) / 8);
  const scroll = Math.max(0, Math.min(revealed, items.length) - visibleRows) * rowH;
  return (
    <Card style={{ width: 900, padding: "36px 44px", transform: `scale(${enter})`, opacity: enter }}>
      <MonoHeader text={header} />
      <div style={{ height: rowH * visibleRows, overflow: "hidden", position: "relative" }}>
        <div style={{ transform: `translateY(${-scroll}px)` }}>
          {items.map((item, i) => {
            const p = interpolate(revealed - i, [0, 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            return (
              <div
                key={i}
                style={{
                  height: rowH,
                  display: "flex",
                  alignItems: "center",
                  gap: 28,
                  opacity: p,
                  transform: `translateX(${(1 - p) * 30}px)`,
                }}
              >
                <span style={{ fontFamily: fonts.mono, fontSize: 26, color: colors.muted, width: 40 }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span style={{ fontFamily: fonts.sans, fontWeight: 500, fontSize: 40, color: colors.ink }}>{item}</span>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};

const GridVisual: React.FC<Extract<Visual, { type: "grid" }>> = ({ items }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 28, width: 900 }}>
      {items.map((item, i) => {
        const pop = spring({ frame: frame - i * 4, fps, config: { damping: 12, mass: 0.6 } });
        return (
          <Card
            key={i}
            style={{
              width: 270,
              height: 230,
              borderRadius: 30,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 14,
              transform: `scale(${pop})`,
              opacity: Math.min(1, pop * 2),
            }}
          >
            <span style={{ fontSize: 100, lineHeight: 1 }}>{item.emoji}</span>
            <span style={{ fontFamily: fonts.mono, fontWeight: 500, fontSize: 28, color: colors.ink }}>{item.label}</span>
          </Card>
        );
      })}
    </div>
  );
};

const BarsVisual: React.FC<Extract<Visual, { type: "bars" }>> = ({ header, bars }) => {
  const frame = useCurrentFrame();
  const enter = useEnter();
  return (
    <Card style={{ width: 900, padding: "40px 48px", transform: `scale(${enter})`, opacity: enter }}>
      <MonoHeader text={header} />
      {bars.map((bar, i) => {
        const fill = interpolate(frame, [10 + i * 6, 34 + i * 6], [0, bar.value], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 28, height: 84 }}>
            <span style={{ fontFamily: fonts.mono, fontWeight: 700, fontSize: 24, color: colors.ink, width: 220 }}>
              {bar.label}
            </span>
            <div style={{ flex: 1, height: 18, borderRadius: 9, background: "#efe4da", overflow: "hidden" }}>
              <div style={{ width: `${fill}%`, height: "100%", borderRadius: 9, background: colors.accent }} />
            </div>
            <span
              style={{
                fontFamily: fonts.mono,
                fontWeight: 700,
                fontSize: 30,
                color: colors.ink,
                width: 70,
                textAlign: "right",
              }}
            >
              {Math.round(fill)}
            </span>
          </div>
        );
      })}
    </Card>
  );
};

const ImageVisual: React.FC<Extract<Visual, { type: "image" }>> = ({ src, url }) => {
  const enter = useEnter();
  const frame = useCurrentFrame();
  return (
    <Card
      style={{
        width: 900,
        overflow: "hidden",
        transform: `scale(${interpolate(enter, [0, 1], [0.85, 1]) + frame * 0.0006})`,
        opacity: enter,
      }}
    >
      <div
        style={{
          height: 64,
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "0 26px",
          borderBottom: `1px solid ${colors.cardBorder}`,
        }}
      >
        {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
          <div key={c} style={{ width: 18, height: 18, borderRadius: 9, background: c }} />
        ))}
        {url && (
          <span style={{ marginLeft: 20, fontFamily: fonts.mono, fontSize: 24, color: colors.muted }}>{url}</span>
        )}
      </div>
      <Img src={staticFile(src)} style={{ width: "100%", height: 760, objectFit: "cover", objectPosition: "top" }} />
    </Card>
  );
};

const CoverVisual: React.FC<Extract<Visual, { type: "cover" }>> = ({ text, caption, emoji }) => {
  const enter = useEnter();
  const frame = useCurrentFrame();
  return (
    <Card style={{ width: 900, padding: 24, transform: `scale(${enter}) rotate(${(1 - enter) * -4}deg)` }}>
      <div
        style={{
          position: "relative",
          height: 500,
          borderRadius: 24,
          background: `linear-gradient(135deg, ${colors.accent} 0%, #e2581a 100%)`,
          padding: "50px 56px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            fontFamily: fonts.sans,
            fontWeight: 800,
            fontSize: 96,
            lineHeight: 1,
            letterSpacing: "-0.03em",
            color: "white",
            width: 560,
            textShadow: "0 4px 0 rgba(0,0,0,0.12)",
          }}
        >
          {text}
        </div>
        {emoji && (
          <div
            style={{
              position: "absolute",
              right: 50,
              bottom: 40,
              fontSize: 210,
              transform: `rotate(${Math.sin(frame / 10) * 6}deg)`,
            }}
          >
            {emoji}
          </div>
        )}
      </div>
      {caption && (
        <div
          style={{
            fontFamily: fonts.sans,
            fontWeight: 700,
            fontSize: 40,
            color: colors.ink,
            padding: "24px 12px 8px",
          }}
        >
          {caption}
        </div>
      )}
    </Card>
  );
};

export const VisualView: React.FC<{ visual: Visual }> = ({ visual }) => {
  switch (visual.type) {
    case "icon":
      return <IconVisual {...visual} />;
    case "list":
      return <ListVisual {...visual} />;
    case "grid":
      return <GridVisual {...visual} />;
    case "bars":
      return <BarsVisual {...visual} />;
    case "image":
      return <ImageVisual {...visual} />;
    case "cover":
      return <CoverVisual {...visual} />;
    default:
      return null;
  }
};
