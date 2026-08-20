import path from "node:path";
import { writeJson, writeText } from "./fsx.mjs";

function csvEscape(value) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export async function writeGoogleVidsPrompts(runDir, scenePlan) {
  const rows = [
    ["scene_number", "duration", "voiceover", "onscreen_text", "video_prompt"]
  ];

  for (const scene of scenePlan.scenes) {
    rows.push([
      scene.scene_number,
      scene.duration,
      scene.voiceover,
      scene.onscreen_text,
      scene.video_prompt
    ]);
  }

  const csv = `${rows.map((row) => row.map(csvEscape).join(",")).join("\n")}\n`;
  const filePath = path.join(runDir, "google-vids-prompts.csv");
  await writeText(filePath, csv);
  return filePath;
}

export async function writePostCopy(runDir, row, scenePlan) {
  const toolName = row.tool_name || row.topic || "Ye tool";
  const caption = [
    `# ${toolName} Reel Post Copy`,
    "",
    "## Caption",
    "",
    `${toolName} ko use karke repetitive kaam fast karo, output review karo, aur publish/share karne se pehle human check zaroor rakho.`,
    "",
    "## Hook Options",
    "",
    `1. ${scenePlan.scenes[0].onscreen_text}`,
    `2. Stop wasting time on this tiny manual task.`,
    `3. Ye micro tool daily workflow me real time save kar sakta hai.`,
    "",
    "## Hashtags",
    "",
    "#aitools #saas #productivity #smallbusiness #freelancertools #reelsindia #hinglishreels #workflowautomation",
    "",
    "## Publishing Reminder",
    "",
    "Final output ko publish/share karne se pehle manually verify karna hai. Real customer data use nahi karna."
  ].join("\n");

  const filePath = path.join(runDir, "post-copy.md");
  await writeText(filePath, `${caption}\n`);
  return filePath;
}

export async function writeRunManifest(runDir, data) {
  const filePath = path.join(runDir, "manifest.json");
  await writeJson(filePath, data);
  return filePath;
}
