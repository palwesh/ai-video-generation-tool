function clean(value, fallback) {
  const text = String(value || "").trim();
  return text || fallback;
}

function shortBenefit(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/[.。]+$/g, "")
    .trim();
}

export function generateFallbackScenePlan(row, captureSummary, config) {
  const toolName = clean(row.tool_name, "ye tool");
  const toolUrl = clean(row.tool_url, "provided Tool URL");
  const topic = clean(row.topic, toolName);
  const description = clean(row.description, "chhote repetitive kaam ko fast aur simple banata hai");
  const targetUser = shortBenefit(clean(row.target_user, "creators, freelancers aur small teams"));
  const benefit = shortBenefit(clean(row.main_benefit, description || "time save karna aur output ko better banana"));

  return {
    scenes: [
      {
        scene_number: 1,
        duration: 10,
        voiceover: `${topic} ke liye baar-baar manual checking kar rahe ho? Chhota task hai, par time aur focus dono leak kar deta hai.`,
        visual: "Creator/avatar at a clean desk compares messy repeated work with the captured real tool screen on a laptop.",
        onscreen_text: "Manual work slows you",
        video_prompt: "Create a 10-second 9:16 vertical video showing the same professional UGC creator/avatar at a modern desk with a laptop showing the real tool page reference. Use quick cuts from messy notes to the captured tool screen, visible cursor highlight, bold readable caption, clear Hinglish voiceover, subtle upbeat music, realistic daylight, and no fake UI."
      },
      {
        scene_number: 2,
        duration: 10,
        voiceover: `${toolName} ek focused micro tool hai for ${targetUser}. Goal simple hai: ${benefit}, bina heavy software ke.`,
        visual: "Same creator/avatar points at the captured homepage/tool screen while a phone records a reel-style behind-the-scenes shot.",
        onscreen_text: `${toolName}`,
        video_prompt: "Create a 10-second 9:16 vertical video showing the same professional UGC creator/avatar introducing the tool beside a laptop displaying the captured real tool page. Add a phone in the foreground recording the screen, large readable product title caption, clear Hinglish voiceover, subtle music, soft office lighting, and a slow side-to-side camera move. Do not invent UI."
      },
      {
        scene_number: 3,
        duration: 10,
        voiceover: `Ab real demo: ${toolUrl} open hai. Sirf fictional demo data use karo, visible controls follow karo, aur result review karo.`,
        visual: `Real screen recording opens ${toolUrl}, fills demo data or uploads a fictional sample file when supported, clicks a safe visible action, and shows the resulting screen.`,
        onscreen_text: "Real demo, no fake UI",
        video_prompt: `Create a 10-second 9:16 vertical video showing the actual Tool URL ${toolUrl} opened on a laptop or phone screen. Use the attached real screenshots or recording as the main screen content, show cursor highlights on visible controls, use fictional demo data only, and keep the UI readable. Include clear Hinglish voiceover and subtle upbeat music. Do not replace the tool with unrelated synthetic footage.`
      },
      {
        scene_number: 4,
        duration: 10,
        voiceover: `Workflow bas teen steps: input add karo, tool run karo, phir result ko check karke use karo. Simple, repeatable, fast.`,
        visual: "Tight edit of the captured tool interaction: input, click, wait, result. Use zooms and cursor rings on real page areas.",
        onscreen_text: "Input -> Run -> Review",
        video_prompt: "Create a 10-second 9:16 vertical video using the attached real screen recording or screenshots as the main laptop screen. Show a clean three-step workflow: demo input, visible action click, result review. Add cursor rings, quick zooms, clear Hinglish voiceover, subtle music, and mobile-readable captions. Do not invent any feature or UI."
      },
      {
        scene_number: 5,
        duration: 10,
        voiceover: `Result ke baad pause lo: kya change hua, kya risk bacha, aur next step kya hai. Yahi value proof hai.`,
        visual: "Captured result screen stays visible while an overlay builds a short checklist: Summary, Warnings, Next steps.",
        onscreen_text: "Result -> Next step",
        video_prompt: "Create a 10-second 9:16 vertical video showing the real captured result screen on a laptop, then overlay a clean checklist: Summary, Warning points, Next steps. Keep the screenshot readable, add cursor highlight, clear Hinglish voiceover, subtle music, crisp lighting, and no real personal information."
      },
      {
        scene_number: 6,
        duration: 10,
        voiceover: `Before: scattered tabs aur guesswork. After: clear screen, clear next step, aur faster decision. Yehi micro-tool ka win hai.`,
        visual: "Before-and-after layout using captured before and after screens, plus the same creator/avatar reacting with a quick confident nod.",
        onscreen_text: "Messy to clear",
        video_prompt: "Create a 10-second 9:16 vertical video with the same professional UGC creator/avatar and a real before-and-after comparison from the attached screenshots. Left side shows messy/manual state, right side shows clean tool/result state. Add a smooth push-in, cursor highlight, clear Hinglish voiceover, subtle music, and professional SaaS/UGC styling."
      },
      {
        scene_number: 7,
        duration: 10,
        voiceover: `Publish se pehle final human review zaroor. Tool speed deta hai, lekin judgement aapka. Test karo, then share smartly.`,
        visual: "Same creator/avatar reviews the captured output, checks a note, and prepares an Instagram draft without pressing publish.",
        onscreen_text: "Review before posting",
        video_prompt: "Create a 10-second 9:16 vertical video showing the same professional UGC creator/avatar reviewing the captured final output on a laptop, checking one short note, then preparing an Instagram draft on a phone without publishing. Include clear Hinglish voiceover, subtle music, realistic warm desk lighting, cursor visible on laptop, and clean safety reminder captions."
      }
    ],
    metadata: {
      generator: "local_fallback",
      capture_summary: captureSummary || null,
      language: row.language || config.language || "Hinglish"
    }
  };
}
