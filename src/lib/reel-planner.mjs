export const SCENE_DURATION_SECONDS = 10;
export const MIN_REEL_SCENES = 3;
export const MAX_REEL_SCENES = 6;
export const DEFAULT_REEL_SCENES = 6;

export function cleanText(value, fallback = "") {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text || fallback;
}

export function clampSceneCount(value, fallback = DEFAULT_REEL_SCENES) {
  const parsed = Number(value);
  const base = Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  return Math.max(MIN_REEL_SCENES, Math.min(MAX_REEL_SCENES, Math.round(base)));
}

export function resolveReelConfig(config = {}, options = {}) {
  const configuredSceneCount = options.sceneCount
    || options.maxScenes
    || config.sceneCount
    || Math.round(Number(config.durationSeconds || DEFAULT_REEL_SCENES * SCENE_DURATION_SECONDS) / SCENE_DURATION_SECONDS);
  const sceneCount = clampSceneCount(configuredSceneCount);
  const sceneDurationSeconds = Number(config.sceneDurationSeconds || SCENE_DURATION_SECONDS) || SCENE_DURATION_SECONDS;
  return {
    sceneCount,
    sceneDurationSeconds,
    totalDurationSeconds: sceneCount * sceneDurationSeconds,
    minDurationSeconds: MIN_REEL_SCENES * sceneDurationSeconds,
    maxDurationSeconds: MAX_REEL_SCENES * sceneDurationSeconds
  };
}

const ROLE_SETS = {
  3: ["hook_intro", "demo_workflow", "review_cta"],
  4: ["hook_intro", "demo", "workflow_output", "review_cta"],
  5: ["hook", "intro", "demo", "workflow_output", "review_cta"],
  6: ["hook", "intro", "demo", "workflow", "proof_before_after", "review_cta"]
};

export const ROLE_COPY = {
  hook: {
    intent: "strong retention hook",
    caption: "Stop manual work",
    visual: "Creator/avatar opens with a clear pain point and the real tool screen ready on a laptop.",
    promptRole: "open with a strong problem hook in the first 2 seconds"
  },
  hook_intro: {
    intent: "hook plus quick tool intro",
    caption: "One tool, faster result",
    visual: "Creator/avatar shows the pain point and immediately reveals the actual tool screen on a laptop.",
    promptRole: "combine a sharp hook with a quick, natural product introduction"
  },
  intro: {
    intent: "natural product intro",
    caption: "Micro tool for this",
    visual: "Creator/avatar introduces the micro tool beside a laptop and phone with the real tool page visible.",
    promptRole: "introduce the product naturally, including who it helps and the main outcome"
  },
  demo: {
    intent: "actual tool demo with real UI",
    caption: "Real tool demo",
    visual: "Actual screen demo uses the provided Tool URL with fictional/demo data and visible controls only.",
    promptRole: "demonstrate the actual Tool URL with fictional/demo data only"
  },
  demo_workflow: {
    intent: "actual demo plus workflow",
    caption: "Demo -> result",
    visual: "Captured screen recording shows the real tool URL, demo input, visible action, and reviewable output.",
    promptRole: "show the actual tool demo and the main workflow in one proof-focused clip"
  },
  workflow: {
    intent: "main workflow/use case",
    caption: "Input -> Run -> Review",
    visual: "Captured screen recording shows input, visible action click, and result review using the real page.",
    promptRole: "show the main workflow visually: input, run, review"
  },
  workflow_output: {
    intent: "workflow plus useful output",
    caption: "Run -> review",
    visual: "Captured workflow and result screen stay readable while overlays call out what to check next.",
    promptRole: "show the workflow and the useful output or review checklist"
  },
  proof_before_after: {
    intent: "output proof and before-after benefit",
    caption: "Messy to clear",
    visual: "Before-and-after edit compares captured manual/before screen against captured tool/result screen.",
    promptRole: "show a clear before-and-after result and the benefit"
  },
  review_cta: {
    intent: "human review, safety, and CTA",
    caption: "Review then share",
    visual: "Creator/avatar reviews the final result, checks safety, and ends with a save/share CTA.",
    promptRole: "show final human review, safety reminder, and a clear Instagram CTA"
  }
};

export function roleForScene(sceneNumber, sceneCount = DEFAULT_REEL_SCENES) {
  const count = clampSceneCount(sceneCount);
  const roles = ROLE_SETS[count] || ROLE_SETS[DEFAULT_REEL_SCENES];
  const role = roles[Math.max(0, Math.min(roles.length - 1, Number(sceneNumber) - 1))];
  return {
    id: role,
    ...ROLE_COPY[role]
  };
}

export function sceneNumbers(sceneCount = DEFAULT_REEL_SCENES) {
  const count = clampSceneCount(sceneCount);
  return Array.from({ length: count }, (_, index) => index + 1);
}
