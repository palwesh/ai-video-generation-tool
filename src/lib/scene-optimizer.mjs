import { resolveReelConfig, roleForScene } from "./reel-planner.mjs";
import {
  buildViralHookOptions,
  normalizeViralLanguage,
  viralBenefitLine,
  viralOnscreenTextForRole,
  viralVoiceoverForRole
} from "./viral-script.mjs";

function clean(value, fallback = "") {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text || fallback;
}

function wordCount(value) {
  return clean(value).split(" ").filter(Boolean).length;
}

function limitWords(value, maxWords) {
  const words = clean(value).split(" ").filter(Boolean);
  if (words.length <= maxWords) {
    return words.join(" ");
  }
  const clipped = words.slice(0, maxWords).join(" ").replace(/[,;:]+$/g, "");
  return `${clipped}.`;
}

function shortPhrase(value, fallback, maxChars = 42) {
  const text = clean(value, fallback)
    .replace(/[^\p{L}\p{N}\s&/+>?.-]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= maxChars) {
    return text;
  }
  return text.slice(0, maxChars).replace(/\s+\S*$/, "").trim() || fallback;
}

function safeToolUrl(value) {
  return clean(value, "provided Tool URL");
}

function safeToolName(row) {
  return clean(row.tool_name || row.topic, "this micro tool");
}

function safeBenefit(row) {
  const raw = shortPhrase(
    row.main_benefit || row.description,
    "save time and improve output quality",
    94
  );
  const lower = raw.toLowerCase();
  if (/mask|redact|privacy|pii|secret|sensitive|email|phone|id\b/.test(lower)) {
    return "sensitive data ko locally mask karna";
  }
  if (/summari[sz]e|check|review|inspect|warn|risk/.test(lower)) {
    return "quick review, warning points aur next steps nikalna";
  }
  if (/convert|format|clean|extract|generate/.test(lower)) {
    return "input ko clean usable output me convert karna";
  }
  return limitWords(raw, 10)
    .replace(/\bkare$/i, "karna")
    .replace(/\.$/, "")
    .trim()
    .toLowerCase();
}

function scriptLanguage(row = {}) {
  return normalizeViralLanguage(row.script_language || row.scriptLanguage || row.language || "Hinglish");
}

function shouldKeepVoiceover(sceneNumber, value, row) {
  const text = clean(value);
  const count = wordCount(text);
  if (count < 12 || count > 24) {
    return false;
  }
  const toolName = safeToolName(row);
  const wrongOrFragmented = [
    /aur kar sakte/i,
    /\bfor creators and small teams\b/i,
    /\bfor general\b/i,
    /structured output me convert/i,
    /input ko structured output/i
  ].some((pattern) => pattern.test(text));
  if (wrongOrFragmented) {
    return false;
  }
  if (sceneNumber > 1 && !text.toLowerCase().includes(toolName.toLowerCase().slice(0, 12)) && /permanent pdf|image redactor/i.test(text)) {
    return false;
  }
  return true;
}

function sceneCaption(sceneNumber, sceneCount, row, existing) {
  const toolName = safeToolName(row);
  const role = roleForScene(sceneNumber, sceneCount);
  const viralText = viralOnscreenTextForRole(role.id, row);
  const defaults = {
    hook: viralText,
    hook_intro: viralText,
    intro: shortPhrase(toolName, "Micro tool", 30),
    demo: viralText,
    demo_workflow: viralText,
    workflow: viralText,
    workflow_output: viralText,
    proof_before_after: viralText,
    review_cta: viralText
  };
  const current = shortPhrase(existing, defaults[role.id] || role.caption || "Tool workflow", 34);
  const tooLong = wordCount(current) > 7 || current.length > 34;
  return tooLong ? (defaults[role.id] || role.caption) : current;
}

function sceneVoiceover(sceneNumber, sceneCount, row, existing) {
  const toolName = safeToolName(row);
  const topic = shortPhrase(row.topic || toolName, toolName, 46);
  const targetUser = shortPhrase(row.target_user, "creators aur small teams", 48).toLowerCase();
  const benefit = safeBenefit(row);
  const toolUrl = safeToolUrl(row.tool_url);
  const role = roleForScene(sceneNumber, sceneCount);
  const viralDefault = viralVoiceoverForRole(role.id, row);
  const defaults = {
    hook: viralDefault,
    hook_intro: viralDefault,
    intro: viralDefault || `${toolName} ek focused micro tool hai. ${targetUser} ke liye: ${benefit}. Heavy setup nahi, quick review.`,
    demo: viralDefault || `Ab real demo: ${toolUrl} open hai. Fictional data add karo, visible action run karo, aur result review karo.`,
    demo_workflow: viralDefault || `Ab demo dekho: ${toolUrl} open karo, fictional input add karo, run karo, aur output review karo.`,
    workflow: viralDefault || "Workflow simple rakho: input add, tool run, result check. Ye repeatable flow daily ka manual effort reduce karta hai.",
    workflow_output: viralDefault || "Run ke baad output blindly use mat karo. Summary, warning points, aur next step check karo.",
    proof_before_after: viralDefault || "Before: scattered manual checks. After: clean output aur faster decision. Value comparison me clearly dikhti hai.",
    review_cta: viralDefault
  };

  if (["hook", "hook_intro", "review_cta"].includes(role.id)) {
    return limitWords(defaults[role.id], 24);
  }
  if (shouldKeepVoiceover(sceneNumber, existing, row)) {
    return clean(existing);
  }
  return limitWords(defaults[role.id] || clean(existing) || defaults.hook, 24);
}

function sceneVisual(sceneNumber, sceneCount, row, existing, hasCaptureAssets) {
  const toolUrl = safeToolUrl(row.tool_url);
  const role = roleForScene(sceneNumber, sceneCount);
  const defaults = {
    hook: "Male or female UGC avatar starts face-to-camera with a sharp hook, then points to a laptop with the real tool page ready.",
    hook_intro: "Same avatar shows the problem and introduces the tool while the real tool page is visible on a laptop.",
    intro: "Same creator introduces the micro tool beside a laptop and phone setup, keeping the actual tool page visible.",
    demo: `Actual screen demo opens ${toolUrl}, uses fictional/demo data only, clicks visible controls, and shows the result screen.`,
    demo_workflow: `Actual screen demo opens ${toolUrl}, adds fictional input, runs a visible action, and reviews the output.`,
    workflow: "Captured screen recording shows the main workflow: add input, run the visible action, review output.",
    workflow_output: "Captured result screen stays readable while short overlays call out summary, warning points, and next steps.",
    proof_before_after: "Before-and-after edit compares captured manual/before screen against captured tool/result screen.",
    review_cta: "Same creator reviews the final output and Instagram draft, then pauses for a professional safety check and CTA."
  };
  const current = clean(existing, defaults[role.id]);
  if (hasCaptureAssets && /demo|workflow|output|proof|before/i.test(role.id) && !/captured|screenshot|screen recording|real tool/i.test(current)) {
    return `${current} Use captured screenshots or screen recording as the main visual proof.`;
  }
  return current;
}

function videoPrompt(scene, sceneCount, row, hasCaptureAssets) {
  const sceneNumber = Number(scene.scene_number);
  const toolName = safeToolName(row);
  const toolUrl = safeToolUrl(row.tool_url);
  const role = roleForScene(sceneNumber, sceneCount);
  const language = scriptLanguage(row);
  const proofLine = hasCaptureAssets && /demo|workflow|output|proof|before/i.test(role.id)
    ? "Use the available real tool screenshots or screen recording as the main laptop/phone screen content."
    : "Show the actual tool page on a laptop or phone when relevant.";
  const base = clean(scene.video_prompt);
  const normalizedBase = base.startsWith("Create a 10-second 9:16 vertical video")
    ? base.replace(/^Create a 10-second 9:16 vertical video\s*/i, "").trim()
    : base;
  const prompt = [
    `Create a 10-second 9:16 vertical video for ${toolName}.`,
    `Scene ${sceneNumber}/${sceneCount} should ${role.promptRole || "promote the tool clearly"}.`,
    /hook/.test(role.id) ? "Start with a strong scroll-stopping avatar line in the first 2 seconds, then reveal the real tool screen." : "",
    /demo/.test(role.id) ? `The actual Tool URL is ${toolUrl}; use fictional/demo data only.` : "",
    `Visual: ${scene.visual}`,
    proofLine,
    "Use fast but readable SaaS/UGC editing: cursor highlights, tight zooms on important UI areas, clean captions, and realistic desk lighting.",
    "Prioritize watch-time: quick pattern interrupt, clear proof, then one simple takeaway.",
    `Include clear ${language} voiceover matching the script and subtle upbeat background music if available.`,
    "Avoid fake UI, unsupported features, real personal information, and unrelated stock-looking filler.",
    normalizedBase && normalizedBase.length < 260 ? normalizedBase : ""
  ];
  return limitWords(prompt.filter(Boolean).join(" "), 125);
}

export function buildReelScriptPackage(scenePlan, row, capture = {}, reelConfig = {}) {
  const scenes = Array.isArray(scenePlan?.scenes) ? scenePlan.scenes : [];
  const hook = scenes[0]?.voiceover || "";
  const cta = scenes.at(-1)?.voiceover || "";
  const body = scenes.slice(1, -1).map((scene) => scene.voiceover).join(" ");
  const hookOptions = buildViralHookOptions(row).slice(0, 5);
  return {
    tool_name: safeToolName(row),
    tool_url: safeToolUrl(row.tool_url),
    script_language: scriptLanguage(row),
    scene_count: reelConfig.sceneCount || scenes.length,
    scene_duration_seconds: reelConfig.sceneDurationSeconds || 10,
    total_duration_seconds: reelConfig.totalDurationSeconds || scenes.length * 10,
    script_angle: `${scriptLanguage(row)} Instagram retention-first tool promo`,
    hook,
    hook_options: hookOptions,
    body,
    cta,
    final_script: scenes.map((scene) => `Scene ${scene.scene_number}: ${scene.voiceover}`).join("\n"),
    engagement_cta: "Save this workflow, comment TOOL, share with someone who needs this. AltFTool link is in the caption.",
    value_promise: viralBenefitLine(row),
    retention_notes: [
      "Open with a pattern interrupt or mistake-avoidance hook, not a greeting.",
      "Show real tool proof before abstract benefits.",
      "Keep captions 3-7 words, high contrast, and easy to read on mobile.",
      "Give a useful takeaway so viewers have a reason to save.",
      "End with human review plus comment/save/share/follow CTA."
    ],
    asset_strategy: {
      capture_first: true,
      use_real_tool_assets_for: scenes
        .filter((scene) => /demo|workflow|output|before|after|real tool|captured/i.test(`${scene.visual} ${scene.video_prompt}`))
        .map((scene) => scene.scene_number),
      captured_asset_count: Array.isArray(capture.files) ? capture.files.length : 0
    }
  };
}

export function optimizeScenePlan(scenePlan, row, capture = {}, config = {}) {
  const reelConfig = resolveReelConfig(config);
  const scenes = Array.isArray(scenePlan?.scenes) ? scenePlan.scenes : [];
  const hasCaptureAssets = Array.isArray(capture.files) && capture.files.length > 0;
  const optimizedScenes = Array.from({ length: reelConfig.sceneCount }, (_, index) => {
    const sceneNumber = index + 1;
    const existing = scenes[index] || {};
    const scene = {
      ...existing,
      scene_number: sceneNumber,
      duration: reelConfig.sceneDurationSeconds
    };
    scene.voiceover = sceneVoiceover(sceneNumber, reelConfig.sceneCount, row, scene.voiceover);
    scene.onscreen_text = sceneCaption(sceneNumber, reelConfig.sceneCount, row, scene.onscreen_text);
    scene.visual = sceneVisual(sceneNumber, reelConfig.sceneCount, row, scene.visual, hasCaptureAssets);
    scene.video_prompt = videoPrompt(scene, reelConfig.sceneCount, row, hasCaptureAssets);
    return scene;
  });

  const metadata = {
    ...(scenePlan?.metadata || {}),
    scene_count: reelConfig.sceneCount,
    scene_duration_seconds: reelConfig.sceneDurationSeconds,
    total_duration_seconds: reelConfig.totalDurationSeconds,
    script_package: buildReelScriptPackage({ scenes: optimizedScenes }, row, capture, reelConfig)
  };

  return {
    ...scenePlan,
    metadata,
    scenes: optimizedScenes
  };
}
