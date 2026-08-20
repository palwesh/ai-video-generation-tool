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

function clampText(value, maxLength) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength - 1).trim()}...`;
}

function isVideoAsset(value) {
  return /\.(webm|mp4|mov)$/i.test(String(value || ""));
}

function mediaSource(media) {
  if (typeof media === "string") {
    return media;
  }
  return media?.src || media?.publicPath || "";
}

function cachedVidsMedia(assets, sceneIndex) {
  const sceneNumber = sceneIndex + 1;
  const sceneClip = assets.vidsClips?.[sceneIndex];
  if (sceneClip) {
    return {
      src: sceneClip,
      kind: "cached_scene_clip",
      badge: "CACHED VIDS CLIP",
      loop: true,
      muted: true,
      objectFit: "contain"
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
    objectFit: "contain"
  };
}

function pickMedia(assets, sceneIndex) {
  const cached = cachedVidsMedia(assets, sceneIndex);
  if (cached) return cached;
  if (sceneIndex === 2) return assets.mobileScroll || assets.demoVideo || assets.demoAfter || assets.desktopFull || assets.desktop || "";
  if (sceneIndex === 3) return assets.demoVideo || assets.demoAfter || assets.desktopFull || assets.desktop || "";
  if (sceneIndex === 4) return assets.demoAfter || assets.desktopFull || assets.desktop || "";
  if (sceneIndex === 5) return assets.demoAfter || assets.desktopFull || assets.desktop || "";
  if (sceneIndex === 6) return assets.mobileScroll || assets.mobile || assets.demoAfter || assets.desktop || "";
  return assets.desktop || assets.demoBefore || assets.desktopFull || assets.mobile || "";
}

function titleFor(scene, sceneIndex, toolName) {
  if (sceneIndex === 0) return scene.onscreen_text || "Before sharing, check this";
  if (sceneIndex === 1) return toolName;
  if (sceneIndex === 2) return "Actual tool demo";
  if (sceneIndex === 3) return scene.onscreen_text || "Input -> Run -> Review";
  if (sceneIndex === 4) return scene.onscreen_text || "Useful output";
  if (sceneIndex === 5) return scene.onscreen_text || "Before vs After";
  return scene.onscreen_text || "Review before posting";
}

function subtitleFor(scene, sceneIndex) {
  if (scene.onscreen_text && sceneIndex !== 1) {
    return clampText(scene.voiceover, 104);
  }
  return clampText(scene.voiceover, 112);
}

function captionChunk(text, frame, fps) {
  const words = String(text || "").replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  if (!words.length) {
    return "";
  }
  const chunkSize = 6;
  const chunkIndex = Math.min(
    Math.floor((frame / fps) / 1.35),
    Math.max(0, Math.ceil(words.length / chunkSize) - 1)
  );
  return words.slice(chunkIndex * chunkSize, chunkIndex * chunkSize + chunkSize).join(" ");
}

const Palette = {
  ink: "#17202a",
  muted: "#536171",
  blue: "#2563eb",
  cyan: "#06b6d4",
  green: "#16a34a",
  amber: "#f59e0b",
  red: "#dc2626",
  panel: "#ffffff",
  line: "#d9e1ea"
};

const fullBleed = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  objectFit: "cover"
};

const safe = {
  position: "absolute",
  left: 80,
  right: 80
};

function CreatorBadge({ sceneIndex, accent, frame }) {
  const show = [0, 1, 5, 6].includes(sceneIndex);
  if (!show) {
    return null;
  }

  const pulse = interpolate(frame % 60, [0, 30, 60], [0.96, 1.04, 0.96], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });

  return (
    <div
      style={{
        position: "absolute",
        right: 72,
        top: sceneIndex < 2 ? 1160 : 1185,
        width: 138,
        height: 168,
        borderRadius: 24,
        backgroundColor: "rgba(255,255,255,0.94)",
        border: `3px solid ${accent}`,
        boxShadow: "0 24px 60px rgba(15, 23, 42, 0.22)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        scale: pulse
      }}
    >
      <div
        style={{
        width: 82,
        height: 82,
          borderRadius: 999,
          background: `linear-gradient(145deg, ${accent}, #111827)`,
          position: "relative",
          overflow: "hidden"
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 21,
            top: 20,
            width: 40,
            height: 40,
            borderRadius: 999,
            backgroundColor: "#f8fafc"
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 16,
            right: 16,
            bottom: -10,
            height: 40,
            borderRadius: "48px 48px 0 0",
            backgroundColor: "#f8fafc"
          }}
        />
      </div>
      <div style={{ color: Palette.ink, fontSize: 21, fontWeight: 860, lineHeight: 1 }}>
        UGC Host
      </div>
      <div style={{ display: "flex", alignItems: "end", gap: 4, height: 23 }}>
        {[14, 24, 18, 28, 16].map((height, index) => (
          <div
            key={index}
            style={{
              width: 7,
              height: height * 0.82 + ((frame + index * 7) % 10),
              borderRadius: 8,
              backgroundColor: index % 2 ? Palette.green : accent
            }}
          />
        ))}
      </div>
      <div style={{ color: Palette.muted, fontSize: 15, fontWeight: 760 }}>
        voice + music
      </div>
    </div>
  );
}

function MediaContent({ media, sceneIndex, assets, fps }) {
  const cachedClip = typeof media === "object" && media?.kind?.startsWith("cached");
  if (!cachedClip && sceneIndex === 5 && (assets.demoBefore || assets.demoAfter)) {
    return (
      <div style={{ width: "100%", height: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
        {[{ label: "Before", src: assets.demoBefore || assets.desktop }, { label: "After", src: assets.demoAfter || assets.desktopFull }].map((item, index) => (
          <div key={item.label} style={{ position: "relative", overflow: "hidden", backgroundColor: index === 0 ? "#fff1f2" : "#ecfdf5" }}>
            {item.src ? (
              <Img
                src={staticFile(item.src)}
                style={{ width: "100%", height: "100%", objectFit: "contain", opacity: 0.96 }}
              />
            ) : null}
            <div
              style={{
                position: "absolute",
                left: 24,
                top: 24,
                padding: "12px 18px",
                borderRadius: 999,
                backgroundColor: index === 0 ? "#dc2626" : "#16a34a",
                color: "#fff",
                fontSize: 28,
                fontWeight: 880
              }}
            >
              {item.label}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!media) {
    return <div style={{ width: "100%", height: "100%", backgroundColor: "#f8fafc" }} />;
  }

  const source = mediaSource(media);
  if (!source) {
    return <div style={{ width: "100%", height: "100%", backgroundColor: "#f8fafc" }} />;
  }
  if (isVideoAsset(source)) {
    const mediaObject = typeof media === "object" && media ? media : {};
    return (
      <Video
        src={staticFile(source)}
        muted={mediaObject.muted !== false}
        loop={mediaObject.loop !== false}
        trimBefore={Math.round(Number(mediaObject.trimSeconds || 0) * fps)}
        objectFit={mediaObject.objectFit || "contain"}
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: "#f8fafc"
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
        objectFit: "contain",
        backgroundColor: "#f8fafc",
        filter: sceneIndex === 0 ? "saturate(0.84)" : "none"
      }}
    />
  );
}

function MediaBadge({ sceneIndex, accent, media }) {
  const label = media?.badge || (sceneIndex === 2
    ? "REAL TOOL DEMO"
    : sceneIndex === 3
      ? "WORKFLOW"
      : sceneIndex === 4
        ? "OUTPUT"
        : sceneIndex === 5
          ? "BEFORE / AFTER"
          : "TOOL CONTEXT");
  return (
    <div
      style={{
        position: "absolute",
        left: 26,
        top: 24,
        padding: "12px 18px",
        borderRadius: 999,
        backgroundColor: accent,
        color: "#fff",
        fontSize: 24,
        fontWeight: 900,
        letterSpacing: 0
      }}
    >
      {label}
    </div>
  );
}

function SpokenCaption({ text, accent, frame, fps }) {
  const chunk = captionChunk(text, frame, fps);
  if (!chunk) {
    return null;
  }

  return (
    <div
      style={{
        position: "absolute",
        left: 82,
        right: 82,
        bottom: 205,
        minHeight: 150,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 32px",
        borderRadius: 26,
        backgroundColor: "rgba(15, 23, 42, 0.92)",
        border: `3px solid ${accent}`,
        boxShadow: "0 26px 70px rgba(15, 23, 42, 0.28)"
      }}
    >
      <div
        style={{
          color: "#ffffff",
          fontSize: 48,
          lineHeight: 1.08,
          fontWeight: 900,
          textAlign: "center",
          textWrap: "balance"
        }}
      >
        {chunk}
      </div>
    </div>
  );
}

export const ReelScene = ({ scene, sceneIndex, toolName, toolUrl, assets }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const media = pickMedia(assets, sceneIndex);
  const mediaPath = mediaSource(media);
  const backgroundAsset = assets.desktop || assets.demoAfter || assets.desktopFull || assets.mobile || mediaPath;
  const progress = frame / (10 * fps);
  const enter = spring({
    frame,
    fps,
    config: { damping: 180, stiffness: 130, mass: 0.8 }
  });
  const fade = interpolate(frame, [0, 10 * fps - 18, 10 * fps], [1, 1, 0.94], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1)
  });
  const slowZoom = interpolate(frame, [0, 10 * fps], [1.04, 1.14], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });
  const cursorX = interpolate(frame, [18, 95, 190, 270], [770, 520, 700, 820], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.2, 0.8, 0.2, 1)
  });
  const cursorY = interpolate(frame, [18, 95, 190, 270], [700, 875, 1030, 1180], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.2, 0.8, 0.2, 1)
  });
  const accent = [Palette.blue, Palette.green, Palette.cyan, Palette.amber, Palette.blue, Palette.red, Palette.green][sceneIndex] || Palette.blue;
  const title = titleFor(scene, sceneIndex, toolName);
  const subtitle = subtitleFor(scene, sceneIndex);
  const isDemo = sceneIndex === 2 || sceneIndex === 3;
  const isBeforeAfter = sceneIndex === 5;
  const isSafety = sceneIndex === 6;
  const mediaTop = isBeforeAfter ? 710 : isSafety ? 620 : 600;
  const mediaHeight = isBeforeAfter ? 720 : isSafety ? 680 : 720;

  return (
    <AbsoluteFill style={{ backgroundColor: "#eef2f5", opacity: fade, overflow: "hidden" }}>
      {backgroundAsset && !isVideoAsset(backgroundAsset) ? (
        <Img
          src={staticFile(backgroundAsset)}
          style={{
            ...fullBleed,
            scale: slowZoom,
            filter: "blur(12px) saturate(0.9)",
            opacity: 0.32
          }}
        />
      ) : null}

      <div style={{ ...fullBleed, background: "linear-gradient(180deg, rgba(245,247,250,0.92), rgba(232,238,244,0.98))" }} />

      <div
        style={{
          ...safe,
          top: 92,
          height: 58,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          color: Palette.muted,
          fontSize: 28,
          fontWeight: 700
        }}
      >
        <div>ALT F TOOL</div>
        <div>{String(scene.scene_number || sceneIndex + 1).padStart(2, "0")} / 07</div>
      </div>

      <div
        style={{
          ...safe,
          top: 185,
          color: Palette.ink,
          opacity: interpolate(frame, [0, 10], [0.78, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp"
          }),
          translate: `0px ${interpolate(enter, [0, 1], [38, 0])}px`
        }}
      >
        <div
          style={{
            display: "inline-block",
            backgroundColor: accent,
            width: 92,
            height: 10,
            borderRadius: 12,
            marginBottom: 34
          }}
        />
        <div style={{ fontSize: sceneIndex === 1 ? 68 : 78, lineHeight: 1.02, fontWeight: 860 }}>
          {clampText(title, sceneIndex === 1 ? 46 : 38)}
        </div>
        <div style={{ marginTop: 22, fontSize: 36, lineHeight: 1.2, color: Palette.muted, fontWeight: 650 }}>
          {subtitle}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 80,
          right: 80,
          top: mediaTop,
          height: mediaHeight,
          border: `2px solid ${Palette.line}`,
          backgroundColor: Palette.panel,
          borderRadius: 24,
          boxShadow: "0 30px 80px rgba(20, 36, 55, 0.18)",
          overflow: "hidden",
          scale: interpolate(enter, [0, 1], [0.96, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp"
          })
        }}
      >
        <MediaContent media={media} sceneIndex={sceneIndex} assets={assets} fps={fps} />
        <MediaBadge sceneIndex={sceneIndex} accent={accent} media={media} />

        {isDemo ? (
          <>
            <div
              style={{
                position: "absolute",
                left: cursorX,
                top: cursorY,
                width: 70,
                height: 70,
                border: `6px solid ${accent}`,
                borderRadius: 999,
                opacity: interpolate(frame % 45, [0, 22, 45], [0.95, 0.35, 0.95])
              }}
            />
            <div
              style={{
                position: "absolute",
                left: cursorX + 24,
                top: cursorY + 22,
                width: 0,
                height: 0,
                borderTop: "22px solid transparent",
                borderBottom: "22px solid transparent",
                borderLeft: "34px solid #111827",
                rotate: "-35deg"
              }}
            />
          </>
        ) : null}
      </div>

      {isBeforeAfter ? (
        <div style={{ position: "absolute", left: 105, right: 105, top: 1450, display: "flex", gap: 22 }}>
          {["Before: manual checking", "After: faster review"].map((label, index) => (
            <div
              key={label}
              style={{
                flex: 1,
                padding: "30px 28px",
                borderRadius: 24,
                backgroundColor: index === 0 ? "#fff1f2" : "#ecfdf5",
                color: index === 0 ? Palette.red : Palette.green,
                fontSize: 34,
                fontWeight: 820,
                lineHeight: 1.12
              }}
            >
              {label}
            </div>
          ))}
        </div>
      ) : null}

      {isSafety ? (
        <div
          style={{
            position: "absolute",
            left: 80,
            right: 80,
            top: 1328,
            padding: "22px 30px",
            borderRadius: 22,
            backgroundColor: "#fff7ed",
            color: "#9a3412",
            fontSize: 31,
            fontWeight: 800,
            lineHeight: 1.15
          }}
        >
          Human review mandatory. Sensitive data share karne se pehle final check karo.
        </div>
      ) : null}

      <CreatorBadge sceneIndex={sceneIndex} accent={accent} frame={frame} />
      <SpokenCaption text={scene.voiceover} accent={accent} frame={frame} fps={fps} />

      <div
        style={{
          position: "absolute",
          left: 80,
          right: 80,
          bottom: 122,
          display: "flex",
          alignItems: "center",
          gap: 18
        }}
      >
        <div style={{ flex: 1, height: 12, backgroundColor: "#d8e0ea", borderRadius: 20, overflow: "hidden" }}>
          <div
            style={{
              width: `${Math.max(4, progress * 100)}%`,
              height: "100%",
              backgroundColor: accent,
              borderRadius: 20
            }}
          />
        </div>
        <div style={{ color: Palette.muted, fontSize: 28, fontWeight: 760 }}>10s</div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 80,
          right: 80,
          bottom: 50,
          color: Palette.muted,
          fontSize: 25,
          lineHeight: 1.2,
          fontWeight: 650
        }}
      >
        {clampText(toolUrl, 76)}
      </div>
    </AbsoluteFill>
  );
};
