import { buildScenesJsonSchema } from "./scenes-schema.mjs";
import { resolveReelConfig, roleForScene, sceneNumbers } from "./reel-planner.mjs";

function sceneStructureLines(sceneCount) {
  return sceneNumbers(sceneCount)
    .map((sceneNumber) => {
      const role = roleForScene(sceneNumber, sceneCount);
      return `Scene ${sceneNumber}: ${role.intent}. ${role.promptRole}.`;
    })
    .join("\n");
}

export function buildSystemPrompt(reelConfig) {
  const sceneCount = reelConfig.sceneCount;
  const totalDuration = reelConfig.totalDurationSeconds;

  return `You are an expert short-form video director, Instagram retention editor, and AI video prompt engineer.

Your task is to convert the provided tool details and script into exactly ${sceneCount} scenes for a ${totalDuration}-second Instagram Reel.

VIDEO FORMAT:
- Aspect ratio: 9:16 vertical
- Total duration: ${totalDuration} seconds
- Each scene: exactly 10 seconds
- Style: realistic, modern, professional SaaS/UGC
- Language: Hinglish unless another language is provided
- Fast cuts, realistic laptop/phone shots, cursor highlights and clean on-screen captions
- A consistent professional UGC creator/avatar should appear naturally in the Reel, especially in hook, intro, proof, and CTA scenes.
- Include clear Hinglish voiceover delivery and light modern background music when the video tool supports audio generation.
- Keep each 10-second voiceover tight, normally 16-24 spoken words, so captions and speech feel synced.
- On-screen captions should be punchy, mobile-readable, and usually 3-7 words.
- Use Website Capture Notes to mention real visible controls, labels, warnings, inputs, or result areas from the actual tool page.
- Each scene needs one clear retention job only.
- Make the Reel valuable, not only promotional: include a practical check, warning, before/after, or next step where the tool supports it.
- Structure every 10-second clip as 0-2s attention, 2-8s proof/demo, 8-10s takeaway.
- Rewrite the script before scene planning into a compact Hook-Body-CTA arc:
  Hook: specific pain, risk, wasted time, or curiosity gap.
  Body: show the actual tool and useful workflow with proof from capture assets.
  CTA: save/share/follow style prompt plus human review/safety reminder.
- Avoid long explanations. The final spoken script must fit ${totalDuration} seconds.

SCENE STRUCTURE:

${sceneStructureLines(sceneCount)}

For any demo/workflow/output scene:
- Show the ACTUAL TOOL DEMONSTRATION using the provided Tool URL.
- Do not create a fake UI.
- Do not invent features.
- Show realistic interaction with the actual tool.
- Use fictional/demo data only.
- If screenshots or recordings are available, treat them as proof/reference for the real UI and make them the main visual.

For the final scene:
- End with final human review, a professional safety reminder, and a natural CTA such as save/share/follow.

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
The main demo scene must reference the provided Tool URL and clearly describe the real tool demonstration.
If the Existing Script conflicts with Tool Name, Tool URL, Description, Category, Priority, or Status, treat the structured row fields as the source of truth and rewrite the script accordingly.
Return only valid JSON.`;
}

export function buildUserPrompt(row, captureSummary, config) {
  const language = row.language || config.language || "Hinglish";
  const reelConfig = resolveReelConfig(config);

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
${reelConfig.totalDurationSeconds}

Scene Count:
${reelConfig.sceneCount}

Script Goal:
Prepare a high-retention Instagram Reel script between ${reelConfig.minDurationSeconds} and ${reelConfig.maxDurationSeconds} seconds. Prioritize hook, real demo proof, useful workflow, before/after value, human review, and CTA.

Website Capture Notes:
${captureSummary || "No capture notes available. Use the real Tool URL in Scene 3 and avoid inventing UI."}`;
}

export function buildOpenAiRequest(row, captureSummary, config) {
  const reelConfig = resolveReelConfig(config);
  return {
    model: process.env.OPENAI_MODEL || config.aiModel || "gpt-5-mini",
    input: [
      {
        role: "system",
        content: buildSystemPrompt(reelConfig)
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
        schema: buildScenesJsonSchema(reelConfig.sceneCount),
        strict: true
      }
    }
  };
}

export function buildGeminiRequest(row, captureSummary, config) {
  const reelConfig = resolveReelConfig(config);
  return {
    systemInstruction: {
      parts: [{ text: buildSystemPrompt(reelConfig) }]
    },
    contents: [
      {
        role: "user",
        parts: [{ text: buildUserPrompt(row, captureSummary, config) }]
      }
    ],
    generationConfig: {
      responseMimeType: "application/json"
    }
  };
}
