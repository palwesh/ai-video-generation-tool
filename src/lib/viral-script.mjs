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

function viralBrandToolLabel(row = {}, language = viralLanguage(row)) {
  const label = viralToolLabel(row);
  if (/^alt\s*f|^altftool/i.test(label)) {
    return label;
  }
  return language === "English" ? `AltFTool's ${label}` : `AltFTool ka ${label}`;
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
    creator: /creator|reel|video|caption|influencer|social|instagram|youtube/.test(text),
    organizer: /organize|organise|store|vault|receipt|warranty|bookmark|archive|tracker|record/.test(text)
  };
}

export function viralToolType(row = {}) {
  const signals = viralSignals(row);
  if (signals.privacy) return "privacy_safety";
  if (signals.security) return "risk_checker";
  if (signals.checker) return "checker_review";
  if (signals.creator) return "creator_workflow";
  if (signals.organizer) return "organizer_vault";
  if (signals.converter) return "converter_generator";
  return "micro_tool";
}

export function viralToolTemplate(row = {}) {
  const language = viralLanguage(row);
  const type = viralToolType(row);
  const templates = {
    privacy_safety: {
      label: "Privacy Safety Tool",
      hook_focus: "Start with the risk of sharing private/sensitive data by mistake.",
      body_focus: "Show input, masking/redaction, then safe review before sharing.",
      cta_focus: "Ask viewers to save it before they paste/share anything sensitive."
    },
    risk_checker: {
      label: "Risk Checker Tool",
      hook_focus: "Start with a hidden-risk mistake people do not notice.",
      body_focus: "Show quick check, warning points, and decision support.",
      cta_focus: "Ask viewers to review once, then try the AltFTool link."
    },
    checker_review: {
      label: "Checker / Review Tool",
      hook_focus: "Start with a missed-detail problem in quick review work.",
      body_focus: "Show checklist, output review, and next action.",
      cta_focus: "Ask viewers to save the review workflow."
    },
    converter_generator: {
      label: "Converter / Generator Tool",
      hook_focus: "Start with repetitive manual formatting or generation work.",
      body_focus: "Show fictional input, one visible action, and clean output.",
      cta_focus: "Ask viewers to try the tool and comment TOOL for the next demo."
    },
    creator_workflow: {
      label: "Creator Workflow Tool",
      hook_focus: "Start with content creation/editing feeling slow or messy.",
      body_focus: "Show idea to output workflow with post-ready proof.",
      cta_focus: "Ask viewers to save/share for their next content task."
    },
    organizer_vault: {
      label: "Organizer / Vault Tool",
      hook_focus: "Start with losing an important receipt, warranty, or detail.",
      body_focus: "Show store, organize, search/find, and review flow.",
      cta_focus: "Ask viewers to save it before they need an old detail."
    },
    micro_tool: {
      label: "Focused Micro Tool",
      hook_focus: "Start with one specific manual task or confusing moment.",
      body_focus: "Show real page, input, action, output, and review.",
      cta_focus: "Ask viewers to save it and try the AltFTool caption link."
    }
  };
  const template = templates[type] || templates.micro_tool;
  if (language === "Hindi") {
    return {
      type,
      label: template.label,
      hook_focus: template.hook_focus,
      body_focus: template.body_focus,
      cta_focus: template.cta_focus,
      language_note: "Hindi/Hinglish words simple रखो; first listen me point clear hona chahiye."
    };
  }
  if (language === "English") {
    return {
      type,
      ...template,
      language_note: "Keep it conversational, clear, and specific to one real workflow."
    };
  }
  return {
    type,
    ...template,
    language_note: "Hinglish natural rakho; viewer ko pehle 3 seconds me pain aur result samajh aaye."
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
    if (signals.organizer) {
      return "keeps important details organized and easy to find";
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
    if (signals.organizer) {
      return "important details को organized और easy-to-find बनाता है";
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
  if (signals.organizer) {
    return "important details ko organized aur easy-to-find banata hai";
  }
  return limitViralWords(row.main_benefit || row.description || text || "manual work ko faster aur cleaner banata hai", 12).replace(/\.$/, "");
}

export function viralPainLine(row = {}) {
  const signals = viralSignals(row);
  const language = viralLanguage(row);
  const topic = viralTopic(row).toLowerCase();
  if (language === "English") {
    if (signals.privacy) {
      return "private data leaks into AI or a public file";
    }
    if (signals.security) {
      return "a hidden risk turns into an expensive mistake later";
    }
    if (signals.checker) {
      return "quick review details are easy to miss";
    }
    if (signals.converter) {
      return "cleaning the same messy input again and again";
    }
    if (signals.organizer) {
      return "important details are hard to find when you need them";
    }
    return `the manual ${topic} step is slowing down your deadline`;
  }
  if (language === "Hindi") {
    if (signals.privacy) {
      return "private data AI या public file में leak हो जाए";
    }
    if (signals.security) {
      return "hidden risk baad में costly mistake बन जाए";
    }
    if (signals.checker) {
      return "quick review में important details miss हो सकती हों";
    }
    if (signals.converter) {
      return "same messy input को बार-बार clean करना पड़ रहा हो";
    }
    if (signals.organizer) {
      return "जरूरत के time important details मिल न रही हों";
    }
    return `${topic} ka manual step deadline slow कर रहा हो`;
  }
  if (signals.privacy) {
    return "private data AI ya public file me leak ho jaye";
  }
  if (signals.security) {
    return "ek hidden risk baad me expensive mistake ban jaye";
  }
  if (signals.checker) {
    return "quick review me important details miss ho sakti ho";
  }
  if (signals.converter) {
    return "same messy input ko baar-baar clean karna pad raha ho";
  }
  if (signals.organizer) {
    return "zarurat ke time important details mil na rahi ho";
  }
  return `${topic} ka manual step deadline me slow kar raha ho`;
}

export function viralRelatableMoment(row = {}) {
  const signals = viralSignals(row);
  const language = viralLanguage(row);
  const topic = viralTopic(row).toLowerCase();
  if (language === "English") {
    if (signals.privacy) {
      return "you are about to share a screenshot, document, or AI prompt";
    }
    if (signals.security) {
      return "you need a quick decision but the risk is not obvious";
    }
    if (signals.checker) {
      return "you are checking something quickly and do not want to miss details";
    }
    if (signals.converter) {
      return "messy input is blocking the clean output you actually need";
    }
    if (signals.creator) {
      return "content is ready, but editing and posting still feels slow";
    }
    if (signals.organizer) {
      return "one old receipt or detail is suddenly needed";
    }
    return `you are stuck doing ${topic} manually`;
  }
  if (language === "Hindi") {
    if (signals.privacy) {
      return "aap screenshot, document ya AI prompt share karne wale ho";
    }
    if (signals.security) {
      return "decision jaldi lena ho, par risk clearly visible na ho";
    }
    if (signals.checker) {
      return "aap quick check kar rahe ho aur details miss nahi karni";
    }
    if (signals.converter) {
      return "messy input ki wajah se clean output atak raha ho";
    }
    if (signals.creator) {
      return "content ready ho, par editing aur posting abhi bhi slow lagti ho";
    }
    if (signals.organizer) {
      return "achanak koi old receipt ya detail chahiye ho";
    }
    return `aap ${topic} manually karte karte stuck ho`;
  }
  if (signals.privacy) {
    return "aap screenshot, document ya AI prompt share karne wale ho";
  }
  if (signals.security) {
    return "decision jaldi lena ho, par risk clearly visible na ho";
  }
  if (signals.checker) {
    return "aap quick check kar rahe ho aur details miss nahi karni";
  }
  if (signals.converter) {
    return "messy input ki wajah se clean output atak raha ho";
  }
  if (signals.creator) {
    return "content ready ho, par editing aur posting abhi bhi slow lagti ho";
  }
  if (signals.organizer) {
    return "achanak koi old receipt ya detail chahiye ho";
  }
  return `aap ${topic} manually karte karte stuck ho`;
}

export function viralResultLine(row = {}) {
  const signals = viralSignals(row);
  const language = viralLanguage(row);
  if (language === "English") {
    if (signals.privacy) return "cleaner sharing with fewer privacy mistakes";
    if (signals.security) return "a clearer risk check before you act";
    if (signals.checker) return "a review-ready checklist in seconds";
    if (signals.converter) return "clean output without repeating the same steps";
    if (signals.creator) return "a faster path from idea to post-ready content";
    if (signals.organizer) return "organized details you can find faster";
    return "a faster workflow with less manual back-and-forth";
  }
  if (language === "Hindi") {
    if (signals.privacy) return "privacy mistakes ke bina cleaner sharing";
    if (signals.security) return "action se pehle clearer risk check";
    if (signals.checker) return "seconds me review-ready checklist";
    if (signals.converter) return "same steps repeat kiye bina clean output";
    if (signals.creator) return "idea se post-ready content tak faster workflow";
    if (signals.organizer) return "organized details jo faster mil jayein";
    return "less manual back-and-forth ke saath faster workflow";
  }
  if (signals.privacy) return "privacy mistakes ke bina cleaner sharing";
  if (signals.security) return "action se pehle clearer risk check";
  if (signals.checker) return "seconds me review-ready checklist";
  if (signals.converter) return "same steps repeat kiye bina clean output";
  if (signals.creator) return "idea se post-ready content tak faster workflow";
  if (signals.organizer) return "organized details jo faster mil jayein";
  return "less manual back-and-forth ke saath faster workflow";
}

function hookScoreDetail(hook = {}, row = {}) {
  const voiceover = clean(hook.voiceover);
  const onscreen = clean(hook.onscreen_text);
  const label = viralToolLabel(row).toLowerCase();
  const topic = viralTopic(row).toLowerCase();
  const text = `${voiceover} ${onscreen}`.toLowerCase();
  const words = voiceover.split(/\s+/).filter(Boolean);
  const lengthScore = words.length >= 10 && words.length <= 21
    ? 100
    : words.length >= 7 && words.length <= 24
      ? 82
      : words.length >= 5 && words.length <= 28
        ? 62
        : 38;
  const clarityHits = [
    label && text.includes(label),
    topic && text.includes(topic.slice(0, Math.min(topic.length, 16))),
    /\b(demo|workflow|result|input|run|review|screen|real|try|save)\b/i.test(text),
    /[.!?।]/.test(voiceover)
  ].filter(Boolean).length;
  const curiosityHits = [
    /\b(stop|wait|before|most|mistake|risk|hidden|pov|watch|need|save|tiny|secret)\b/i.test(text),
    /\?/.test(voiceover),
    /before|after|difference|miss|skip/i.test(text)
  ].filter(Boolean).length;
  const relatableHits = [
    /\b(aap|agar|jab|pov|manual|messy|galti|stuck|slow|repeat|need|chahiye|miss|find|share)\b/i.test(text),
    viralPainLine(row).split(/\s+/).some((word) => word.length > 4 && text.includes(word.toLowerCase())),
    viralRelatableMoment(row).split(/\s+/).some((word) => word.length > 4 && text.includes(word.toLowerCase()))
  ].filter(Boolean).length;
  const toolHits = [
    label && text.includes(label),
    /\baltf|altftool|tool\b/i.test(text),
    viralBenefitLine(row).split(/\s+/).some((word) => word.length > 5 && text.includes(word.toLowerCase()))
  ].filter(Boolean).length;
  const clarity = Math.min(100, 46 + clarityHits * 16 + (words.length <= 24 ? 8 : -10));
  const curiosity = Math.min(100, 46 + curiosityHits * 18 + (/^(stop|wait|ruk|dekho|pov|before)/i.test(voiceover) ? 8 : 0));
  const relatable = Math.min(100, 44 + relatableHits * 18);
  const tool_relevance = Math.min(100, 54 + toolHits * 18);
  const score = Math.round((clarity * 0.3) + (curiosity * 0.24) + (relatable * 0.24) + (tool_relevance * 0.22) + (lengthScore - 80) * 0.15);
  const warnings = [
    words.length > 24 ? "Too long for a natural 6-10 sec avatar hook." : "",
    words.length < 7 ? "Too short; add a clear pain or promise." : "",
    tool_relevance < 70 ? "Tool name or outcome is not clear enough." : "",
    curiosity < 70 ? "Curiosity/pattern interrupt can be stronger." : "",
    relatable < 70 ? "Add a more relatable viewer moment." : ""
  ].filter(Boolean);
  return {
    score: Math.max(0, Math.min(100, score)),
    clarity,
    curiosity,
    relatable,
    tool_relevance,
    length: lengthScore,
    word_count: words.length,
    status: score >= 82 ? "strong" : score >= 68 ? "usable" : "rewrite",
    warnings
  };
}

export function scoreViralHook(hook = {}, row = {}) {
  return hookScoreDetail(hook, row);
}

export function buildViralHookOptions(row = {}) {
  const label = viralToolLabel(row);
  const topic = viralTopic(row).toLowerCase();
  const benefit = viralBenefitLine(row);
  const pain = viralPainLine(row);
  const moment = viralRelatableMoment(row);
  const result = viralResultLine(row);
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
      voiceover: `This risk appears when ${pain}. Watch ${label}'s workflow first.`
    },
    {
      framework: "save_for_later",
      onscreen_text: "Save before needed",
      voiceover: `When ${pain}, ${label} helps. Save this real demo.`
    },
    {
      framework: "three_step_shortcut",
      onscreen_text: "3-step shortcut",
      voiceover: `I thought this had to stay manual. Then ${label}: input, run, review. Watch the real demo.`
    },
    {
      framework: "curiosity_gap",
      onscreen_text: "Most people miss this",
      voiceover: `Most people skip this ${topic} step. Watch ${label}'s result; the difference is clear.`
    },
    {
      framework: "benefit_first",
      onscreen_text: "Cleaner output fast",
      voiceover: `${label} ${benefit}. No heavy setup, just a quick real tool demo.`
    },
    {
      framework: "pov_relatable",
      onscreen_text: "POV: this saves time",
      voiceover: `POV: ${label} helps when ${moment}. Watch the real demo.`
    },
    {
      framework: "before_after_preview",
      onscreen_text: "Before vs after",
      voiceover: `Before: ${topic} feels messy. After: ${label} shows the clean workflow. Watch the real result.`
    },
    {
      framework: "one_screen_demo",
      onscreen_text: "One screen demo",
      voiceover: `Give me one screen and 30 seconds; I will show exactly how ${label} helps with ${topic}.`
    },
    {
      framework: "comment_bait_value",
      onscreen_text: "Need this?",
      voiceover: `If ${moment}, comment TOOL after this. First watch ${label} in action.`
    },
    {
      framework: "myth_buster",
      onscreen_text: "Not a long setup",
      voiceover: `${topic} does not need a long setup. ${label} is open, and this is the real workflow.`
    },
    {
      framework: "micro_tool_discovery",
      onscreen_text: "Tiny tool, real use",
      voiceover: `Tiny tool, real use case: ${label} helps when ${pain}. Save it before you need it.`
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
      voiceover: `Ye risk tab hota hai jab ${pain}. Pehle ${label} workflow dekh lo.`
    },
    {
      framework: "save_for_later",
      onscreen_text: "Save कर लो",
      voiceover: `Jab ${pain}, ${label} help karega. Abhi real demo dekh lo.`
    },
    {
      framework: "three_step_shortcut",
      onscreen_text: "3-step shortcut",
      voiceover: `मुझे लगा ये काम manual ही रहेगा. फिर ${label}: input, run, review. Real demo देखिए.`
    },
    {
      framework: "curiosity_gap",
      onscreen_text: "लोग ये miss करते हैं",
      voiceover: `Most log ${topic} me ye step skip kar dete hain. ${label} ka result dekho, difference clear hai.`
    },
    {
      framework: "benefit_first",
      onscreen_text: "Fast clean output",
      voiceover: `${label} ${benefit}. Heavy setup नहीं, बस real tool page पर quick demo.`
    },
    {
      framework: "pov_relatable",
      onscreen_text: "POV: time save",
      voiceover: `POV: ${label} tab help karta hai jab ${moment}. Real demo dekho.`
    },
    {
      framework: "before_after_preview",
      onscreen_text: "Before vs after",
      voiceover: `Before: ${topic} messy लगता है. After: ${label} clean workflow दिखाता है. Real result देखिए.`
    },
    {
      framework: "one_screen_demo",
      onscreen_text: "One screen demo",
      voiceover: `Mujhe ek screen aur 30 seconds do; ${label} ka exact workflow clear ho jayega.`
    },
    {
      framework: "comment_bait_value",
      onscreen_text: "ये चाहिए?",
      voiceover: `Agar ${moment}, demo ke baad comment TOOL. Pehle ${label} in action dekho.`
    },
    {
      framework: "myth_buster",
      onscreen_text: "Long setup nahi",
      voiceover: `${topic} ke liye long setup nahi chahiye. ${label} open hai, real workflow dekho.`
    },
    {
      framework: "micro_tool_discovery",
      onscreen_text: "Tiny tool, real use",
      voiceover: `Tiny tool, real use case: ${label} tab help karta hai jab ${pain}. Save kar lo.`
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
      voiceover: `Ye risk tab hota hai jab ${pain}. Pehle ${label} workflow dekh lo.`
    },
    {
      framework: "save_for_later",
      onscreen_text: "Save before needed",
      voiceover: `Jab ${pain}, ${label} help karega. Abhi real demo dekh lo.`
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
    },
    {
      framework: "pov_relatable",
      onscreen_text: "POV: time save",
      voiceover: `POV: ${label} tab help karta hai jab ${moment}. Real demo dekho.`
    },
    {
      framework: "before_after_preview",
      onscreen_text: "Before vs after",
      voiceover: `Before: ${topic} messy lagta hai. After: ${label} clean workflow dikhata hai. Real result dekho.`
    },
    {
      framework: "one_screen_demo",
      onscreen_text: "One screen demo",
      voiceover: `Mujhe ek screen aur 30 seconds do; ${label} ka exact workflow clear ho jayega.`
    },
    {
      framework: "comment_bait_value",
      onscreen_text: "Ye chahiye?",
      voiceover: `Agar ${moment}, demo ke baad comment TOOL. Pehle ${label} in action dekho.`
    },
    {
      framework: "myth_buster",
      onscreen_text: "Long setup nahi",
      voiceover: `${topic} ke liye long setup nahi chahiye. ${label} open hai, real workflow dekho.`
    },
    {
      framework: "micro_tool_discovery",
      onscreen_text: "Tiny tool, real use",
      voiceover: `Tiny tool, real use case: ${label} tab help karta hai jab ${pain}. Save kar lo.`
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

  return hooks.map((hook) => {
    const normalizedHook = {
      ...hook,
      voiceover: limitViralWords(hook.voiceover, 24)
    };
    return {
      ...normalizedHook,
      hook_score: scoreViralHook(normalizedHook, row)
    };
  });
}

export function selectViralHook(row = {}, offset = 0) {
  const hooks = buildViralHookOptions(row);
  const seed = Number(row.source_row_number || row.row || 0) + hashText(viralToolName(row)) + Number(offset || 0);
  const ranked = hooks
    .map((hook, index) => ({ hook, index }))
    .sort((a, b) => (b.hook.hook_score?.score || 0) - (a.hook.hook_score?.score || 0) || a.index - b.index);
  const strong = ranked
    .filter((item) => (item.hook.hook_score?.score || 0) >= 74)
    .slice(0, 5)
    .map((item) => item.hook);
  const pool = strong.length ? strong : ranked.slice(0, 5).map((item) => item.hook);
  return pool[Math.abs(seed) % pool.length] || hooks[0];
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
  const brandedLabel = viralBrandToolLabel(row, language);
  const lines = language === "English" ? {
    hook: hook.voiceover,
    hook_intro: hook.voiceover,
    intro: `${label} is built for ${audience}. It ${benefit}.`,
    demo: `Now the real demo: ${toolUrl} is open. Add demo data, run the visible action, and review the result.`,
    demo_workflow: `The real demo is simple: open the link, add fictional input, run the action, then check the output.`,
    workflow: "Remember the three-step flow: input, run, review. This screen proof shows the value clearly.",
    workflow_output: "Do not use the output blindly. Check the summary, warnings, and next step; that is the save-worthy part.",
    proof_before_after: "Before: manual confusion. After: cleaner output, faster decision, and a safer review before sharing.",
    review_cta: `Review it once before sharing. If useful, save this, comment TOOL, and try ${brandedLabel}. Link is in the caption.`
  } : language === "Hindi" ? {
    hook: hook.voiceover,
    hook_intro: hook.voiceover,
    intro: `${label} ${audience} के लिए built है. ये ${benefit}.`,
    demo: `अब real demo: ${toolUrl} open है. Demo data add करो, visible action run करो, और result review करो.`,
    demo_workflow: `Real demo simple है: link open, fictional input, run action, फिर output check.`,
    workflow: "Three-step flow याद रखो: input, run, review. इसी screen proof से value clear दिखेगी.",
    workflow_output: "Output मिलते ही blindly use मत करो. Summary, warnings और next step check करो; यही save-worthy part है.",
    proof_before_after: "Before manual confusion. After clean output, faster decision, और share करने से पहले safer review.",
    review_cta: `Human review के बाद ही share करो. Useful लगा तो save, comment TOOL, और ${brandedLabel} try करो. Link caption में है.`
  } : {
    hook: hook.voiceover,
    hook_intro: hook.voiceover,
    intro: `${label} ${audience} ke liye built hai. Ye ${benefit}.`,
    demo: `Ab real demo: ${toolUrl} open hai. Demo data add karo, visible action run karo, aur result review karo.`,
    demo_workflow: `Real demo simple hai: link open, fictional input, run action, phir output check. Fake UI nahi.`,
    workflow: "Teen-step flow yaad rakho: input, run, review. Isi screen footage se user ko proof dikhega.",
    workflow_output: "Output milte hi blindly use mat karo. Summary, warnings aur next step check karo; ye save-worthy part hai.",
    proof_before_after: "Before manual confusion. After clear output, faster decision, aur share karne se pehle safer review.",
    review_cta: `Human review ke baad hi share karo. Useful laga to save, comment TOOL, aur ${brandedLabel} try karo. Link caption me hai.`
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
  const selectedHook = selectViralHook(row);
  const hookOptions = [
    selectedHook,
    ...buildViralHookOptions(row).filter((option) => option.framework !== selectedHook?.framework)
  ].filter(Boolean).slice(0, 8);
  const language = viralLanguage(row);
  const toolUrl = clean(row.tool_url || row.url, "");
  const brandedToolName = language === "English" ? `AltFTool's ${toolName}` : `AltFTool ka ${toolName}`;
  const caption = language === "English" ? [
    `${brandedToolName} real demo.`,
    `If ${topic} wastes your time, save this workflow.`,
    `Value: ${benefit}.`,
    "Test with fictional data, review the output, then use or share it.",
    "Comment \"TOOL\" if you want the next micro-tool demo.",
    toolUrl ? `Try ${brandedToolName}: ${toolUrl}` : ""
  ].join(" ") : language === "Hindi" ? [
    `${brandedToolName} real demo.`,
    `अगर ${topic} में time waste होता है, तो ये workflow save कर लो.`,
    `Value: ${benefit}.`,
    "Fictional data से test करो, output review करो, फिर use/share करो.",
    "Comment \"TOOL\" अगर next micro-tool demo चाहिए.",
    toolUrl ? `${brandedToolName} try करो: ${toolUrl}` : ""
  ].join(" ") : [
    `${brandedToolName} real demo.`,
    `Agar ${topic} me time waste hota hai, ye workflow save kar lo.`,
    `Value: ${benefit}.`,
    "Fictional data se test karo, output review karo, phir use/share karo.",
    "Comment \"TOOL\" agar next micro-tool demo chahiye.",
    toolUrl ? `${brandedToolName} try karo: ${toolUrl}` : ""
  ].join(" ");
  const baseHashtags = [
    "#AltFTool",
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
      "AltFTool",
      brandedToolName,
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
      ? "Save this workflow, comment TOOL, and try it from the AltFTool caption link."
      : language === "Hindi"
        ? "Is workflow ko save karo, comment TOOL, aur AltFTool caption link se try karo."
        : "Save this workflow, comment TOOL, aur AltFTool caption link se try karo.",
    onscreen_overlays: (plan.scenes || []).map((scene) => ({
      scene_number: scene.scene_number,
      text: scene.onscreen_text
    }))
  };
}
