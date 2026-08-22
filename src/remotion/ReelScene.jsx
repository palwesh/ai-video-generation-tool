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
    return "";
  }
  try {
    return new URL(text).hostname.replace(/^www\./, "");
  } catch {
    return clampText(text.replace(/^https?:\/\//, "").replace(/^www\./, ""), 42);
  }
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
    return {
      src: sceneClip,
      kind: "cached_scene_clip",
      badge: isHook ? "HOOK AVATAR VIDEO" : isCta ? "CTA AVATAR VIDEO" : "AI AVATAR CLIP",
      loop: !(isHook || isCta),
      muted: !(isHook || isCta),
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

function toolMediaForScene(assets, sceneIndex) {
  if (sceneIndex > 0) {
    return assets.demoVideo
      || assets.mobileScroll
      || assets.demoAfter
      || assets.desktopFull
      || assets.desktop
      || assets.demoBefore
      || assets.mobile
      || "";
  }
  if (sceneIndex === 2) {
    return assets.demoVideo || assets.demoAfter || assets.desktopFull || assets.desktop || assets.mobileScroll || "";
  }
  if (sceneIndex === 3) {
    return assets.demoVideo || assets.demoAfter || assets.desktopFull || assets.desktop || "";
  }
  if (sceneIndex === 4) {
    return assets.demoAfter || assets.demoVideo || assets.desktopFull || assets.desktop || "";
  }
  if (sceneIndex === 5) {
    return assets.demoAfter || assets.desktopFull || assets.demoVideo || assets.desktop || "";
  }
  return assets.desktop || assets.demoBefore || assets.desktopFull || assets.mobile || "";
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
    return clampText(toolName, 35);
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

function captionChunk(text, frame, fps) {
  const words = splitWords(text);
  if (!words.length) {
    return "";
  }
  const chunkSize = 5;
  const chunkIndex = Math.min(
    Math.floor((frame / fps) / 1.2),
    Math.max(0, Math.ceil(words.length / chunkSize) - 1)
  );
  return words.slice(chunkIndex * chunkSize, chunkIndex * chunkSize + chunkSize).join(" ");
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

function MediaLayer({ media, fit = "contain", fps, style = {}, crop = false }) {
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
        <div>{clampText(toolName, 32)}</div>
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
          TOOL USED IN THIS REEL
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
          {clampText(toolName, 54)}
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
          actual tool page
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

function trendCaptionTag(text, sceneIndex) {
  const source = cleanText(text).toLowerCase();
  if (/(save|bookmark|remember|keep)/.test(source)) {
    return "SAVE THIS";
  }
  if (/(free|without paying|no cost)/.test(source)) {
    return "FREE TOOL";
  }
  if (/(demo|screen|click|input|run|workflow|step)/.test(source)) {
    return sceneIndex <= 2 ? "REAL DEMO" : "STEP BY STEP";
  }
  if (/(before|after|result|output|proof)/.test(source)) {
    return "RESULT CHECK";
  }
  if (/(review|safe|privacy|data|publish|share)/.test(source)) {
    return "CHECK FIRST";
  }
  return sceneIndex <= 2 ? "WATCH THIS" : "QUICK TIP";
}

function ReelCaption({ text, frame, fps, accent, compact = false, sceneIndex = 1 }) {
  const chunk = captionChunk(text, frame, fps);
  if (!chunk) {
    return null;
  }
  const powerWords = /^(stop|save|comment|tool|real|demo|review|privacy|risk|output|before|after|fast|free|mask|safe|watch|try|human|clear|check|ai|viral|secret|easy|quick|proof|result|workflow|click|time|salary|slip|data|share|post|instagram|reel)$/i;
  const words = chunk.split(/\s+/).filter(Boolean);
  const localFrame = frame % Math.max(1, Math.round(fps * 1.2));
  const pop = spring({
    frame: localFrame,
    fps,
    config: { damping: 180, stiffness: 260, mass: 0.55 }
  });
  const enterY = interpolate(localFrame, [0, Math.round(fps * 0.14), Math.round(fps * 1.2)], [18, 0, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1)
  });
  const shine = interpolate(frame % 72, [0, 36, 72], [0.15, 0.45, 0.15], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });
  const tag = trendCaptionTag(text, sceneIndex);

  return (
    <div
      style={{
        position: "absolute",
        left: compact ? 90 : 64,
        right: compact ? 90 : 64,
        bottom: compact ? 190 : 160,
        minHeight: compact ? 124 : 150,
        display: "grid",
        alignItems: "center",
        justifyItems: "center",
        translate: `0px ${enterY}px`,
        scale: interpolate(pop, [0, 1], [0.96, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp"
        })
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -31,
          padding: "11px 19px",
          borderRadius: 999,
          backgroundColor: "#FFD700",
          color: "#111827",
          border: "4px solid #111827",
          boxShadow: "0 12px 0 rgba(0,0,0,0.26)",
          fontSize: compact ? 22 : 24,
          lineHeight: 1,
          fontWeight: 980,
          letterSpacing: 0
        }}
      >
        {tag}
      </div>
      <div
        style={{
          position: "relative",
          width: "100%",
          minHeight: compact ? 124 : 150,
          padding: compact ? "31px 32px 26px" : "36px 40px 30px",
          borderRadius: 26,
          backgroundColor: "rgba(8, 13, 23, 0.95)",
          border: `5px solid ${accent}`,
          boxShadow: "0 28px 0 rgba(0,0,0,0.22), 0 34px 84px rgba(15, 23, 42, 0.42)",
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
            translate: `${interpolate(frame % 72, [0, 72], [-520, 520], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp"
            })}px 0px`
          }}
        />
        <div
          style={{
            position: "relative",
            zIndex: 1,
            fontSize: compact ? 46 : 56,
            lineHeight: 1.02,
            fontWeight: 980,
            textAlign: "center",
            textWrap: "balance",
            textTransform: "uppercase",
            textShadow: "0 5px 0 #000000, 0 0 18px rgba(0,0,0,0.72)"
          }}
        >
          {words.map((word, index) => {
            const normalized = word.replace(/[^\p{L}\p{N}]/gu, "");
            const highlighted = index === 0 || powerWords.test(normalized);
            const displayWord = word.toUpperCase();
            return (
              <React.Fragment key={`${word}-${index}`}>
                <span
                  style={{
                    color: highlighted ? "#FFD700" : "#ffffff",
                    WebkitTextStroke: highlighted ? "1.5px #111827" : "0px transparent"
                  }}
                >
                  {displayWord}
                </span>
                {index < words.length - 1 ? " " : ""}
              </React.Fragment>
            );
          })}
        </div>
        <div
          style={{
            position: "absolute",
            left: 22,
            bottom: 16,
            width: 72,
            height: 7,
            borderRadius: 999,
            backgroundColor: "#FFD700"
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
        {clampText(toolUrl || toolName, 74)}
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
          <div>{clampText(toolName, 34)}</div>
        </div>
        <div>{String(scene.scene_number || sceneIndex + 1).padStart(2, "0")} / {String(totalScenes).padStart(2, "0")}</div>
      </div>

      <ProgressBar frame={frame} sceneDurationFrames={sceneDurationFrames} accent="#FFD700" />
      <div style={{ position: "absolute", left: 76, right: 76, bottom: 38, color: "rgba(255,255,255,0.82)", fontSize: 22, fontWeight: 700 }}>
        {clampText(toolUrl || toolName, 74)}
      </div>
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
          {clampText(toolName, 42)}
        </div>
        <div style={{ marginTop: 18, color: Palette.slate, fontSize: 35, lineHeight: 1.18, fontWeight: 720 }}>
          {supportingLine(scene, 118)}
        </div>
      </div>

      <BrowserFrame
        media={toolMedia}
        fps={fps}
        accent={accent}
        label="TOOL INTRO"
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

      <ReelCaption text={scene.voiceover} frame={frame} fps={fps} accent={accent} compact sceneIndex={sceneIndex} />
      <ProgressBar frame={frame} sceneDurationFrames={sceneDurationFrames} accent={accent} />
      <div style={{ position: "absolute", left: 76, right: 76, bottom: 38, color: Palette.muted, fontSize: 22, fontWeight: 650 }}>
        {clampText(toolUrl || toolName, 74)}
      </div>
    </AbsoluteFill>
  );
}

function DemoScene({ scene, sceneIndex, totalScenes, toolName, toolUrl, assets, toolMedia, generatedClip, frame, fps, accent, sceneDurationFrames, fade }) {
  const enter = spring({ frame, fps, config: { damping: 180, stiffness: 135, mass: 0.75 } });
  const titleY = interpolate(enter, [0, 1], [34, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const screenScale = interpolate(enter, [0, 1], [0.96, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });
  const isWorkflow = sceneIndex > 2;

  return (
    <AbsoluteFill style={{ opacity: fade, overflow: "hidden" }}>
      <BackgroundWash asset={toolMedia || assets.desktop} frame={frame} accent={accent} />
      <TopStrip scene={scene} sceneIndex={sceneIndex} totalScenes={totalScenes} toolName={toolName} />

      <div style={{ position: "absolute", left: 72, right: 72, top: 155, translate: `0px ${titleY}px` }}>
        <div style={{ display: "inline-flex", padding: "12px 18px", borderRadius: 999, backgroundColor: "#ecfeff", color: Palette.teal, fontSize: 25, fontWeight: 950 }}>
          No fake UI
        </div>
        <div style={{ marginTop: 20, color: Palette.ink, fontSize: 75, lineHeight: 1.02, fontWeight: 960 }}>
          {firstStrongLine(scene, toolName, sceneIndex)}
        </div>
      </div>

      <BrowserFrame
        media={toolMedia}
        fps={fps}
        accent={accent}
        label={isWorkflow ? "WORKFLOW RECORDING" : "REAL TOOL DEMO"}
        large
        crop
        style={{
          left: 58,
          right: 58,
          top: 365,
          height: 950,
          scale: screenScale
        }}
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
            right: 60,
            top: 1188,
            width: 270,
            height: 355
          }}
          objectPosition="54% 42%"
        />
      ) : null}

      <div
        style={{
          position: "absolute",
          left: 74,
          right: generatedClip || assets.avatarHost ? 360 : 74,
          top: 1346,
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 12
        }}
      >
        {["Input", "Run", "Review"].map((label, index) => (
          <div
            key={label}
            style={{
              padding: "18px 12px",
              borderRadius: 18,
              backgroundColor: index === 1 ? "#ecfdf5" : "#eff6ff",
              color: index === 1 ? Palette.green : Palette.blue,
              fontSize: 27,
              fontWeight: 940,
              textAlign: "center"
            }}
          >
            {label}
          </div>
        ))}
      </div>

      <ReelCaption text={scene.voiceover} frame={frame} fps={fps} accent={accent} sceneIndex={sceneIndex} />
      <ProgressBar frame={frame} sceneDurationFrames={sceneDurationFrames} accent={accent} />
      <div style={{ position: "absolute", left: 76, right: 76, bottom: 38, color: Palette.muted, fontSize: 22, fontWeight: 650 }}>
        {clampText(toolUrl || toolName, 74)}
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

      <ReelCaption text={scene.voiceover} frame={frame} fps={fps} accent={accent} sceneIndex={sceneIndex} />
      <ProgressBar frame={frame} sceneDurationFrames={sceneDurationFrames} accent={accent} />
      <div style={{ position: "absolute", left: 76, right: 76, bottom: 38, color: Palette.muted, fontSize: 22, fontWeight: 650 }}>
        {clampText(toolUrl || toolName, 74)}
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
        label="FINAL PROOF"
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
          <ReelCaption text={scene.voiceover} frame={frame} fps={fps} accent={accent} compact sceneIndex={sceneIndex} />
          <ProgressBar frame={frame} sceneDurationFrames={sceneDurationFrames} accent={accent} />
          <div style={{ position: "absolute", left: 76, right: 76, bottom: 38, color: Palette.muted, fontSize: 22, fontWeight: 650 }}>
            {clampText(toolUrl || toolName, 74)}
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
  const generatedClip = (sceneIndex === 0 || sceneIndex === totalScenes - 1)
    ? cachedVidsMedia(rawAssets, sceneIndex, totalScenes)
    : null;
  const sceneAssets = sceneIndex === 0 ? rawAssets : { ...rawAssets, avatarHost: "" };
  const toolMedia = toolMediaForScene(sceneAssets, sceneIndex);
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
  } else if (sceneIndex === totalScenes - 1) {
    body = <CtaScene {...common} />;
  } else if (sceneIndex === totalScenes - 2) {
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
