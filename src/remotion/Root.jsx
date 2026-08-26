import React from "react";
import { Composition } from "remotion";
import {
  AltFToolFullAvatarPromoReel,
  AltFToolMaleAvatarPromoReel,
  avatarPromoSceneSeconds,
  avatarPromoScenes
} from "./AltFToolFullAvatarPromoReel.jsx";
import {
  AltFToolDualAvatarIntroReel,
  dualAvatarIntroSceneSeconds,
  dualAvatarIntroScenes
} from "./AltFToolDualAvatarIntroReel.jsx";
import { AltFToolsReviewIntroReel, introScenes } from "./AltFToolsReviewIntroReel.jsx";
import { ToolReel } from "./ToolReel.jsx";

const defaultScenes = Array.from({ length: 6 }, (_, index) => ({
  scene_number: index + 1,
  duration: 10,
  voiceover: "",
  visual: "",
  onscreen_text: `Scene ${index + 1}`,
  video_prompt: ""
}));

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="ToolReel"
        component={ToolReel}
        durationInFrames={1800}
        fps={30}
        width={1080}
        height={1920}
        calculateMetadata={({ props }) => {
          const scenes = Array.isArray(props?.scenes) && props.scenes.length ? props.scenes : defaultScenes;
          const sceneDurationSeconds = Number(props?.sceneDurationSeconds || 10) || 10;
          const clips = Array.isArray(props?.assets?.vidsClips) ? props.assets.vidsClips : [];
          const lastSceneHasAvatarClip = scenes.length > 1 && Boolean(clips[scenes.length - 1]);
          const postAvatarOutroSeconds = lastSceneHasAvatarClip && props?.assets?.postAvatarOutroSeconds !== 0
            ? Math.max(0.5, Number(props?.assets?.postAvatarOutroSeconds || 2) || 2)
            : 0;
          return {
            durationInFrames: Math.round((scenes.length * sceneDurationSeconds + postAvatarOutroSeconds) * 30)
          };
        }}
        defaultProps={{
          toolName: "AltF Tool",
          toolUrl: "https://www.altftool.com/",
          scenes: defaultScenes,
          sceneDurationSeconds: 10,
          assets: {
            brandLogo: "brand/altf-logo.png"
          }
        }}
      />
      <Composition
        id="AltFToolsReviewIntroReel"
        component={AltFToolsReviewIntroReel}
        durationInFrames={introScenes.length * 7 * 30}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="AltFToolFullAvatarPromoReel"
        component={AltFToolFullAvatarPromoReel}
        durationInFrames={avatarPromoScenes.length * avatarPromoSceneSeconds * 30}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="AltFToolMaleAvatarPromoReel"
        component={AltFToolMaleAvatarPromoReel}
        durationInFrames={avatarPromoScenes.length * avatarPromoSceneSeconds * 30}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="AltFToolDualAvatarIntroReel"
        component={AltFToolDualAvatarIntroReel}
        durationInFrames={dualAvatarIntroScenes.length * dualAvatarIntroSceneSeconds * 30}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
