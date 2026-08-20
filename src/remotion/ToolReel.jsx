import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useVideoConfig } from "remotion";
import { ReelScene } from "./ReelScene.jsx";

export const ToolReel = ({ toolName, toolUrl, scenes, assets }) => {
  const { fps } = useVideoConfig();
  const sceneDuration = 10 * fps;
  const safeScenes = Array.isArray(scenes) && scenes.length ? scenes.slice(0, 7) : [];

  return (
    <AbsoluteFill style={{ backgroundColor: "#eef2f5", fontFamily: "Inter, Arial, sans-serif" }}>
      {assets?.music ? (
        <Audio src={staticFile(assets.music)} volume={0.18} />
      ) : null}
      {safeScenes.map((scene, index) => (
        <Sequence
          key={scene.scene_number || index}
          from={index * sceneDuration}
          durationInFrames={sceneDuration}
          name={`Scene ${index + 1}`}
        >
          {assets?.voiceovers?.[index] ? (
            <Audio src={staticFile(assets.voiceovers[index])} volume={1} />
          ) : null}
          <ReelScene
            scene={scene}
            sceneIndex={index}
            toolName={toolName}
            toolUrl={toolUrl}
            assets={assets || {}}
          />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
