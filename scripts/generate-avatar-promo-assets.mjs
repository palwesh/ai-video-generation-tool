import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

const rootDir = process.cwd();
const publicDir = path.join(rootDir, "public", "instagram", "altftool_full_avatar_promo");
const audioDir = path.join(publicDir, "audio");
const outputDir = path.join(rootDir, "outputs", "instagram", "altftool_full_avatar_promo");

const scenes = [
  "Agar useful online tools chahiye, AltFTool ko abhi save kar lo.",
  "AltFTool par small tools milte hain jo boring manual work ko fast karte hain.",
  "PDF, privacy, salary slip, AI text, editing, aur productivity tools yaha mil jayenge.",
  "Link open karo, tool choose karo, demo data daalo, aur result turant dekho.",
  "Har reel me real demo, clear output, aur simple Hinglish review milega.",
  "Abhi try karo https://www.altftool.com/ aur follow karo for daily tool demos."
];

const caption = `Useful online tools chahiye? AltFTool save kar lo.

AltFTool par PDF, privacy, salary slip, AI text, editing, aur productivity ke practical micro tools milte hain.

Try now: https://www.altftool.com/

Follow @altftools_review for daily real tool demos.

#altftool #altftools_review #aitools #webtools #productivitytools #freetools #toolreview #microtools #smartwork #digitaltools #creatorworkflow`;

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

function makeMusicBed(durationSeconds = 42, sampleRate = 44100) {
  const sampleCount = Math.floor(durationSeconds * sampleRate);
  const notes = [146.83, 185, 220, 277.18, 329.63, 277.18, 246.94, 196];
  const samples = new Array(sampleCount);

  for (let index = 0; index < sampleCount; index += 1) {
    const time = index / sampleRate;
    const beat = Math.floor(time * 2.6);
    const note = notes[beat % notes.length];
    const beatPosition = (time * 2.6) % 1;
    const envelope = Math.max(0.14, 1 - beatPosition * 0.76);
    const bass = Math.sin(2 * Math.PI * (note / 2) * time) * 0.052;
    const lead = Math.sin(2 * Math.PI * note * time) * 0.036 * envelope;
    const lift = Math.sin(2 * Math.PI * note * 2.005 * time) * 0.015 * envelope;
    samples[index] = bass + lead + lift;
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
      // Keep looking for a Python with edge-tts installed.
    }
  }

  throw new Error("edge-tts is not installed. Run `.venv/bin/python -m pip install edge-tts` first.");
}

async function buildVoiceover(pythonExecutable, text, index) {
  const token = String(index + 1).padStart(2, "0");
  const mp3Path = path.join(audioDir, `scene-${token}.mp3`);
  const voice = process.env.AVATAR_PROMO_EDGE_VOICE || "en-IN-PrabhatNeural";
  const rate = process.env.AVATAR_PROMO_EDGE_RATE || "+8%";

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
}

async function main() {
  await fs.mkdir(audioDir, { recursive: true });
  await fs.mkdir(outputDir, { recursive: true });

  const existingAudio = await fs.readdir(audioDir).catch(() => []);
  await Promise.all(existingAudio
    .filter((fileName) => /^(scene-\d+\.mp3|music-bed\.wav)$/i.test(fileName))
    .map((fileName) => fs.rm(path.join(audioDir, fileName), { force: true })));

  await fs.writeFile(path.join(audioDir, "music-bed.wav"), makeMusicBed(), "binary");
  await fs.writeFile(path.join(outputDir, "script.txt"), scenes.map((line, index) => `Scene ${index + 1}: ${line}`).join("\n"), "utf8");
  await fs.writeFile(path.join(outputDir, "caption.txt"), caption, "utf8");

  const pythonExecutable = await pythonWithEdgeTts();
  for (let index = 0; index < scenes.length; index += 1) {
    await buildVoiceover(pythonExecutable, scenes[index], index);
  }

  await fs.writeFile(
    path.join(outputDir, "README.md"),
    [
      "# AltFTool Full Avatar Promo Reel",
      "",
      "- Composition: AltFToolFullAvatarPromoReel",
      "- Format: 1080x1920 vertical",
      "- Duration: 42 seconds",
      "- Link promoted: https://www.altftool.com/",
      "- Voice: Edge neural Hinglish"
    ].join("\n"),
    "utf8"
  );

  console.log(`Generated avatar promo assets in ${outputDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
