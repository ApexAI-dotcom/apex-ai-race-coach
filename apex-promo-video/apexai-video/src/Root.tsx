import React from "react";
import { Composition, Still } from "remotion";
import "./fonts";
import { FPS, s } from "./config";
import { DURATION_16x9, DURATION_9x16 } from "./timeline";
import { Promo16x9 } from "./compositions/Promo16x9";
import { Promo9x16 } from "./compositions/Promo9x16";
import { Thumbnail } from "./compositions/Thumbnail";
import { SocialRoot } from "./social/SocialRoot";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="ApexAI-16x9"
        component={Promo16x9}
        durationInFrames={s(DURATION_16x9)}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="ApexAI-9x16"
        component={Promo9x16}
        durationInFrames={s(DURATION_9x16)}
        fps={FPS}
        width={1080}
        height={1920}
      />
      <Still id="Thumbnail" component={Thumbnail} width={1280} height={720} />
      <SocialRoot />
    </>
  );
};
