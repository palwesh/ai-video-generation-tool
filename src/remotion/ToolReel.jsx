import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useVideoConfig } from "remotion";
import { Video } from "@remotion/media";
import { ReelScene } from "./ReelScene.jsx";

export const ToolReel = ({ toolName, toolUrl, scenes, assets, sceneDurationSeconds = 10 }) => {
  const { fps } = useVideoConfig();
  const sceneDuration = Math.max(1, Number(sceneDurationSeconds || 10)) * fps;
  const safeScenes = Array.isArray(scenes) && scenes.length ? scenes : [];
  const voiceovers = Array.isArray(assets?.voiceovers) ? assets.voiceovers : [];
  const hasBodySceneVoiceovers = voiceovers.slice(1).some(Boolean);
  const useBodyVoiceoverVideo = Boolean(assets?.bodyVoiceoverVideo && !hasBodySceneVoiceovers && safeScenes.length > 1);

  return (
    <AbsoluteFill style={{ backgroundColor: "#eef2f5", fontFamily: "Inter, Arial, sans-serif" }}>
      {assets?.music ? (
        <Audio src={staticFile(assets.music)} volume={0.18} />
      ) : null}
      {useBodyVoiceoverVideo ? (
        <Sequence
          from={sceneDuration}
          durationInFrames={Math.max(1, (safeScenes.length - 1) * sceneDuration)}
          layout="none"
          name="Body voiceover source"
        >
          <Video
            src={staticFile(assets.bodyVoiceoverVideo)}
            muted={false}
            volume={1}
            style={{
              position: "absolute",
              left: -20,
              top: -20,
              width: 1,
              height: 1,
              opacity: 0,
              pointerEvents: "none"
            }}
          />
        </Sequence>
      ) : null}
      {safeScenes.map((scene, index) => (
        <Sequence
          key={scene.scene_number || index}
          from={index * sceneDuration}
          durationInFrames={sceneDuration}
          name={`Scene ${index + 1}`}
        >
          {voiceovers[index] && !((index === 0 || index === safeScenes.length - 1) && assets?.vidsClips?.[index]) && !(index > 0 && useBodyVoiceoverVideo) ? (
            <Audio src={staticFile(voiceovers[index])} volume={1} />
          ) : null}
          <ReelScene
            scene={scene}
            sceneIndex={index}
            totalScenes={safeScenes.length}
            sceneDurationSeconds={Number(sceneDurationSeconds || 10)}
            toolName={toolName}
            toolUrl={toolUrl}
            assets={assets || {}}
          />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
