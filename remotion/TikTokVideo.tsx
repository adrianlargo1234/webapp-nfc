import { useMemo } from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Background } from "./components/Background";
import { Captions } from "./components/Captions";
import { Stamp } from "./components/Stamp";
import { Title } from "./components/Title";
import { VisualView } from "./components/Visuals";
import { buildPages, buildTimeline, starredWords, wordsFromCaptions, wordsFromScenes } from "./timeline";
import type { VideoProps } from "./types";

export const TikTokVideo: React.FC<VideoProps> = ({ audio, scenes, captions, highlight }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const timeline = useMemo(() => buildTimeline(scenes, fps), [scenes, fps]);
  const pages = useMemo(() => {
    if (!captions?.length) return buildPages(wordsFromScenes(scenes));
    // Si los subtítulos ya traen palabras marcadas con *, no se adivina a partir de `say`.
    const marked = captions.some((c) => c.text.includes("*"));
    const words = wordsFromCaptions(captions, marked ? highlight : [...highlight, ...starredWords(scenes)]);
    return buildPages(words);
  }, [captions, highlight, scenes]);

  const current = timeline.find((s) => frame >= s.startFrame && frame < s.endFrame) ?? timeline[timeline.length - 1];

  return (
    <AbsoluteFill>
      <Background />
      {audio && <Audio src={staticFile(audio)} />}

      {current && (
        <Title key={current.titleStartFrame} text={current.title} step={current.step} startFrame={current.titleStartFrame} />
      )}

      {timeline
        .filter((s) => s.visualStartFrame === s.startFrame)
        .map((s) => {
          const length = s.visualEndFrame - s.visualStartFrame;
          return (
            <Sequence key={s.index} from={s.visualStartFrame} durationInFrames={length} layout="none">
              <VisualSlot length={length}>
                <VisualView visual={s.visual} />
              </VisualSlot>
            </Sequence>
          );
        })}

      {timeline
        .filter((s) => s.stamp)
        .map((s) => (
          <Sequence key={`stamp-${s.index}`} from={s.startFrame} durationInFrames={s.endFrame - s.startFrame} layout="none">
            <Stamp text={s.stamp!} startFrame={0} />
          </Sequence>
        ))}

      <Captions pages={pages} />
    </AbsoluteFill>
  );
};

/** Centra el visual y lo desvanece al final de su tramo. */
const VisualSlot: React.FC<{ length: number; children: React.ReactNode }> = ({ length, children }) => {
  const frame = useCurrentFrame();
  const out = interpolate(frame, [length - 6, length], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div
      style={{
        position: "absolute",
        top: 360,
        left: 0,
        right: 0,
        height: 880,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: out,
        transform: `translateY(${(1 - out) * -20}px)`,
      }}
    >
      {children}
    </div>
  );
};
