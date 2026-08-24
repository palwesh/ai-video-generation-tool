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

const fps = 30;
const sceneSeconds = 7;
const sceneFrames = sceneSeconds * fps;

export const introScenes = [
  {
    voiceover: "Online tools dhundhte dhundhte time waste ho raha hai? Is page ko save kar lo.",
    kicker: "STOP SCROLLING",
    title: "Useful tools. Real demos.",
    body: "New page for practical micro-tool reviews.",
    accent: "#22d3ee",
    layout: "hook"
  },
  {
    voiceover: "Yaha AltFTool ke micro tools ka real demo milega, fake UI nahi.",
    kicker: "ALT F TOOL",
    title: "No fake UI",
    body: "We open the actual tool and show what it does.",
    accent: "#34d399",
    layout: "promise"
  },
  {
    voiceover: "Har reel me tool open hoga, workflow dikhega, aur output clear hoga.",
    kicker: "REAL WORKFLOW",
    title: "Open. Use. Review.",
    body: "Short videos that make the tool easy to understand.",
    accent: "#facc15",
    layout: "workflow"
  },
  {
    voiceover: "AI, privacy, PDF, salary slip, editing, aur productivity tools simple language me.",
    kicker: "WHAT WE REVIEW",
    title: "Tools for daily work",
    body: "For creators, students, freelancers, and teams.",
    accent: "#60a5fa",
    layout: "categories"
  },
  {
    voiceover: "Follow altftools_review, comment TOOL, aur next useful tool try karo.",
    kicker: "START HERE",
    title: "Follow @altftools_review",
    body: "Try tools at altftool.com",
    accent: "#fb7185",
    layout: "cta"
  }
];

const assetBase = "instagram/altftools_review_first_reel";
const logo = "brand/altf-logo.png";
const avatar = "avatar/altftool-female-host-young-main.png";

function splitWords(value) {
  return String(value || "").replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
}

function captionWindow(words, activeIndex, size = 4) {
  const safeIndex = Math.min(words.length - 1, Math.max(0, activeIndex));
  const start = Math.min(Math.max(0, safeIndex - 1), Math.max(0, words.length - size));
  return words.slice(start, start + size).map((word, index) => ({
    word,
    active: start + index === safeIndex,
    index: start + index
  }));
}

function WordCaption({ text, frame, accent }) {
  const words = splitWords(text);
  if (!words.length) return null;

  const wordHold = Math.max(4, sceneFrames / words.length);
  const activeIndex = Math.min(words.length - 1, Math.floor(frame / wordHold));
  const local = Math.floor(frame % wordHold);
  const visible = captionWindow(words, activeIndex, 4);
  const pop = interpolate(local, [0, Math.min(8, wordHold), wordHold], [0.94, 1.1, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1)
  });

  return (
    <div
      style={{
        position: "absolute",
        left: 72,
        right: 72,
        bottom: 142,
        minHeight: 122,
        padding: "27px 34px 25px",
        borderRadius: 24,
        backgroundColor: "rgba(3, 7, 18, 0.92)",
        border: "4px solid rgba(255,255,255,0.86)",
        boxShadow: `0 18px 0 rgba(0,0,0,0.24), 0 30px 84px rgba(0,0,0,0.38), inset 0 0 0 3px ${accent}77`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden"
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 24,
          bottom: 16,
          width: `${Math.max(10, ((activeIndex + 1) / words.length) * 100)}%`,
          maxWidth: "calc(100% - 48px)",
          height: 7,
          borderRadius: 999,
          backgroundColor: "#FFD700"
        }}
      />
      <div
        style={{
          position: "relative",
          zIndex: 1,
          color: "#fff",
          fontSize: 54,
          lineHeight: 1.05,
          fontWeight: 980,
          textAlign: "center",
          textShadow: "0 4px 0 #000, 0 0 20px rgba(0,0,0,0.72)"
        }}
      >
        {visible.map((item, index) => (
          <React.Fragment key={`${item.word}-${item.index}`}>
            <span
              style={{
                display: "inline-block",
                color: item.active ? "#FFD700" : "#fff",
                opacity: item.active ? 1 : 0.82,
                scale: item.active ? pop : 1,
                WebkitTextStroke: item.active ? "1.4px #111827" : "0.5px #111827"
              }}
            >
              {item.word}
            </span>
            {index < visible.length - 1 ? " " : ""}
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
          `radial-gradient(circle at 82% 10%, ${accent}55 0, transparent 330px),` +
          "radial-gradient(circle at 10% 86%, rgba(255,255,255,0.14) 0, transparent 320px)," +
          "linear-gradient(145deg, #020617 0%, #08111f 54%, #0f172a 100%)"
      }}
    >
      <div style={{ position: "absolute", inset: 26, border: "2px solid rgba(255,255,255,0.12)" }} />
      <div
        style={{
          position: "absolute",
          left: -180,
          top: 250,
          width: 620,
          height: 620,
          borderRadius: 999,
          border: `3px solid ${accent}44`
        }}
      />
      <div
        style={{
          position: "absolute",
          right: -140,
          bottom: 150,
          width: 500,
          height: 500,
          borderRadius: 999,
          border: "2px solid rgba(255,255,255,0.12)"
        }}
      />
    </AbsoluteFill>
  );
}

function TopBar({ scene, index }) {
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
        <Img src={staticFile(logo)} style={{ width: 76, height: 76, objectFit: "contain" }} />
        <div style={{ color: "#fff", fontSize: 30, lineHeight: 1, fontWeight: 930 }}>AltF Tools Review</div>
      </div>
      <div
        style={{
          padding: "14px 18px",
          borderRadius: 999,
          backgroundColor: "rgba(255,255,255,0.12)",
          color: "rgba(255,255,255,0.82)",
          fontSize: 24,
          fontWeight: 850
        }}
      >
        {index + 1}/{introScenes.length}
      </div>
    </div>
  );
}

function SceneText({ scene, frame }) {
  const enter = interpolate(frame, [0, 24], [42, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1)
  });
  return (
    <div style={{ position: "absolute", left: 68, right: 68, top: 170, zIndex: 4, translate: `0px ${enter}px` }}>
      <div
        style={{
          display: "inline-flex",
          padding: "13px 19px",
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
          maxWidth: 880,
          fontSize: scene.title.length > 24 ? 76 : 88,
          lineHeight: 0.96,
          fontWeight: 980,
          textWrap: "balance",
          letterSpacing: 0
        }}
      >
        {scene.title}
      </div>
      <div
        style={{
          marginTop: 24,
          color: "rgba(255,255,255,0.76)",
          maxWidth: 780,
          fontSize: 34,
          lineHeight: 1.18,
          fontWeight: 700,
          textWrap: "balance"
        }}
      >
        {scene.body}
      </div>
    </div>
  );
}

function AvatarCard({ frame, accent }) {
  const inX = interpolate(frame, [16, 42], [120, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1)
  });
  return (
    <div
      style={{
        position: "absolute",
        right: 56,
        top: 610,
        width: 430,
        height: 640,
        borderRadius: 34,
        overflow: "hidden",
        border: `5px solid ${accent}`,
        boxShadow: "0 34px 120px rgba(0,0,0,0.38)",
        translate: `${inX}px 0px`
      }}
    >
      <Img src={staticFile(avatar)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "54% 42%" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 52%, rgba(2,6,23,0.92) 100%)" }} />
      <div style={{ position: "absolute", left: 22, right: 22, bottom: 24, color: "#fff", fontSize: 31, lineHeight: 1.05, fontWeight: 930 }}>
        Real tool reviewer
      </div>
    </div>
  );
}

function PhonePreview({ frame, accent }) {
  const y = interpolate(frame, [12, 44], [80, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1)
  });
  return (
    <div
      style={{
        position: "absolute",
        left: 72,
        bottom: 370,
        width: 486,
        height: 610,
        borderRadius: 48,
        border: "11px solid #111827",
        backgroundColor: "#f8fafc",
        overflow: "hidden",
        boxShadow: "0 34px 110px rgba(0,0,0,0.34)",
        translate: `0px ${y}px`
      }}
    >
      <div style={{ height: 72, backgroundColor: "#e2e8f0", display: "flex", alignItems: "center", gap: 10, padding: "0 22px" }}>
        {[0, 1, 2].map((item) => <div key={item} style={{ width: 14, height: 14, borderRadius: 999, backgroundColor: "#94a3b8" }} />)}
        <div style={{ marginLeft: "auto", color: "#334155", fontSize: 19, fontWeight: 850 }}>altftool.com</div>
      </div>
      <div style={{ padding: 28 }}>
        <div style={{ height: 35, width: "78%", borderRadius: 999, backgroundColor: accent }} />
        <div style={{ marginTop: 22, height: 24, width: "58%", borderRadius: 999, backgroundColor: "#cbd5e1" }} />
        <div style={{ marginTop: 36, display: "grid", gap: 16 }}>
          {[0, 1, 2].map((item) => (
            <div key={item} style={{ height: 88, borderRadius: 24, backgroundColor: item === 1 ? "#ecfeff" : "#e2e8f0" }} />
          ))}
        </div>
        <div style={{ marginTop: 32, padding: "18px 20px", borderRadius: 999, backgroundColor: "#020617", color: accent, fontSize: 23, fontWeight: 970, textAlign: "center" }}>
          REAL DEMO
        </div>
      </div>
    </div>
  );
}

function PromiseVisual({ frame, accent }) {
  const slide = interpolate(frame, [18, 48], [70, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1)
  });
  return (
    <div style={{ position: "absolute", left: 72, right: 72, top: 612, height: 680, translate: `0px ${slide}px` }}>
      {["Actual URL", "Demo data", "Clear result"].map((label, index) => (
        <div
          key={label}
          style={{
            marginTop: index ? 22 : 0,
            padding: "34px 34px",
            borderRadius: 30,
            backgroundColor: index === 1 ? "rgba(255,255,255,0.94)" : "rgba(255,255,255,0.12)",
            color: index === 1 ? "#06111e" : "#fff",
            border: `3px solid ${index === 1 ? accent : "rgba(255,255,255,0.14)"}`,
            fontSize: 42,
            lineHeight: 1,
            fontWeight: 950,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <span>{label}</span>
          <span style={{ color: index === 1 ? "#16a34a" : accent }}>OK</span>
        </div>
      ))}
    </div>
  );
}

function WorkflowVisual({ frame, accent }) {
  return (
    <div style={{ position: "absolute", left: 72, right: 72, top: 650, display: "grid", gridTemplateColumns: "1fr", gap: 18 }}>
      {["Open tool", "Use workflow", "Review output"].map((label, index) => {
        const x = interpolate(frame, [12 + index * 10, 42 + index * 10], [index % 2 ? 70 : -70, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(0.16, 1, 0.3, 1)
        });
        return (
          <div
            key={label}
            style={{
              height: 150,
              borderRadius: 28,
              backgroundColor: index === 1 ? "rgba(255,255,255,0.94)" : "rgba(255,255,255,0.12)",
              color: index === 1 ? "#06111e" : "#fff",
              border: `3px solid ${index === 1 ? accent : "rgba(255,255,255,0.14)"}`,
              display: "flex",
              alignItems: "center",
              gap: 24,
              padding: "0 34px",
              translate: `${x}px 0px`
            }}
          >
            <div style={{ width: 66, height: 66, borderRadius: 999, display: "grid", placeItems: "center", backgroundColor: index === 1 ? "#06111e" : accent, color: index === 1 ? accent : "#06111e", fontSize: 30, fontWeight: 980 }}>
              {index + 1}
            </div>
            <div style={{ fontSize: 44, fontWeight: 960 }}>{label}</div>
          </div>
        );
      })}
    </div>
  );
}

function CategoriesVisual({ frame, accent }) {
  const labels = ["AI", "Privacy", "PDF", "Salary Slip", "Editing", "Productivity"];
  return (
    <div style={{ position: "absolute", left: 72, right: 72, top: 650, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
      {labels.map((label, index) => {
        const scale = interpolate(frame, [10 + index * 5, 28 + index * 5], [0.86, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(0.16, 1, 0.3, 1)
        });
        return (
          <div
            key={label}
            style={{
              height: 126,
              borderRadius: 26,
              backgroundColor: index % 2 ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.12)",
              color: index % 2 ? "#06111e" : "#fff",
              border: `3px solid ${index % 2 ? accent : "rgba(255,255,255,0.14)"}`,
              display: "grid",
              placeItems: "center",
              fontSize: 35,
              fontWeight: 940,
              scale
            }}
          >
            {label}
          </div>
        );
      })}
    </div>
  );
}

function CtaVisual({ frame, accent }) {
  const pulse = interpolate(frame % 54, [0, 27, 54], [1, 1.035, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });
  return (
    <div style={{ position: "absolute", left: 72, right: 72, top: 660 }}>
      <div
        style={{
          borderRadius: 34,
          padding: "42px 38px",
          backgroundColor: "rgba(255,255,255,0.94)",
          color: "#06111e",
          boxShadow: "0 34px 120px rgba(0,0,0,0.35)",
          scale: pulse
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <Img src={staticFile(logo)} style={{ width: 108, height: 108, objectFit: "contain" }} />
          <div>
            <div style={{ color: accent, fontSize: 25, lineHeight: 1, fontWeight: 980 }}>FOLLOW NOW</div>
            <div style={{ marginTop: 10, fontSize: 56, lineHeight: 1, fontWeight: 980 }}>@altftools_review</div>
          </div>
        </div>
        <div style={{ marginTop: 34, padding: "24px 28px", borderRadius: 24, backgroundColor: "#020617", color: "#fff", fontSize: 39, lineHeight: 1.08, fontWeight: 900 }}>
          Comment TOOL for the next demo
        </div>
      </div>
      <div style={{ marginTop: 28, color: "rgba(255,255,255,0.78)", fontSize: 32, lineHeight: 1, fontWeight: 800, textAlign: "center" }}>
        altftool.com
      </div>
    </div>
  );
}

function SceneVisual({ scene, frame }) {
  if (scene.layout === "hook") {
    return (
      <>
        <PhonePreview frame={frame} accent={scene.accent} />
        <AvatarCard frame={frame} accent={scene.accent} />
      </>
    );
  }
  if (scene.layout === "promise") return <PromiseVisual frame={frame} accent={scene.accent} />;
  if (scene.layout === "workflow") return <WorkflowVisual frame={frame} accent={scene.accent} />;
  if (scene.layout === "categories") return <CategoriesVisual frame={frame} accent={scene.accent} />;
  return <CtaVisual frame={frame} accent={scene.accent} />;
}

function IntroScene({ scene, index }) {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ overflow: "hidden", fontFamily: "Inter, Arial, sans-serif" }}>
      <Background accent={scene.accent} />
      <TopBar scene={scene} index={index} />
      <SceneText scene={scene} frame={frame} />
      <SceneVisual scene={scene} frame={frame} />
      <WordCaption text={scene.voiceover} frame={frame} accent={scene.accent} />
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
            backgroundColor: scene.accent
          }}
        />
      </div>
    </AbsoluteFill>
  );
}

export const AltFToolsReviewIntroReel = () => {
  const { fps: configFps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: "#020617" }}>
      <Audio src={staticFile(`${assetBase}/audio/music-bed.wav`)} volume={0.13} />
      {introScenes.map((scene, index) => (
        <Sequence key={scene.title} from={index * sceneSeconds * configFps} durationInFrames={sceneSeconds * configFps}>
          <Audio src={staticFile(`${assetBase}/audio/scene-${String(index + 1).padStart(2, "0")}.mp3`)} volume={1} />
          <IntroScene scene={scene} index={index} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
