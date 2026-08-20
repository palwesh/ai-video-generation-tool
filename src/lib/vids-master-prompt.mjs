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

function sceneIntent(sceneNumber) {
  const intents = {
    1: "strong problem hook",
    2: "natural tool intro",
    3: "actual tool demo with real UI",
    4: "main workflow/use case",
    5: "useful output or next steps",
    6: "before-and-after benefit",
    7: "human review and safety reminder"
  };
  return intents[Number(sceneNumber)] || "tool promo scene";
}

export function buildGoogleVidsMasterPrompt(scenePlan, manifest = {}) {
  const tool = manifest.tool || {};
  const toolName = tool.tool_name || tool.topic || "AltF micro tool";
  const toolUrl = tool.tool_url || "provided Tool URL";
  const description = tool.description || "";
  const category = tool.category || "";
  const captureFiles = manifest.capture?.files || [];

  const sceneLines = scenePlan.scenes.map((scene) => (
    `Scene ${scene.scene_number} (${scene.duration}s):\n` +
    `Voiceover: ${scene.voiceover}\n` +
    `On-screen text: ${scene.onscreen_text}\n` +
    `Visual direction: ${scene.visual || scene.video_prompt}\n`
  ));

  return trimBlock([
    `Create a 70-second Instagram Reel in 9:16 portrait format for ${toolName}.`,
    `Language: Hinglish.`,
    `Style: realistic modern SaaS/UGC, fast cuts, laptop and phone shots, cursor highlights, clean mobile-readable captions.`,
    `Talent/audio direction: keep one consistent professional UGC creator/avatar across scenes; include clear Hinglish spoken voiceover and subtle upbeat background music if Google Vids supports audio in the chosen generation flow.`,
    `Editing direction: captions should be short and high contrast; use quick proof-focused cuts, not stock-looking filler.`,
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
    "- Do not make a silent screen-only clip unless audio generation is unavailable.",
    "- End with a human review and safety reminder before publishing/sharing.",
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
  const referenceFiles = Array.isArray(options.referenceFiles) ? options.referenceFiles : captureFiles;
  const referenceLine = referenceFiles.length
    ? `Use these attached real tool screenshots as the visible laptop/phone screen reference: ${referenceFiles.slice(0, 3).map(assetLabel).join(", ")}. Keep the screen readable and do not replace it with unrelated UI.`
    : `If the tool UI appears, show the actual Tool URL on screen: ${toolUrl}. Do not invent controls, results, or fake pages.`;

  return trimBlock([
    `Create a 10-second 9:16 vertical video for ${toolName}.`,
    `Scene ${scene.scene_number}/7 intent: ${sceneIntent(scene.scene_number)}.`,
    `Visual: ${compact(scene.visual || scene.video_prompt, 520)}`,
    referenceLine,
    `Voiceover: ${compact(scene.voiceover, 260)}`,
    `On-screen caption: ${compact(scene.onscreen_text, 90)}`,
    "Style: realistic modern professional SaaS/UGC reel, fast cuts, clean desk, laptop/phone shots, visible cursor highlights, daylight office lighting.",
    "Audio: clear Hinglish spoken voiceover matching the line above, plus subtle upbeat background music if available.",
    "Editing: large high-contrast captions, quick proof-focused zooms, consistent creator/avatar across scenes.",
    "Rules: fictional/demo data only; no real personal information; no fake UI; no unrelated stock-looking filler; no silent screen-only clip unless audio is unavailable."
  ]);
}
