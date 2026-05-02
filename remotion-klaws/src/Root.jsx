import { Composition } from "remotion";
import { KlawsVideo } from "./KlawsVideo";

export const RemotionRoot = () => {
  return (
    <Composition
      id="KlawsVideo"
      component={KlawsVideo}
      durationInFrames={300}
      fps={30}
      width={1080}
      height={1080}
    />
  );
};
