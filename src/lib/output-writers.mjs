import path from "node:path";
import { ensureDir, writeJson, writeText } from "./fsx.mjs";

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
  const hookOptions = scenePlan.metadata?.script_package?.hook_options || [];
  const caption = [
    `# ${toolName} Reel Post Copy`,
    "",
    "## Caption",
    "",
    `${toolName} ko use karke repetitive kaam fast karo, output review karo, aur publish/share karne se pehle human check zaroor rakho.`,
    "",
    "## Hook Options",
    "",
    ...(hookOptions.length
      ? hookOptions.slice(0, 5).map((hook, index) => `${index + 1}. ${hook.voiceover}`)
      : [
        `1. ${scenePlan.scenes[0].voiceover}`,
        "2. Stop wasting time on this tiny manual task.",
        "3. Ye micro tool daily workflow me real time save kar sakta hai."
      ]),
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

export async function writeAssetBrief(runDir, row, capture = {}) {
  const files = Array.isArray(capture.files) ? capture.files : [];
  const lines = [
    `# Asset Brief - ${row.tool_name || row.topic || "Tool Reel"}`,
    "",
    "## Tool",
    "",
    `- Name: ${row.tool_name || row.topic || ""}`,
    `- URL: ${row.tool_url || ""}`,
    `- Description: ${row.description || ""}`,
    "",
    "## Capture Strategy",
    "",
    "- Open the actual tool link before scripting.",
    "- Use only fictional/demo data.",
    "- Prefer captured screenshots and screen recordings for demo/workflow/output scenes.",
    "- Avoid fake UI or unsupported feature claims.",
    "",
    "## Captured Files",
    "",
    files.length
      ? files.map((file) => `- ${file}`).join("\n")
      : "- No capture files available in this run.",
    "",
    "## Capture Summary",
    "",
    capture.summary || "No capture summary available."
  ].join("\n");
  const filePath = path.join(runDir, "asset-brief.md");
  await writeText(filePath, `${lines}\n`);
  return filePath;
}

export async function writeReelScriptPackage(runDir, scriptPackage = {}) {
  const jsonPath = path.join(runDir, "reel-script.json");
  const mdPath = path.join(runDir, "reel-script.md");
  await writeJson(jsonPath, scriptPackage);
  const md = [
    `# Reel Script - ${scriptPackage.tool_name || "Tool Reel"}`,
    "",
    `Duration: ${scriptPackage.total_duration_seconds || ""} seconds`,
    `Scenes: ${scriptPackage.scene_count || ""}`,
    "",
    "## Hook",
    "",
    scriptPackage.hook || "",
    "",
    "## Body",
    "",
    scriptPackage.body || "",
    "",
    "## CTA",
    "",
    scriptPackage.cta || "",
    "",
    "## Hook Options",
    "",
    ...((scriptPackage.hook_options || []).length
      ? scriptPackage.hook_options.map((hook, index) => `${index + 1}. ${hook.voiceover} (${hook.framework})`)
      : ["No alternate hooks generated."]),
    "",
    "## Engagement CTA",
    "",
    scriptPackage.engagement_cta || "Save this workflow, comment TOOL, and share with someone who needs this.",
    "",
    "## Scene Script",
    "",
    scriptPackage.final_script || "",
    "",
    "## Retention Notes",
    "",
    ...(scriptPackage.retention_notes || []).map((note) => `- ${note}`)
  ].join("\n");
  await writeText(mdPath, `${md}\n`);
  return { jsonPath, mdPath };
}

export async function writeVidsGeneratedSceneFolders(runDir, scenePlan) {
  const root = path.join(runDir, "vids-generated-scenes");
  await ensureDir(root);
  const scenes = Array.isArray(scenePlan?.scenes) ? scenePlan.scenes : [];

  await writeText(path.join(root, "README.md"), [
    "# Vids Generated Scenes",
    "",
    "Use this folder to keep Google Vids generated scene clips and scene-level proof assets together.",
    "",
    "Recommended file names inside each scene folder:",
    "",
    "- google-vids-scene.mp4",
    "- avatar-scene.mp4",
    "- prompt.txt",
    "- notes.md",
    "",
    "If a clip should be reused by the local final editor, also copy it to `../vids-clips/` with a name like `scene-01.mp4`.",
    ""
  ].join("\n"));

  for (const scene of scenes) {
    const sceneNumber = String(scene.scene_number).padStart(2, "0");
    const sceneDir = path.join(root, `scene-${sceneNumber}`);
    await ensureDir(sceneDir);
    await writeText(path.join(sceneDir, "prompt.txt"), `${scene.video_prompt}\n`);
    await writeText(path.join(sceneDir, "notes.md"), [
      `# Scene ${sceneNumber}`,
      "",
      `Duration: ${scene.duration}s`,
      "",
      "## Voiceover",
      "",
      scene.voiceover,
      "",
      "## On-Screen Caption",
      "",
      scene.onscreen_text,
      "",
      "## Visual",
      "",
      scene.visual,
      ""
    ].join("\n"));
  }

  return root;
}

export async function writeRunManifest(runDir, data) {
  const filePath = path.join(runDir, "manifest.json");
  await writeJson(filePath, data);
  return filePath;
}
