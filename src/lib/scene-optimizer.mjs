import { resolveReelConfig, roleForScene } from "./reel-planner.mjs";
import {
  buildViralHookOptions,
  normalizeViralLanguage,
  selectViralHook,
  scoreViralHook,
  viralBenefitLine,
  viralOnscreenTextForRole,
  viralToolTemplate,
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

function hookVariantLabel(framework = "") {
  const key = String(framework || "").trim().toLowerCase();
  if (/mistake|warning|risk|privacy|hidden/.test(key)) return "Problem Hook";
  if (/pov|relatable/.test(key)) return "POV Hook";
  if (/before|after|proof/.test(key)) return "Before/After Hook";
  if (/screen|demo|shortcut|benefit/.test(key)) return "Demo Hook";
  if (/comment|save/.test(key)) return "Engagement Hook";
  return "Curiosity Hook";
}

function threeHookVariants(hookOptions = []) {
  const preferred = ["Problem Hook", "POV Hook", "Before/After Hook"];
  const used = new Set();
  const variants = [];
  for (const label of preferred) {
    const match = hookOptions.find((hook) => hookVariantLabel(hook.framework) === label && !used.has(hook.framework));
    if (match) {
      used.add(match.framework);
      variants.push({ ...match, variant_label: label });
    }
  }
  for (const hook of hookOptions) {
    if (variants.length >= 3) break;
    if (used.has(hook.framework)) continue;
    used.add(hook.framework);
    variants.push({ ...hook, variant_label: hookVariantLabel(hook.framework) });
  }
  return variants;
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

function captureUseGuide(capture = {}) {
  return capture?.toolUseGuide || capture?.tool_use_guide || {};
}

function guideInputLabel(guide = {}) {
  const labels = (guide.inputsShown || [])
    .map((field) => field.label || field.name || field.type || field.tagName)
    .filter(Boolean)
    .slice(0, 2)
    .join(", ");
  if (labels) {
    return labels;
  }
  if ((guide.uploadsShown || []).length) {
    return "demo upload file";
  }
  return "";
}

function bodyCopyLooksUseFocused(value) {
  return /\b(open|link|demo|input|fill|upload|click|run|generate|convert|process|result|output|review|screen|tool page|workflow)\b/i.test(clean(value));
}

function toolUseLines(row, capture = {}, language = scriptLanguage(row)) {
  const guide = captureUseGuide(capture);
  const label = safeToolName(row);
  const benefit = safeBenefit(row);
  const toolUrl = safeToolUrl(row.tool_url);
  const inputLabel = guideInputLabel(guide);
  const action = shortPhrase(guide.primaryAction, "visible action", 54);
  const output = shortPhrase(guide.outputPreview, "result/output screen", 86);
  const useCase = shortPhrase(guide.primaryUseCase || row.description || benefit, benefit, 90);

  if (language === "English") {
    return {
      intro: `${label} does one focused job: ${useCase}. Watch the real page, then the exact workflow.`,
      demo: `Here is the real page: ${toolUrl}. Add fictional ${inputLabel || "demo input"}, click ${action}, and watch the tool respond.`,
      workflow: `Use it like this: open the link, fill the visible input, run the action, then pause on the result screen.`,
      workflowOutput: `The important part is the output: check ${output}, then decide what to copy, download, or share.`,
      proof: `Before, the task feels manual. After, ${label} shows input, action, and review in one clear flow.`
    };
  }

  if (language === "Hindi") {
    return {
      intro: `${label} ka kaam simple hai: ${useCase}. Pehle real page dekho, phir exact workflow.`,
      demo: `Ye real page hai: ${toolUrl}. Fictional ${inputLabel || "demo input"} add karo, ${action} click karo, aur response dekho.`,
      workflow: `Use aise karo: link open, visible input fill, action run, phir result screen par ruk kar review.`,
      workflowOutput: `Main value output me hai: ${output} check karo, phir copy, download ya share ka decision lo.`,
      proof: `Before kaam manual lagta hai. After ${label} input, action aur review ko ek clear flow me dikhata hai.`
    };
  }

  return {
    intro: `${label} ka kaam simple hai: ${useCase}. Pehle real page dekho, phir exact workflow.`,
    demo: `Ye real page hai: ${toolUrl}. Fictional ${inputLabel || "demo input"} add karo, ${action} click karo, aur response dekho.`,
    workflow: `Use aise karo: link open, visible input fill, action run, phir result screen par ruk kar review.`,
    workflowOutput: `Main value output me hai: ${output} check karo, phir copy, download ya share ka decision lo.`,
    proof: `Before kaam manual lagta hai. After ${label} input, action aur review ko ek clear flow me dikhata hai.`
  };
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

function sceneVoiceover(sceneNumber, sceneCount, row, existing, capture = {}) {
  const toolName = safeToolName(row);
  const role = roleForScene(sceneNumber, sceneCount);
  const viralDefault = viralVoiceoverForRole(role.id, row);
  const language = scriptLanguage(row);
  const useLines = toolUseLines(row, capture, language);
  const defaults = {
    hook: viralDefault,
    hook_intro: viralDefault,
    intro: useLines.intro,
    demo: useLines.demo,
    demo_workflow: useLines.demo,
    workflow: useLines.workflow,
    workflow_output: useLines.workflowOutput,
    proof_before_after: useLines.proof,
    review_cta: viralDefault
  };

  if (["hook", "hook_intro", "review_cta"].includes(role.id)) {
    return limitWords(defaults[role.id], 24);
  }
  if (shouldKeepVoiceover(sceneNumber, existing, row) && bodyCopyLooksUseFocused(existing)) {
    return clean(existing);
  }
  return limitWords(defaults[role.id] || clean(existing) || defaults.hook, 24);
}

function sceneVisual(sceneNumber, sceneCount, row, existing, hasCaptureAssets, capture = {}) {
  const toolUrl = safeToolUrl(row.tool_url);
  const role = roleForScene(sceneNumber, sceneCount);
  const guide = captureUseGuide(capture);
  const inputLabel = guideInputLabel(guide) || "visible input/upload area";
  const action = shortPhrase(guide.primaryAction, "visible action", 54);
  const output = shortPhrase(guide.outputPreview, "result/output screen", 86);
  const defaults = {
    hook: "Male or female UGC avatar starts face-to-camera with a sharp hook, then points to a laptop with the real tool page ready.",
    hook_intro: "Same avatar shows the problem and introduces the tool while the real tool page is visible on a laptop.",
    intro: "Same creator introduces what this micro tool does while the real tool page remains readable on laptop/phone.",
    demo: `Full-screen real demo opens ${toolUrl}, zooms into ${inputLabel}, uses fictional/demo data only, clicks ${action}, and shows the result screen.`,
    demo_workflow: `Full-screen captured workflow opens ${toolUrl}, fills ${inputLabel}, clicks ${action}, and pauses on ${output}.`,
    workflow: `Captured screen recording teaches the use flow: open link, fill ${inputLabel}, click ${action}, review result.`,
    workflow_output: `Captured result/output screen stays readable while overlays explain what to check, copy, download, or share next.`,
    proof_before_after: "Before-and-after edit compares captured before/input screen against captured after/result screen.",
    review_cta: "Same creator reviews the final output and Instagram draft, then pauses for a professional safety check and CTA."
  };
  const current = clean(existing, defaults[role.id]);
  if (hasCaptureAssets && /demo|workflow|output|proof|before/i.test(role.id) && !/captured|screenshot|screen recording|real tool/i.test(current)) {
    return `${current} Use captured screenshots or screen recording as the main full-screen visual proof.`;
  }
  return current;
}

function videoPrompt(scene, sceneCount, row, hasCaptureAssets, capture = {}) {
  const sceneNumber = Number(scene.scene_number);
  const toolName = safeToolName(row);
  const toolUrl = safeToolUrl(row.tool_url);
  const role = roleForScene(sceneNumber, sceneCount);
  const language = scriptLanguage(row);
  const guide = captureUseGuide(capture);
  const useFlow = (guide.demoSteps || []).length
    ? `Follow this real use flow: ${guide.demoSteps.join(" -> ")}.`
    : "Follow this real use flow: open page -> add fictional input -> click visible action -> review result.";
  const proofLine = hasCaptureAssets && /demo|workflow|output|proof|before/i.test(role.id)
    ? `Use the available real tool screenshots or screen recording as the main full-screen proof. ${useFlow}`
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
    "Use fast but readable SaaS/UGC editing: cursor highlights, tight zooms on input fields, action buttons, result/output areas, clean captions, and realistic desk lighting.",
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
  const selectedHook = selectViralHook(row);
  const hookOptions = [
    selectedHook,
    ...buildViralHookOptions(row).filter((option) => option.framework !== selectedHook?.framework)
  ].filter(Boolean).slice(0, 8);
  const hookScore = selectedHook?.hook_score || scoreViralHook(selectedHook, row);
  const hookVariants = threeHookVariants(hookOptions);
  const guide = captureUseGuide(capture);
  const toolTemplate = viralToolTemplate(row);
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
    hook_variants: hookVariants,
    hook_quality: hookScore,
    body,
    cta,
    final_script: scenes.map((scene) => `Scene ${scene.scene_number}: ${scene.voiceover}`).join("\n"),
    engagement_cta: "Save this workflow, comment TOOL, share with someone who needs this. AltFTool link is in the caption.",
    value_promise: viralBenefitLine(row),
    tool_use_focus: {
      primary_use_case: guide.primaryUseCase || row.description || "",
      primary_action: guide.primaryAction || "",
      output_preview: guide.outputPreview || "",
      demo_steps: guide.demoSteps || []
    },
    tool_type_template: toolTemplate,
    hook_strategy: {
      selected_framework: selectedHook?.framework || hookOptions[0]?.framework || "",
      selected_score: hookScore?.score || 0,
      goal: "First 3 seconds should feel relatable, specific to the tool, and easy to understand without context.",
      rules: [
        "No generic greeting.",
        "Name the viewer's real problem or moment first.",
        "Promise one clear outcome, then prove it with the actual tool demo.",
        "Keep the avatar hook short enough for 6-10 seconds of natural speech.",
        "Rotate frameworks across rows so every reel does not start the same way."
      ],
      alternate_hook_count: hookOptions.length
    },
    retention_notes: [
      "Open with a relatable problem, mistake, POV, before/after, or curiosity hook; avoid repeated generic starts.",
      "Make the hook understandable in one listen: who it helps, what pain it removes, and why to keep watching.",
      "Show real tool proof before abstract benefits.",
      "Use the body to teach how the tool works: open, input, action, result, review.",
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
    scene.voiceover = sceneVoiceover(sceneNumber, reelConfig.sceneCount, row, scene.voiceover, capture);
    scene.onscreen_text = sceneCaption(sceneNumber, reelConfig.sceneCount, row, scene.onscreen_text);
    scene.visual = sceneVisual(sceneNumber, reelConfig.sceneCount, row, scene.visual, hasCaptureAssets, capture);
    scene.video_prompt = videoPrompt(scene, reelConfig.sceneCount, row, hasCaptureAssets, capture);
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
