import path from "node:path";
import fs from "node:fs/promises";
import dotenv from "dotenv";
import { parseArgs } from "./lib/args.mjs";
import { ensureDir, readJson, writeJson, writeText } from "./lib/fsx.mjs";

dotenv.config({ quiet: true });

const args = parseArgs(process.argv.slice(2));
const toolDir = args["tool-dir"] ? path.resolve(args["tool-dir"]) : null;
const spokenField = args["spoken-field"] || process.env.TRF_SPOKEN_FIELD || "voiceover_audio";
const voiceoverDir = args["voiceover-dir"]
  ? path.resolve(args["voiceover-dir"])
  : path.join(toolDir || process.cwd(), "voiceovers");
const overwrite = Boolean(args.overwrite);

if (!toolDir) {
  console.error("Missing --tool-dir.");
  console.error("Example: npm run voiceover:pack -- --tool-dir outputs/runs/.../tool-folder");
  process.exit(1);
}

function normalizeLine(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/\s+([।.!?,])/g, "$1")
    .trim();
}

function sceneLabel(index) {
  return `scene-${String(index + 1).padStart(2, "0")}`;
}

async function writeTextIfAllowed(filePath, content) {
  if (!overwrite) {
    const exists = await fs.access(filePath).then(() => true).catch(() => false);
    if (exists) {
      return { filePath, skipped: true };
    }
  }
  await writeText(filePath, content);
  return { filePath, skipped: false };
}

const scenePlanPath = path.join(toolDir, "scene-plan.json");
const scenePlan = await readJson(scenePlanPath);
const scenes = Array.isArray(scenePlan.scenes) ? scenePlan.scenes : [];

if (!scenes.length) {
  console.error(`No scenes found in ${scenePlanPath}`);
  process.exit(1);
}

await ensureDir(voiceoverDir);

const rows = [];
const writes = [];
for (const [index, scene] of scenes.entries()) {
  const label = sceneLabel(index);
  const spokenText = normalizeLine(scene?.[spokenField] || scene?.spoken_voiceover || scene?.voiceover);
  const captionText = normalizeLine(scene?.voiceover);
  const fileBase = path.join(voiceoverDir, label);

  rows.push({
    scene_number: index + 1,
    duration_seconds: scene.duration || scenePlan.metadata?.scene_duration_seconds || 10,
    recording_text: spokenText,
    caption_text: captionText,
    preferred_audio_file: `${label}.mp3`,
    supported_audio_files: [`${label}.mp3`, `${label}.wav`, `${label}.m4a`, `voiceover-scene-${index + 1}.mp3`]
  });

  writes.push(await writeTextIfAllowed(`${fileBase}.txt`, `${spokenText}\n`));
  writes.push(await writeTextIfAllowed(`${fileBase}.md`, [
    `# Scene ${index + 1} Voiceover`,
    "",
    "## Record This",
    spokenText,
    "",
    "## Caption Line",
    captionText,
    "",
    "## Save Audio As",
    `Preferred: \`${label}.mp3\``,
    `Also supported: \`${label}.wav\`, \`${label}.m4a\`, \`voiceover-scene-${index + 1}.mp3\``,
    ""
  ].join("\n")));
}

const recordingScript = [
  `# Recording Script - ${scenePlan.topic || path.basename(toolDir)}`,
  "",
  "Record each scene as a separate audio file. Natural human voice works best: phone voice memo, studio mic, CapCut voiceover, or any Hindi neural TTS export.",
  "",
  "Keep files in this same folder. The local renderer automatically uses these files before built-in AI/TTS voice.",
  "",
  ...rows.flatMap((row) => [
    `## Scene ${row.scene_number} (${row.duration_seconds}s)`,
    row.recording_text,
    "",
    `Save as: \`${row.preferred_audio_file}\``,
    ""
  ]),
  "## Re-render Command",
  "```bash",
  `npm run render:local -- --tool-dir "${toolDir}" --voiceover-dir "${voiceoverDir}"`,
  "```",
  ""
].join("\n");

const readme = [
  "# Human Voiceover Pack",
  "",
  "This folder is for replacing robotic built-in TTS with a real/natural voice.",
  "",
  "Supported names:",
  "- `scene-01.mp3`, `scene-02.mp3`, ...",
  "- `scene-01.wav`, `scene-02.wav`, ...",
  "- `scene-01.m4a`, `scene-02.m4a`, ...",
  "- `voiceover-scene-1.mp3`, `voiceover-scene-2.mp3`, ...",
  "",
  "Recommended flow:",
  "1. Open `recording-script.md`.",
  "2. Record every scene separately.",
  "3. Save the files in this folder using the exact scene names.",
  "4. Run the render command again.",
  "",
  "The renderer will use these files first. If a scene file is missing, it falls back to built-in TTS for that scene.",
  ""
].join("\n");

writes.push(await writeTextIfAllowed(path.join(voiceoverDir, "recording-script.md"), recordingScript));
writes.push(await writeTextIfAllowed(path.join(voiceoverDir, "README.md"), readme));
await writeJson(path.join(voiceoverDir, "voiceover-map.json"), {
  toolDir,
  scenePlanPath,
  spokenField,
  voiceoverDir,
  generatedAt: new Date().toISOString(),
  scenes: rows
});

console.log(`Voiceover pack ready: ${voiceoverDir}`);
console.log(`Recording script: ${path.join(voiceoverDir, "recording-script.md")}`);
console.log(`Scenes: ${rows.length}`);
const skipped = writes.filter((item) => item.skipped).length;
if (skipped) {
  console.log(`Skipped existing text files: ${skipped}. Add --overwrite to refresh them.`);
}
