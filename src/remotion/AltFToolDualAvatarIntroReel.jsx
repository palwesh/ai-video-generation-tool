import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig
} from "remotion";

export const dualAvatarIntroSceneSeconds = 10;

export const dualAvatarIntroScenes = [
  {
    voiceover: "Stop scrolling. Agar useful online tools dhundte dhundte time waste ho raha hai, AltFTool ko abhi save kar lo.",
    kicker: "STOP SCROLLING",
    headline: "Useful tools ek jagah",
    subline: "AltFTool ko save kar lo.",
    avatar: "female",
    accent: "#22d3ee",
    badge: "Female host",
    bullets: ["Free micro tools", "Daily work fast", "No heavy setup"]
  },
  {
    voiceover: "AltFTool par PDF, privacy, salary slip, AI text, editing aur productivity ke micro tools ek jagah milte hain.",
    kicker: "WHY ALT F TOOL",
    headline: "PDF. Privacy. Salary slip. AI.",
    subline: "Practical tools for creators, students, freelancers, and teams.",
    avatar: "male",
    accent: "#facc15",
    badge: "Male host",
    bullets: ["Open tool", "Use demo data", "Check result"]
  },
  {
    voiceover: "AltFTool dot com try karo, link caption me hai. Follow altftools review for daily real tool demos, aur reel save kar lo.",
    kicker: "TRY NOW",
    headline: "AltFTool.com",
    subline: "Link caption me hai. Follow @altftools_review.",
    avatar: "both",
    accent: "#34d399",
    badge: "Daily demos",
    bullets: ["Try link", "Save reel", "Follow for demos"]
  }
];

const logo = "brand/altf-logo.png";
const femaleAvatar = "avatar/altftool-female-host-custom.png";
const femaleFallback = "avatar/altftool-female-host-young-main.png";
const maleAvatar = "avatar/altftool-male-host-main.png";
const assetBase = "instagram/altftool_dual_avatar_intro/audio";

function splitWords(value) {
  return String(value || "").replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
}

function captionWindow(words, activeIndex, size = 5) {
  const safeIndex = Math.max(0, Math.min(words.length - 1, activeIndex));
  const start = Math.min(Math.max(0, safeIndex - 2), Math.max(0, words.length - size));
  return words.slice(start, start + size).map((word, index) => ({
    word,
    active: start + index === safeIndex
  }));
}

function DynamicCaption({ text, frame, sceneFrames }) {
  const words = splitWords(text);
  if (!words.length) return null;
  const hold = Math.max(5, sceneFrames / words.length);
  const activeIndex = Math.min(words.length - 1, Math.floor(frame / hold));
  const pop = interpolate(frame % hold, [0, Math.min(8, hold), hold], [0.96, 1.1, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1)
  });

  return (
    <div
      style={{
        position: "absolute",
        left: 58,
        right: 58,
        bottom: 128,
        minHeight: 132,
        borderRadius: 24,
        padding: "28px 30px 38px",
        backgroundColor: "rgba(3, 7, 18, 0.94)",
        border: "4px solid rgba(255,255,255,0.9)",
        boxShadow: "0 30px 90px rgba(0,0,0,0.38)",
        display: "grid",
        placeItems: "center"
      }}
    >
      <div
        style={{
          color: "#ffffff",
          fontSize: 51,
          lineHeight: 1.02,
          fontWeight: 980,
          textAlign: "center",
          textShadow: "0 4px 0 #000, 0 0 20px rgba(0,0,0,0.7)"
        }}
      >
        {captionWindow(words, activeIndex).map((item, index) => (
          <React.Fragment key={`${item.word}-${index}`}>
            <span
              style={{
                color: item.active ? "#FFD700" : "#ffffff",
                display: "inline-block",
                scale: item.active ? pop : 1,
                WebkitTextStroke: item.active ? "1.2px #111827" : "0.4px #111827"
              }}
            >
              {item.word}
            </span>
            {index < 4 ? " " : ""}
          </React.Fragment>
        ))}
      </div>
      <div
        style={{
          position: "absolute",
          left: 22,
          right: 22,
          bottom: 16,
          height: 8,
          borderRadius: 999,
          backgroundColor: "rgba(255,255,255,0.22)",
          overflow: "hidden"
        }}
      >
        <div
          style={{
            width: `${((activeIndex + 1) / words.length) * 100}%`,
            height: "100%",
            borderRadius: 999,
            backgroundColor: "#FFD700"
          }}
        />
      </div>
    </div>
  );
}

function BrandTop({ scene, index }) {
  return (
    <div
      style={{
        position: "absolute",
        left: 54,
        right: 54,
        top: 46,
        zIndex: 20,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <Img src={staticFile(logo)} style={{ width: 78, height: 78, objectFit: "contain" }} />
        <div>
          <div style={{ color: "#fff", fontSize: 30, fontWeight: 950, lineHeight: 1 }}>AltFTool</div>
          <div style={{ color: "rgba(255,255,255,0.72)", fontSize: 21, fontWeight: 760, marginTop: 7 }}>altftool.com</div>
        </div>
      </div>
      <div
        style={{
          color: "#04111f",
          fontSize: 21,
          fontWeight: 950,
          padding: "13px 18px",
          borderRadius: 999,
          backgroundColor: scene.accent
        }}
      >
        {index + 1}/3
      </div>
    </div>
  );
}

function AvatarImage({ src, style = {}, objectPosition = "50% 36%" }) {
  return (
    <Img
      src={staticFile(src)}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        objectPosition,
        ...style
      }}
      onError={(event) => {
        event.currentTarget.src = staticFile(femaleFallback);
      }}
    />
  );
}

function AvatarPanel({ scene, frame }) {
  const breathe = interpolate(frame % 90, [0, 45, 90], [1, 1.025, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1)
  });
  const primary = scene.avatar === "male" ? maleAvatar : femaleAvatar;
  const primaryPosition = scene.avatar === "male" ? "50% 40%" : "50% 35%";

  if (scene.avatar === "both") {
    return (
      <>
        <div
          style={{
            position: "absolute",
            right: 58,
            top: 252,
            width: 455,
            height: 805,
            borderRadius: 34,
            overflow: "hidden",
            border: `6px solid ${scene.accent}`,
            boxShadow: "0 34px 100px rgba(0,0,0,0.42)",
            scale: breathe
          }}
        >
          <AvatarImage src={femaleAvatar} objectPosition="50% 35%" />
          <AvatarShade label="Female host" />
        </div>
        <div
          style={{
            position: "absolute",
            left: 74,
            top: 660,
            width: 305,
            height: 405,
            borderRadius: 30,
            overflow: "hidden",
            border: "5px solid rgba(255,255,255,0.92)",
            boxShadow: "0 28px 80px rgba(0,0,0,0.35)"
          }}
        >
          <AvatarImage src={maleAvatar} objectPosition="50% 39%" />
          <AvatarShade label="Male host" small />
        </div>
      </>
    );
  }

  return (
    <div
      style={{
        position: "absolute",
        right: scene.avatar === "male" ? 78 : 58,
        top: 248,
        width: scene.avatar === "male" ? 465 : 455,
        height: 825,
        borderRadius: 34,
        overflow: "hidden",
        border: `6px solid ${scene.accent}`,
        boxShadow: "0 34px 100px rgba(0,0,0,0.42)",
        scale: breathe
      }}
    >
      <AvatarImage src={primary} objectPosition={primaryPosition} />
      <AvatarShade label={scene.badge} />
    </div>
  );
}

function AvatarShade({ label, small = false }) {
  return (
    <>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 48%, rgba(2,6,23,0.86) 100%)" }} />
      <div
        style={{
          position: "absolute",
          left: small ? 16 : 26,
          right: small ? 16 : 26,
          bottom: small ? 16 : 28,
          color: "#fff",
          fontSize: small ? 24 : 34,
          fontWeight: 950,
          textShadow: "0 3px 12px rgba(0,0,0,0.5)"
        }}
      >
        {label}
        <div style={{ marginTop: 8, fontSize: small ? 15 : 19, fontWeight: 820, color: "#FFD700" }}>avatar intro</div>
      </div>
    </>
  );
}

function CopyBlock({ scene, frame }) {
  const inY = interpolate(frame, [0, 28], [58, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1)
  });
  const opacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });

  return (
    <div
      style={{
        position: "absolute",
        left: 64,
        top: 220,
        width: scene.avatar === "both" ? 438 : 485,
        translate: `0px ${inY}px`,
        opacity
      }}
    >
      <div
        style={{
          display: "inline-block",
          padding: "14px 20px",
          borderRadius: 999,
          backgroundColor: scene.accent,
          color: "#03111f",
          fontSize: 24,
          fontWeight: 950,
          lineHeight: 1
        }}
      >
        {scene.kicker}
      </div>
      <div
        style={{
          marginTop: 30,
          color: "#ffffff",
          fontSize: scene.avatar === "both" ? 62 : 66,
          lineHeight: 0.96,
          fontWeight: 980,
          letterSpacing: 0
        }}
      >
        {scene.headline}
      </div>
      <div
        style={{
          marginTop: 24,
          color: "rgba(255,255,255,0.74)",
          fontSize: 28,
          lineHeight: 1.2,
          fontWeight: 760
        }}
      >
        {scene.subline}
      </div>
      <div style={{ marginTop: 32, display: "grid", gap: 16 }}>
        {scene.bullets.map((bullet, index) => (
          <div key={bullet} style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 20, height: 20, borderRadius: 999, backgroundColor: index === 1 ? "#FFD700" : scene.accent }} />
            <div style={{ color: "#ffffff", fontSize: 25, fontWeight: 860 }}>{bullet}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AudioBars({ scene, frame }) {
  return (
    <div style={{ position: "absolute", left: 66, bottom: 306, display: "flex", gap: 10, alignItems: "end" }}>
      {Array.from({ length: 9 }, (_, index) => {
        const height = 24 + Math.abs(Math.sin((frame + index * 9) / 9)) * 46;
        return (
          <div
            key={index}
            style={{
              width: 17,
              height,
              borderRadius: 999,
              backgroundColor: index % 3 === 1 ? "#FFD700" : scene.accent
            }}
          />
        );
      })}
    </div>
  );
}

function Scene({ scene, index }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sceneFrames = dualAvatarIntroSceneSeconds * fps;
  const progress = interpolate(frame, [0, sceneFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });

  return (
    <AbsoluteFill
      style={{
        overflow: "hidden",
        fontFamily: "Inter, Arial, sans-serif",
        background:
          `radial-gradient(circle at 82% 12%, ${scene.accent}44 0, transparent 430px),` +
          "radial-gradient(circle at 8% 88%, rgba(255,255,255,0.13) 0, transparent 360px)," +
          "linear-gradient(145deg, #020617 0%, #0b1324 48%, #111827 100%)"
      }}
    >
      <div style={{ position: "absolute", inset: 28, border: "2px solid rgba(255,255,255,0.12)" }} />
      <div style={{ position: "absolute", left: -180, top: 320, width: 590, height: 590, borderRadius: 999, border: `3px solid ${scene.accent}3d` }} />
      <BrandTop scene={scene} index={index} />
      <CopyBlock scene={scene} frame={frame} />
      <AvatarPanel scene={scene} frame={frame} />
      <AudioBars scene={scene} frame={frame} />
      <DynamicCaption text={scene.voiceover} frame={frame} sceneFrames={sceneFrames} />
      <div
        style={{
          position: "absolute",
          left: 76,
          right: 76,
          bottom: 48,
          height: 9,
          borderRadius: 999,
          backgroundColor: "rgba(255,255,255,0.3)",
          overflow: "hidden"
        }}
      >
        <div style={{ width: `${progress * 100}%`, height: "100%", borderRadius: 999, backgroundColor: scene.accent }} />
      </div>
    </AbsoluteFill>
  );
}

export const AltFToolDualAvatarIntroReel = () => {
  const { fps } = useVideoConfig();
  const sceneFrames = dualAvatarIntroSceneSeconds * fps;
  return (
    <AbsoluteFill style={{ fontFamily: "Inter, Arial, sans-serif", backgroundColor: "#020617" }}>
      {dualAvatarIntroScenes.map((scene, index) => (
        <Sequence key={scene.headline} from={index * sceneFrames} durationInFrames={sceneFrames}>
          <Audio src={staticFile(`${assetBase}/scene-${String(index + 1).padStart(2, "0")}.mp3`)} volume={1} />
          <Scene scene={scene} index={index} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
