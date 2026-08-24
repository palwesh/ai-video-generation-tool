import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

const rootDir = process.cwd();
const publicDir = path.join(rootDir, "public", "instagram", "altftools_review_first_reel");
const audioDir = path.join(publicDir, "audio");
const outputDir = path.join(rootDir, "outputs", "instagram", "altftools_review_first_reel");
const tempDir = path.join(outputDir, "temp");

const scenes = [
  "Online tools dhundhte dhundhte time waste ho raha hai? Is page ko save kar lo.",
  "Yaha AltFTool ke micro tools ka real demo milega, fake UI nahi.",
  "Har reel me tool open hoga, workflow dikhega, aur output clear hoga.",
  "AI, privacy, PDF, salary slip, editing, aur productivity tools simple language me.",
  "Follow altftools_review, comment TOOL, aur next useful tool try karo."
];

const caption = `Welcome to @altftools_review.

Yaha daily useful AltFTool micro tools ke real demos milenge: no fake UI, no extra confusion, bas practical workflow aur clear result.

Follow karo, save karo, aur comment TOOL agar next review me aap kisi specific tool ka demo chahte ho.

Try tools: https://www.altftool.com/

#altftool #altftools_review #aitools #freetools #productivitytools #webtools #toolreview #digitaltools #smartwork #creatortools #usefultools`;

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

function writePcmWav(samples, sampleRate = 44100) {
  const bytesPerSample = 2;
  const dataSize = samples.length * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * bytesPerSample, 28);
  buffer.writeUInt16LE(bytesPerSample, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  samples.forEach((sample, index) => {
    const value = Math.max(-1, Math.min(1, sample));
    buffer.writeInt16LE(Math.round(value * 32767), 44 + index * bytesPerSample);
  });

  return buffer;
}

function makeMusicBed(durationSeconds = 35, sampleRate = 44100) {
  const sampleCount = Math.floor(durationSeconds * sampleRate);
  const notes = [164.81, 196, 246.94, 293.66, 329.63, 246.94, 220, 196];
  const samples = new Array(sampleCount);

  for (let index = 0; index < sampleCount; index += 1) {
    const time = index / sampleRate;
    const beat = Math.floor(time * 2.4);
    const note = notes[beat % notes.length];
    const beatPosition = (time * 2.4) % 1;
    const envelope = Math.max(0.16, 1 - beatPosition * 0.72);
    const bass = Math.sin(2 * Math.PI * (note / 2) * time) * 0.055;
    const lead = Math.sin(2 * Math.PI * note * time) * 0.038 * envelope;
    const sparkle = Math.sin(2 * Math.PI * note * 2.01 * time) * 0.014 * envelope;
    samples[index] = bass + lead + sparkle;
  }

  return writePcmWav(samples, sampleRate);
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
      // Try the next Python executable.
    }
  }

  return "";
}

async function buildEdgeVoiceover(pythonExecutable, text, index) {
  const token = String(index + 1).padStart(2, "0");
  const mp3Path = path.join(audioDir, `scene-${token}.mp3`);
  const voice = process.env.FIRST_REEL_EDGE_VOICE || "en-IN-PrabhatNeural";
  const rate = process.env.FIRST_REEL_EDGE_RATE || "+7%";

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
    mp3Path
  ]);
  return mp3Path;
}

async function buildMacVoiceover(text, index) {
  const token = String(index + 1).padStart(2, "0");
  const tempAiff = path.join(tempDir, `scene-${token}.aiff`);
  const wavPath = path.join(audioDir, `scene-${token}.wav`);
  const voice = process.env.FIRST_REEL_VOICE || "Rishi";
  const rate = process.env.FIRST_REEL_RATE || "205";

  await runCommand(`voice scene ${token}`, "/usr/bin/say", ["-v", voice, "-r", rate, "-o", tempAiff, text]);
  await runCommand(`convert scene ${token}`, "/usr/bin/afconvert", ["-f", "WAVE", "-d", "LEI16@44100", tempAiff, wavPath]);
  return wavPath;
}

async function main() {
  await fs.mkdir(audioDir, { recursive: true });
  await fs.mkdir(outputDir, { recursive: true });
  await fs.mkdir(tempDir, { recursive: true });
  const existingAudio = await fs.readdir(audioDir).catch(() => []);
  await Promise.all(existingAudio
    .filter((fileName) => /^scene-\d+\.(aiff|m4a|mp3|wav)$/i.test(fileName))
    .map((fileName) => fs.rm(path.join(audioDir, fileName), { force: true })));

  const scriptText = scenes.map((line, index) => `Scene ${index + 1}: ${line}`).join("\n");
  await fs.writeFile(path.join(outputDir, "script.txt"), scriptText, "utf8");
  await fs.writeFile(path.join(outputDir, "caption.txt"), caption, "utf8");
  await fs.writeFile(path.join(audioDir, "music-bed.wav"), makeMusicBed(), "binary");

  const edgePython = await pythonWithEdgeTts();
  for (let index = 0; index < scenes.length; index += 1) {
    if (edgePython) {
      await buildEdgeVoiceover(edgePython, scenes[index], index);
    } else {
      await buildMacVoiceover(scenes[index], index);
    }
  }

  await fs.writeFile(
    path.join(outputDir, "README.md"),
    [
      "# AltFTools Review First Reel",
      "",
      "Ready-to-post intro reel assets for the Instagram page.",
      "",
      "- Composition: AltFToolsReviewIntroReel",
      "- Format: 1080x1920 vertical",
      "- Duration: 35 seconds",
      "- Caption: caption.txt",
      "- Voiceover: public/instagram/altftools_review_first_reel/audio/"
    ].join("\n"),
    "utf8"
  );

  console.log(`Generated first reel assets in ${outputDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
