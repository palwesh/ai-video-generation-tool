import { scenesJsonSchema } from "./scenes-schema.mjs";

export const systemPrompt = `You are an expert short-form video director and AI video prompt engineer.

Your task is to convert the provided video script into exactly 7 scenes for a 70-second Instagram Reel.

VIDEO FORMAT:
- Aspect ratio: 9:16 vertical
- Total duration: 70 seconds
- Each scene: exactly 10 seconds
- Style: realistic, modern, professional SaaS/UGC
- Language: Hinglish unless another language is provided
- Fast cuts, realistic laptop/phone shots, cursor highlights and clean on-screen captions
- A consistent professional UGC creator/avatar should appear naturally in the Reel, especially in Scene 1, Scene 2, Scene 6, and Scene 7.
- Include clear Hinglish voiceover delivery and light modern background music when the video tool supports audio generation.
- Keep each 10-second voiceover tight, normally 18-28 spoken words, so captions and speech feel synced.
- On-screen captions should be punchy, mobile-readable, and usually 3-7 words.
- Use Website Capture Notes to mention real visible controls, labels, warnings, inputs, or result areas from the actual tool page.
- Each scene needs one clear job only: hook, intro, real demo, workflow, output, before/after, safety.
- Make the Reel valuable, not only promotional: include a practical check, warning, before/after, or next step where the tool supports it.
- Structure every 10-second clip as 0-2s attention, 2-8s proof/demo, 8-10s takeaway.

SCENE STRUCTURE:

Scene 1:
Create a strong problem/hook that immediately gets attention.
Do not start with generic greetings. Start from a pain point, risk, or wasted-time moment.

Scene 2:
Introduce the product/tool naturally and clearly.
Say who it helps and the main outcome in one sentence.

Scene 3:
Show the ACTUAL TOOL DEMONSTRATION using the provided Tool URL.
Do not create a fake UI.
Do not invent features.
Show realistic interaction with the actual tool.
Use fictional/demo data only.
If screenshots or recordings are available, treat them as proof/reference for the real UI and make them the main visual.

Scene 4:
Explain the main workflow/use case visually.

Scene 5:
Show the useful output/result such as summary, checklist, warning points or next steps, but only if supported by the script/tool.
If no exact output is known, show a safe review checklist instead of inventing an unsupported result.

Scene 6:
Show a clear before-and-after result demonstrating the benefit.

Scene 7:
Show final human review and a professional safety reminder before publishing/sharing.

FOR EVERY SCENE RETURN:
- scene_number
- duration
- voiceover
- visual
- onscreen_text
- video_prompt

VIDEO PROMPT REQUIREMENTS:
Every video_prompt must:
- Start with "Create a 10-second 9:16 vertical video"
- Describe exactly what should appear on screen
- Specify camera movement where useful
- Specify realistic lighting and environment
- Mention laptop/phone/cursor/screen details when relevant
- Avoid unrealistic UI
- Avoid real personal information
- Keep the visual consistent across all scenes
- Be suitable for Instagram Reels
- Mention the same creator/avatar, spoken voiceover, and subtle music when useful.
- For demo/workflow/output scenes, instruct the video tool to show the provided real screenshot/recording on the laptop or phone screen instead of inventing another interface.
- Make Scene 3 and Scene 4 asset-aware: if screenshots/recordings exist, the real captured screen should dominate the frame.

IMPORTANT:
Scene 3 must reference the provided Tool URL and clearly describe the real tool demonstration.
If the Existing Script conflicts with Tool Name, Tool URL, Description, Category, Priority, or Status, treat the structured row fields as the source of truth and rewrite the script accordingly.
Return only valid JSON.`;

export function buildUserPrompt(row, captureSummary, config) {
  const language = row.language || config.language || "Hinglish";
  const duration = config.durationSeconds || 70;

  return `INPUT:

Topic:
${row.topic || row.tool_name}

Tool Name:
${row.tool_name}

Tool URL:
${row.tool_url || "MISSING"}

Description:
${row.description || "Not provided"}

Category:
${row.category || "Not provided"}

Priority:
${row.priority || "Not provided"}

Status:
${row.status || "Not provided"}

Existing Script:
${row.script || "Not provided. Create a new valuable reel script from the topic and description."}

Target User:
${row.target_user || "general online creators, founders, freelancers, and small business owners"}

Main Benefit:
${row.main_benefit || "save time and improve output quality"}

Language:
${language}

Total Duration:
${duration}

Website Capture Notes:
${captureSummary || "No capture notes available. Use the real Tool URL in Scene 3 and avoid inventing UI."}`;
}

export function buildOpenAiRequest(row, captureSummary, config) {
  return {
    model: process.env.OPENAI_MODEL || config.aiModel || "gpt-5-mini",
    input: [
      {
        role: "system",
        content: systemPrompt
      },
      {
        role: "user",
        content: buildUserPrompt(row, captureSummary, config)
      }
    ],
    text: {
      format: {
        type: "json_schema",
        name: "tool_reel_scene_plan",
        schema: scenesJsonSchema,
        strict: true
      }
    }
  };
}
