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
  return `${words.slice(0, maxWords).join(" ")}.`;
}

function shortPhrase(value, fallback, maxChars = 42) {
  const text = clean(value, fallback)
    .replace(/[^\w\s&/+>.-]/g, "")
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

function shouldKeepVoiceover(sceneNumber, value, row) {
  const text = clean(value);
  const count = wordCount(text);
  if (count < 15 || count > 28) {
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

function sceneCaption(sceneNumber, row, existing) {
  const toolName = safeToolName(row);
  const defaults = {
    1: "Stop manual checks",
    2: shortPhrase(toolName, "Micro tool", 30),
    3: "Real tool demo",
    4: "Input -> Run -> Review",
    5: "Result -> Next step",
    6: "Before vs After",
    7: "Review Then Share"
  };
  const current = shortPhrase(existing, defaults[sceneNumber] || "Tool workflow", 34);
  const tooLong = wordCount(current) > 7 || current.length > 34;
  return tooLong ? defaults[sceneNumber] : current;
}

function sceneVoiceover(sceneNumber, row, existing) {
  const toolName = safeToolName(row);
  const topic = shortPhrase(row.topic || toolName, toolName, 46);
  const targetUser = shortPhrase(row.target_user, "creators aur small teams", 48).toLowerCase();
  const benefit = safeBenefit(row);
  const toolUrl = safeToolUrl(row.tool_url);
  const defaults = {
    1: `Agar ${topic} manual kar rahe ho, chhota task bhi time kha leta hai. Ab isko faster aur cleaner banate hain.`,
    2: `${toolName} ek focused micro tool hai. ${targetUser} ke liye: ${benefit}. Heavy setup nahi, quick review.`,
    3: `Ab real demo: ${toolUrl} open hai. Fictional data add karo, visible action run karo, aur output carefully review karo.`,
    4: "Workflow simple rakho: input add, tool run, result check. Ye repeatable flow daily ka manual effort reduce karta hai.",
    5: "Output screen pe summary, warning points, ya next steps check karo. Useful result wahi hai jo action clear kare.",
    6: "Before: scattered manual checks. After: clean output aur faster decision. Value tab dikhti hai jab comparison clear ho.",
    7: "Publish se pehle human review mandatory. Sensitive data, claims, aur final caption check karo; then confidently share."
  };

  if (shouldKeepVoiceover(sceneNumber, existing, row)) {
    return clean(existing);
  }
  return limitWords(defaults[sceneNumber] || clean(existing) || defaults[1], 30);
}

function sceneVisual(sceneNumber, row, existing, hasCaptureAssets) {
  const toolUrl = safeToolUrl(row.tool_url);
  const defaults = {
    1: "Same professional UGC creator/avatar notices repeated manual work, then turns to a laptop with the real tool page ready.",
    2: "Same creator introduces the micro tool beside a laptop and phone setup, keeping the actual tool page visible.",
    3: `Actual screen demo opens ${toolUrl}, uses fictional/demo data only, clicks visible controls, and shows the result screen.`,
    4: "Captured screen recording shows the main workflow: add input, run the visible action, review output.",
    5: "Captured result screen stays readable while short overlays call out summary, warning points, and next steps.",
    6: "Before-and-after edit compares captured manual/before screen against captured tool/result screen.",
    7: "Same creator reviews the final output and Instagram draft, then pauses for a professional safety check before sharing."
  };
  const current = clean(existing, defaults[sceneNumber]);
  if (hasCaptureAssets && [3, 4, 5, 6].includes(sceneNumber) && !/captured|screenshot|screen recording|real tool/i.test(current)) {
    return `${current} Use captured screenshots or screen recording as the main visual proof.`;
  }
  return current;
}

function videoPrompt(scene, row, hasCaptureAssets) {
  const sceneNumber = Number(scene.scene_number);
  const toolName = safeToolName(row);
  const toolUrl = safeToolUrl(row.tool_url);
  const proofLine = hasCaptureAssets && [3, 4, 5, 6].includes(sceneNumber)
    ? "Use the available real tool screenshots or screen recording as the main laptop/phone screen content."
    : "Show the actual tool page on a laptop or phone when relevant.";
  const sceneRoles = {
    1: "open with a strong problem hook in the first 2 seconds",
    2: "introduce the product naturally and clearly",
    3: `demonstrate the actual Tool URL ${toolUrl} with fictional/demo data only`,
    4: "show the main workflow visually: input, run, review",
    5: "show the useful output, checklist, warning points, or next steps supported by the tool",
    6: "show a clear before-and-after benefit",
    7: "show final human review and a professional safety reminder before publishing"
  };
  const base = clean(scene.video_prompt);
  const normalizedBase = base.startsWith("Create a 10-second 9:16 vertical video")
    ? base.replace(/^Create a 10-second 9:16 vertical video\s*/i, "").trim()
    : base;
  const prompt = [
    `Create a 10-second 9:16 vertical video for ${toolName}.`,
    `Scene ${sceneNumber}/7 should ${sceneRoles[sceneNumber] || "promote the tool clearly"}.`,
    `Visual: ${scene.visual}`,
    proofLine,
    "Use fast but readable SaaS/UGC editing: cursor highlights, tight zooms on important UI areas, clean captions, and realistic desk lighting.",
    "Include clear Hinglish voiceover matching the script and subtle upbeat background music if available.",
    "Avoid fake UI, unsupported features, real personal information, and unrelated stock-looking filler.",
    normalizedBase && normalizedBase.length < 260 ? normalizedBase : ""
  ];
  return limitWords(prompt.filter(Boolean).join(" "), 125);
}

export function optimizeScenePlan(scenePlan, row, capture = {}) {
  const scenes = Array.isArray(scenePlan?.scenes) ? scenePlan.scenes : [];
  const hasCaptureAssets = Array.isArray(capture.files) && capture.files.length > 0;
  const optimizedScenes = Array.from({ length: 7 }, (_, index) => {
    const sceneNumber = index + 1;
    const existing = scenes[index] || {};
    const scene = {
      ...existing,
      scene_number: sceneNumber,
      duration: 10
    };
    scene.voiceover = sceneVoiceover(sceneNumber, row, scene.voiceover);
    scene.onscreen_text = sceneCaption(sceneNumber, row, scene.onscreen_text);
    scene.visual = sceneVisual(sceneNumber, row, scene.visual, hasCaptureAssets);
    scene.video_prompt = videoPrompt(scene, row, hasCaptureAssets);
    return scene;
  });

  return {
    ...scenePlan,
    scenes: optimizedScenes
  };
}
