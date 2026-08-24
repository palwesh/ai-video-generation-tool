function trimBlock(lines) {
  return lines.map((line) => String(line ?? "").trim()).filter(Boolean).join("\n");
}

function compact(value, maxLength = 480) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength - 3).trim()}...`;
}

function assetLabel(file) {
  return String(file || "").split(/[\\/]/).pop() || "reference asset";
}

function assetLines(captureFiles, limit = 4) {
  const files = captureFiles.slice(0, limit);
  return files.length
    ? files.map((file) => `- Attached reference: ${assetLabel(file)}`).join("\n")
    : "- Use the provided tool URL as the visual reference.";
}

function videoSizeInfo(value = "") {
  const raw = String(value || "").trim().toLowerCase();
  if (/landscape|horizontal|16:9|wide|youtube/.test(raw)) {
    return {
      value: "landscape",
      shortLabel: "Landscape 16:9",
      promptLead: "Create a 10-second 16:9 landscape video",
      masterLead: "Create a landscape 16:9 video",
      strictLine: "Strict format: landscape 16:9 only, not vertical, not square. Keep faces, captions, cursor highlights, and laptop/phone screens inside safe margins.",
      platform: "YouTube / website / wide social video"
    };
  }
  if (/square|1:1|post/.test(raw)) {
    return {
      value: "square",
      shortLabel: "Square 1:1",
      promptLead: "Create a 10-second 1:1 square video",
      masterLead: "Create a square 1:1 video",
      strictLine: "Strict format: square 1:1 only, not vertical, not landscape. Keep faces, captions, cursor highlights, and device screens inside safe margins.",
      platform: "Instagram feed / LinkedIn / square social video"
    };
  }
  return {
    value: "portrait",
    shortLabel: "Portrait 9:16",
    promptLead: "Create a 10-second 9:16 vertical video",
    masterLead: "Create a 9:16 portrait video",
    strictLine: "Strict format: portrait 9:16 only, not landscape, not square. Keep faces, captions, cursor highlights, and phone/laptop screens inside mobile safe margins.",
    platform: "Instagram Reels / YouTube Shorts"
  };
}

function videoSizeFrom(scenePlan = {}, manifest = {}, options = {}) {
  return videoSizeInfo(
    options.videoSize
    || scenePlan.metadata?.video_size
    || scenePlan.metadata?.videoSize
    || manifest.video_size
    || manifest.videoSize
    || manifest.hookAvatar?.videoSize
    || "portrait"
  );
}

function referenceIntentLines(referenceFiles = [], toolUrl = "") {
  const files = referenceFiles.slice(0, 5);
  if (!files.length) {
    return [
      `Show the actual Tool URL when a device screen is visible: ${toolUrl}.`,
      "Do not invent controls, results, dashboards, pages, or unsupported features."
    ];
  }
  const avatarRefs = files.filter((file) => /avatar|host|portrait|face|person|female|male/i.test(assetLabel(file)));
  const screenRefs = files.filter((file) => !avatarRefs.includes(file));
  const lines = [];
  if (avatarRefs.length) {
    lines.push(`Avatar/reference face image(s): ${avatarRefs.map(assetLabel).join(", ")}. Use only as a presenter style/face reference if the tool supports image references; keep natural face motion.`);
  }
  if (screenRefs.length) {
    lines.push(`Real tool screen reference(s): ${screenRefs.slice(0, 4).map(assetLabel).join(", ")}. Put these as the readable laptop/phone screen content when showing the tool.`);
  }
  lines.push(`Actual Tool URL: ${toolUrl}. Keep tool proof real; no fake UI or unrelated generated app screens.`);
  return lines;
}

function sceneIntent(sceneNumber, sceneCount) {
  return roleForScene(sceneNumber, sceneCount).intent || "tool promo scene";
}

export function buildGoogleVidsMasterPrompt(scenePlan, manifest = {}) {
  const tool = manifest.tool || {};
  const toolName = tool.tool_name || tool.topic || "AltF micro tool";
  const toolUrl = tool.tool_url || "provided Tool URL";
  const description = tool.description || "";
  const category = tool.category || "";
  const captureFiles = manifest.capture?.files || [];
  const sceneCount = scenePlan.scenes.length || 6;
  const totalDuration = scenePlan.scenes.reduce((sum, scene) => sum + Number(scene.duration || 10), 0) || sceneCount * 10;
  const size = videoSizeFrom(scenePlan, manifest);

  const sceneLines = scenePlan.scenes.map((scene) => (
    `Scene ${scene.scene_number} (${scene.duration}s):\n` +
    `Voiceover: ${scene.voiceover}\n` +
    `On-screen text: ${scene.onscreen_text}\n` +
    `Visual direction: ${scene.visual || scene.video_prompt}\n`
  ));

  return trimBlock([
    `${size.masterLead} (${totalDuration} seconds total) for ${toolName}.`,
    size.strictLine,
    "Goal: promote the AltFTool micro tool with a scroll-stopping hook, real tool proof, clear workflow, and a save/share/follow CTA.",
    `Language: Hinglish, natural Indian creator delivery, simple words, no robotic phrasing.`,
    "Style: realistic modern SaaS/UGC, fast cuts, human presenter/avatar moments, laptop and phone shots, visible cursor highlights, clean mobile-readable captions.",
    "Talent/audio direction: keep one consistent professional UGC creator/avatar across avatar scenes; speak directly to camera, start lines immediately, clear Hinglish voiceover, subtle upbeat background music only if available.",
    "Editing direction: hook in first 2 seconds, proof-focused zooms, no generic filler, captions after the hook should follow the spoken words with bold white/yellow text and black outline.",
    `Tool URL to demonstrate accurately: ${toolUrl}`,
    description ? `Tool description: ${description}` : "",
    category ? `Category/context: ${category}` : "",
    "",
    "Important rules:",
    "- Use only fictional/demo data.",
    "- Do not show real personal information.",
    "- Do not invent fake UI or unsupported features.",
    "- Scene 3 must show the actual tool URL and realistic interaction with the real visible page.",
    "- If reference screenshots are attached as ingredients, keep the real screenshot readable on the device screen instead of replacing it with unrelated synthetic footage.",
    "- Mention AltFTool naturally before or during the tool demo so viewers understand the brand.",
    "- Do not make a silent screen-only clip unless audio generation is unavailable.",
    "- CTA should say the tool link is in the caption, ask viewers to save/share/follow, and include a quick human-review safety reminder.",
    "",
    "Use these reference assets if the UI allows uploads:",
    assetLines(captureFiles),
    "",
    "Exact scene plan:",
    sceneLines.join("\n")
  ]);
}

export function buildGoogleVidsClipPrompt(scenePlan, sceneNumber, manifest = {}, options = {}) {
  const tool = manifest.tool || {};
  const scene = scenePlan.scenes.find((item) => Number(item.scene_number) === Number(sceneNumber));
  if (!scene) {
    throw new Error(`Scene ${sceneNumber} was not found in the scene plan.`);
  }

  const toolName = tool.tool_name || tool.topic || "AltF micro tool";
  const toolUrl = tool.tool_url || "provided Tool URL";
  const captureFiles = manifest.capture?.files || [];
  const sceneCount = Number(scenePlan.metadata?.reel_scene_count || scenePlan.metadata?.scene_count || scenePlan.scenes.length || 6) || 6;
  const size = videoSizeFrom(scenePlan, manifest, options);
  const referenceFiles = Array.isArray(options.referenceFiles) ? options.referenceFiles : captureFiles;
  const referenceLines = referenceIntentLines(referenceFiles, toolUrl);
  const isHookScene = Number(sceneNumber) === 1;
  const isLastScene = Number(sceneNumber) === sceneCount;
  const isProofScene = /demo|workflow|output|proof|before|after|result/i.test(sceneIntent(scene.scene_number, sceneCount));
  const hookDirection = isHookScene
    ? [
      "This is ONLY the first 10-second hook clip that will be merged with real tool screenshots and demo footage later.",
      "Open with the first hook line immediately in the first 2 seconds; no greeting, no slow intro.",
      "Use a realistic creator/avatar speaking directly to camera in Hinglish, with a laptop showing the real AltFTool page briefly as proof.",
      "Do not generate a full tutorial, full workflow, fake results, or unrelated stock footage. Keep it as a punchy hook/presenter clip."
    ].join(" ")
    : "";
  const ctaDirection = isLastScene
    ? "This is the final CTA clip. The presenter should clearly say to try the AltFTool link in the caption, save the reel, and review output before sharing."
    : "";
  const proofDirection = isProofScene
    ? "This scene must prioritize real tool proof: readable screen, visible cursor/click highlight, fictional/demo data, and a clear result or next step."
    : "Keep the scene tied to the tool value, not generic stock footage.";

  return trimBlock([
    `${size.promptLead} for ${size.platform} promoting ${toolName}.`,
    size.strictLine,
    `Scene ${scene.scene_number}/${sceneCount} intent: ${sceneIntent(scene.scene_number, sceneCount)}.`,
    hookDirection,
    ctaDirection,
    proofDirection,
    `Visual: ${compact(scene.visual || scene.video_prompt, 520)}`,
    referenceLines.join(" "),
    `Voiceover: ${compact(scene.voiceover, 260)}`,
    `On-screen caption: ${compact(scene.onscreen_text, 90)}`,
    "Style: realistic modern professional SaaS/UGC reel, fast cuts, clean desk, laptop/phone shots, visible cursor rings, daylight office lighting, polished but not overproduced.",
    "Audio: clear natural Hinglish spoken voiceover matching the exact line above, subtle upbeat background music if available, no robotic delivery.",
    "Editing: quick hook, proof-focused zooms, readable captions, one idea per shot, consistent presenter/avatar across clips, no clutter.",
    "Branding: mention AltFTool naturally when useful; never show real account names or private data.",
    "Rules: fictional/demo data only; no real personal information; no fake UI; no unsupported features; no unrelated stock-looking filler; no silent screen-only clip unless audio is unavailable."
  ]);
}
import { roleForScene } from "./reel-planner.mjs";
