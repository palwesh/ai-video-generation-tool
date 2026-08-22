function clean(value, fallback = "") {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text || fallback;
}

export function normalizeViralLanguage(value, fallback = "Hinglish") {
  const raw = clean(value, fallback).toLowerCase();
  if (/^en|english/.test(raw)) return "English";
  if (/^hi$|hindi|हिंदी/.test(raw)) return "Hindi";
  return "Hinglish";
}

function viralLanguage(row = {}) {
  return normalizeViralLanguage(row.script_language || row.scriptLanguage || row.language || "Hinglish");
}

export function limitViralWords(value, maxWords = 24) {
  const words = clean(value).split(" ").filter(Boolean);
  if (words.length <= maxWords) {
    return words.join(" ");
  }
  const clipped = words.slice(0, maxWords).join(" ").replace(/[,;:]+$/g, "");
  return `${clipped}.`;
}

function shortPhrase(value, fallback = "ye tool", maxWords = 5, maxChars = 42) {
  const text = clean(value, fallback)
    .replace(/[|:]+$/g, "")
    .replace(/[^\p{L}\p{N}\s&/+>?.-]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= maxChars && text.split(/\s+/).length <= maxWords) {
    return text;
  }
  return text
    .split(/\s+/)
    .filter((word) => word !== "&")
    .slice(0, maxWords)
    .join(" ")
    .slice(0, maxChars)
    .replace(/\s+\S*$/, "")
    .trim() || fallback;
}

function hashText(value) {
  return clean(value).split("").reduce((total, char) => (
    ((total << 5) - total + char.charCodeAt(0)) >>> 0
  ), 0);
}

export function viralToolName(row = {}) {
  return clean(row.tool_name || row.topic || row.name, "ye micro tool");
}

export function viralToolLabel(row = {}) {
  const raw = viralToolName(row);
  if (/pii/i.test(raw) && /redact/i.test(raw)) {
    return "PII Redactor";
  }
  if (/pdf/i.test(raw) && /image/i.test(raw) && /redact/i.test(raw)) {
    return "PDF & Image Redactor";
  }
  if (/privacy/i.test(raw) && /guard|scanner|checker/i.test(raw)) {
    return shortPhrase(raw, "Privacy Tool", 3, 30);
  }
  return shortPhrase(raw, "ye tool", 4, 34);
}

export function viralTopic(row = {}) {
  return shortPhrase(row.topic || row.tool_name || row.name, viralToolLabel(row), 5, 42);
}

export function viralAudience(row = {}) {
  const language = viralLanguage(row);
  const fallback = language === "English"
    ? "creators, founders and teams"
    : language === "Hindi"
      ? "creators, founders और teams"
      : "creators, founders aur teams";
  return shortPhrase(row.target_user, fallback, 5, 48).toLowerCase();
}

export function viralSignals(row = {}) {
  const text = clean(`${row.tool_name || ""} ${row.topic || ""} ${row.category || ""} ${row.description || ""} ${row.main_benefit || ""} ${row.script || ""}`).toLowerCase();
  return {
    privacy: /pii|privacy|redact|sensitive|secret|email|phone|id\b|passport|aadhaar|pan|ssn|bank|medical/.test(text),
    security: /security|phishing|scam|fraud|risk|vulnerability|credential|secret|policy|audit/.test(text),
    checker: /check|checker|review|inspect|audit|validate|warning|risk|compare/.test(text),
    converter: /convert|format|clean|extract|generate|builder|formatter/.test(text),
    creator: /creator|reel|video|caption|influencer|social|instagram|youtube/.test(text)
  };
}

export function viralBenefitLine(row = {}) {
  const signals = viralSignals(row);
  const language = viralLanguage(row);
  const text = clean(`${row.description || ""} ${row.main_benefit || ""} ${row.script || ""}`);
  if (language === "English") {
    if (signals.privacy) {
      return "masks sensitive details before you share them or paste them into AI";
    }
    if (signals.security) {
      return "surfaces risk points quickly so you do not make blind decisions";
    }
    if (signals.checker) {
      return "turns checks into a quick summary, warning points, and next actions";
    }
    if (signals.converter) {
      return "converts messy input into clean, usable output";
    }
    if (signals.creator) {
      return "makes the content workflow faster, cleaner, and post-ready";
    }
    return limitViralWords(row.main_benefit || row.description || text || "makes manual work faster and cleaner", 12).replace(/\.$/, "");
  }
  if (language === "Hindi") {
    if (signals.privacy) {
      return "share ya AI paste se pehle sensitive details ko safely mask करता है";
    }
    if (signals.security) {
      return "risk points ko जल्दी दिखाता है, ताकि blind decision न हो";
    }
    if (signals.checker) {
      return "summary, warning points और next action को review-ready बनाता है";
    }
    if (signals.converter) {
      return "messy input ko clean usable output में convert करता है";
    }
    if (signals.creator) {
      return "content workflow को faster, cleaner और post-ready बनाता है";
    }
    return limitViralWords(row.main_benefit || row.description || text || "manual work को faster और cleaner बनाता है", 12).replace(/\.$/, "");
  }
  if (signals.privacy) {
    return "sensitive details ko share ya AI paste se pehle safely mask karta hai";
  }
  if (signals.security) {
    return "risk points ko quickly surface karta hai, taaki aap blind decision na lo";
  }
  if (signals.checker) {
    return "summary, warning points aur next action ko review-ready banata hai";
  }
  if (signals.converter) {
    return "messy input ko clean, usable output me convert karta hai";
  }
  if (signals.creator) {
    return "content workflow ko faster, cleaner aur post-ready banata hai";
  }
  return limitViralWords(row.main_benefit || row.description || text || "manual work ko faster aur cleaner banata hai", 12).replace(/\.$/, "");
}

export function viralPainLine(row = {}) {
  const signals = viralSignals(row);
  const language = viralLanguage(row);
  const topic = viralTopic(row).toLowerCase();
  if (language === "English") {
    if (signals.privacy) {
      return "private data accidentally lands in AI, email, or a public document";
    }
    if (signals.security) {
      return "a hidden risk turns into an expensive mistake later";
    }
    if (signals.checker) {
      return "you need a fast review but keep missing checklist points";
    }
    if (signals.converter) {
      return "converting raw input into clean output feels repetitive";
    }
    return `the manual ${topic} step is slowing down your deadline`;
  }
  if (language === "Hindi") {
    if (signals.privacy) {
      return "private data galti se AI, email ya public doc में चला जाए";
    }
    if (signals.security) {
      return "hidden risk baad में costly mistake बन जाए";
    }
    if (signals.checker) {
      return "fast review चाहिए लेकिन checklist points miss हो रहे हों";
    }
    if (signals.converter) {
      return "raw input ko clean output में convert करना repetitive लग रहा हो";
    }
    return `${topic} ka manual step deadline slow कर रहा हो`;
  }
  if (signals.privacy) {
    return "private data galti se AI, email ya public doc me chala jaye";
  }
  if (signals.security) {
    return "ek hidden risk baad me expensive mistake ban jaye";
  }
  if (signals.checker) {
    return "aapko fast review chahiye par checklist miss ho rahi ho";
  }
  if (signals.converter) {
    return "raw input clean output me convert karna repetitive lag raha ho";
  }
  return `${topic} ka manual step deadline me slow kar raha ho`;
}

export function buildViralHookOptions(row = {}) {
  const label = viralToolLabel(row);
  const topic = viralTopic(row).toLowerCase();
  const benefit = viralBenefitLine(row);
  const pain = viralPainLine(row);
  const signals = viralSignals(row);
  const language = viralLanguage(row);

  const hooks = language === "English" ? [
    {
      framework: "pattern_interrupt",
      onscreen_text: "Stop. Watch this.",
      voiceover: `Stop scrolling. If you do ${topic} manually, watch this 30-second real demo of ${label}.`
    },
    {
      framework: "mistake_avoidance",
      onscreen_text: "Avoid this mistake",
      voiceover: `This small mistake can happen when ${pain}. First watch ${label}'s simple workflow.`
    },
    {
      framework: "save_for_later",
      onscreen_text: "Save before needed",
      voiceover: `You will remember this tool when ${pain}. Save it now and watch the demo.`
    },
    {
      framework: "three_step_shortcut",
      onscreen_text: "3-step shortcut",
      voiceover: `I thought this had to stay manual. Then ${label}: input, run, review. Watch the real demo.`
    },
    {
      framework: "curiosity_gap",
      onscreen_text: "Most people miss this",
      voiceover: `Most people skip this step in ${topic}. Look at ${label}'s result; the difference is clear.`
    },
    {
      framework: "benefit_first",
      onscreen_text: "Cleaner output fast",
      voiceover: `${label} ${benefit}. No heavy setup, just a quick real tool demo.`
    }
  ] : language === "Hindi" ? [
    {
      framework: "pattern_interrupt",
      onscreen_text: "रुकिए. ये देखिए.",
      voiceover: `Scroll रोकिए. अगर आप ${topic} manually कर रहे हैं, तो ${label} का 30-second real demo देखिए.`
    },
    {
      framework: "mistake_avoidance",
      onscreen_text: "ये गलती मत करो",
      voiceover: `ये छोटी mistake तब हो सकती है जब ${pain}. पहले ${label} का simple workflow देख लो.`
    },
    {
      framework: "save_for_later",
      onscreen_text: "Save कर लो",
      voiceover: `ये tool तब याद आएगा जब ${pain}. इसलिए अभी save करो और demo देखो.`
    },
    {
      framework: "three_step_shortcut",
      onscreen_text: "3-step shortcut",
      voiceover: `मुझे लगा ये काम manual ही रहेगा. फिर ${label}: input, run, review. Real demo देखिए.`
    },
    {
      framework: "curiosity_gap",
      onscreen_text: "लोग ये miss करते हैं",
      voiceover: `Most लोग ${topic} में ये step skip कर देते हैं. ${label} का result देखिए, difference clear है.`
    },
    {
      framework: "benefit_first",
      onscreen_text: "Fast clean output",
      voiceover: `${label} ${benefit}. Heavy setup नहीं, बस real tool page पर quick demo.`
    }
  ] : [
    {
      framework: "pattern_interrupt",
      onscreen_text: "Stop. Watch this.",
      voiceover: `Stop scrolling. Agar ${topic} manual kar rahe ho, ${label} ka 30-second real demo dekh lo.`
    },
    {
      framework: "mistake_avoidance",
      onscreen_text: "Avoid this mistake",
      voiceover: `Ye chhoti mistake ${pain}. Pehle ${label} ka simple workflow dekh lo.`
    },
    {
      framework: "save_for_later",
      onscreen_text: "Save before needed",
      voiceover: `Ye tool tab yaad aayega jab ${pain}. Isliye abhi save karo, demo dekho.`
    },
    {
      framework: "three_step_shortcut",
      onscreen_text: "3-step shortcut",
      voiceover: `Mujhe laga ye kaam manual hi rahega. Phir ${label}: input, run, review. Real demo dekho.`
    },
    {
      framework: "curiosity_gap",
      onscreen_text: "Most people miss this",
      voiceover: `Most people ${topic} me ye step skip kar dete hain. ${label} ka result dekho, difference clear hai.`
    },
    {
      framework: "benefit_first",
      onscreen_text: "Cleaner output fast",
      voiceover: `${label} ${benefit}. Setup nahi, bas real tool page par quick demo.`
    }
  ];

  if (signals.privacy) {
    const privacyHooks = language === "English" ? [
      {
        framework: "privacy_warning",
        onscreen_text: "AI paste? Wait.",
        voiceover: `Before pasting personal data into AI, pause. Use ${label} to mask sensitive details first.`
      },
      {
        framework: "hidden_data_risk",
        onscreen_text: "Hidden data risk",
        voiceover: `Email, phone, or ID can hide inside a prompt. Watch ${label}'s real privacy check.`
      }
    ] : language === "Hindi" ? [
      {
        framework: "privacy_warning",
        onscreen_text: "AI paste? रुकिए.",
        voiceover: `AI chat में personal data paste करने से पहले रुकिए. ${label} से sensitive details mask करें.`
      },
      {
        framework: "hidden_data_risk",
        onscreen_text: "Hidden data risk",
        voiceover: `Email, phone या ID prompt में छुप सकती है. ${label} का real privacy check देखिए.`
      }
    ] : [
      {
        framework: "privacy_warning",
        onscreen_text: "AI paste? Wait.",
        voiceover: `AI chat me personal data paste karne se pehle ruk jao. ${label} se pehle sensitive details mask karo.`
      },
      {
        framework: "hidden_data_risk",
        onscreen_text: "Hidden data risk",
        voiceover: `Email, phone ya ID prompt me chupkar ja sakti hai. ${label} ka real privacy check dekh lo.`
      }
    ];
    hooks.unshift(...privacyHooks);
  }

  return hooks.map((hook) => ({
    ...hook,
    voiceover: limitViralWords(hook.voiceover, 24)
  }));
}

export function selectViralHook(row = {}, offset = 0) {
  const hooks = buildViralHookOptions(row);
  const seed = Number(row.source_row_number || row.row || 0) + hashText(viralToolName(row)) + Number(offset || 0);
  return hooks[Math.abs(seed) % hooks.length] || hooks[0];
}

export function viralOnscreenTextForRole(roleId, row = {}) {
  if (roleId === "hook" || roleId === "hook_intro") {
    return selectViralHook(row).onscreen_text;
  }
  const label = viralToolLabel(row);
  const language = viralLanguage(row);
  const defaults = language === "English" ? {
    intro: `${label} in action`,
    demo: "Real demo, no fake UI",
    demo_workflow: "Demo -> result",
    workflow: "Input -> Run -> Review",
    workflow_output: "Check before use",
    proof_before_after: "Messy to clear",
    review_cta: "Comment TOOL"
  } : language === "Hindi" ? {
    intro: `${label} in action`,
    demo: "Real demo, fake UI नहीं",
    demo_workflow: "Demo -> result",
    workflow: "Input -> Run -> Review",
    workflow_output: "Use से पहले check",
    proof_before_after: "Messy से clear",
    review_cta: "Comment TOOL"
  } : {
    intro: `${label} in action`,
    demo: "Real demo, no fake UI",
    demo_workflow: "Demo -> result",
    workflow: "Input -> Run -> Review",
    workflow_output: "Check before use",
    proof_before_after: "Messy to clear",
    review_cta: "Comment TOOL"
  };
  return defaults[roleId] || "Save this workflow";
}

export function viralVoiceoverForRole(roleId, row = {}, context = {}) {
  const label = viralToolLabel(row);
  const audience = viralAudience(row);
  const benefit = viralBenefitLine(row);
  const toolUrl = clean(row.tool_url || row.url, "provided Tool URL");
  const hook = selectViralHook(row);
  const language = viralLanguage(row);
  const lines = language === "English" ? {
    hook: hook.voiceover,
    hook_intro: hook.voiceover,
    intro: `${label} is built for ${audience}. It ${benefit}.`,
    demo: `Now the real demo: ${toolUrl} is open. Add demo data, run the visible action, and review the result.`,
    demo_workflow: `The real demo is simple: open the link, add fictional input, run the action, then check the output.`,
    workflow: "Remember the three-step flow: input, run, review. This screen proof shows the value clearly.",
    workflow_output: "Do not use the output blindly. Check the summary, warnings, and next step; that is the save-worthy part.",
    proof_before_after: "Before: manual confusion. After: cleaner output, faster decision, and a safer review before sharing.",
    review_cta: `Review it once before sharing. If useful, save this, comment TOOL, and try ${label}.`
  } : language === "Hindi" ? {
    hook: hook.voiceover,
    hook_intro: hook.voiceover,
    intro: `${label} ${audience} के लिए built है. ये ${benefit}.`,
    demo: `अब real demo: ${toolUrl} open है. Demo data add करो, visible action run करो, और result review करो.`,
    demo_workflow: `Real demo simple है: link open, fictional input, run action, फिर output check.`,
    workflow: "Three-step flow याद रखो: input, run, review. इसी screen proof से value clear दिखेगी.",
    workflow_output: "Output मिलते ही blindly use मत करो. Summary, warnings और next step check करो; यही save-worthy part है.",
    proof_before_after: "Before manual confusion. After clean output, faster decision, और share करने से पहले safer review.",
    review_cta: `Human review के बाद ही share करो. Useful लगा तो save, comment TOOL, और ${label} try करो.`
  } : {
    hook: hook.voiceover,
    hook_intro: hook.voiceover,
    intro: `${label} ${audience} ke liye built hai. Ye ${benefit}.`,
    demo: `Ab real demo: ${toolUrl} open hai. Demo data add karo, visible action run karo, aur result review karo.`,
    demo_workflow: `Real demo simple hai: link open, fictional input, run action, phir output check. Fake UI nahi.`,
    workflow: "Teen-step flow yaad rakho: input, run, review. Isi screen footage se user ko proof dikhega.",
    workflow_output: "Output milte hi blindly use mat karo. Summary, warnings aur next step check karo; ye save-worthy part hai.",
    proof_before_after: "Before manual confusion. After clear output, faster decision, aur share karne se pehle safer review.",
    review_cta: `Human review ke baad hi share karo. Useful laga to save, comment TOOL, aur ${label} try karo.`
  };
  const fallback = context.fallback || lines.hook;
  return limitViralWords(lines[roleId] || fallback, 24);
}

function hashtagValue(value) {
  const text = String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 4)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
  return text ? `#${text}` : "";
}

export function buildViralSeoData(row = {}, plan = {}) {
  const toolName = viralToolName(row);
  const topic = clean(row.topic || toolName, toolName);
  const benefit = viralBenefitLine(row);
  const hookOptions = buildViralHookOptions(row).slice(0, 5);
  const language = viralLanguage(row);
  const caption = language === "English" ? [
    `${toolName} real demo.`,
    `If ${topic} wastes your time, save this workflow.`,
    `Value: ${benefit}.`,
    "Test with fictional data, review the output, then use or share it.",
    "Comment \"TOOL\" if you want the next micro-tool demo."
  ].join(" ") : language === "Hindi" ? [
    `${toolName} ka real demo.`,
    `अगर ${topic} में time waste होता है, तो ये workflow save कर लो.`,
    `Value: ${benefit}.`,
    "Fictional data से test करो, output review करो, फिर use/share करो.",
    "Comment \"TOOL\" अगर next micro-tool demo चाहिए."
  ].join(" ") : [
    `${toolName} ka real demo.`,
    `Agar ${topic} me time waste hota hai, ye workflow save kar lo.`,
    `Value: ${benefit}.`,
    "Fictional data se test karo, output review karo, phir use/share karo.",
    "Comment \"TOOL\" agar next micro-tool demo chahiye."
  ].join(" ");
  const baseHashtags = [
    hashtagValue(toolName),
    hashtagValue(topic),
    "#AITools",
    "#ProductivityHacks",
    "#SaaSTools",
    "#ToolDemo",
    "#MicroSaaS",
    "#CreatorTools",
    "#WorkflowHack",
    "#TechReels",
    "#HinglishReels",
    "#ReelsIndia",
    "#SaveThis",
    "#DigitalTools",
    "#AutomationTools",
    "#OnlineTools"
  ].filter(Boolean);
  return {
    instagram_caption: caption,
    hashtags: [...new Set(baseHashtags)].slice(0, 15),
    keywords: [
      toolName,
      topic,
      language,
      "real tool demo",
      "scroll stopping hook",
      "save this workflow",
      "comment TOOL",
      "micro tool",
      "AI tool",
      "productivity hack",
      limitViralWords(benefit, 8)
    ].filter(Boolean),
    hook_options: hookOptions,
    engagement_cta: language === "English"
      ? "Save this workflow, comment TOOL, and share it with someone who needs this."
      : language === "Hindi"
        ? "Is workflow ko save karo, comment TOOL, aur jisko need ho uske saath share karo."
        : "Save this workflow, comment TOOL, share with someone who needs this.",
    onscreen_overlays: (plan.scenes || []).map((scene) => ({
      scene_number: scene.scene_number,
      text: scene.onscreen_text
    }))
  };
}
