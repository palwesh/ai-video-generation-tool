import { resolveReelConfig, roleForScene } from "./reel-planner.mjs";

function clean(value, fallback) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text || fallback;
}

function shortBenefit(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/[.。]+$/g, "")
    .trim();
}

function limitWords(value, maxWords = 24) {
  const words = clean(value, "").split(" ").filter(Boolean);
  if (words.length <= maxWords) {
    return words.join(" ");
  }
  return `${words.slice(0, maxWords).join(" ")}.`;
}

function roleScene(roleId, context) {
  const { toolName, toolUrl, topic, targetUser, benefit } = context;

  const scenes = {
    hook: {
      voiceover: `Agar ${topic} abhi manual kar rahe ho, aap time ke saath trust bhi risk kar rahe ho. Ye quick fix dekho.`,
      visual: "Creator/avatar at a clean desk reacts to repeated manual work, then turns to the captured real tool screen on a laptop.",
      onscreen_text: "Manual work? Stop.",
      video_prompt: "Create a 10-second 9:16 vertical video showing the same professional UGC creator/avatar at a modern desk noticing a repetitive manual task, then revealing a laptop with the real captured tool page. Use fast cuts, slight push-in camera move, cursor highlight on screen, bold readable caption, clear Hinglish voiceover, subtle upbeat music, realistic daylight, and no fake UI."
    },
    hook_intro: {
      voiceover: `Ye ${topic} ka manual step chhota lagta hai, par time khata hai. ${toolName} isko faster aur cleaner banata hai.`,
      visual: "Creator/avatar shows the pain point and immediately reveals the actual tool screen on a laptop and phone setup.",
      onscreen_text: "Faster in one tool",
      video_prompt: "Create a 10-second 9:16 vertical video showing the same professional UGC creator/avatar opening with a specific manual-work pain point, then revealing the real captured tool page on a laptop. Add a phone recording angle, cursor highlight, clean Hinglish captions, subtle music, soft office lighting, and no invented UI."
    },
    intro: {
      voiceover: `${toolName} ek focused micro tool hai for ${targetUser}. Goal simple hai: ${benefit}, bina heavy setup ke.`,
      visual: "Same creator/avatar introduces the micro tool beside a laptop and phone setup while the actual tool page stays visible.",
      onscreen_text: toolName,
      video_prompt: "Create a 10-second 9:16 vertical video showing the same professional UGC creator/avatar introducing the tool beside a laptop displaying the captured real tool page. Add a phone in the foreground recording the screen, large readable product title caption, clear Hinglish voiceover, subtle music, soft office lighting, and a slow side-to-side camera move. Do not invent UI."
    },
    demo: {
      voiceover: `Ab real demo: ${toolUrl} open hai. Fictional data add karo, visible action run karo, aur result carefully review karo.`,
      visual: `Real screen recording opens ${toolUrl}, uses fictional/demo data only, clicks a safe visible action, and shows the result screen.`,
      onscreen_text: "Real demo, no fake UI",
      video_prompt: `Create a 10-second 9:16 vertical video showing the actual Tool URL ${toolUrl} opened on a laptop or phone screen. Use the attached real screenshots or recording as the main screen content, show cursor highlights on visible controls, use fictional demo data only, and keep the UI readable. Include clear Hinglish voiceover and subtle upbeat music. Do not replace the tool with unrelated synthetic footage.`
    },
    demo_workflow: {
      voiceover: `Ab demo dekho: ${toolUrl} open karo, fictional input add karo, run karo, aur output ko action ke hisaab se review karo.`,
      visual: `Captured recording shows ${toolUrl}, demo input, visible action, and the reviewable result in one clean flow.`,
      onscreen_text: "Demo -> result",
      video_prompt: `Create a 10-second 9:16 vertical video showing the actual Tool URL ${toolUrl} with the real captured screen recording as the main laptop screen. Show fictional input, visible action click, and result review with cursor rings and tight zooms. Use clear Hinglish voiceover, subtle music, realistic desk lighting, and no fake UI.`
    },
    workflow: {
      voiceover: "Workflow bas teen steps: input add karo, tool run karo, phir result check karo. Ye repeatable flow time save karta hai.",
      visual: "Tight edit of captured tool interaction: input, click, wait, result. Use zooms and cursor rings on real page areas.",
      onscreen_text: "Input -> Run -> Review",
      video_prompt: "Create a 10-second 9:16 vertical video using the attached real screen recording or screenshots as the main laptop screen. Show a clean three-step workflow: demo input, visible action click, result review. Add cursor rings, quick zooms, clear Hinglish voiceover, subtle music, and mobile-readable captions. Do not invent any feature or UI."
    },
    workflow_output: {
      voiceover: "Run ke baad output ko blindly mat use karo. Summary, warning points, aur next step check karo; wahi real value hai.",
      visual: "Captured workflow and result screen stay readable while overlays call out Summary, Warnings, and Next step.",
      onscreen_text: "Check before use",
      video_prompt: "Create a 10-second 9:16 vertical video showing the real captured tool workflow and result screen on a laptop. Overlay a clean checklist: Summary, Warning points, Next step. Keep the screenshot readable, add cursor highlight, clear Hinglish voiceover, subtle upbeat music, crisp lighting, and no real personal information."
    },
    proof_before_after: {
      voiceover: "Before: scattered checks aur guesswork. After: clear screen, clear next step, faster decision. Yehi micro-tool ka win hai.",
      visual: "Before-and-after layout using captured before and after screens, plus the same creator/avatar reacting with a confident nod.",
      onscreen_text: "Messy to clear",
      video_prompt: "Create a 10-second 9:16 vertical video with the same professional UGC creator/avatar and a real before-and-after comparison from the attached screenshots. Left side shows messy/manual state, right side shows clean tool/result state. Add a smooth push-in, cursor highlight, clear Hinglish voiceover, subtle music, and professional SaaS/UGC styling."
    },
    review_cta: {
      voiceover: "Final share se pehle human review zaroor. Agar useful laga, save karo aur next micro tool ke liye follow kar lo.",
      visual: "Same creator/avatar reviews the final output, checks a short safety note, and prepares an Instagram draft without pressing publish.",
      onscreen_text: "Save this workflow",
      video_prompt: "Create a 10-second 9:16 vertical video showing the same professional UGC creator/avatar reviewing the captured final output on a laptop, checking one safety note, then preparing an Instagram draft on a phone without publishing. Include clear Hinglish voiceover, subtle music, realistic warm desk lighting, cursor visible on laptop, bold save/share CTA caption, and a professional safety reminder."
    }
  };

  return scenes[roleId] || scenes.review_cta;
}

export function generateFallbackScenePlan(row, captureSummary, config) {
  const reelConfig = resolveReelConfig(config);
  const toolName = clean(row.tool_name, "ye tool");
  const toolUrl = clean(row.tool_url, "provided Tool URL");
  const topic = clean(row.topic, toolName);
  const description = clean(row.description, "chhote repetitive kaam ko fast aur simple banata hai");
  const targetUser = shortBenefit(clean(row.target_user, "creators, freelancers aur small teams"));
  const benefit = shortBenefit(clean(row.main_benefit, description || "time save karna aur output ko better banana"));
  const context = { toolName, toolUrl, topic, targetUser, benefit };

  const scenes = Array.from({ length: reelConfig.sceneCount }, (_, index) => {
    const sceneNumber = index + 1;
    const role = roleForScene(sceneNumber, reelConfig.sceneCount);
    const scene = roleScene(role.id, context);
    return {
      scene_number: sceneNumber,
      duration: reelConfig.sceneDurationSeconds,
      voiceover: limitWords(scene.voiceover, 24),
      visual: scene.visual,
      onscreen_text: scene.onscreen_text,
      video_prompt: scene.video_prompt
    };
  });

  return {
    scenes,
    metadata: {
      generator: "local_fallback",
      capture_summary: captureSummary || null,
      language: row.language || config.language || "Hinglish",
      scene_count: reelConfig.sceneCount,
      scene_duration_seconds: reelConfig.sceneDurationSeconds,
      total_duration_seconds: reelConfig.totalDurationSeconds
    }
  };
}
