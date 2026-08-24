import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

const rootDir = process.cwd();
const publicDir = path.join(rootDir, "public", "instagram", "altftool_dual_avatar_intro");
const audioDir = path.join(publicDir, "audio");
const outputDir = path.join(rootDir, "outputs", "instagram", "altftool_dual_avatar_intro");

const scenes = [
  "Stop scrolling. Agar useful online tools dhundte dhundte time waste ho raha hai, AltFTool ko abhi save kar lo.",
  "AltFTool par PDF, privacy, salary slip, AI text, editing aur productivity ke micro tools ek jagah milte hain.",
  "AltFTool dot com try karo, link caption me hai. Follow altftools review for daily real tool demos, aur reel save kar lo."
];

const caption = `Useful online tools chahiye? AltFTool save kar lo.

AltFTool par PDF, privacy, salary slip, AI text, editing aur productivity ke micro tools ek jagah milte hain.

Try now: https://www.altftool.com/

Follow @altftools_review for daily real tool demos.

#altftool #altftools_review #aitools #webtools #productivitytools #freetools #microtools #dailytools #smartwork #digitaltools`;

function runCommand(label, command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => {
      reject(new Error(`${label} failed: ${error.message}`));
    });
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${label} exited with ${code}: ${stderr.trim()}`));
    });
  });
}

async function pythonWithEdgeTts() {
  const candidates = [
    path.join(rootDir, ".venv", "bin", "python"),
    "python3"
  ];
  for (const candidate of candidates) {
    try {
      await runCommand("edge-tts import check", candidate, ["-c", "import edge_tts"]);
      return candidate;
    } catch {
      // Continue looking.
    }
  }
  throw new Error("edge-tts is not installed. Run setup first, then retry.");
}

async function buildVoiceover(pythonExecutable, text, index) {
  const token = String(index + 1).padStart(2, "0");
  const voice = index === 1 ? "en-IN-PrabhatNeural" : "hi-IN-SwaraNeural";
  const rate = index === 1 ? "+7%" : "+8%";
  await runCommand(`edge voice scene ${token}`, pythonExecutable, [
    "-m",
    "edge_tts",
    "--voice",
    voice,
    "--rate",
    rate,
    "--text",
    text,
    "--write-media",
    path.join(audioDir, `scene-${token}.mp3`)
  ]);
}

async function main() {
  await fs.mkdir(audioDir, { recursive: true });
  await fs.mkdir(outputDir, { recursive: true });

  const oldAudio = await fs.readdir(audioDir).catch(() => []);
  await Promise.all(oldAudio
    .filter((fileName) => /^scene-\d+\.mp3$/i.test(fileName))
    .map((fileName) => fs.rm(path.join(audioDir, fileName), { force: true })));

  const pythonExecutable = await pythonWithEdgeTts();
  for (let index = 0; index < scenes.length; index += 1) {
    await buildVoiceover(pythonExecutable, scenes[index], index);
  }

  await fs.writeFile(path.join(outputDir, "script.txt"), scenes.map((line, index) => `Scene ${index + 1}: ${line}`).join("\n"), "utf8");
  await fs.writeFile(path.join(outputDir, "caption.txt"), caption, "utf8");
  await fs.writeFile(path.join(outputDir, "README.md"), [
    "# AltFTool Dual Avatar Intro Reel",
    "",
    "- Composition: AltFToolDualAvatarIntroReel",
    "- Format: 1080x1920 vertical",
    "- Duration: 30 seconds",
    "- Scene 1: female avatar hook",
    "- Scene 2: male avatar value proof",
    "- Scene 3: female CTA with both avatar presence",
    "- Link promoted: https://www.altftool.com/"
  ].join("\n"), "utf8");

  console.log(`Generated dual avatar intro assets in ${outputDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
