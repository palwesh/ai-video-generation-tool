import { resolveReelConfig, roleForScene } from "./reel-planner.mjs";
import {
  normalizeViralLanguage,
  viralBenefitLine,
  viralOnscreenTextForRole,
  viralVoiceoverForRole
} from "./viral-script.mjs";

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
  const clipped = words.slice(0, maxWords).join(" ").replace(/[,;:]+$/g, "");
  return `${clipped}.`;
}

function roleScene(roleId, context) {
  const { row, toolName, toolUrl, targetUser, benefit, language } = context;

  const scenes = {
    hook: {
      voiceover: viralVoiceoverForRole("hook", row),
      visual: "Creator/avatar opens with a scroll-stopping line, then quickly reveals the real captured tool screen on a laptop.",
      onscreen_text: viralOnscreenTextForRole("hook", row),
      video_prompt: `Create a 10-second 9:16 vertical video showing the same professional UGC creator/avatar at a modern desk noticing a repetitive manual task, then revealing a laptop with the real captured tool page. Use fast cuts, slight push-in camera move, cursor highlight on screen, bold readable caption, clear ${language} voiceover, subtle upbeat music, realistic daylight, and no fake UI.`
    },
    hook_intro: {
      voiceover: viralVoiceoverForRole("hook_intro", row),
      visual: "Creator/avatar uses a curiosity hook, shows the pain point, and immediately reveals the actual tool screen on a laptop and phone setup.",
      onscreen_text: viralOnscreenTextForRole("hook_intro", row),
      video_prompt: `Create a 10-second 9:16 vertical video showing the same professional UGC creator/avatar opening with a specific manual-work pain point, then revealing the real captured tool page on a laptop. Add a phone recording angle, cursor highlight, clean ${language} captions, subtle music, soft office lighting, and no invented UI.`
    },
    intro: {
      voiceover: viralVoiceoverForRole("intro", row, { fallback: `${toolName} ek focused micro tool hai for ${targetUser}. Goal simple hai: ${benefit}, bina heavy setup ke.` }),
      visual: "Same creator/avatar introduces the micro tool beside a laptop and phone setup while the actual tool page stays visible.",
      onscreen_text: viralOnscreenTextForRole("intro", row),
      video_prompt: `Create a 10-second 9:16 vertical video showing the same professional UGC creator/avatar introducing the tool beside a laptop displaying the captured real tool page. Add a phone in the foreground recording the screen, large readable product title caption, clear ${language} voiceover, subtle music, soft office lighting, and a slow side-to-side camera move. Do not invent UI.`
    },
    demo: {
      voiceover: viralVoiceoverForRole("demo", row),
      visual: `Real screen recording opens ${toolUrl}, uses fictional/demo data only, clicks a safe visible action, and shows the result screen.`,
      onscreen_text: viralOnscreenTextForRole("demo", row),
      video_prompt: `Create a 10-second 9:16 vertical video showing the actual Tool URL ${toolUrl} opened on a laptop or phone screen. Use the attached real screenshots or recording as the main screen content, show cursor highlights on visible controls, use fictional demo data only, and keep the UI readable. Include clear ${language} voiceover and subtle upbeat music. Do not replace the tool with unrelated synthetic footage.`
    },
    demo_workflow: {
      voiceover: viralVoiceoverForRole("demo_workflow", row),
      visual: `Captured recording shows ${toolUrl}, demo input, visible action, and the reviewable result in one clean flow.`,
      onscreen_text: viralOnscreenTextForRole("demo_workflow", row),
      video_prompt: `Create a 10-second 9:16 vertical video showing the actual Tool URL ${toolUrl} with the real captured screen recording as the main laptop screen. Show fictional input, visible action click, and result review with cursor rings and tight zooms. Use clear ${language} voiceover, subtle music, realistic desk lighting, and no fake UI.`
    },
    workflow: {
      voiceover: viralVoiceoverForRole("workflow", row),
      visual: "Tight edit of captured tool interaction: input, click, wait, result. Use zooms and cursor rings on real page areas.",
      onscreen_text: viralOnscreenTextForRole("workflow", row),
      video_prompt: `Create a 10-second 9:16 vertical video using the attached real screen recording or screenshots as the main laptop screen. Show a clean three-step workflow: demo input, visible action click, result review. Add cursor rings, quick zooms, clear ${language} voiceover, subtle music, and mobile-readable captions. Do not invent any feature or UI.`
    },
    workflow_output: {
      voiceover: viralVoiceoverForRole("workflow_output", row),
      visual: "Captured workflow and result screen stay readable while overlays call out Summary, Warnings, and Next step.",
      onscreen_text: viralOnscreenTextForRole("workflow_output", row),
      video_prompt: `Create a 10-second 9:16 vertical video showing the real captured tool workflow and result screen on a laptop. Overlay a clean checklist: Summary, Warning points, Next step. Keep the screenshot readable, add cursor highlight, clear ${language} voiceover, subtle upbeat music, crisp lighting, and no real personal information.`
    },
    proof_before_after: {
      voiceover: viralVoiceoverForRole("proof_before_after", row),
      visual: "Before-and-after layout using captured before and after screens, plus the same creator/avatar reacting with a confident nod.",
      onscreen_text: viralOnscreenTextForRole("proof_before_after", row),
      video_prompt: `Create a 10-second 9:16 vertical video with the same professional UGC creator/avatar and a real before-and-after comparison from the attached screenshots. Left side shows messy/manual state, right side shows clean tool/result state. Add a smooth push-in, cursor highlight, clear ${language} voiceover, subtle music, and professional SaaS/UGC styling.`
    },
    review_cta: {
      voiceover: viralVoiceoverForRole("review_cta", row),
      visual: "Same creator/avatar reviews the final output, checks a short safety note, and prepares an Instagram draft without pressing publish.",
      onscreen_text: viralOnscreenTextForRole("review_cta", row),
      video_prompt: `Create a 10-second 9:16 vertical video showing the same professional UGC creator/avatar reviewing the captured final output on a laptop, checking one safety note, then preparing an Instagram draft on a phone without publishing. Include clear ${language} voiceover, subtle music, realistic warm desk lighting, cursor visible on laptop, bold save/share CTA caption, and a professional safety reminder.`
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
  const benefit = shortBenefit(clean(row.main_benefit, description || viralBenefitLine(row)));
  const language = normalizeViralLanguage(row.script_language || row.scriptLanguage || row.language || config.language || "Hinglish");
  const context = { row, toolName, toolUrl, topic, targetUser, benefit, language };

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
      language,
      scene_count: reelConfig.sceneCount,
      scene_duration_seconds: reelConfig.sceneDurationSeconds,
      total_duration_seconds: reelConfig.totalDurationSeconds
    }
  };
}
