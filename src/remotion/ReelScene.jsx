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

function cachedVidsMedia(assets, sceneIndex, totalScenes = 6) {
  const sceneNumber = sceneIndex + 1;
  const sceneClip = assets.vidsClips?.[sceneIndex];
  if (sceneClip) {
    const isHook = sceneIndex === 0;
    const isCta = sceneIndex === totalScenes - 1;
    const audioScenes = new Set((assets.vidsClipAudioScenes || []).map(Number));
    const hasOwnAudio = isHook || isCta || audioScenes.has(sceneNumber);
    return {
      src: sceneClip,
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
  if (!assets?.demoBefore || !assets?.demoAfter) {
    return false;
  }
  const text = sceneNarrationText(scene);
  return /(before\s*(vs|\/|and)?\s*after|before|after|compare|comparison|difference|proof|pehle|baad|manual.*result|result.*manual|vs\.?|versus)/.test(text);
}

function toolMediaForScene(assets, scene = {}, sceneIndex = 0, totalScenes = 6) {
  const text = sceneNarrationText(scene);
  if (sceneIndex === 0) {
    return firstAvailable(assets.desktop, assets.demoBefore, assets.desktopFull, assets.mobile, assets.demoAfter);
  }
  if (sceneIndex === totalScenes - 1) {
    return firstAvailable(assets.demoAfter, assets.desktopFull, assets.demoVideo, assets.desktop, assets.mobile);
  }
  if (/(mobile|phone|scroll|instagram|caption|share|post|publish)/.test(text)) {
    return firstAvailable(assets.mobileScroll, assets.mobile, assets.demoAfter, assets.demoVideo, assets.desktopFull, assets.desktop);
  }
  if (/(before|manual|messy|problem|risk|mistake)/.test(text) && !/(after|result|output)/.test(text)) {
    return firstAvailable(assets.demoBefore, assets.desktop, assets.desktopFull, assets.demoVideo, assets.mobile);
  }
  if (shouldUseBeforeAfterScene(assets, scene, sceneIndex, totalScenes)) {
    return firstAvailable(assets.demoAfter, assets.demoBefore, assets.demoVideo, assets.desktopFull, assets.desktop);
  }
  if (/(result|output|summary|checklist|warning|next step|review-ready|ready)/.test(text)) {
    return firstAvailable(assets.demoAfter, assets.demoVideo, assets.mobileScroll, assets.desktopFull, assets.desktop);
  }
  if (/(input|fill|click|run|workflow|step|demo|use case|use-case|tool page|actual tool)/.test(text)) {
    return firstAvailable(assets.demoVideo, assets.mobileScroll, assets.demoAfter, assets.mobile, assets.desktopFull, assets.desktop);
  }
  if (sceneIndex === 1) {
    return firstAvailable(assets.demoVideo, assets.mobileScroll, assets.mobile, assets.demoAfter, assets.desktopFull, assets.desktop);
  }
  return firstAvailable(assets.demoVideo, assets.mobileScroll, assets.demoAfter, assets.mobile, assets.desktopFull, assets.desktop, assets.demoBefore);
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

function demoLayoutForVariant(variant, portraitLike) {
  const base = {
    cardInset: portraitLike ? "96px 38px 320px" : "142px 0 345px",
    cardRadius: portraitLike ? 34 : 0,
    cardBorder: portraitLike ? "5px solid rgba(255,255,255,0.92)" : "0 solid transparent",
    cardShadow: portraitLike ? "0 36px 110px rgba(0,0,0,0.42)" : "none",
    top: { left: 48, right: 48, top: 48 },
    chipsTop: portraitLike ? 1360 : 1276,
    chipsLeft: 58,
    chipsRight: 58,
    rotate: "0deg",
    backgroundAngle: 150
  };

  if (variant === 1) {
    return {
      ...base,
      cardInset: portraitLike ? "122px 72px 340px" : "178px 36px 365px",
      cardRadius: 32,
      cardBorder: "5px solid rgba(255,255,255,0.9)",
      cardShadow: "0 38px 120px rgba(0,0,0,0.38)",
      top: { left: 56, right: 210, top: 54 },
      chipsTop: portraitLike ? 1378 : 1306,
      chipsLeft: 80,
      chipsRight: 80,
      backgroundAngle: 34
    };
  }

  if (variant === 2) {
    return {
      ...base,
      cardInset: portraitLike ? "82px 30px 345px" : "116px 34px 375px",
      cardRadius: portraitLike ? 36 : 24,
      cardBorder: "4px solid rgba(255,255,255,0.78)",
      cardShadow: "0 42px 130px rgba(0,0,0,0.34)",
      top: { left: 210, right: 48, top: 54 },
      chipsTop: portraitLike ? 1350 : 1284,
      chipsLeft: 52,
      chipsRight: 150,
      backgroundAngle: 214
    };
  }

  if (variant === 3) {
    return {
      ...base,
      cardInset: portraitLike ? "112px 52px 300px" : "126px 0 315px",
      cardRadius: portraitLike ? 30 : 0,
      top: { left: 48, right: 48, top: 64 },
      chipsTop: portraitLike ? 1402 : 1326,
      chipsLeft: 132,
      chipsRight: 52,
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

function EndBrandCard({ toolName, toolUrl, assets, frame, fps, accent, sceneDurationFrames }) {
  const startFrame = Math.max(0, sceneDurationFrames - Math.round(fps * 3.1));
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

function ReelCaption({ text, frame, fps, accent, compact = false, sceneDurationFrames = 300, sceneIndex = 1 }) {
  const words = splitWords(text);
  if (!words.length) {
    return null;
  }
  const windowSize = compact ? 4 : 5;
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
  const shine = interpolate(frame % 64, [0, 32, 64], [0.08, 0.32, 0.08], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });
  const lineVariant = sceneIndex % 3;
  const captionBottom = compact ? 185 : lineVariant === 1 ? 146 : 168;
  const captionWidth = compact ? { left: 104, right: 104 } : lineVariant === 2 ? { left: 86, right: 118 } : { left: 64, right: 64 };
  const longestWord = visibleWords.reduce((max, item) => Math.max(max, item.word.length), 0);
  const baseFontSize = compact ? 46 : 58;
  const fontSize = longestWord > 13 ? baseFontSize - 6 : baseFontSize;

  return (
    <div
      style={{
        position: "absolute",
        ...captionWidth,
        bottom: captionBottom,
        minHeight: compact ? 112 : 136,
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
          minHeight: compact ? 112 : 136,
          padding: compact ? "24px 28px 22px" : "30px 38px 28px",
          borderRadius: 24,
          backgroundColor: "rgba(7, 12, 22, 0.94)",
          border: "4px solid rgba(255,255,255,0.86)",
          boxShadow: `0 18px 0 rgba(0,0,0,0.22), 0 32px 90px rgba(0,0,0,0.42), inset 0 0 0 3px ${accent}77`,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(110deg, rgba(255,255,255,0) 0%, rgba(255,255,255,${shine}) 42%, rgba(255,255,255,0) 72%)`,
            translate: `${interpolate(frame % 64, [0, 64], [-520, 520], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp"
            })}px 0px`
          }}
        />
        <div
          style={{
            position: "relative",
            zIndex: 1,
            fontSize,
            lineHeight: 1.06,
            fontWeight: 980,
            textAlign: "center",
            textWrap: "balance",
            textShadow: "0 4px 0 #000000, 0 0 18px rgba(0,0,0,0.72)"
          }}
        >
          {visibleWords.map((item, index) => {
            return (
              <React.Fragment key={`${item.word}-${item.sourceIndex}`}>
                <span
                  style={{
                    display: "inline-block",
                    color: item.active ? "#FFD700" : "#ffffff",
                    scale: item.active ? interpolate(pop, [0, 1], [0.92, 1.12], {
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp"
                    }) : 1,
                    opacity: item.active ? 1 : 0.82,
                    WebkitTextStroke: item.active ? "1.5px #111827" : "0.5px #111827"
                  }}
                >
                  {item.word}
                </span>
                {index < visibleWords.length - 1 ? " " : ""}
              </React.Fragment>
            );
          })}
        </div>
        <div
          style={{
            position: "absolute",
            left: 22,
            bottom: 16,
            width: `${Math.max(9, ((activeIndex + 1) / words.length) * 100)}%`,
            maxWidth: "calc(100% - 44px)",
            height: 7,
            borderRadius: 999,
            backgroundColor: "#FFD700",
            opacity: 0.92
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 22,
            top: 17,
            width: 48,
            height: 48,
            borderRadius: 999,
            border: "5px solid rgba(255,255,255,0.92)",
            boxShadow: `0 0 0 9px ${accent}55`
          }}
        />
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

function AltFToolOpenOverlay({ sceneIndex, toolName, toolUrl, assets, frame, fps, accent }) {
  if (sceneIndex !== 1) {
    return null;
  }

  const endFrame = Math.round(fps * 2.4);
  const opacity = interpolate(frame, [0, 12, endFrame - 12, endFrame], [1, 1, 1, 0], {
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

function FullscreenDemoMedia({ media, scene, sceneIndex, totalScenes, toolName, toolUrl, assets, frame, fps, accent }) {
  const source = mediaSource(media);
  const portraitLike = isMobileLikeMedia(media);
  const text = sceneNarrationText(scene);
  const variant = visualVariantFor(toolName, sceneIndex, totalScenes);
  const layout = demoLayoutForVariant(variant, portraitLike);
  const objectPosition = /(result|output|after|review|summary|warning)/.test(text)
    ? "50% 42%"
    : /(input|fill|upload|click|run|button|workflow)/.test(text)
      ? "50% 50%"
      : "50% 46%";
  const zoomStart = portraitLike ? 1.02 : variant === 1 ? 1.04 : 1.08;
  const zoomEnd = portraitLike ? 1.07 : variant === 2 ? 1.16 : 1.2;
  const zoom = interpolate(frame, [0, Math.round(fps * 10)], [zoomStart, zoomEnd], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1)
  });
  const yPan = interpolate(frame, [0, Math.round(fps * 10)], portraitLike ? [0, -24] : variant === 3 ? [8, -22] : [24, -34], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.33, 0, 0.2, 1)
  });
  const xPanPoints = variant === 1 ? [-24, 10] : variant === 2 ? [18, -22] : sceneIndex % 2 ? [-16, 16] : [14, -14];
  const xPan = interpolate(frame, [0, Math.round(fps * 10)], xPanPoints, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.33, 0, 0.2, 1)
  });
  const badge = mediaPurposeLabel(scene, sceneIndex, totalScenes);

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
          fit="cover"
          fps={fps}
          crop={!portraitLike}
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
          minHeight: 82,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 18,
          padding: "16px 20px",
          borderRadius: 24,
          backgroundColor: "rgba(255,255,255,0.94)",
          border: "3px solid rgba(255,255,255,0.9)",
          boxShadow: "0 20px 70px rgba(0,0,0,0.28)"
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ color: accent, fontSize: 22, lineHeight: 1, fontWeight: 980 }}>
            ACTUAL TOOL DEMO
          </div>
          <div style={{ marginTop: 7, color: Palette.ink, fontSize: 31, lineHeight: 1, fontWeight: 940, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {brandedToolDisplay(toolName, 44)}
          </div>
        </div>
        <div
          style={{
            flex: "0 0 auto",
            padding: "13px 17px",
            borderRadius: 999,
            backgroundColor: "#111827",
            color: "#FFD700",
            fontSize: 20,
            fontWeight: 960,
            lineHeight: 1
          }}
        >
          {String(scene.scene_number || sceneIndex + 1).padStart(2, "0")} / {String(totalScenes).padStart(2, "0")}
        </div>
      </div>

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
        {[badge, "Fictional demo data", compactDomain(toolUrl)].filter(Boolean).map((label, index) => (
          <div
            key={`${label}-${index}`}
            style={{
              minWidth: 0,
              flex: index === 0 ? "1.2 1 0" : "1 1 0",
              padding: "15px 16px",
              borderRadius: 999,
              backgroundColor: index === 0 ? accent : "rgba(255,255,255,0.92)",
              color: index === 0 ? "#ffffff" : Palette.ink,
              border: index === 0 ? "0 solid transparent" : "3px solid rgba(255,255,255,0.76)",
              boxShadow: "0 16px 48px rgba(0,0,0,0.22)",
              fontSize: 21,
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
      <AltFToolOpenOverlay
        sceneIndex={sceneIndex}
        toolName={toolName}
        toolUrl={toolUrl}
        assets={assets}
        frame={frame}
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
          width: 535,
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
            fontSize: 36,
            lineHeight: 1.16,
            fontWeight: 760
          }}
        >
          {supportingLine(scene, 105)}
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

function HookVideoLeadScene({ scene, sceneIndex, totalScenes, toolName, toolUrl, generatedClip, frame, fps, accent, sceneDurationFrames, fade }) {
  return (
    <AbsoluteFill style={{ opacity: fade, overflow: "hidden", backgroundColor: "#020617" }}>
      <div style={{ ...fullBleed }}>
        <MediaLayer
          media={{ ...generatedClip, muted: false, loop: false, objectFit: "cover" }}
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

      <ProgressBar frame={frame} sceneDurationFrames={sceneDurationFrames} accent="#FFD700" />
      <div style={{ position: "absolute", left: 76, right: 76, bottom: 38, color: "rgba(255,255,255,0.82)", fontSize: 22, fontWeight: 700 }}>
        {clampText(toolUrl || "altftool.com", 74)}
      </div>
    </AbsoluteFill>
  );
}

function CtaAvatarLeadScene({ scene, sceneIndex, totalScenes, toolName, toolUrl, assets, generatedClip, frame, fps, accent, sceneDurationFrames, fade }) {
  const brandOutroStart = Math.max(0, sceneDurationFrames - Math.round(fps * 3.1));
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
          media={{ ...generatedClip, muted: false, loop: false, objectFit: "cover" }}
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

          <ReelCaption
            text={scene.voiceover || `Try ${brandedToolDisplay(toolName, 36)}. Link caption me hai.`}
            frame={frame}
            fps={fps}
            accent="#FFD700"
            compact
            sceneDurationFrames={sceneDurationFrames}
            sceneIndex={sceneIndex}
          />
          <ProgressBar frame={frame} sceneDurationFrames={sceneDurationFrames} accent="#FFD700" />
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

      <ReelCaption text={scene.voiceover} frame={frame} fps={fps} accent={accent} compact sceneDurationFrames={sceneDurationFrames} sceneIndex={sceneIndex} />
      <ProgressBar frame={frame} sceneDurationFrames={sceneDurationFrames} accent={accent} />
      <div style={{ position: "absolute", left: 76, right: 76, bottom: 38, color: Palette.muted, fontSize: 22, fontWeight: 650 }}>
        {clampText(toolUrl || "altftool.com", 74)}
      </div>
    </AbsoluteFill>
  );
}

function DemoScene({ scene, sceneIndex, totalScenes, toolName, toolUrl, assets, toolMedia, generatedClip, frame, fps, accent, sceneDurationFrames, fade }) {
  const isWorkflow = sceneIndex > 2;
  const presenterIn = interpolate(frame, [20, 48], [120, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1)
  });

  return (
    <AbsoluteFill style={{ opacity: fade, overflow: "hidden" }}>
      <FullscreenDemoMedia
        media={toolMedia}
        scene={scene}
        sceneIndex={sceneIndex}
        totalScenes={totalScenes}
        toolName={toolName}
        toolUrl={toolUrl}
        assets={assets}
        frame={frame}
        fps={fps}
        accent={accent}
      />
      <CursorCallout frame={frame} accent={accent} variant={isWorkflow ? "workflow" : "demo"} />

      {generatedClip || assets.avatarHost ? (
        <HostFrame
          avatarHost={assets.avatarHost}
          generatedClip={generatedClip}
          fps={fps}
          accent={accent}
          label={generatedClip ? "Avatar clip" : "Host note"}
          sublabel="explaining steps"
          presenterStyle={assets.hookAvatarStyle || "female"}
          style={{
            right: 42,
            top: 1110,
            width: 220,
            height: 300,
            translate: `${presenterIn}px 0px`
          }}
          objectPosition="54% 42%"
        />
      ) : null}

      <ReelCaption text={scene.voiceover} frame={frame} fps={fps} accent={accent} sceneDurationFrames={sceneDurationFrames} sceneIndex={sceneIndex} />
      <ProgressBar frame={frame} sceneDurationFrames={sceneDurationFrames} accent="#FFD700" />
      <div style={{ position: "absolute", left: 76, right: 76, bottom: 38, color: "rgba(255,255,255,0.78)", fontSize: 22, fontWeight: 700 }}>
        {clampText(toolUrl || "altftool.com", 74)}
      </div>
    </AbsoluteFill>
  );
}

function ProofScene({ scene, sceneIndex, totalScenes, toolName, toolUrl, assets, generatedClip, frame, fps, accent, sceneDurationFrames, fade }) {
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

      <div style={{ position: "absolute", left: 58, right: 58, top: 415, height: 840, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <div style={{ position: "relative", borderRadius: 24, overflow: "hidden", border: `3px solid ${Palette.line}`, backgroundColor: "#fff1f2", boxShadow: "0 28px 80px rgba(15, 23, 42, 0.17)", translate: `${leftIn}px 0px` }}>
          <MediaLayer media={assets.demoBefore || assets.desktop} fit="contain" fps={fps} />
          <div style={{ position: "absolute", left: 24, top: 24, padding: "12px 18px", borderRadius: 999, backgroundColor: Palette.red, color: "#ffffff", fontSize: 25, fontWeight: 950 }}>Before</div>
        </div>
        <div style={{ position: "relative", borderRadius: 24, overflow: "hidden", border: `3px solid ${Palette.line}`, backgroundColor: "#ecfdf5", boxShadow: "0 28px 80px rgba(15, 23, 42, 0.17)", translate: `${rightIn}px 0px` }}>
          <MediaLayer media={assets.demoAfter || assets.desktopFull || assets.desktop} fit="contain" fps={fps} />
          <div style={{ position: "absolute", left: 24, top: 24, padding: "12px 18px", borderRadius: 999, backgroundColor: Palette.green, color: "#ffffff", fontSize: 25, fontWeight: 950 }}>After</div>
        </div>
      </div>

      <div style={{ position: "absolute", left: 74, right: generatedClip || assets.avatarHost ? 362 : 74, top: 1300, display: "grid", gap: 13 }}>
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
            top: 1278,
            width: 274,
            height: 362
          }}
        />
      ) : null}

      <ReelCaption text={scene.voiceover} frame={frame} fps={fps} accent={accent} sceneDurationFrames={sceneDurationFrames} sceneIndex={sceneIndex} />
      <ProgressBar frame={frame} sceneDurationFrames={sceneDurationFrames} accent={accent} />
      <div style={{ position: "absolute", left: 76, right: 76, bottom: 38, color: Palette.muted, fontSize: 22, fontWeight: 650 }}>
        {clampText(toolUrl || "altftool.com", 74)}
      </div>
    </AbsoluteFill>
  );
}

function CtaScene({ scene, sceneIndex, totalScenes, toolName, toolUrl, assets, toolMedia, generatedClip, frame, fps, accent, sceneDurationFrames, fade }) {
  const brandOutroStart = Math.max(0, sceneDurationFrames - Math.round(fps * 3.1));
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
          <ReelCaption text={scene.voiceover} frame={frame} fps={fps} accent={accent} compact sceneDurationFrames={sceneDurationFrames} sceneIndex={sceneIndex} />
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
  const sceneAssets = sceneIndex === 0 ? rawAssets : { ...rawAssets, avatarHost: "" };
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
  if (sceneIndex === 0 && generatedClip) {
    body = <HookVideoLeadScene {...common} />;
  } else if (sceneIndex === 0) {
    body = <HookScene {...common} />;
  } else if (sceneIndex === totalScenes - 1 && generatedClip) {
    body = <CtaAvatarLeadScene {...common} />;
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
