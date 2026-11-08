import type { Caption } from "@remotion/captions";
import { Composition, staticFile, type CalculateMetadataFunction } from "remotion";
import { TikTokVideo } from "./TikTokVideo";
import type { VideoProps } from "./types";
import video from "./video.json";

const FPS = 30;

const calculateMetadata: CalculateMetadataFunction<VideoProps> = async ({ props }) => {
  let captions: Caption[] | null = null;
  if (props.captionsFile) {
    const res = await fetch(staticFile(props.captionsFile));
    captions = (await res.json()) as Caption[];
  }
  const scenesEnd = props.scenes.reduce((sum, s) => sum + s.duration, 0);
  const captionsEnd = captions?.length ? captions[captions.length - 1].endMs / 1000 + 0.6 : 0;
  return {
    durationInFrames: Math.ceil(Math.max(scenesEnd, captionsEnd) * FPS),
    props: { ...props, captions },
  };
};

export const RemotionRoot: React.FC = () => (
  <Composition
    id="TikTok"
    component={TikTokVideo}
    width={1080}
    height={1920}
    fps={FPS}
    durationInFrames={FPS * 10}
    defaultProps={video as unknown as VideoProps}
    calculateMetadata={calculateMetadata}
  />
);
