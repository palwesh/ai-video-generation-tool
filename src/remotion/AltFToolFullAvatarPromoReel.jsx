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

export const avatarPromoSceneSeconds = 7;

export const avatarPromoScenes = [
  {
    voiceover: "Agar useful online tools chahiye, AltFTool ko abhi save kar lo.",
    kicker: "SAVE THIS",
    headline: "Useful tools in one place",
    subline: "Fast micro tools for daily work.",
    prompt: "altftool.com",
    accent: "#22d3ee",
    bullets: ["Free micro tools", "No heavy setup", "Quick output"]
  },
  {
    voiceover: "AltFTool par small tools milte hain jo boring manual work ko fast karte hain.",
    kicker: "WHY ALT F TOOL",
    headline: "Manual kaam fast karo",
    subline: "Open the tool, use demo data, review the result.",
    prompt: "https://www.altftool.com/",
    accent: "#34d399",
    bullets: ["Open", "Use", "Result"]
  },
  {
    voiceover: "PDF, privacy, salary slip, AI text, editing, aur productivity tools yaha mil jayenge.",
    kicker: "TOOLS YOU NEED",
    headline: "PDF. AI. Privacy. Editing.",
    subline: "Practical tools for creators, students, freelancers, and teams.",
    prompt: "Try AltFTool today",
    accent: "#facc15",
    bullets: ["PDF", "Privacy", "Salary slip", "AI text"]
  },
  {
    voiceover: "Link open karo, tool choose karo, demo data daalo, aur result turant dekho.",
    kicker: "REAL FLOW",
    headline: "Choose. Fill. Get result.",
    subline: "No fake UI. Real workflow. Simple explanation.",
    prompt: "altftool.com",
    accent: "#60a5fa",
    bullets: ["Choose tool", "Add demo data", "Download result"]
  },
  {
    voiceover: "Har reel me real demo, clear output, aur simple Hinglish review milega.",
    kicker: "FOLLOW FOR DEMOS",
    headline: "Real tool reviews daily",
    subline: "Save the page so you do not lose useful tools.",
    prompt: "@altftools_review",
    accent: "#fb7185",
    bullets: ["Real demo", "Clear output", "Save worthy"]
  },
  {
    voiceover: "Abhi try karo https://www.altftool.com/ aur follow karo for daily tool demos.",
    kicker: "TRY NOW",
    headline: "Visit AltFTool",
    subline: "Link: https://www.altftool.com/",
    prompt: "Follow @altftools_review",
    accent: "#2dd4bf",
    bullets: ["Try the link", "Comment TOOL", "Follow for more"]
  }
];

const fps = 30;
const sceneFrames = avatarPromoSceneSeconds * fps;
const assetBase = "instagram/altftool_full_avatar_promo";
const logo = "brand/altf-logo.png";
const femaleAvatar = "avatar/altftool-female-host-young-main.png";
const maleAvatar = "avatar/altftool-male-host-main.png";

function splitWords(value) {
  return String(value || "").replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
}

function captionWords(words, activeIndex, size = 4) {
  const safeIndex = Math.max(0, Math.min(words.length - 1, activeIndex));
  const start = Math.min(Math.max(0, safeIndex - 1), Math.max(0, words.length - size));
  return words.slice(start, start + size).map((word, index) => ({
    word,
    active: start + index === safeIndex
  }));
}

function AnimatedCaption({ text, frame, accent }) {
  const words = splitWords(text);
  if (!words.length) return null;

  const wordHold = Math.max(4, sceneFrames / words.length);
  const activeIndex = Math.min(words.length - 1, Math.floor(frame / wordHold));
  const local = Math.floor(frame % wordHold);
  const pop = interpolate(local, [0, Math.min(8, wordHold), wordHold], [0.96, 1.1, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1)
  });

  return (
    <div
      style={{
        position: "absolute",
        left: 64,
        right: 64,
        bottom: 138,
        minHeight: 128,
        borderRadius: 24,
        padding: "28px 32px",
        backgroundColor: "rgba(2, 6, 23, 0.94)",
        border: "4px solid rgba(255,255,255,0.88)",
        boxShadow: "0 26px 80px rgba(0,0,0,0.38)",
        display: "grid",
        placeItems: "center"
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 22,
          right: 22,
          bottom: 15,
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
      <div
        style={{
          position: "relative",
          zIndex: 1,
          color: "#fff",
          fontSize: 54,
          lineHeight: 1.04,
          fontWeight: 980,
          textAlign: "center",
          textShadow: "0 4px 0 #000, 0 0 20px rgba(0,0,0,0.66)"
        }}
      >
        {captionWords(words, activeIndex).map((item, index) => (
          <React.Fragment key={`${item.word}-${index}`}>
            <span
              style={{
                color: item.active ? "#FFD700" : "#fff",
                display: "inline-block",
                opacity: item.active ? 1 : 0.82,
                scale: item.active ? pop : 1,
                WebkitTextStroke: item.active ? "1.3px #111827" : "0.5px #111827"
              }}
            >
              {item.word}
            </span>
            {index < 3 ? " " : ""}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function Background({ accent }) {
  return (
    <AbsoluteFill
      style={{
        background:
          `radial-gradient(circle at 74% 12%, ${accent}5c 0, transparent 420px),` +
          "radial-gradient(circle at 8% 82%, rgba(255,255,255,0.12) 0, transparent 320px)," +
          "linear-gradient(145deg, #020617 0%, #09111f 52%, #101827 100%)"
      }}
    >
      <div style={{ position: "absolute", inset: 28, border: "2px solid rgba(255,255,255,0.11)" }} />
      <div
        style={{
          position: "absolute",
          left: -240,
          top: 250,
          width: 640,
          height: 640,
          borderRadius: 999,
          border: `3px solid ${accent}44`
        }}
      />
      <div
        style={{
          position: "absolute",
          right: -160,
          bottom: 190,
          width: 520,
          height: 520,
          borderRadius: 999,
          border: "2px solid rgba(255,255,255,0.14)"
        }}
      />
    </AbsoluteFill>
  );
}

function TopBar({ index }) {
  return (
    <div
      style={{
        position: "absolute",
        left: 56,
        right: 56,
        top: 48,
        zIndex: 10,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <Img src={staticFile(logo)} style={{ width: 78, height: 78, objectFit: "contain" }} />
        <div>
          <div style={{ color: "#fff", fontSize: 31, lineHeight: 1, fontWeight: 950 }}>AltFTool</div>
          <div style={{ marginTop: 6, color: "rgba(255,255,255,0.66)", fontSize: 22, lineHeight: 1, fontWeight: 750 }}>https://www.altftool.com/</div>
        </div>
      </div>
      <div
        style={{
          padding: "14px 18px",
          borderRadius: 999,
          backgroundColor: "rgba(255,255,255,0.13)",
          color: "#fff",
          fontSize: 24,
          lineHeight: 1,
          fontWeight: 900
        }}
      >
        {index + 1}/{avatarPromoScenes.length}
      </div>
    </div>
  );
}

function AvatarStage({ frame, accent, avatarPath }) {
  const breathe = interpolate(frame % 90, [0, 45, 90], [1, 1.025, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1)
  });
  const wave = Math.abs(Math.sin(frame / 5));

  return (
    <div
      style={{
        position: "absolute",
        right: 44,
        top: 256,
        width: 512,
        height: 918,
        borderRadius: 42,
        overflow: "hidden",
        border: `6px solid ${accent}`,
        backgroundColor: "#0f172a",
        boxShadow: "0 38px 140px rgba(0,0,0,0.44)",
        scale: breathe
      }}
    >
      <Img src={staticFile(avatarPath)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "52% 39%" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 48%, rgba(2,6,23,0.94) 100%)" }} />
      <div
        style={{
          position: "absolute",
          left: 26,
          right: 26,
          bottom: 30,
          display: "grid",
          gap: 18
        }}
      >
        <div style={{ color: "#fff", fontSize: 38, lineHeight: 1, fontWeight: 960 }}>Your tool guide</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {[0, 1, 2, 3, 4, 5].map((bar) => (
            <div
              key={bar}
              style={{
                width: 18,
                height: 20 + ((bar + 1) * 10 * (0.45 + wave)),
                borderRadius: 999,
                backgroundColor: bar % 2 ? "#FFD700" : accent
              }}
            />
          ))}
          <div style={{ marginLeft: 12, color: "rgba(255,255,255,0.76)", fontSize: 21, lineHeight: 1, fontWeight: 800 }}>avatar speaking</div>
        </div>
      </div>
    </div>
  );
}

function SceneCopy({ scene, frame }) {
  return (
    <div
      style={{
        position: "absolute",
        left: 64,
        top: 178,
        width: 520,
        zIndex: 5,
        translate: `0px ${interpolate(frame, [0, 28], [46, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(0.16, 1, 0.3, 1)
        })}px`
      }}
    >
      <div
        style={{
          display: "inline-flex",
          padding: "13px 20px",
          borderRadius: 999,
          backgroundColor: scene.accent,
          color: "#06111e",
          fontSize: 24,
          lineHeight: 1,
          fontWeight: 980
        }}
      >
        {scene.kicker}
      </div>
      <div
        style={{
          marginTop: 28,
          color: "#fff",
          fontSize: scene.headline.length > 24 ? 60 : 70,
          lineHeight: 0.98,
          fontWeight: 980,
          letterSpacing: 0,
          textWrap: "balance"
        }}
      >
        {scene.headline}
      </div>
      <div
        style={{
          marginTop: 24,
          color: "rgba(255,255,255,0.72)",
          fontSize: 31,
          lineHeight: 1.16,
          fontWeight: 720
        }}
      >
        {scene.subline}
      </div>
    </div>
  );
}

function LinkCard({ scene, frame }) {
  const slide = interpolate(frame, [18, 48], [70, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1)
  });

  return (
    <div
      style={{
        position: "absolute",
        left: 64,
        top: 725,
        width: 486,
        translate: `0px ${slide}px`
      }}
    >
      <div
        style={{
          padding: "30px 30px 32px",
          borderRadius: 30,
          backgroundColor: "rgba(255,255,255,0.94)",
          color: "#06111e",
          boxShadow: "0 30px 110px rgba(0,0,0,0.32)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Img src={staticFile(logo)} style={{ width: 76, height: 76, objectFit: "contain" }} />
          <div>
            <div style={{ color: scene.accent, fontSize: 24, lineHeight: 1, fontWeight: 980 }}>OPEN LINK</div>
            <div style={{ marginTop: 8, fontSize: 34, lineHeight: 1, fontWeight: 960 }}>AltFTool.com</div>
          </div>
        </div>
        <div
          style={{
            marginTop: 24,
            padding: "20px 22px",
            borderRadius: 20,
            backgroundColor: "#020617",
            color: scene.accent,
            fontSize: 28,
            lineHeight: 1.05,
            fontWeight: 920,
            overflowWrap: "anywhere"
          }}
        >
          {scene.prompt}
        </div>
        <div style={{ marginTop: 24, display: "grid", gap: 12 }}>
          {scene.bullets.map((bullet, index) => (
            <div key={bullet} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 26, height: 26, borderRadius: 999, backgroundColor: index % 2 ? "#111827" : scene.accent }} />
              <div style={{ color: "#111827", fontSize: 27, lineHeight: 1, fontWeight: 850 }}>{bullet}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ frame, accent }) {
  return (
    <div
      style={{
        position: "absolute",
        left: 76,
        right: 76,
        bottom: 58,
        height: 10,
        borderRadius: 999,
        backgroundColor: "rgba(226,232,240,0.72)",
        overflow: "hidden"
      }}
    >
      <div
        style={{
          width: `${Math.max(4, ((frame + 1) / sceneFrames) * 100)}%`,
          height: "100%",
          borderRadius: 999,
          backgroundColor: accent
        }}
      />
    </div>
  );
}

function PromoScene({ scene, index, avatarPath }) {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ overflow: "hidden", fontFamily: "Inter, Arial, sans-serif" }}>
      <Background accent={scene.accent} />
      <TopBar index={index} />
      <SceneCopy scene={scene} frame={frame} />
      <LinkCard scene={scene} frame={frame} />
      <AvatarStage frame={frame} accent={scene.accent} avatarPath={avatarPath} />
      <AnimatedCaption text={scene.voiceover} frame={frame} accent={scene.accent} />
      <ProgressBar frame={frame} accent={scene.accent} />
    </AbsoluteFill>
  );
}

function AvatarPromoReel({ avatarPath }) {
  const { fps: configFps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: "#020617" }}>
      <Audio src={staticFile(`${assetBase}/audio/music-bed.wav`)} volume={0.12} />
      {avatarPromoScenes.map((scene, index) => (
        <Sequence key={scene.headline} from={index * avatarPromoSceneSeconds * configFps} durationInFrames={avatarPromoSceneSeconds * configFps}>
          <Audio src={staticFile(`${assetBase}/audio/scene-${String(index + 1).padStart(2, "0")}.mp3`)} volume={1} />
          <PromoScene scene={scene} index={index} avatarPath={avatarPath} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
}

export const AltFToolFullAvatarPromoReel = () => {
  return <AvatarPromoReel avatarPath={femaleAvatar} />;
};

export const AltFToolMaleAvatarPromoReel = () => {
  return <AvatarPromoReel avatarPath={maleAvatar} />;
};
