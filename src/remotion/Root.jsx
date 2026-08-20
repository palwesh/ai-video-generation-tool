import React from "react";
import { Composition } from "remotion";
import { ToolReel } from "./ToolReel.jsx";

const defaultScenes = Array.from({ length: 7 }, (_, index) => ({
  scene_number: index + 1,
  duration: 10,
  voiceover: "",
  visual: "",
  onscreen_text: `Scene ${index + 1}`,
  video_prompt: ""
}));

export const RemotionRoot = () => {
  return (
    <Composition
      id="ToolReel"
      component={ToolReel}
      durationInFrames={2100}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{
        toolName: "AltF Tool",
        toolUrl: "https://www.altftool.com/",
        scenes: defaultScenes,
        assets: {}
      }}
    />
  );
};
