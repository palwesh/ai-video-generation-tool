import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig
} from "remotion";
import { Video } from "@remotion/media";

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

function splitWords(value) {
  return cleanText(value).split(" ").filter(Boolean);
}

function captionReadableText(value) {
  return cleanText(value)
    .replace(/https?:\/\/[^\s]+/gi, "AltFTool link")
    .replace(/\bwww\.[^\s]+/gi, "AltFTool link")
    .replace(/\s+/g, " ")
    .trim();
}

function toolInitials(toolName) {
  const words = cleanText(toolName, "Tool")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length) {
    return "AT";
  }
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return words.slice(0, 2).map((word) => word[0]).join("").toUpperCase();
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

function brandedToolDisplay(toolName, maxLength = 44) {
  const name = cleanText(toolName, "Tool");
  const branded = /^alt\s*f|^altftool/i.test(name) ? name : `AltFTool • ${name}`;
  return clampText(branded, maxLength);
}

function sceneNarrationText(scene = {}) {
  return cleanText([
    scene.voiceover,
    scene.spoken_voiceover,
    scene.voiceover_audio,
    scene.onscreen_text,
    scene.visual,
    scene.video_prompt
  ].filter(Boolean).join(" ")).toLowerCase();
}

function isVideoAsset(value) {
  return /\.(webm|mp4|mov)$/i.test(String(value || ""));
}

function isImageAsset(value) {
  return /\.(png|jpe?g|webp|svg)$/i.test(String(value || ""));
}

const defaultBrandLogo = "brand/altf-logo.png";

function remotionImageSource(value) {
  const source = cleanText(value);
  if (/^https?:\/\//i.test(source)) {
    return source;
  }
  return staticFile(source);
}

function toolLogoSource(assets) {
  const candidates = [
    assets?.toolLogo,
    assets?.tool_logo,
    assets?.logo,
    assets?.logoPath,
    assets?.brandLogo,
    assets?.brand_logo,
    assets?.favicon
  ];
  return candidates.find((candidate) => isImageAsset(candidate)) || defaultBrandLogo;
}

function mediaSource(media) {
  if (typeof media === "string") {
    return media;
  }
  return media?.src || media?.publicPath || "";
}

function isAvatarClipMedia(media) {
  const marker = [
    mediaSource(media),
    media?.kind,
    media?.badge,
    media?.label,
    media?.note
  ].filter(Boolean).join(" ").toLowerCase();
  return /\b(avatar|hook|cta|focus|presenter|creator|host|talking[- ]?head)\b/.test(marker);
}

function cachedVidsMedia(assets, sceneIndex, totalScenes = 6) {
  const sceneNumber = sceneIndex + 1;
  const sceneClip = assets.vidsClips?.[sceneIndex];
  const muteAvatarAudio = ["mute", "muted", "off"].includes(String(assets?.avatarAudioMode || "").toLowerCase());
  if (sceneClip) {
    const sceneClipSource = mediaSource(sceneClip);
    const isHook = sceneIndex === 0;
    const isCta = sceneIndex === totalScenes - 1;
    const audioScenes = new Set((assets.vidsClipAudioScenes || []).map(Number));
    const hasOwnAudio = !muteAvatarAudio && (isHook || isCta || audioScenes.has(sceneNumber));
    return {
      ...(sceneClip && typeof sceneClip === "object" ? sceneClip : {}),
      src: sceneClipSource,
      kind: "cached_scene_clip",
      badge: isHook ? "HOOK AVATAR VIDEO" : isCta ? "CTA AVATAR VIDEO" : hasOwnAudio ? "FOCUS AVATAR VIDEO" : "AI AVATAR CLIP",
      loop: !hasOwnAudio,
      muted: !hasOwnAudio,
      objectFit: "cover"
    };
  }

  const timelines = Array.isArray(assets.vidsTimelines) ? assets.vidsTimelines : [];
  const timeline = timelines.find((item) => (
    item?.publicPath &&
    Array.isArray(item.coveredScenes) &&
    item.coveredScenes.map(Number).includes(sceneNumber)
  ));
  if (!timeline) {
    return null;
  }

  const coveredScenes = timeline.coveredScenes.map(Number);
  const timelineIndex = Math.max(0, coveredScenes.indexOf(sceneNumber));
  return {
    src: timeline.publicPath,
    kind: timeline.kind === "partial_export" ? "cached_partial_timeline" : "cached_full_timeline",
    badge: timeline.kind === "partial_export" ? "CACHED VIDS PART" : "CACHED VIDS",
    trimSeconds: timelineIndex * 10,
    loop: false,
    muted: true,
    objectFit: "cover"
  };
}

function firstAvailable(...candidates) {
  return candidates.find(Boolean) || "";
}

function mediaPurposeLabel(scene, sceneIndex, totalScenes = 6) {
  const text = sceneNarrationText(scene);
  if (/(before|after|compare|comparison|difference|proof)/.test(text)) {
    return "BEFORE / AFTER";
  }
  if (/(result|output|summary|checklist|warning|next step|review-ready|ready)/.test(text)) {
    return "RESULT SCREEN";
  }
  if (/(input|fill|click|run|workflow|step|demo|use case|use-case|tool page|actual tool)/.test(text)) {
    return "WORKFLOW DEMO";
  }
  if (/(mobile|phone|scroll|instagram|caption|share|post|publish)/.test(text)) {
    return "SHARE FLOW";
  }
  if (/(privacy|safe|redact|mask|data|human review|review)/.test(text)) {
    return "SAFETY CHECK";
  }
  return sceneIndex <= 1 ? "REAL TOOL PAGE" : "REAL TOOL DEMO";
}

function shouldUseBeforeAfterScene(assets, scene = {}, sceneIndex = 0, totalScenes = 6) {
  if (sceneIndex !== totalScenes - 2) {
    return false;
  }
  if (!(assets?.demoBefore || assets?.demoFocusBefore) || !(assets?.demoAfter || assets?.demoFocusAfter)) {
    return false;
  }
  const text = sceneNarrationText(scene);
  return /(before\s*(vs|\/|and)?\s*after|before|after|compare|comparison|difference|proof|pehle|baad|manual.*result|result.*manual|vs\.?|versus|benefit|save|faster|result|output)/.test(text);
}

function captionsEnabledForScene(assets = {}, sceneIndex = 0, totalScenes = 6) {
  const mode = String(assets?.captionMode || "body").trim().toLowerCase();
  if (mode === "off" || mode === "none") {
    return false;
  }
  if (mode === "all") {
    return true;
  }
  if (mode === "body-cta" || mode === "after-hook") {
    return sceneIndex > 0;
  }
  return sceneIndex > 0 && sceneIndex < totalScenes - 1;
}

function avatarClipHasOwnCaptions(media = {}) {
  const explicitFields = [
    media?.hasCaptions,
    media?.burnedCaptions,
    media?.hasBurnedCaptions,
    media?.captioned,
    media?.subtitled,
    media?.hasSubtitles
  ];
  if (explicitFields.some((value) => value === true || value === "true" || value === "yes")) {
    return true;
  }
  if (explicitFields.some((value) => value === false || value === "false" || value === "no")) {
    return false;
  }
  const marker = [
    mediaSource(media),
    media?.kind,
    media?.badge,
    media?.label,
    media?.note,
    media?.sourcePath,
    media?.publicPath
  ].filter(Boolean).join(" ").toLowerCase();
  if (/\b(no[-_ ]?caption|no[-_ ]?subtitles?|without[-_ ]?caption|uncaptioned)\b/.test(marker)) {
    return false;
  }
  return /\b(captioned|captions?|subtitled|subtitles?|burned[-_ ]?in)\b/.test(marker);
}

function avatarCaptionsEnabled(assets = {}, generatedClip = null) {
  const mode = String(assets?.avatarCaptionMode || "auto").trim().toLowerCase();
  if (mode === "off" || mode === "none") {
    return false;
  }
  if (mode === "always" || mode === "on") {
    return true;
  }
  return !avatarClipHasOwnCaptions(generatedClip);
}

function beforeDemoAsset(assets = {}) {
  return firstAvailable(assets.demoFocusBefore, assets.demoBefore, assets.toolReadable, assets.desktop, assets.landing);
}

function afterDemoAsset(assets = {}) {
  return firstAvailable(assets.demoFocusAfter, assets.demoAfter, assets.toolReadable, assets.desktopFull, assets.desktop, assets.landing);
}

function inputDemoAsset(assets = {}) {
  return firstAvailable(assets.demoInputs, assets.demoFocusBefore, assets.demoBefore, assets.toolReadable, assets.desktop, assets.landing);
}

function mediaItem(source, meta = {}) {
  const src = mediaSource(source);
  if (!src) {
    return null;
  }
  if (source && typeof source === "object") {
    return { ...source, ...meta, src };
  }
  return { src, ...meta };
}

function uniqueMediaItems(items) {
  const seen = new Set();
  return items.filter(Boolean).filter((item) => {
    const source = mediaSource(item);
    if (!source || seen.has(source)) {
      return false;
    }
    seen.add(source);
    return true;
  });
}

function demoMediaSequence(assets = {}, scene = {}, sceneIndex = 0, totalScenes = 6, primaryMedia = "") {
  const text = sceneNarrationText(scene);
  const introShots = [
    mediaItem(assets.toolReadable, { demoTitle: "TOOL PAGE", badge: "TOOL PAGE VISIBLE" }),
    mediaItem(assets.desktop, { demoTitle: "TOP SECTION", badge: "TOOL NAME VISIBLE" }),
    mediaItem(assets.landing, { demoTitle: "TOOL NAME PAGE", badge: "ALT F TOOL OPEN" }),
    mediaItem(assets.desktopFull, { demoTitle: "PAGE SCROLL", badge: "FULL PAGE CONTEXT", objectFit: "cover", objectPosition: "50% 18%" })
  ];
  const inputShots = [
    mediaItem(assets.demoInputs, { demoTitle: "REAL INPUT DEMO", badge: "INPUT VALUES FILLED", objectPosition: "50% 48%" }),
    mediaItem(assets.demoFocusBefore, { demoTitle: "INPUT CLOSE-UP", badge: "INPUT FOCUS", objectFit: "cover", objectPosition: "50% 42%" }),
    mediaItem(assets.demoBefore, { demoTitle: "INPUT AREA", badge: "BEFORE RUN", objectFit: "cover", objectPosition: "50% 42%" })
  ];
  const actionShots = [
    mediaItem(assets.demoVideo, { demoTitle: "SCREEN RECORD", badge: "LIVE TOOL FLOW" }),
    mediaItem(assets.mobileScroll, { demoTitle: "MOBILE SCROLL", badge: "PHONE VIEW" })
  ];
  const resultShots = [
    mediaItem(assets.demoFocusAfter, { demoTitle: "RESULT CLOSE-UP", badge: "RESULT FOCUS", objectFit: "cover", objectPosition: "50% 44%" }),
    mediaItem(assets.demoAfter, { demoTitle: "RESULT SCREEN", badge: "OUTPUT REVIEW", objectFit: "cover", objectPosition: "50% 44%" })
  ];
  const primaryShot = mediaItem(primaryMedia, { demoTitle: "ACTUAL TOOL DEMO", badge: mediaPurposeLabel(scene, sceneIndex, totalScenes) });

  if (sceneIndex === 1) {
    return uniqueMediaItems([
      mediaItem(assets.toolReadable, { demoTitle: "TOOL PAGE", badge: "TOOL PAGE VISIBLE" }),
      ...inputShots,
      ...actionShots,
      ...resultShots,
      mediaItem(assets.desktop, { demoTitle: "TOP SECTION", badge: "TOOL NAME VISIBLE" }),
      mediaItem(assets.landing, { demoTitle: "TOOL NAME PAGE", badge: "ALT F TOOL OPEN" }),
      primaryShot,
      mediaItem(assets.desktopFull, { demoTitle: "PAGE SCROLL", badge: "FULL PAGE CONTEXT", objectFit: "cover", objectPosition: "50% 18%" })
    ]).slice(0, 5);
  }

  if (/(result|output|summary|checklist|warning|next step|review-ready|ready|after)/.test(text)) {
    return uniqueMediaItems([
      ...resultShots,
      ...actionShots,
      ...inputShots,
      ...introShots,
      primaryShot
    ]).slice(0, 5);
  }

  if (/(input|fill|upload|click|run|workflow|step|demo|use case|use-case|tool page|actual tool|kaise|how to use)/.test(text)) {
    return uniqueMediaItems([
      ...inputShots,
      ...actionShots,
      ...resultShots,
      ...introShots,
      primaryShot
    ]).slice(0, 5);
  }

  if (/(mobile|phone|scroll|instagram|caption|share|post|publish)/.test(text)) {
    return uniqueMediaItems([
      ...actionShots,
      mediaItem(assets.mobile, { demoTitle: "MOBILE VIEW", badge: "PHONE SCREEN" }),
      ...resultShots,
      ...inputShots,
      primaryShot
    ]).slice(0, 5);
  }

  return uniqueMediaItems([
    primaryShot,
    ...introShots,
    ...inputShots,
    ...actionShots,
    ...resultShots
  ]).slice(0, 5);
}

function activeDemoShot({ assets, scene, sceneIndex, totalScenes, toolMedia, frame, fps, sceneDurationFrames }) {
  const sequence = demoMediaSequence(assets, scene, sceneIndex, totalScenes, toolMedia);
  if (!sequence.length) {
    return {
      media: toolMedia,
      slotFrame: frame,
      slotIndex: 0,
      sequence
    };
  }

  const sceneFrames = Math.max(1, Number(sceneDurationFrames || fps * 10));
  const minFrames = Math.max(1, Math.round(fps * 2));
  const maxFrames = Math.max(minFrames, Math.round(fps * 4));
  const slotFrames = Math.max(minFrames, Math.min(maxFrames, Math.ceil(sceneFrames / sequence.length)));
  const slotIndex = Math.min(sequence.length - 1, Math.floor(frame / slotFrames));

  return {
    media: sequence[slotIndex],
    slotFrame: Math.max(0, frame - slotIndex * slotFrames),
    slotIndex,
    slotFrames,
    sequence
  };
}

function toolMediaForScene(assets, scene = {}, sceneIndex = 0, totalScenes = 6) {
  const text = sceneNarrationText(scene);
  if (sceneIndex === 0) {
    return firstAvailable(assets.landing, assets.toolReadable, assets.desktop, assets.demoBefore, assets.desktopFull, assets.mobile, assets.demoAfter);
  }
  if (sceneIndex === totalScenes - 1) {
    return firstAvailable(afterDemoAsset(assets), assets.demoVideo, assets.desktop, assets.mobile);
  }
  if (sceneIndex === 1) {
    return firstAvailable(assets.landing, assets.toolReadable, assets.desktop, assets.demoVideo, assets.mobileScroll, assets.demoAfter);
  }
  if (/(mobile|phone|scroll|instagram|caption|share|post|publish)/.test(text)) {
    return firstAvailable(assets.mobileScroll, assets.mobile, afterDemoAsset(assets), assets.demoVideo, assets.toolReadable, assets.desktop);
  }
  if (/(before|manual|messy|problem|risk|mistake)/.test(text) && !/(after|result|output)/.test(text)) {
    return firstAvailable(inputDemoAsset(assets), assets.demoVideo, assets.mobile);
  }
  if (shouldUseBeforeAfterScene(assets, scene, sceneIndex, totalScenes)) {
    return firstAvailable(afterDemoAsset(assets), beforeDemoAsset(assets), assets.demoVideo);
  }
  if (/(result|output|summary|checklist|warning|next step|review-ready|ready)/.test(text)) {
    return firstAvailable(afterDemoAsset(assets), assets.demoVideo, assets.mobileScroll, assets.toolReadable, assets.desktop);
  }
  if (/(input|fill|click|run|workflow|step|demo|use case|use-case|tool page|actual tool)/.test(text)) {
    return firstAvailable(assets.demoInputs, assets.demoVideo, assets.toolReadable, assets.mobileScroll, beforeDemoAsset(assets), assets.mobile, afterDemoAsset(assets));
  }
  return firstAvailable(assets.demoVideo, assets.demoInputs, assets.toolReadable, assets.mobileScroll, afterDemoAsset(assets), assets.mobile, assets.desktop, beforeDemoAsset(assets));
}

function firstStrongLine(scene, toolName, sceneIndex) {
  const caption = cleanText(scene?.onscreen_text);
  if (caption && caption.length <= 38) {
    return caption;
  }
  if (sceneIndex === 0) {
    const words = splitWords(scene?.voiceover);
    return words.slice(0, 6).join(" ") || "Stop manual work";
  }
  if (sceneIndex === 1) {
    return brandedToolDisplay(toolName, 38);
  }
  if (sceneIndex === 2) {
    return "Real tool demo";
  }
  if (sceneIndex === 3) {
    return "Input -> Run -> Review";
  }
  if (sceneIndex === 4) {
    return "Before vs After";
  }
  return "Review before sharing";
}

function supportingLine(scene, maxLength = 96) {
  return clampText(scene?.voiceover, maxLength);
}

function stableHash(value) {
  const text = cleanText(value, "altftool");
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash << 5) - hash + text.charCodeAt(index)) | 0;
  }
  return Math.abs(hash);
}

function visualVariantFor(toolName, sceneIndex, totalScenes = 6) {
  return stableHash(`${toolName || "tool"}:${sceneIndex}:${totalScenes}`) % 4;
}

function captionWordWindow(words, activeIndex, windowSize) {
  if (!words.length) {
    return [];
  }
  const safeIndex = Math.min(words.length - 1, Math.max(0, activeIndex));
  const halfWindow = Math.floor(windowSize / 2);
  const start = Math.min(Math.max(0, safeIndex - halfWindow), Math.max(0, words.length - windowSize));
  return words.slice(start, start + windowSize).map((word, index) => ({
    word,
    sourceIndex: start + index,
    active: start + index === safeIndex
  }));
}

function normalizeCaptionWord(value = "") {
  return cleanText(value).replace(/[^\p{L}\p{N}]+/gu, "").toLowerCase();
}

function isCaptionPowerWord(word = "") {
  const clean = normalizeCaptionWord(word);
  return /^(altftool|altf|tool|free|save|share|try|link|caption|result|output|warning|risk|review|demo|input|run|click|fast|quick|easy|simple|smart|ai|secret|mistake|stop|wait|देखो|रुको|save|comment)$/i.test(clean)
    || clean.length >= 9;
}

function demoLayoutForVariant(variant, portraitLike, readableScreen = false) {
  const base = {
    cardInset: portraitLike ? "58px 16px 236px" : "76px 14px 248px",
    cardRadius: portraitLike ? 26 : 22,
    cardBorder: "3px solid rgba(255,255,255,0.84)",
    cardShadow: "0 30px 100px rgba(0,0,0,0.36)",
    top: { left: 28, right: 28, top: 28 },
    chipsTop: portraitLike ? 1438 : 1410,
    chipsLeft: 32,
    chipsRight: 32,
    rotate: "0deg",
    backgroundAngle: 150
  };

  if (readableScreen) {
    return {
      ...base,
      cardInset: "0px",
      cardRadius: 0,
      cardBorder: "0 solid transparent",
      cardShadow: "none",
      top: { left: 12, right: 12, top: 12 },
      chipsTop: 0,
      chipsLeft: 0,
      chipsRight: 0,
      rotate: "0deg",
      backgroundAngle: 156
    };
  }

  if (variant === 1) {
    return {
      ...base,
      cardInset: portraitLike ? "72px 22px 238px" : "86px 14px 250px",
      cardRadius: 24,
      top: { left: 30, right: 168, top: 32 },
      chipsTop: portraitLike ? 1432 : 1406,
      chipsLeft: 34,
      chipsRight: 34,
      backgroundAngle: 34
    };
  }

  if (variant === 2) {
    return {
      ...base,
      cardInset: portraitLike ? "46px 12px 244px" : "74px 12px 258px",
      cardRadius: portraitLike ? 28 : 20,
      top: { left: 160, right: 28, top: 32 },
      chipsTop: portraitLike ? 1440 : 1416,
      chipsLeft: 32,
      chipsRight: 96,
      backgroundAngle: 214
    };
  }

  if (variant === 3) {
    return {
      ...base,
      cardInset: portraitLike ? "66px 16px 224px" : "82px 10px 238px",
      cardRadius: portraitLike ? 22 : 0,
      top: { left: 28, right: 28, top: 38 },
      chipsTop: portraitLike ? 1450 : 1422,
      chipsLeft: 88,
      chipsRight: 30,
      rotate: portraitLike ? "-0.8deg" : "0deg",
      backgroundAngle: 118
    };
  }

  return base;
}

const Palette = {
  ink: "#111827",
  slate: "#334155",
  muted: "#64748b",
  panel: "#ffffff",
  line: "#d9e2ec",
  blue: "#2563eb",
  teal: "#0f766e",
  green: "#16a34a",
  amber: "#f59e0b",
  red: "#dc2626",
  pink: "#db2777",
  bg: "#f5f7fb"
};

const accents = [
  Palette.red,
  Palette.blue,
  Palette.teal,
  Palette.amber,
  Palette.green,
  Palette.pink,
  Palette.blue
];

const fullBleed = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%"
};

function BackgroundWash({ asset, frame, accent }) {
  const zoom = interpolate(frame, [0, 300], [1.04, 1.14], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });

  return (
    <>
      {asset && !isVideoAsset(asset) ? (
        <Img
          src={staticFile(asset)}
          style={{
            ...fullBleed,
            objectFit: "cover",
            scale: zoom,
            filter: "blur(18px) saturate(0.86)",
            opacity: 0.22
          }}
        />
      ) : null}
      <div style={{ ...fullBleed, backgroundColor: Palette.bg }} />
      <div
        style={{
          ...fullBleed,
          background: `linear-gradient(160deg, rgba(255,255,255,0.96) 0%, rgba(241,245,249,0.96) 48%, ${accent}22 100%)`
        }}
      />
    </>
  );
}

function MediaLayer({ media, fit = "contain", fps, style = {}, crop = false, objectPosition = "50% 50%" }) {
  const source = mediaSource(media);
  if (!source) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: "#eef2f7",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: Palette.muted,
          fontSize: 30,
          fontWeight: 800,
          ...style
        }}
      >
        Tool asset
      </div>
    );
  }

  if (isVideoAsset(source)) {
    const mediaObject = typeof media === "object" && media ? media : {};
    return (
      <Video
        src={staticFile(source)}
        muted={mediaObject.muted !== false}
        loop={mediaObject.loop !== false}
        trimBefore={Math.round(Number(mediaObject.trimSeconds || 0) * fps)}
        objectFit={mediaObject.objectFit || fit}
        cropLeft={crop ? 0.02 : 0}
        cropRight={crop ? 0.02 : 0}
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: "#eef2f7",
          objectPosition,
          ...style
        }}
      />
    );
  }

  return (
    <Img
      src={staticFile(source)}
      style={{
        width: "100%",
        height: "100%",
        objectFit: fit,
        objectPosition,
        backgroundColor: "#eef2f7",
        ...style
      }}
    />
  );
}

function TopStrip({ scene, sceneIndex, totalScenes, toolName }) {
  return (
    <div
      style={{
        position: "absolute",
        left: 74,
        right: 74,
        top: 62,
        height: 62,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        color: Palette.slate,
        fontSize: 25,
        fontWeight: 800
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 12, height: 12, borderRadius: 999, backgroundColor: accents[sceneIndex] || Palette.blue }} />
        <div>{brandedToolDisplay(toolName, 36)}</div>
      </div>
      <div>{String(scene.scene_number || sceneIndex + 1).padStart(2, "0")} / {String(totalScenes).padStart(2, "0")}</div>
    </div>
  );
}

function ToolLogoMark({ toolName, assets, accent, frame, size = 164 }) {
  const source = toolLogoSource(assets);
  const hasLogoImage = Boolean(source);
  const pulse = interpolate(frame % 72, [0, 36, 72], [1, 1.035, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });
  const markWidth = hasLogoImage ? Math.round(size * 2.18) : size;
  const markHeight = hasLogoImage ? Math.round(size * 0.82) : size;

  return (
    <div
      style={{
        width: markWidth,
        height: markHeight,
        borderRadius: hasLogoImage ? 26 : 34,
        background: hasLogoImage ? "#050a14" : `linear-gradient(145deg, ${accent}, #111827 74%)`,
        border: "7px solid #ffffff",
        boxShadow: `0 22px 70px ${accent}55, 0 0 0 12px rgba(255,255,255,0.18)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        padding: hasLogoImage ? Math.round(size * 0.08) : 0,
        scale: pulse
      }}
    >
      {hasLogoImage ? (
        <Img
          src={remotionImageSource(source)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            backgroundColor: "#050a14"
          }}
        />
      ) : (
        <div
          style={{
            color: "#ffffff",
            fontSize: Math.round(size * 0.42),
            lineHeight: 1,
            fontWeight: 980,
            textShadow: "0 7px 0 rgba(0,0,0,0.28)"
          }}
        >
          {toolInitials(toolName)}
        </div>
      )}
    </div>
  );
}

function MiniBrandLogo({ assets, accent, compact = false }) {
  const source = toolLogoSource(assets);
  return (
    <div
      style={{
        flex: "0 0 auto",
        width: compact ? 86 : 112,
        height: compact ? 39 : 50,
        borderRadius: compact ? 12 : 15,
        backgroundColor: "#050a14",
        border: `${compact ? 2 : 3}px solid ${accent}`,
        boxShadow: `0 10px 28px ${accent}33`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden"
      }}
    >
      <Img
        src={remotionImageSource(source)}
        style={{
          width: "86%",
          height: "76%",
          objectFit: "contain"
        }}
      />
    </div>
  );
}

function brandOutroFrames(assets, fps) {
  const seconds = Math.max(0, Math.min(6, Number(assets?.postAvatarOutroSeconds ?? 2) || 0));
  return Math.round(fps * seconds);
}

function EndBrandCard({ toolName, toolUrl, assets, frame, fps, accent, sceneDurationFrames }) {
  const outroFrames = brandOutroFrames(assets, fps);
  if (outroFrames <= 0) {
    return null;
  }
  const startFrame = Math.max(0, sceneDurationFrames - outroFrames);
  if (frame < startFrame) {
    return null;
  }

  const localFrame = frame - startFrame;
  const enter = spring({
    frame: localFrame,
    fps,
    config: { damping: 160, stiffness: 220, mass: 0.72 }
  });
  const domain = compactDomain(toolUrl);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 40,
        background: `linear-gradient(180deg, rgba(2,6,23,${interpolate(localFrame, [0, 18], [0.28, 0.82], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp"
        })}) 0%, rgba(2,6,23,0.92) 100%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 74
      }}
    >
      <div
        style={{
          width: "100%",
          minHeight: 720,
          borderRadius: 34,
          backgroundColor: "rgba(255,255,255,0.96)",
          border: `6px solid ${accent}`,
          boxShadow: "0 40px 120px rgba(0,0,0,0.42)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 30,
          scale: interpolate(enter, [0, 1], [0.92, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp"
          }),
          translate: `0px ${interpolate(localFrame, [0, 20], [42, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1)
          })}px`
        }}
      >
        <ToolLogoMark toolName={toolName} assets={assets} accent={accent} frame={frame} size={178} />
        <div
          style={{
            padding: "11px 20px",
            borderRadius: 999,
            backgroundColor: "#111827",
            color: "#FFD700",
            fontSize: 25,
            lineHeight: 1,
            fontWeight: 940
          }}
        >
          ALT F TOOL USED IN THIS REEL
        </div>
        <div
          style={{
            maxWidth: 790,
            color: Palette.ink,
            fontSize: 76,
            lineHeight: 0.98,
            fontWeight: 980,
            textAlign: "center",
            textWrap: "balance"
          }}
        >
          {brandedToolDisplay(toolName, 54)}
        </div>
        {domain ? (
          <div
            style={{
              color: Palette.slate,
              fontSize: 34,
              lineHeight: 1,
              fontWeight: 820,
              textAlign: "center"
            }}
          >
            Open: {domain}
          </div>
        ) : null}
        <div
          style={{
            marginTop: 8,
            padding: "20px 32px",
            borderRadius: 999,
            backgroundColor: accent,
            color: "#ffffff",
            fontSize: 32,
            lineHeight: 1,
            fontWeight: 940,
            boxShadow: `0 18px 48px ${accent}55`
          }}
        >
          Save this reel and try the tool
        </div>
      </div>
    </div>
  );
}

function BrowserFrame({ media, fps, accent, label = "REAL TOOL DEMO", large = false, style = {}, crop = false }) {
  return (
    <div
      style={{
        position: "absolute",
        borderRadius: large ? 22 : 20,
        overflow: "hidden",
        backgroundColor: Palette.panel,
        border: `3px solid ${Palette.line}`,
        boxShadow: large ? "0 34px 100px rgba(15, 23, 42, 0.24)" : "0 24px 70px rgba(15, 23, 42, 0.18)",
        ...style
      }}
    >
      <div
        style={{
          height: large ? 58 : 46,
          backgroundColor: "#f8fafc",
          borderBottom: `2px solid ${Palette.line}`,
          display: "flex",
          alignItems: "center",
          padding: large ? "0 22px" : "0 18px",
          gap: 9
        }}
      >
        {["#ef4444", "#f59e0b", "#22c55e"].map((color) => (
          <div key={color} style={{ width: large ? 15 : 12, height: large ? 15 : 12, borderRadius: 999, backgroundColor: color }} />
        ))}
        <div
          style={{
            marginLeft: 12,
            height: large ? 31 : 25,
            flex: 1,
            borderRadius: 999,
            backgroundColor: "#e2e8f0",
            color: Palette.muted,
            fontSize: large ? 19 : 16,
            fontWeight: 760,
            display: "flex",
            alignItems: "center",
            paddingLeft: 18
          }}
        >
          altftool.com / actual tool page
        </div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: large ? 58 : 46, bottom: 0 }}>
        <MediaLayer media={media} fit="contain" fps={fps} crop={crop} />
      </div>
      <div
        style={{
          position: "absolute",
          left: large ? 24 : 18,
          top: large ? 78 : 62,
          padding: large ? "13px 18px" : "10px 15px",
          borderRadius: 999,
          backgroundColor: accent,
          color: "#fff",
          fontSize: large ? 24 : 19,
          fontWeight: 930
        }}
      >
        {label}
      </div>
    </div>
  );
}

function avatarPresenterLabel(style) {
  if (style === "male") {
    return "Male Avatar";
  }
  if (style === "auto") {
    return "AI Avatar";
  }
  return "Female Avatar";
}

function FallbackHost({ accent, presenterStyle = "female", frame = 0 }) {
  const isMale = presenterStyle === "male";
  const mouthWidth = interpolate(frame % 28, [0, 14, 28], [34, 54, 34], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });
  const hairColor = isMale ? "#111827" : "#3b1f33";
  const shirtColor = isMale ? "#dbeafe" : "#fce7f3";
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: `linear-gradient(150deg, ${accent}, #0f172a)`,
        position: "relative",
        overflow: "hidden"
      }}
    >
      <div style={{ position: "absolute", left: "24%", top: "14%", width: "52%", height: "36%", borderRadius: isMale ? "48% 48% 44% 44%" : "50% 50% 44% 44%", backgroundColor: hairColor }} />
      {!isMale ? (
        <>
          <div style={{ position: "absolute", left: "17%", top: "29%", width: "20%", height: "32%", borderRadius: 999, backgroundColor: hairColor }} />
          <div style={{ position: "absolute", right: "17%", top: "29%", width: "20%", height: "32%", borderRadius: 999, backgroundColor: hairColor }} />
        </>
      ) : null}
      <div style={{ position: "absolute", left: "30%", top: "23%", width: "40%", height: "28%", borderRadius: "48% 48% 46% 46%", backgroundColor: "#f8fafc" }} />
      <div style={{ position: "absolute", left: "38%", top: "35%", width: 12, height: 12, borderRadius: 999, backgroundColor: Palette.ink }} />
      <div style={{ position: "absolute", right: "38%", top: "35%", width: 12, height: 12, borderRadius: 999, backgroundColor: Palette.ink }} />
      <div
        style={{
          position: "absolute",
          left: `calc(50% - ${mouthWidth / 2}px)`,
          top: "43%",
          width: mouthWidth,
          height: 10,
          borderRadius: 999,
          backgroundColor: accent
        }}
      />
      <div style={{ position: "absolute", left: "22%", right: "22%", bottom: "-5%", height: "45%", borderRadius: "140px 140px 0 0", backgroundColor: "#f8fafc" }} />
      <div style={{ position: "absolute", left: "24%", right: "24%", top: "54%", height: "8%", borderRadius: 99, backgroundColor: shirtColor }} />
      <div style={{ position: "absolute", left: "20%", right: "20%", bottom: "11%", height: "30%", borderRadius: "90px 90px 0 0", backgroundColor: shirtColor, opacity: 0.72 }} />
    </div>
  );
}

function HostFrame({
  avatarHost,
  generatedClip,
  fps,
  accent,
  label = "Creator Host",
  sublabel = "human-led demo",
  style = {},
  objectPosition = "52% 42%",
  presenterStyle = "female"
}) {
  const frame = useCurrentFrame();
  const pulse = interpolate(frame % 64, [0, 32, 64], [1, 1.018, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });

  return (
    <div
      style={{
        position: "absolute",
        borderRadius: 28,
        overflow: "hidden",
        backgroundColor: "#ffffff",
        border: `4px solid ${accent}`,
        boxShadow: "0 34px 90px rgba(15, 23, 42, 0.27)",
        scale: pulse,
        ...style
      }}
    >
      {generatedClip ? (
        <MediaLayer media={generatedClip} fit="cover" fps={fps} />
      ) : avatarHost ? (
        <Img
          src={staticFile(avatarHost)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition
          }}
        />
      ) : (
        <FallbackHost accent={accent} presenterStyle={presenterStyle} frame={frame} />
      )}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(15,23,42,0) 52%, rgba(15,23,42,0.82) 100%)" }} />
      <div
        style={{
          position: "absolute",
          left: 24,
          right: 24,
          bottom: 24,
          color: "#ffffff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "end",
          gap: 12
        }}
      >
        <div>
          <div style={{ fontSize: 31, lineHeight: 1, fontWeight: 930 }}>{label}</div>
          <div style={{ marginTop: 7, fontSize: 19, lineHeight: 1, fontWeight: 780, opacity: 0.92 }}>{sublabel}</div>
        </div>
        <div style={{ display: "flex", alignItems: "end", gap: 4, height: 32 }}>
          {[15, 29, 19, 34, 23].map((height, index) => (
            <div
              key={index}
              style={{
                width: 7,
                height: height + ((frame + index * 6) % 9),
                borderRadius: 10,
                backgroundColor: index % 2 ? "#ffffff" : accent
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ReelCaption({ text, frame, fps, accent, compact = false, demoReadable = false, sceneDurationFrames = 300, sceneIndex = 1, captionStyle = "trending-pop" }) {
  const words = splitWords(text);
  if (!words.length) {
    return null;
  }
  const styleKey = String(captionStyle || "trending-pop").toLowerCase();
  const cleanSaas = styleKey === "clean-saas";
  const minimalBold = styleKey === "minimal-bold";
  const windowSize = demoReadable ? 1 : minimalBold ? 2 : cleanSaas ? 3 : compact ? 3 : 4;
  const wordHoldFrames = Math.max(4, sceneDurationFrames / Math.max(1, words.length));
  const activeIndex = Math.min(words.length - 1, Math.floor(frame / wordHoldFrames));
  const visibleWords = captionWordWindow(words, activeIndex, windowSize);
  const localFrame = Math.floor(frame % wordHoldFrames);
  const enterSettleFrame = Math.min(8, Math.max(1, Math.floor(wordHoldFrames * 0.55)));
  const pop = spring({
    frame: localFrame,
    fps,
    config: { damping: 150, stiffness: 290, mass: 0.48 }
  });
  const enterY = interpolate(localFrame, [0, enterSettleFrame, wordHoldFrames], [14, 0, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1)
  });
  const lineVariant = sceneIndex % 3;
  const captionZone = demoReadable
    ? { left: 150, right: 150, top: "84%", bottom: "3%" }
    : minimalBold
    ? { left: 92, right: 92, top: "62%", bottom: "21%" }
    : cleanSaas
    ? { left: 86, right: 86, top: "60%", bottom: "21%" }
    : compact
    ? { left: 88, right: 88, top: "59%", bottom: "21%" }
    : lineVariant === 2
      ? { left: 72, right: 92, top: "58%", bottom: "20%" }
      : { left: 64, right: 64, top: "60%", bottom: "20%" };
  const longestWord = visibleWords.reduce((max, item) => Math.max(max, item.word.length), 0);
  const baseFontSize = demoReadable
    ? longestWord > 13 ? 28 : 33
    : minimalBold
    ? (longestWord > 13 ? 42 : 50)
    : cleanSaas
      ? (longestWord > 13 ? 46 : 54)
      : longestWord > 13 ? (compact ? 48 : 58) : (compact ? 54 : 66);
  const activeScale = interpolate(pop, [0, 1], [0.9, demoReadable ? 1.1 : 1.22], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });
  const captionColors = minimalBold
    ? ["#ffffff", "#ffffff", "#FFD700"]
    : cleanSaas
      ? ["#ffffff", "#dbeafe", "#67e8f9", "#ffffff"]
      : ["#ffffff", "#FFD700", "#67e8f9", "#ffffff", "#fde68a"];

  return (
    <div
      style={{
        position: "absolute",
        ...captionZone,
        display: "grid",
        alignItems: "center",
        justifyItems: "center",
        translate: `0px ${enterY}px`,
        scale: interpolate(pop, [0, 1], [0.98, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "visible"
        }}
      >
        <div
          style={{
            position: "relative",
            zIndex: 1,
            fontSize: baseFontSize,
            lineHeight: 1.02,
            fontWeight: 980,
            textAlign: "center",
            textWrap: "balance",
            textTransform: "uppercase",
            letterSpacing: 0,
            textShadow: demoReadable
              ? "0 2px 0 #000000, 0 0 8px rgba(0,0,0,0.66), 0 5px 14px rgba(0,0,0,0.48)"
              : minimalBold
                ? "0 3px 0 #000000, 0 0 14px rgba(0,0,0,0.72), 0 8px 22px rgba(0,0,0,0.58)"
                : cleanSaas
                  ? "0 3px 0 #000000, 0 0 15px rgba(0,0,0,0.74), 0 8px 24px rgba(0,0,0,0.62)"
                  : "0 5px 0 #000000, 0 0 22px rgba(0,0,0,0.86), 0 10px 34px rgba(0,0,0,0.78)"
          }}
        >
          {visibleWords.map((item, index) => {
            const isLong = item.word.length > 10;
            const powerWord = isCaptionPowerWord(item.word);
            const rhythmScale = minimalBold ? 1 : cleanSaas ? (index % 2 === 0 ? 1 : 0.94) : index % 3 === 1 ? 1.04 : index % 3 === 2 ? 0.88 : 0.96;
            const sizeEm = item.active
              ? minimalBold ? 1.08 : cleanSaas ? (powerWord ? 1.16 : 1.08) : powerWord ? 1.34 : 1.22
              : powerWord
                ? minimalBold ? 1.02 : cleanSaas ? 1.04 : 1.12
                : isLong
                  ? minimalBold ? 0.78 : cleanSaas ? 0.8 : 0.76
                  : index % 3 === 2
                    ? minimalBold ? 0.92 : cleanSaas ? 0.88 : 0.82
                    : 0.92;
            const color = item.active
              ? minimalBold ? "#ffffff" : "#FFD700"
              : powerWord
                ? minimalBold ? "#FFD700" : ((item.sourceIndex + sceneIndex) % 2 === 0 ? "#67e8f9" : "#fde68a")
                : captionColors[(item.sourceIndex + sceneIndex) % captionColors.length];
            const strokeWidth = demoReadable
              ? item.active ? 1.4 : powerWord ? 1 : 0.7
              : minimalBold ? (item.active ? 2 : 1.2) : cleanSaas ? (item.active ? 2.2 : powerWord ? 1.7 : 1.1) : item.active ? 2.7 : powerWord ? 2 : 1.35;
            return (
              <React.Fragment key={`${item.word}-${item.sourceIndex}`}>
                <span
                  style={{
                    display: "inline-block",
                    color,
                    fontSize: `${sizeEm}em`,
                    scale: item.active ? activeScale : rhythmScale,
                    opacity: item.active ? 1 : powerWord ? 0.94 : 0.78,
                    margin: demoReadable ? "0 3px" : powerWord ? "0 7px" : "0 4px",
                    WebkitTextStroke: `${strokeWidth}px #050a14`,
                    transformOrigin: "50% 62%",
                    filter: demoReadable
                      ? item.active ? `drop-shadow(0 0 7px ${accent}55)` : powerWord ? `drop-shadow(0 0 5px ${accent}44)` : "drop-shadow(0 4px 8px rgba(0,0,0,0.36))"
                      : item.active ? `drop-shadow(0 0 20px ${accent}88)` : powerWord ? `drop-shadow(0 0 14px ${accent}55)` : "drop-shadow(0 8px 16px rgba(0,0,0,0.52))"
                  }}
                >
                  {item.word}
                </span>
                {index < visibleWords.length - 1 ? " " : ""}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ frame, sceneDurationFrames, accent }) {
  const progress = Math.min(1, Math.max(0, frame / sceneDurationFrames));
  return (
    <div
      style={{
        position: "absolute",
        left: 76,
        right: 76,
        bottom: 86,
        display: "flex",
        alignItems: "center",
        gap: 18
      }}
    >
      <div style={{ flex: 1, height: 10, borderRadius: 999, backgroundColor: "#d8e0ea", overflow: "hidden" }}>
        <div style={{ width: `${Math.max(5, progress * 100)}%`, height: "100%", borderRadius: 999, backgroundColor: accent }} />
      </div>
      <div style={{ color: Palette.muted, fontSize: 23, fontWeight: 760 }}>10s</div>
    </div>
  );
}

function CursorCallout({ frame, accent, variant = "demo" }) {
  const points = variant === "workflow"
    ? [[235, 1025], [520, 905], [735, 1135], [645, 1250]]
    : [[760, 855], [520, 1030], [720, 1170], [815, 1005]];
  const x = interpolate(frame, [25, 95, 170, 255], points.map((point) => point[0]), {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.2, 0.8, 0.2, 1)
  });
  const y = interpolate(frame, [25, 95, 170, 255], points.map((point) => point[1]), {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.2, 0.8, 0.2, 1)
  });

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: 76,
          height: 76,
          borderRadius: 999,
          border: `7px solid ${accent}`,
          opacity: interpolate(frame % 42, [0, 20, 42], [0.96, 0.28, 0.96], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp"
          })
        }}
      />
      <div
        style={{
          position: "absolute",
          left: x + 26,
          top: y + 23,
          width: 0,
          height: 0,
          borderTop: "23px solid transparent",
          borderBottom: "23px solid transparent",
          borderLeft: "35px solid #111827",
          rotate: "-34deg"
        }}
      />
    </>
  );
}

function isMobileLikeMedia(media) {
  const source = mediaSource(media).toLowerCase();
  return /mobile|phone|vertical|portrait|scroll/.test(source);
}

function isReadableScreenMedia(media) {
  const source = mediaSource(media).toLowerCase();
  return /(tool-readable|desktop-landing|desktop-demo|desktop-top|desktop-full-page|mobile-top|mobile-scroll|screenshot|screen-record)/.test(source);
}

function AltFToolOpenOverlay({ sceneIndex, toolName, toolUrl, assets, frame, fps, accent }) {
  if (sceneIndex !== 1) {
    return null;
  }

  const cardSeconds = Math.max(0, Math.min(6, Number(assets?.altfOpenCardSeconds ?? 4) || 0));
  if (cardSeconds <= 0) {
    return null;
  }
  const endFrame = Math.round(fps * cardSeconds);
  const fadeFrames = Math.max(1, Math.min(12, Math.floor(endFrame / 3)));
  const opacity = interpolate(frame, [0, fadeFrames, Math.max(fadeFrames, endFrame - fadeFrames), endFrame], [1, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1)
  });
  const enter = spring({
    frame,
    fps,
    config: { damping: 150, stiffness: 210, mass: 0.72 }
  });
  const domain = compactDomain(toolUrl || "https://www.altftool.com/");
  const displayDomain = /altftool/i.test(domain) ? "AltFTool.com" : domain;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 32,
        opacity,
        background: `linear-gradient(160deg, #020617 0%, #08111f 52%, ${accent}88 100%)`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 72,
        pointerEvents: "none"
      }}
    >
      <div
        style={{
          scale: interpolate(enter, [0, 1], [0.88, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp"
          }),
          translate: `0px ${interpolate(frame, [0, 24], [44, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1)
          })}px`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center"
        }}
      >
        <ToolLogoMark toolName={toolName} assets={assets} accent={accent} frame={frame} size={176} />
        <div
          style={{
            marginTop: 42,
            padding: "13px 22px",
            borderRadius: 999,
            backgroundColor: "#FFD700",
            color: "#111827",
            fontSize: 25,
            lineHeight: 1,
            fontWeight: 980,
            boxShadow: "0 18px 48px rgba(0,0,0,0.28)"
          }}
        >
          OPEN THIS FIRST
        </div>
        <div
          style={{
            marginTop: 26,
            color: "#ffffff",
            fontSize: 92,
            lineHeight: 0.96,
            fontWeight: 980,
            textAlign: "center",
            textShadow: "0 8px 0 rgba(0,0,0,0.26), 0 0 42px rgba(0,0,0,0.34)"
          }}
        >
          {displayDomain}
        </div>
        <div
          style={{
            marginTop: 24,
            maxWidth: 760,
            color: "rgba(255,255,255,0.86)",
            fontSize: 34,
            lineHeight: 1.12,
            fontWeight: 760,
            textAlign: "center",
            textWrap: "balance"
          }}
        >
          Then search or open {brandedToolDisplay(toolName, 44)} and watch the real demo.
        </div>
        <div
          style={{
            marginTop: 44,
            padding: "19px 28px",
            borderRadius: 999,
            backgroundColor: "rgba(255,255,255,0.94)",
            color: Palette.ink,
            fontSize: 28,
            lineHeight: 1,
            fontWeight: 940
          }}
        >
          Real tool screenshots start next
        </div>
      </div>
    </div>
  );
}

function FullscreenDemoMedia({ media, scene, sceneIndex, totalScenes, toolName, toolUrl, assets, frame, sceneFrame = frame, fps, accent, sequenceInfo }) {
  const source = mediaSource(media);
  const mediaMeta = media && typeof media === "object" ? media : {};
  const portraitLike = isMobileLikeMedia(media);
  const text = sceneNarrationText(scene);
  const variant = visualVariantFor(toolName, sceneIndex, totalScenes);
  const lowerSource = source.toLowerCase();
  const readableScreen = isReadableScreenMedia(media);
  const layout = demoLayoutForVariant(variant, portraitLike, readableScreen);
  const mediaFit = mediaMeta.objectFit || (readableScreen ? "contain" : lowerSource.includes("mobile") && !lowerSource.includes("scroll") ? "cover" : "contain");
  const objectPosition = mediaMeta.objectPosition || (readableScreen
    ? /(result|output|after|review|summary|warning)/.test(text)
      ? "50% 48%"
      : /(input|fill|upload|click|run|button|workflow)/.test(text)
        ? "50% 46%"
        : "50% 44%"
    : /(result|output|after|review|summary|warning)/.test(text)
      ? "50% 42%"
      : /(input|fill|upload|click|run|button|workflow)/.test(text)
        ? "50% 50%"
      : sceneIndex === 1
        ? "50% 18%"
        : "50% 46%");
  const zoomStart = readableScreen ? 1 : portraitLike ? 1.01 : 1.04;
  const zoomEnd = readableScreen ? 1 : portraitLike ? 1.06 : 1.1;
  const zoom = interpolate(frame, [0, Math.round(fps * 10)], [zoomStart, zoomEnd], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1)
  });
  const yPan = interpolate(frame, [0, Math.round(fps * 10)], readableScreen ? [0, 0] : portraitLike ? [0, -24] : variant === 3 ? [8, -22] : [24, -34], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.33, 0, 0.2, 1)
  });
  const xPanPoints = variant === 1 ? [-24, 10] : variant === 2 ? [18, -22] : sceneIndex % 2 ? [-16, 16] : [14, -14];
  const xPan = interpolate(frame, [0, Math.round(fps * 10)], readableScreen ? [0, 0] : xPanPoints, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.33, 0, 0.2, 1)
  });
  const useGuideShot = /(how to use|kaise|use karo|use karna|input|fill|upload|click|run|workflow|step|demo)/i.test(text);
  const inputFilledShot = /desktop-demo-inputs|input/.test(lowerSource);
  const outputShot = /(result|output|after|review|summary|warning)/i.test(text);
  const demoTitle = mediaMeta.demoTitle || (inputFilledShot ? "REAL INPUT DEMO" : useGuideShot ? "HOW TO USE DEMO" : "ACTUAL TOOL DEMO");
  const badge = mediaMeta.badge || (inputFilledShot
    ? "INPUT VALUES FILLED"
    : useGuideShot
      ? "OPEN -> INPUT -> RUN -> REVIEW"
      : outputShot
        ? "RESULT REVIEW"
        : mediaPurposeLabel(scene, sceneIndex, totalScenes));
  const shotCount = sequenceInfo?.sequence?.length || 0;
  const shotLabel = shotCount > 1 ? `SHOT ${Number(sequenceInfo.slotIndex || 0) + 1}/${shotCount}` : "";

  return (
    <AbsoluteFill style={{ backgroundColor: "#020617", overflow: "hidden" }}>
      {source && !isVideoAsset(source) ? (
        <Img
          src={staticFile(source)}
          style={{
            ...fullBleed,
            objectFit: "cover",
            objectPosition,
            scale: 1.18,
            filter: "blur(24px) saturate(0.9)",
            opacity: 0.42
          }}
        />
      ) : (
        <div style={{ ...fullBleed, background: `linear-gradient(${layout.backgroundAngle}deg, #020617 0%, #111827 52%, ${accent}66 100%)` }} />
      )}
      <div style={{ ...fullBleed, background: "linear-gradient(180deg, rgba(2,6,23,0.64) 0%, rgba(2,6,23,0.06) 18%, rgba(2,6,23,0.02) 58%, rgba(2,6,23,0.82) 100%)" }} />
      <div
        style={{
          position: "absolute",
          inset: layout.cardInset,
          overflow: "hidden",
          borderRadius: layout.cardRadius,
          border: layout.cardBorder,
          boxShadow: layout.cardShadow,
          backgroundColor: "#0b1020",
          rotate: layout.rotate
        }}
      >
        <MediaLayer
          media={media}
          fit={mediaFit}
          fps={fps}
          crop={false}
          objectPosition={objectPosition}
          style={{
            ...fullBleed,
            scale: zoom,
            translate: `${xPan}px ${yPan}px`
          }}
        />
        <div style={{ ...fullBleed, boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.12)" }} />
      </div>

      <div
        style={{
          position: "absolute",
          ...layout.top,
          minHeight: readableScreen ? 50 : 82,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: readableScreen ? 12 : 18,
          padding: readableScreen ? "8px 11px" : "16px 20px",
          borderRadius: readableScreen ? 14 : 24,
          backgroundColor: readableScreen ? "rgba(255,255,255,0.82)" : "rgba(255,255,255,0.94)",
          border: readableScreen ? "1px solid rgba(255,255,255,0.68)" : "3px solid rgba(255,255,255,0.9)",
          boxShadow: readableScreen ? "0 10px 34px rgba(0,0,0,0.18)" : "0 20px 70px rgba(0,0,0,0.28)"
        }}
      >
        <div style={{ minWidth: 0, display: "flex", alignItems: "center", gap: readableScreen ? 10 : 14 }}>
          <MiniBrandLogo assets={assets} accent={accent} compact={readableScreen} />
          <div style={{ minWidth: 0 }}>
            <div style={{ color: accent, fontSize: readableScreen ? 14 : 22, lineHeight: 1, fontWeight: 980 }}>
              {demoTitle}
            </div>
            <div style={{ marginTop: readableScreen ? 4 : 7, color: Palette.ink, fontSize: readableScreen ? 21 : 31, lineHeight: 1, fontWeight: 940, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {brandedToolDisplay(toolName, readableScreen ? 52 : 44)}
            </div>
          </div>
        </div>
        <div
          style={{
            flex: "0 0 auto",
            padding: readableScreen ? "8px 11px" : "13px 17px",
            borderRadius: 999,
            backgroundColor: "#111827",
            color: "#FFD700",
            fontSize: readableScreen ? 15 : 20,
            fontWeight: 960,
            lineHeight: 1
          }}
        >
          {String(scene.scene_number || sceneIndex + 1).padStart(2, "0")} / {String(totalScenes).padStart(2, "0")}
        </div>
      </div>

      {!readableScreen ? (
        <div
          style={{
            position: "absolute",
            left: layout.chipsLeft,
            right: layout.chipsRight,
            top: layout.chipsTop,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12
          }}
        >
          {[badge, shotLabel || "Fictional demo data", compactDomain(toolUrl)].filter(Boolean).map((label, index) => (
          <div
            key={`${label}-${index}`}
            style={{
              minWidth: 0,
              flex: index === 0 ? "1.2 1 0" : "1 1 0",
              padding: readableScreen ? "11px 14px" : "15px 16px",
              borderRadius: 999,
              backgroundColor: index === 0 ? accent : "rgba(255,255,255,0.92)",
              color: index === 0 ? "#ffffff" : Palette.ink,
              border: index === 0 ? "0 solid transparent" : "3px solid rgba(255,255,255,0.76)",
              boxShadow: readableScreen ? "0 10px 34px rgba(0,0,0,0.2)" : "0 16px 48px rgba(0,0,0,0.22)",
              fontSize: readableScreen ? 18 : 21,
              lineHeight: 1,
              fontWeight: 930,
              textAlign: "center",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap"
            }}
          >
            {label}
          </div>
          ))}
        </div>
      ) : null}
      <AltFToolOpenOverlay
        sceneIndex={sceneIndex}
        toolName={toolName}
        toolUrl={toolUrl}
        assets={assets}
        frame={sceneFrame}
        fps={fps}
        accent={accent}
      />
    </AbsoluteFill>
  );
}

function HookScene({ scene, sceneIndex, totalScenes, toolName, toolUrl, assets, toolMedia, generatedClip, frame, fps, accent, sceneDurationFrames, fade }) {
  const headline = firstStrongLine(scene, toolName, sceneIndex);
  const presenterStyle = assets.hookAvatarStyle || "female";
  const presenterLabel = avatarPresenterLabel(presenterStyle);
  const titleIn = interpolate(frame, [0, 20], [42, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1)
  });
  const hostIn = interpolate(frame, [8, 32], [145, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1)
  });
  const screenIn = interpolate(frame, [26, 54], [86, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1)
  });
  const hookPulse = interpolate(frame % 58, [0, 29, 58], [1, 1.045, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });

  return (
    <AbsoluteFill style={{ opacity: fade, overflow: "hidden" }}>
      <BackgroundWash asset={toolMedia || assets.desktop} frame={frame} accent={accent} />
      <TopStrip scene={scene} sceneIndex={sceneIndex} totalScenes={totalScenes} toolName={toolName} />

      <div
        style={{
          position: "absolute",
          left: 74,
          top: 162,
          width: 485,
          translate: `0px ${titleIn}px`
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "13px 18px",
            borderRadius: 999,
            backgroundColor: "#fee2e2",
            color: Palette.red,
            fontSize: 28,
            fontWeight: 950
          }}
        >
          Scroll stopper
        </div>
        <div
          style={{
            marginTop: 26,
            color: Palette.ink,
            fontSize: 92,
            lineHeight: 0.96,
            fontWeight: 980,
            textWrap: "balance"
          }}
        >
          {clampText(headline, 34)}
        </div>
        <div
          style={{
          marginTop: 24,
          color: Palette.slate,
          fontSize: 32,
          lineHeight: 1.16,
          fontWeight: 760
        }}
      >
          {supportingLine(scene, 88)}
        </div>
      </div>

      <HostFrame
        avatarHost={assets.avatarHost}
        generatedClip={generatedClip}
        fps={fps}
        accent={accent}
        label={generatedClip ? "AI Avatar Hook" : `${presenterLabel} Hook`}
        sublabel="speaking first line"
        presenterStyle={presenterStyle}
        style={{
          right: 58,
          top: 355,
          width: 442,
          height: 820,
          translate: `${hostIn}px 0px`
        }}
      />

      <BrowserFrame
        media={toolMedia}
        fps={fps}
        accent={Palette.blue}
        label="REAL TOOL PAGE"
        large={false}
        style={{
          left: 74,
          top: 885,
          width: 520,
          height: 385,
          translate: `0px ${screenIn}px`
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 74,
          right: 74,
          top: 1315,
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 14
        }}
      >
        {["Avatar hook", "Real demo", "Post-ready edit"].map((label, index) => (
          <div
            key={label}
            style={{
              padding: "22px 14px",
              borderRadius: 20,
              backgroundColor: index === 1 ? "#ecfdf5" : index === 2 ? "#eff6ff" : "#fff7ed",
              color: index === 1 ? Palette.green : index === 2 ? Palette.blue : "#9a3412",
              fontSize: 25,
              lineHeight: 1,
              fontWeight: 930,
              textAlign: "center",
              scale: index === 0 ? hookPulse : 1
            }}
          >
            {label}
          </div>
        ))}
      </div>

      <ProgressBar frame={frame} sceneDurationFrames={sceneDurationFrames} accent={accent} />

      <div
        style={{
          position: "absolute",
          left: 76,
          right: 76,
          bottom: 38,
          color: Palette.muted,
          fontSize: 22,
          fontWeight: 650
        }}
      >
        {clampText(toolUrl || "altftool.com", 74)}
      </div>
    </AbsoluteFill>
  );
}

function HookVideoLeadScene({ scene, sceneIndex, totalScenes, toolName, toolUrl, assets, generatedClip, frame, fps, accent, sceneDurationFrames, fade }) {
  const muteAvatarAudio = ["mute", "muted", "off"].includes(String(assets?.avatarAudioMode || "").toLowerCase());
  const showAvatarCaption = avatarCaptionsEnabled(assets, generatedClip);
  return (
    <AbsoluteFill style={{ opacity: fade, overflow: "hidden", backgroundColor: "#020617" }}>
      <div style={{ ...fullBleed }}>
        <MediaLayer
          media={{ ...generatedClip, muted: muteAvatarAudio, loop: false, objectFit: "cover" }}
          fit="cover"
          fps={fps}
          style={{ ...fullBleed }}
        />
      </div>
      <div style={{ ...fullBleed, background: "linear-gradient(180deg, rgba(2,6,23,0.18) 0%, rgba(2,6,23,0.05) 42%, rgba(2,6,23,0.78) 100%)" }} />
      <div style={{ ...fullBleed, border: `18px solid ${accent}` , opacity: 0.82 }} />

      <div
        style={{
          position: "absolute",
          left: 68,
          right: 68,
          top: 58,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          color: "#ffffff",
          fontSize: 24,
          fontWeight: 880,
          textShadow: "0 3px 14px rgba(0,0,0,0.45)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 14, height: 14, borderRadius: 999, backgroundColor: "#FFD700", boxShadow: "0 0 24px rgba(255,215,0,0.65)" }} />
          <div>{brandedToolDisplay(toolName, 40)}</div>
        </div>
        <div>{String(scene.scene_number || sceneIndex + 1).padStart(2, "0")} / {String(totalScenes).padStart(2, "0")}</div>
      </div>

      {showAvatarCaption ? (
        <ReelCaption
          text={scene.voiceover}
          frame={frame}
          fps={fps}
          accent={accent}
          compact
          sceneDurationFrames={sceneDurationFrames}
          sceneIndex={sceneIndex}
          captionStyle={assets?.captionStyle}
        />
      ) : null}
    </AbsoluteFill>
  );
}

function AvatarVideoLeadScene({ scene, sceneIndex, totalScenes, toolName, toolUrl, assets, generatedClip, frame, fps, accent, sceneDurationFrames, fade }) {
  const muteAvatarAudio = ["mute", "muted", "off"].includes(String(assets?.avatarAudioMode || "").toLowerCase());
  const showAvatarCaption = avatarCaptionsEnabled(assets, generatedClip);
  const labelIn = interpolate(frame, [0, 24], [-34, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1)
  });
  const badge = cleanText(generatedClip?.badge, "AI AVATAR VIDEO");

  return (
    <AbsoluteFill style={{ opacity: fade, overflow: "hidden", backgroundColor: "#020617" }}>
      <div style={{ ...fullBleed }}>
        <MediaLayer
          media={{ ...generatedClip, muted: muteAvatarAudio, loop: false, objectFit: "cover" }}
          fit="cover"
          fps={fps}
          style={{ ...fullBleed }}
          objectPosition="50% 42%"
        />
      </div>
      <div style={{ ...fullBleed, background: "linear-gradient(180deg, rgba(2,6,23,0.18) 0%, rgba(2,6,23,0.04) 44%, rgba(2,6,23,0.82) 100%)" }} />
      <div style={{ ...fullBleed, boxShadow: `inset 0 0 0 16px ${accent}` , opacity: 0.72 }} />

      <div
        style={{
          position: "absolute",
          left: 54,
          right: 54,
          top: 48,
          minHeight: 74,
          padding: "13px 16px",
          borderRadius: 999,
          backgroundColor: "rgba(255,255,255,0.94)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          boxShadow: "0 20px 72px rgba(0,0,0,0.28)",
          translate: `0px ${labelIn}px`
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ color: accent, fontSize: 18, lineHeight: 1, fontWeight: 980, textTransform: "uppercase" }}>
            {clampText(badge, 28)}
          </div>
          <div style={{ marginTop: 6, color: Palette.ink, fontSize: 28, lineHeight: 1, fontWeight: 950, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {brandedToolDisplay(toolName, 42)}
          </div>
        </div>
        <div style={{ flex: "0 0 auto", color: Palette.ink, fontSize: 21, lineHeight: 1, fontWeight: 900 }}>
          {String(scene.scene_number || sceneIndex + 1).padStart(2, "0")} / {String(totalScenes).padStart(2, "0")}
        </div>
      </div>

      {showAvatarCaption ? (
        <ReelCaption
          text={scene.voiceover}
          frame={frame}
          fps={fps}
          accent={accent}
          compact
          sceneDurationFrames={sceneDurationFrames}
          sceneIndex={sceneIndex}
          captionStyle={assets?.captionStyle}
        />
      ) : null}
    </AbsoluteFill>
  );
}

function CtaAvatarLeadScene({ scene, sceneIndex, totalScenes, toolName, toolUrl, assets, generatedClip, frame, fps, accent, sceneDurationFrames, fade }) {
  const muteAvatarAudio = ["mute", "muted", "off"].includes(String(assets?.avatarAudioMode || "").toLowerCase());
  const showAvatarCaption = avatarCaptionsEnabled(assets, generatedClip);
  const outroFrames = brandOutroFrames(assets, fps);
  const brandOutroStart = outroFrames > 0 ? Math.max(0, sceneDurationFrames - outroFrames) : sceneDurationFrames + 1;
  const showCtaOverlay = frame < brandOutroStart - 4;
  const topIn = interpolate(frame, [0, 26], [-42, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1)
  });

  return (
    <AbsoluteFill style={{ opacity: fade, overflow: "hidden", backgroundColor: "#020617" }}>
      <div style={{ ...fullBleed }}>
        <MediaLayer
          media={{ ...generatedClip, muted: muteAvatarAudio, loop: false, objectFit: "cover" }}
          fit="cover"
          fps={fps}
          style={{ ...fullBleed }}
          objectPosition="50% 42%"
        />
      </div>
      <div style={{ ...fullBleed, background: "linear-gradient(180deg, rgba(2,6,23,0.2) 0%, rgba(2,6,23,0.04) 38%, rgba(2,6,23,0.9) 100%)" }} />
      <div style={{ ...fullBleed, boxShadow: `inset 0 0 0 18px ${accent}` , opacity: 0.78 }} />

      {showCtaOverlay ? (
        <>
          <div
            style={{
              position: "absolute",
              left: 54,
              right: 54,
              top: 46,
              minHeight: 72,
              padding: "14px 18px",
              borderRadius: 999,
              backgroundColor: "rgba(255,255,255,0.94)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              boxShadow: "0 20px 70px rgba(0,0,0,0.28)",
              translate: `0px ${topIn}px`
            }}
          >
            <div style={{ minWidth: 0, display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 14, height: 14, borderRadius: 999, backgroundColor: "#FFD700", boxShadow: "0 0 24px rgba(255,215,0,0.7)" }} />
              <div style={{ color: Palette.ink, fontSize: 28, lineHeight: 1, fontWeight: 940, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {brandedToolDisplay(toolName, 42)}
              </div>
            </div>
            <div style={{ flex: "0 0 auto", color: accent, fontSize: 21, lineHeight: 1, fontWeight: 980 }}>
              {compactDomain(toolUrl)}
            </div>
          </div>

        </>
      ) : null}
      {showCtaOverlay && showAvatarCaption ? (
        <ReelCaption
          text={scene.voiceover}
          frame={frame}
          fps={fps}
          accent={accent}
          compact
          sceneDurationFrames={sceneDurationFrames}
          sceneIndex={sceneIndex}
          captionStyle={assets?.captionStyle}
        />
      ) : null}
    </AbsoluteFill>
  );
}

function IntroScene({ scene, sceneIndex, totalScenes, toolName, toolUrl, assets, toolMedia, generatedClip, frame, fps, accent, sceneDurationFrames, fade }) {
  const enter = spring({ frame, fps, config: { damping: 170, stiffness: 130, mass: 0.8 } });
  const hostX = interpolate(enter, [0, 1], [-70, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const screenY = interpolate(enter, [0, 1], [70, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ opacity: fade, overflow: "hidden" }}>
      <BackgroundWash asset={toolMedia || assets.desktop} frame={frame} accent={accent} />
      <TopStrip scene={scene} sceneIndex={sceneIndex} totalScenes={totalScenes} toolName={toolName} />

      <div style={{ position: "absolute", left: 72, right: 72, top: 168 }}>
        <div style={{ color: Palette.ink, fontSize: 76, lineHeight: 1.02, fontWeight: 950, textWrap: "balance" }}>
          {brandedToolDisplay(toolName, 48)}
        </div>
        <div style={{ marginTop: 18, color: Palette.slate, fontSize: 35, lineHeight: 1.18, fontWeight: 720 }}>
          {supportingLine(scene, 118)}
        </div>
      </div>

      <BrowserFrame
        media={toolMedia}
        fps={fps}
        accent={accent}
        label={mediaPurposeLabel(scene, sceneIndex, totalScenes)}
        large
        style={{
          left: 72,
          right: 72,
          top: 470,
          height: 725,
          translate: `0px ${screenY}px`
        }}
      />

      <HostFrame
        avatarHost={assets.avatarHost}
        generatedClip={generatedClip}
        fps={fps}
        accent={accent}
        label={generatedClip ? "Avatar explainer" : "Presenter"}
        sublabel="why this helps"
        presenterStyle={assets.hookAvatarStyle || "female"}
        style={{
          left: 72,
          top: 1240,
          width: 330,
          height: 420,
          translate: `${hostX}px 0px`
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 430,
          right: 72,
          top: 1265,
          display: "grid",
          gap: 15
        }}
      >
        {["Focused micro tool", "Use fictional/demo data", "Review before share"].map((label, index) => (
          <div
            key={label}
            style={{
              padding: "24px 28px",
              borderRadius: 22,
              backgroundColor: index === 0 ? "#eff6ff" : index === 1 ? "#ecfdf5" : "#fff7ed",
              color: index === 0 ? Palette.blue : index === 1 ? Palette.green : "#9a3412",
              fontSize: 32,
              lineHeight: 1.08,
              fontWeight: 900
            }}
          >
            {label}
          </div>
        ))}
      </div>

      {captionsEnabledForScene(assets, sceneIndex, totalScenes) ? (
        <ReelCaption text={scene.voiceover} frame={frame} fps={fps} accent={accent} compact sceneDurationFrames={sceneDurationFrames} sceneIndex={sceneIndex} captionStyle={assets?.captionStyle} />
      ) : null}
      <ProgressBar frame={frame} sceneDurationFrames={sceneDurationFrames} accent={accent} />
      <div style={{ position: "absolute", left: 76, right: 76, bottom: 38, color: Palette.muted, fontSize: 22, fontWeight: 650 }}>
        {clampText(toolUrl || "altftool.com", 74)}
      </div>
    </AbsoluteFill>
  );
}

function DemoScene({ scene, sceneIndex, totalScenes, toolName, toolUrl, assets, toolMedia, generatedClip, frame, fps, accent, sceneDurationFrames, fade }) {
  const isWorkflow = sceneIndex > 2;
  const activeShot = activeDemoShot({
    assets,
    scene,
    sceneIndex,
    totalScenes,
    toolMedia,
    frame,
    fps,
    sceneDurationFrames
  });
  const activeMedia = activeShot.media || toolMedia;
  const readableDemoMedia = isReadableScreenMedia(activeMedia);
  const demoCaptionText = readableDemoMedia ? captionReadableText(scene.voiceover) : scene.voiceover;
  const presenterIn = interpolate(frame, [20, 48], [120, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1)
  });
  const hostStyle = readableDemoMedia
    ? {
      right: 28,
      top: 1218,
      width: 162,
      height: 220,
      translate: `${presenterIn}px 0px`
    }
    : {
      right: 42,
      top: 1110,
      width: 220,
      height: 300,
      translate: `${presenterIn}px 0px`
    };

  return (
    <AbsoluteFill style={{ opacity: fade, overflow: "hidden" }}>
      <FullscreenDemoMedia
        media={activeMedia}
        scene={scene}
        sceneIndex={sceneIndex}
        totalScenes={totalScenes}
        toolName={toolName}
        toolUrl={toolUrl}
        assets={assets}
        frame={activeShot.slotFrame}
        sceneFrame={frame}
        fps={fps}
        accent={accent}
        sequenceInfo={activeShot}
      />
      <CursorCallout frame={activeShot.slotFrame} accent={accent} variant={isWorkflow ? "workflow" : "demo"} />

      {assets.avatarHost && !generatedClip ? (
        <HostFrame
          avatarHost={assets.avatarHost}
          fps={fps}
          accent={accent}
          label="Host note"
          sublabel="explaining steps"
          presenterStyle={assets.hookAvatarStyle || "female"}
          style={hostStyle}
          objectPosition="54% 42%"
        />
      ) : null}

      {captionsEnabledForScene(assets, sceneIndex, totalScenes) ? (
        <ReelCaption
          text={demoCaptionText}
          frame={frame}
          fps={fps}
          accent={accent}
          compact={readableDemoMedia}
          demoReadable={readableDemoMedia}
          sceneDurationFrames={sceneDurationFrames}
          sceneIndex={sceneIndex}
          captionStyle={assets?.captionStyle}
        />
      ) : null}
      {!readableDemoMedia ? (
        <>
          <ProgressBar frame={frame} sceneDurationFrames={sceneDurationFrames} accent="#FFD700" />
          <div style={{ position: "absolute", left: 76, right: 76, bottom: 38, color: "rgba(255,255,255,0.78)", fontSize: 22, fontWeight: 700 }}>
            {clampText(toolUrl || "altftool.com", 74)}
          </div>
        </>
      ) : null}
    </AbsoluteFill>
  );
}

function ProofScene({ scene, sceneIndex, totalScenes, toolName, toolUrl, assets, generatedClip, frame, fps, accent, sceneDurationFrames, fade }) {
  const beforeMedia = beforeDemoAsset(assets);
  const afterMedia = afterDemoAsset(assets);
  const leftIn = interpolate(frame, [8, 32], [-54, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1)
  });
  const rightIn = interpolate(frame, [16, 42], [54, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1)
  });

  return (
    <AbsoluteFill style={{ opacity: fade, overflow: "hidden" }}>
      <BackgroundWash asset={assets.demoAfter || assets.desktopFull || assets.desktop} frame={frame} accent={accent} />
      <TopStrip scene={scene} sceneIndex={sceneIndex} totalScenes={totalScenes} toolName={toolName} />

      <div style={{ position: "absolute", left: 72, right: 72, top: 158 }}>
        <div style={{ color: Palette.ink, fontSize: 80, lineHeight: 1.02, fontWeight: 970 }}>
          {firstStrongLine(scene, toolName, sceneIndex)}
        </div>
        <div style={{ marginTop: 18, color: Palette.slate, fontSize: 34, lineHeight: 1.18, fontWeight: 720 }}>
          {supportingLine(scene, 110)}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 48,
          right: 48,
          top: 392,
          height: 910,
          borderRadius: 32,
          overflow: "hidden",
          border: `5px solid ${Palette.line}`,
          backgroundColor: "#0b1020",
          boxShadow: "0 36px 110px rgba(15, 23, 42, 0.28)",
          translate: `${rightIn}px 0px`
        }}
      >
        <MediaLayer
          media={afterMedia}
          fit="contain"
          fps={fps}
          objectPosition="50% 42%"
          style={{
            ...fullBleed,
            scale: interpolate(frame, [0, sceneDurationFrames], [1, 1.04], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp"
            })
          }}
        />
        <div style={{ ...fullBleed, boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.16)" }} />
        <div
          style={{
            position: "absolute",
            left: 28,
            top: 28,
            padding: "14px 20px",
            borderRadius: 999,
            backgroundColor: Palette.green,
            color: "#ffffff",
            fontSize: 27,
            lineHeight: 1,
            fontWeight: 980,
            boxShadow: "0 16px 44px rgba(22, 163, 74, 0.34)"
          }}
        >
          AFTER: READY OUTPUT
        </div>
        <div
          style={{
            position: "absolute",
            left: 30,
            bottom: 30,
            width: 432,
            height: 298,
            borderRadius: 22,
            overflow: "hidden",
            border: "5px solid #ffffff",
            backgroundColor: "#fff1f2",
            boxShadow: "0 28px 72px rgba(0,0,0,0.34)",
            translate: `${leftIn}px 0px`
          }}
        >
          <MediaLayer media={beforeMedia} fit="cover" fps={fps} objectPosition="50% 48%" />
          <div style={{ position: "absolute", left: 18, top: 18, padding: "10px 15px", borderRadius: 999, backgroundColor: Palette.red, color: "#ffffff", fontSize: 21, fontWeight: 950 }}>
            BEFORE
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            right: 28,
            bottom: 30,
            padding: "16px 20px",
            borderRadius: 22,
            backgroundColor: "rgba(255,255,255,0.95)",
            color: Palette.ink,
            fontSize: 28,
            lineHeight: 1.08,
            fontWeight: 930,
            maxWidth: 452,
            boxShadow: "0 24px 70px rgba(0,0,0,0.24)"
          }}
        >
          Real demo proof from {brandedToolDisplay(toolName, 34)}
        </div>
      </div>

      <div style={{ position: "absolute", left: 74, right: generatedClip || assets.avatarHost ? 362 : 74, top: 1334, display: "grid", gap: 13 }}>
        {["Less manual guesswork", "Clearer next step", "Human review stays final"].map((label, index) => (
          <div
            key={label}
            style={{
              padding: "20px 24px",
              borderRadius: 20,
              backgroundColor: index === 2 ? "#fff7ed" : "#eff6ff",
              color: index === 2 ? "#9a3412" : Palette.blue,
              fontSize: 29,
              lineHeight: 1.08,
              fontWeight: 900
            }}
          >
            {label}
          </div>
        ))}
      </div>

      {generatedClip || assets.avatarHost ? (
        <HostFrame
          avatarHost={assets.avatarHost}
          generatedClip={generatedClip}
          fps={fps}
          accent={accent}
          label={generatedClip ? "Avatar reaction" : "Host reaction"}
          sublabel="benefit proof"
          presenterStyle={assets.hookAvatarStyle || "female"}
          style={{
            right: 60,
            top: 1318,
            width: 274,
            height: 362
          }}
        />
      ) : null}

      {captionsEnabledForScene(assets, sceneIndex, totalScenes) ? (
        <ReelCaption text={scene.voiceover} frame={frame} fps={fps} accent={accent} sceneDurationFrames={sceneDurationFrames} sceneIndex={sceneIndex} captionStyle={assets?.captionStyle} />
      ) : null}
      <ProgressBar frame={frame} sceneDurationFrames={sceneDurationFrames} accent={accent} />
      <div style={{ position: "absolute", left: 76, right: 76, bottom: 38, color: Palette.muted, fontSize: 22, fontWeight: 650 }}>
        {clampText(toolUrl || "altftool.com", 74)}
      </div>
    </AbsoluteFill>
  );
}

function CtaScene({ scene, sceneIndex, totalScenes, toolName, toolUrl, assets, toolMedia, generatedClip, frame, fps, accent, sceneDurationFrames, fade }) {
  const outroFrames = brandOutroFrames(assets, fps);
  const brandOutroStart = outroFrames > 0 ? Math.max(0, sceneDurationFrames - outroFrames) : sceneDurationFrames + 1;
  const showRegularOutroUi = frame < brandOutroStart - 4;
  const hostIn = interpolate(frame, [4, 28], [-120, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1)
  });
  const cardIn = interpolate(frame, [18, 48], [90, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1)
  });

  return (
    <AbsoluteFill style={{ opacity: fade, overflow: "hidden" }}>
      <BackgroundWash asset={toolMedia || assets.demoAfter || assets.desktop} frame={frame} accent={accent} />
      <TopStrip scene={scene} sceneIndex={sceneIndex} totalScenes={totalScenes} toolName={toolName} />

      <div style={{ position: "absolute", left: 72, right: 72, top: 158 }}>
        <div style={{ color: Palette.ink, fontSize: 82, lineHeight: 1.02, fontWeight: 970, textWrap: "balance" }}>
          {firstStrongLine(scene, toolName, sceneIndex)}
        </div>
        <div style={{ marginTop: 18, color: Palette.slate, fontSize: 35, lineHeight: 1.18, fontWeight: 720 }}>
          {supportingLine(scene, 108)}
        </div>
      </div>

      <HostFrame
        avatarHost={assets.avatarHost}
        generatedClip={generatedClip}
        fps={fps}
        accent={accent}
        label={generatedClip ? "AI Avatar Outro" : "Final review"}
        sublabel="save + share"
        presenterStyle={assets.hookAvatarStyle || "female"}
        style={{
          left: 66,
          top: 465,
          width: 440,
          height: 720,
          translate: `${hostIn}px 0px`
        }}
      />

      <div
        style={{
          position: "absolute",
          right: 66,
          top: 505,
          width: 470,
          borderRadius: 26,
          backgroundColor: "#ffffff",
          border: `3px solid ${Palette.line}`,
          boxShadow: "0 32px 90px rgba(15, 23, 42, 0.2)",
          padding: 34,
          translate: `${cardIn}px 0px`
        }}
      >
        <div style={{ color: Palette.ink, fontSize: 42, lineHeight: 1.05, fontWeight: 950 }}>
          Before posting
        </div>
        <div style={{ marginTop: 28, display: "grid", gap: 18 }}>
          {["Check output", "No sensitive data", "Save this tool"].map((label, index) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 38, height: 38, borderRadius: 999, backgroundColor: index === 2 ? accent : Palette.green, color: "#fff", fontSize: 25, fontWeight: 950, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {index + 1}
              </div>
              <div style={{ color: Palette.slate, fontSize: 32, fontWeight: 880 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      <BrowserFrame
        media={toolMedia}
        fps={fps}
        accent={Palette.blue}
        label="ALT F TOOL PROOF"
        style={{
          left: 74,
          right: 74,
          top: 1238,
          height: 260
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 76,
          right: 76,
          top: 1536,
          padding: "24px 30px",
          borderRadius: 24,
          backgroundColor: "#fff7ed",
          color: "#9a3412",
          fontSize: 31,
          lineHeight: 1.16,
          fontWeight: 860,
          textAlign: "center"
        }}
      >
        Human review mandatory before publishing or sharing.
      </div>

      {showRegularOutroUi ? (
        <>
          {captionsEnabledForScene(assets, sceneIndex, totalScenes) ? (
            <ReelCaption text={scene.voiceover} frame={frame} fps={fps} accent={accent} compact sceneDurationFrames={sceneDurationFrames} sceneIndex={sceneIndex} captionStyle={assets?.captionStyle} />
          ) : null}
          <ProgressBar frame={frame} sceneDurationFrames={sceneDurationFrames} accent={accent} />
          <div style={{ position: "absolute", left: 76, right: 76, bottom: 38, color: Palette.muted, fontSize: 22, fontWeight: 650 }}>
            {clampText(toolUrl || "altftool.com", 74)}
          </div>
        </>
      ) : null}
      <EndBrandCard
        toolName={toolName}
        toolUrl={toolUrl}
        assets={assets}
        frame={frame}
        fps={fps}
        accent={accent}
        sceneDurationFrames={sceneDurationFrames}
      />
    </AbsoluteFill>
  );
}

function TransitionOverlay({ frame, sceneDurationFrames, accent }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        translate: `${interpolate(frame, [sceneDurationFrames - 13, sceneDurationFrames], [0, 1080], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(0.7, 0, 0.84, 0)
        })}px 0px`,
        opacity: interpolate(frame, [0, 8, sceneDurationFrames - 13, sceneDurationFrames], [0.52, 0, 0, 0.62], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp"
        })
      }}
    >
      <div style={{ width: "100%", height: "100%", backgroundColor: accent }} />
    </div>
  );
}

export const ReelScene = ({ scene, sceneIndex, totalScenes = 6, sceneDurationSeconds = 10, toolName, toolUrl, assets }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sceneDurationFrames = Math.max(1, Number(sceneDurationSeconds || 10)) * fps;
  const accent = accents[sceneIndex] || Palette.blue;
  const rawAssets = assets || {};
  const generatedClip = cachedVidsMedia(rawAssets, sceneIndex, totalScenes);
  const generatedClipIsAvatar = isAvatarClipMedia(generatedClip);
  const shouldUseSavedAvatar = sceneIndex === 0 || sceneIndex === totalScenes - 1;
  const sceneAssets = shouldUseSavedAvatar ? rawAssets : { ...rawAssets, avatarHost: "" };
  const toolMedia = toolMediaForScene(sceneAssets, scene, sceneIndex, totalScenes);
  const fade = interpolate(frame, [0, sceneDurationFrames - 18, sceneDurationFrames], [1, 1, 0.94], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1)
  });
  const common = {
    scene,
    sceneIndex,
    totalScenes,
    toolName,
    toolUrl,
    assets: sceneAssets,
    toolMedia,
    generatedClip,
    frame,
    fps,
    accent,
    sceneDurationFrames,
    fade
  };

  let body;
  if (sceneIndex === 0 && generatedClipIsAvatar) {
    body = <HookVideoLeadScene {...common} />;
  } else if (sceneIndex === 0) {
    body = <HookScene {...common} />;
  } else if (sceneIndex === totalScenes - 1 && generatedClipIsAvatar) {
    body = <CtaAvatarLeadScene {...common} />;
  } else if (generatedClipIsAvatar) {
    body = <AvatarVideoLeadScene {...common} />;
  } else if (sceneIndex === totalScenes - 1) {
    body = <CtaScene {...common} />;
  } else if (shouldUseBeforeAfterScene(rawAssets, scene, sceneIndex, totalScenes)) {
    body = <ProofScene {...common} />;
  } else {
    body = <DemoScene {...common} />;
  }

  return (
    <>
      {body}
      <TransitionOverlay frame={frame} sceneDurationFrames={sceneDurationFrames} accent={accent} />
    </>
  );
};
