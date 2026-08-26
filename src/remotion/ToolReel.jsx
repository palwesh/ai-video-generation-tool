import React from "react";
import { AbsoluteFill, Audio, Easing, Img, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Video } from "@remotion/media";
import { ReelScene } from "./ReelScene.jsx";

const DEFAULT_POST_AVATAR_OUTRO_SECONDS = 2.4;

function cleanText(value, fallback = "") {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text || fallback;
}

function clampText(value, maxLength) {
  const text = cleanText(value);
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength - 1).replace(/\s+\S*$/, "").trim()}...`;
}

function compactDomain(value) {
  const text = cleanText(value);
  if (!text) {
    return "altftool.com";
  }
  try {
    return new URL(text).hostname.replace(/^www\./, "");
  } catch {
    return clampText(text.replace(/^https?:\/\//, "").replace(/^www\./, ""), 42);
  }
}

function bodyVoiceoverRanges(sceneCount, sceneDuration, sceneHasAvatarAudio) {
  const ranges = [];
  let startIndex = null;

  for (let index = 1; index < sceneCount; index += 1) {
    const sceneNumber = index + 1;
    const blocked = sceneHasAvatarAudio(sceneNumber);
    if (blocked) {
      if (startIndex !== null) {
        ranges.push({ startIndex, endIndex: index - 1 });
        startIndex = null;
      }
      continue;
    }
    if (startIndex === null) {
      startIndex = index;
    }
  }

  if (startIndex !== null) {
    ranges.push({ startIndex, endIndex: sceneCount - 1 });
  }

  return ranges.map((range) => {
    const duration = (range.endIndex - range.startIndex + 1) * sceneDuration;
    const trimBefore = Math.max(0, (range.startIndex - 1) * sceneDuration);
    return {
      ...range,
      from: range.startIndex * sceneDuration,
      duration,
      trimBefore,
      trimAfter: trimBefore + duration
    };
  });
}

function PostAvatarEndCard({ toolName, toolUrl, assets, durationFrames, fps }) {
  const frame = useCurrentFrame();
  const logo = assets?.brandLogo || "brand/altf-logo.png";
  const rise = interpolate(frame, [0, Math.round(fps * 0.5)], [42, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1)
  });
  const opacity = interpolate(frame, [0, Math.round(fps * 0.28), durationFrames - Math.round(fps * 0.28), durationFrames], [0, 1, 1, 0.92], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });

  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #020617 0%, #07111f 56%, #030712 100%)", color: "#ffffff", opacity }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          border: "18px solid #22d3ee",
          boxShadow: "inset 0 0 90px rgba(34,211,238,0.18)"
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 72,
          right: 72,
          top: 520,
          display: "grid",
          justifyItems: "center",
          gap: 30,
          textAlign: "center",
          translate: `0px ${rise}px`
        }}
      >
        <Img src={staticFile(logo)} style={{ width: 238, maxHeight: 104, objectFit: "contain" }} />
        <div style={{ fontSize: 58, lineHeight: 1.04, fontWeight: 980 }}>
          Try this tool on AltFTool
        </div>
        <div style={{ color: "#FFD700", fontSize: 34, lineHeight: 1.18, fontWeight: 900 }}>
          {clampText(toolName, 54)}
        </div>
        <div style={{ marginTop: 8, color: "#cbd5e1", fontSize: 28, fontWeight: 780 }}>
          Link caption me hai | {compactDomain(toolUrl)}
        </div>
      </div>
    </AbsoluteFill>
  );
}

export const ToolReel = ({ toolName, toolUrl, scenes, assets, sceneDurationSeconds = 10 }) => {
  const { fps } = useVideoConfig();
  const sceneDuration = Math.max(1, Number(sceneDurationSeconds || 10)) * fps;
  const safeScenes = Array.isArray(scenes) && scenes.length ? scenes : [];
  const voiceovers = Array.isArray(assets?.voiceovers) ? assets.voiceovers : [];
  const avatarAudioScenes = new Set((assets?.vidsClipAudioScenes || []).map(Number));
  const hasCachedSceneClip = (sceneNumber) => Boolean(assets?.vidsClips?.[Math.max(0, Number(sceneNumber) - 1)]);
  const lastSceneNumber = safeScenes.length;
  if (hasCachedSceneClip(1)) {
    avatarAudioScenes.add(1);
  }
  if (lastSceneNumber > 1 && hasCachedSceneClip(lastSceneNumber)) {
    avatarAudioScenes.add(lastSceneNumber);
  }
  const sceneHasAvatarAudio = (sceneNumber) => avatarAudioScenes.has(Number(sceneNumber));
  const bodyRanges = bodyVoiceoverRanges(safeScenes.length, sceneDuration, sceneHasAvatarAudio);
  const hasBodySceneVoiceovers = voiceovers.slice(1).some(Boolean);
  const useBodyVoiceoverVideo = Boolean(assets?.bodyVoiceoverVideo && !hasBodySceneVoiceovers && bodyRanges.length);
  const useBodyVoiceoverAudio = Boolean(assets?.bodyVoiceoverAudio && !hasBodySceneVoiceovers && !useBodyVoiceoverVideo && bodyRanges.length);
  const hasPostAvatarOutro = lastSceneNumber > 1 && hasCachedSceneClip(lastSceneNumber) && assets?.postAvatarOutroSeconds !== 0;
  const postAvatarOutroFrames = hasPostAvatarOutro
    ? Math.max(Math.round(fps * 1.4), Math.round(Number(assets?.postAvatarOutroSeconds || DEFAULT_POST_AVATAR_OUTRO_SECONDS) * fps))
    : 0;
  const musicVolume = useBodyVoiceoverVideo || useBodyVoiceoverAudio || avatarAudioScenes.size ? 0.12 : 0.16;

  return (
    <AbsoluteFill style={{ backgroundColor: "#eef2f5", fontFamily: "Inter, Arial, sans-serif" }}>
      {assets?.music ? (
        <Audio src={staticFile(assets.music)} volume={musicVolume} />
      ) : null}
      {useBodyVoiceoverVideo ? bodyRanges.map((range) => (
        <Sequence
          key={`body-voiceover-video-${range.startIndex}-${range.endIndex}`}
          from={range.from}
          durationInFrames={Math.max(1, range.duration)}
          layout="none"
          name={`Body voiceover source ${range.startIndex + 1}-${range.endIndex + 1}`}
        >
          <Video
            src={staticFile(assets.bodyVoiceoverVideo)}
            muted={false}
            volume={1}
            trimBefore={range.trimBefore}
            trimAfter={range.trimAfter}
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
      )) : null}
      {useBodyVoiceoverAudio ? bodyRanges.map((range) => (
        <Sequence
          key={`body-voiceover-audio-${range.startIndex}-${range.endIndex}`}
          from={range.from}
          durationInFrames={Math.max(1, range.duration)}
          layout="none"
          name={`Body voiceover audio ${range.startIndex + 1}-${range.endIndex + 1}`}
        >
          <Audio
            src={staticFile(assets.bodyVoiceoverAudio)}
            volume={1}
            trimBefore={range.trimBefore}
            trimAfter={range.trimAfter}
          />
        </Sequence>
      )) : null}
      {safeScenes.map((scene, index) => (
        <Sequence
          key={scene.scene_number || index}
          from={index * sceneDuration}
          durationInFrames={sceneDuration}
          name={`Scene ${index + 1}`}
        >
          {voiceovers[index] && !sceneHasAvatarAudio(index + 1) && !(index > 0 && (useBodyVoiceoverVideo || useBodyVoiceoverAudio)) ? (
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
      {postAvatarOutroFrames ? (
        <Sequence
          from={safeScenes.length * sceneDuration}
          durationInFrames={postAvatarOutroFrames}
          name="Post avatar brand end card"
        >
          <PostAvatarEndCard
            toolName={toolName}
            toolUrl={toolUrl}
            assets={assets || {}}
            durationFrames={postAvatarOutroFrames}
            fps={fps}
          />
        </Sequence>
      ) : null}
    </AbsoluteFill>
  );
};
