import path from "node:path";
import fs from "node:fs/promises";
import { spawn } from "node:child_process";
import dotenv from "dotenv";
import { parseArgs } from "./lib/args.mjs";
import { ensureDir, readJson, writeJson } from "./lib/fsx.mjs";
import { findCachedVidsAssets } from "./lib/vids-clip-cache.mjs";
import {
  ensureGeneratedArchive,
  mirrorGeneratedDirectory,
  mirrorGeneratedFile
} from "./lib/generated-archive.mjs";

dotenv.config({ quiet: true });

const args = parseArgs(process.argv.slice(2));
const toolDir = args["tool-dir"] ? path.resolve(args["tool-dir"]) : null;
const outputRoot = path.resolve(args.output || args.out || path.join(
  "outputs",
  "runs",
  `local-reel-${new Date().toISOString().replace(/[:.]/g, "-")}`
));
const publicAssetRoot = path.resolve("public", "tool-reel-assets");
const audioEnabled = !args["no-audio"];
const sayVoice = args.voice || process.env.TRF_SAY_VOICE || "";
const sayRate = String(args["voice-rate"] || process.env.TRF_SAY_RATE || 205);

if (!toolDir) {
  console.error("Missing --tool-dir.");
  console.error("Example: npm run render:local -- --tool-dir outputs/runs/.../tool-folder");
  process.exit(1);
}

async function accessOrNull(filePath) {
  return fs.access(filePath).then(() => filePath).catch(() => null);
}

function safeFileName(value) {
  return String(value || "tool-reel")
    .replace(/[/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase() || "tool-reel";
}

async function copyAsset(source, destinationDir, name) {
  if (!source || !await accessOrNull(source)) {
    return "";
  }
  const extension = path.extname(source) || ".png";
  const destination = path.join(destinationDir, `${name}${extension}`);
  await fs.copyFile(source, destination);
  return path.relative(path.resolve("public"), destination).split(path.sep).join("/");
}

async function copyCachedVidsAssets(toolDir, assetDir, sceneCount = 6) {
  const cached = await findCachedVidsAssets(toolDir, { sceneCount });
  const sceneClips = [];
  const copiedFiles = [];

  for (const [index, clip] of cached.sceneClips.entries()) {
    if (!clip?.absolutePath) {
      sceneClips[index] = "";
      continue;
    }
    const relativePath = await copyAsset(clip.absolutePath, assetDir, `vids-scene-${String(index + 1).padStart(2, "0")}`);
    sceneClips[index] = relativePath;
    if (relativePath) {
      copiedFiles.push({ ...clip, publicPath: relativePath });
    }
  }

  const timelineExports = [];
  const defaultCoveredScenes = Array.from({ length: sceneCount }, (_, index) => index + 1);
  for (const [index, item] of cached.timelineExports.entries()) {
    const relativePath = await copyAsset(item.absolutePath, assetDir, `vids-timeline-${index + 1}-${item.kind || "export"}`);
    if (!relativePath) {
      continue;
    }
    timelineExports.push({
      kind: item.kind || "export",
      publicPath: relativePath,
      coveredScenes: item.coveredScenes || defaultCoveredScenes,
      sourcePath: item.absolutePath,
      note: item.note || ""
    });
    copiedFiles.push({ ...item, publicPath: relativePath });
  }

  return {
    cacheDir: cached.cacheDir,
    manifestPath: cached.manifestPath,
    sceneClips,
    timelineExports,
    copiedFiles,
    sourceFiles: cached.files
  };
}

async function runCommand(label, command, commandArgs) {
  return await new Promise((resolve, reject) => {
    const child = spawn(command, commandArgs, {
      cwd: process.cwd(),
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ code, stdout, stderr });
        return;
      }
      reject(new Error(`${label} failed with exit code ${code}\n${stderr || stdout}`));
    });
  });
}

function writeUInt32LE(buffer, value, offset) {
  buffer.writeUInt32LE(value >>> 0, offset);
}

function writeUInt16LE(buffer, value, offset) {
  buffer.writeUInt16LE(value >>> 0, offset);
}

async function writeMusicBedWav(filePath, durationSeconds = 70) {
  const sampleRate = 44100;
  const channels = 2;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const totalSamples = Math.ceil(sampleRate * durationSeconds);
  const dataSize = totalSamples * channels * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0);
  writeUInt32LE(buffer, 36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  writeUInt32LE(buffer, 16, 16);
  writeUInt16LE(buffer, 1, 20);
  writeUInt16LE(buffer, channels, 22);
  writeUInt32LE(buffer, sampleRate, 24);
  writeUInt32LE(buffer, sampleRate * channels * bytesPerSample, 28);
  writeUInt16LE(buffer, channels * bytesPerSample, 32);
  writeUInt16LE(buffer, bitsPerSample, 34);
  buffer.write("data", 36);
  writeUInt32LE(buffer, dataSize, 40);

  const chords = [
    [196, 246.94, 293.66],
    [174.61, 220, 261.63],
    [220, 277.18, 329.63],
    [164.81, 207.65, 246.94]
  ];

  for (let sampleIndex = 0; sampleIndex < totalSamples; sampleIndex += 1) {
    const t = sampleIndex / sampleRate;
    const beat = t % 1;
    const chord = chords[Math.floor(t / 8) % chords.length];
    const pad = chord.reduce((sum, freq) => sum + Math.sin(2 * Math.PI * freq * t), 0) / chord.length;
    const pluckEnvelope = Math.exp(-18 * (t % 0.5));
    const pluck = Math.sin(2 * Math.PI * (chord[(Math.floor(t * 2) + 1) % chord.length] * 2) * t) * pluckEnvelope;
    const kickEnvelope = Math.exp(-24 * beat);
    const kick = Math.sin(2 * Math.PI * (58 - beat * 20) * t) * kickEnvelope;
    const value = Math.max(-1, Math.min(1, pad * 0.055 + pluck * 0.035 + kick * 0.08));
    const intValue = Math.round(value * 32767);
    const offset = 44 + sampleIndex * channels * bytesPerSample;
    buffer.writeInt16LE(intValue, offset);
    buffer.writeInt16LE(intValue, offset + 2);
  }

  await fs.writeFile(filePath, buffer);
}

async function createVoiceoverWav(text, outputPath, tempPath) {
  const sayArgs = ["-r", sayRate];
  if (sayVoice) {
    sayArgs.push("-v", sayVoice);
  }
  sayArgs.push(String(text || ""), "-o", tempPath);
  await runCommand("say", "/usr/bin/say", sayArgs);
  await runCommand("afconvert", "/usr/bin/afconvert", ["-f", "WAVE", "-d", "LEI16", tempPath, outputPath]);
  return path.relative(path.resolve("public"), outputPath).split(path.sep).join("/");
}

async function createAudioAssets(scenes, assetDir, outputDir, durationSeconds = 60) {
  if (!audioEnabled) {
    return { enabled: false, voiceovers: [], music: "" };
  }

  const hasSay = await accessOrNull("/usr/bin/say");
  const hasAfconvert = await accessOrNull("/usr/bin/afconvert");
  if (!hasSay || !hasAfconvert) {
    return {
      enabled: false,
      voiceovers: [],
      music: "",
      warning: "macOS say/afconvert was not available."
    };
  }

  const tempDir = path.join(outputDir, "audio-temp");
  await ensureDir(tempDir);

  const voiceovers = [];
  const warnings = [];
  for (const [index, scene] of scenes.entries()) {
    const wavPath = path.join(assetDir, `voiceover-scene-${index + 1}.wav`);
    const aiffPath = path.join(tempDir, `voiceover-scene-${index + 1}.aiff`);
    try {
      const relativePath = await createVoiceoverWav(scene.voiceover, wavPath, aiffPath);
      voiceovers.push(relativePath);
    } catch (error) {
      warnings.push(`Scene ${index + 1} voiceover failed: ${error.message}`);
      voiceovers.push("");
    }
  }

  const musicPath = path.join(assetDir, "music-bed.wav");
  let music = "";
  try {
    await writeMusicBedWav(musicPath, durationSeconds);
    music = path.relative(path.resolve("public"), musicPath).split(path.sep).join("/");
  } catch (error) {
    warnings.push(`Music bed failed: ${error.message}`);
  }

  return {
    enabled: Boolean(voiceovers.some(Boolean) || music),
    voiceovers,
    music,
    warnings
  };
}

async function runRender(propsPath, outputPath) {
  return await new Promise((resolve, reject) => {
    const child = spawn("npx", [
      "remotion",
      "render",
      "src/remotion/index.jsx",
      "ToolReel",
      outputPath,
      "--props",
      propsPath,
      "--overwrite"
    ], {
      cwd: process.cwd(),
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      stdout += text;
      process.stdout.write(text);
    });

    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      stderr += text;
      process.stderr.write(text);
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ code, stdout, stderr });
        return;
      }
      reject(new Error(`Remotion render failed with exit code ${code}\n${stderr || stdout}`));
    });
  });
}

await ensureDir(outputRoot);

const scenePlan = await readJson(path.join(toolDir, "scene-plan.json"));
const manifest = await readJson(path.join(toolDir, "manifest.json")).catch(() => ({}));
const captureFiles = manifest.capture?.files || [];
const slug = path.basename(toolDir);
const assetDir = path.join(publicAssetRoot, `${slug}-${Date.now()}`);
await ensureDir(assetDir);
const sceneDurationSeconds = Number(scenePlan.metadata?.scene_duration_seconds || scenePlan.scenes?.[0]?.duration || 10) || 10;
const totalDurationSeconds = Number(scenePlan.metadata?.total_duration_seconds || (scenePlan.scenes?.length || 0) * sceneDurationSeconds) || 60;

const desktopTop = captureFiles.find((file) => file.endsWith("desktop-top.png"));
const desktopFull = captureFiles.find((file) => file.endsWith("desktop-full-page.png"));
const mobileTop = captureFiles.find((file) => file.endsWith("mobile-top.png"));
const desktopDemoBefore = captureFiles.find((file) => file.endsWith("desktop-demo-before.png"));
const desktopDemoAfter = captureFiles.find((file) => file.endsWith("desktop-demo-after.png"));
const desktopDemoVideo = captureFiles.find((file) => file.endsWith("desktop-demo.webm"));
const mobileScrollVideo = captureFiles.find((file) => file.endsWith("mobile-scroll.webm"));

const assets = {
  desktop: await copyAsset(desktopTop, assetDir, "desktop-top"),
  desktopFull: await copyAsset(desktopFull, assetDir, "desktop-full-page"),
  mobile: await copyAsset(mobileTop, assetDir, "mobile-top"),
  demoBefore: await copyAsset(desktopDemoBefore, assetDir, "desktop-demo-before"),
  demoAfter: await copyAsset(desktopDemoAfter, assetDir, "desktop-demo-after"),
  demoVideo: await copyAsset(desktopDemoVideo, assetDir, "desktop-demo"),
  mobileScroll: await copyAsset(mobileScrollVideo, assetDir, "mobile-scroll")
};
const vidsCacheAssets = await copyCachedVidsAssets(toolDir, assetDir, scenePlan.scenes.length);
assets.vidsClips = vidsCacheAssets.sceneClips;
assets.vidsTimelines = vidsCacheAssets.timelineExports;
assets.vidsClipCache = {
  cacheDir: vidsCacheAssets.cacheDir,
  manifestPath: vidsCacheAssets.manifestPath,
  copiedFiles: vidsCacheAssets.copiedFiles,
  sourceFiles: vidsCacheAssets.sourceFiles
};
const audioAssets = await createAudioAssets(scenePlan.scenes, assetDir, outputRoot, totalDurationSeconds);
assets.voiceovers = audioAssets.voiceovers;
assets.music = audioAssets.music;

const props = {
  toolName: manifest.tool?.tool_name || scenePlan.topic || slug,
  toolUrl: manifest.tool?.tool_url || "",
  scenes: scenePlan.scenes,
  sceneDurationSeconds,
  assets
};
const propsPath = path.join(outputRoot, "remotion-props.json");
const outputPath = path.join(outputRoot, args.filename || `${safeFileName(props.toolName)}-local-reel.mp4`);
const reportPath = path.join(outputRoot, "local-reel-report.json");
await writeJson(propsPath, props);

const report = {
  ok: false,
  toolDir,
  scenePlan: path.join(toolDir, "scene-plan.json"),
  manifest: path.join(toolDir, "manifest.json"),
  propsPath,
  outputPath,
  assets,
  audio: audioAssets,
  sceneDurationSeconds,
  totalDurationSeconds,
  renderedAt: new Date().toISOString()
};

async function mirrorLocalRenderOutputs(report) {
  const archiveDir = await ensureGeneratedArchive(toolDir);
  const entries = [];
  const directories = [];

  const videoEntry = await mirrorGeneratedFile({
    toolDir,
    sourcePath: outputPath,
    category: "local-render",
    fileName: path.basename(outputPath),
    label: "Final local MP4",
    note: "Final local Remotion video render."
  });
  if (videoEntry) {
    entries.push(videoEntry);
  }

  const propsEntry = await mirrorGeneratedFile({
    toolDir,
    sourcePath: propsPath,
    category: "local-render",
    fileName: "remotion-props.json",
    label: "Remotion props",
    note: "Render input props used to create the final video."
  });
  if (propsEntry) {
    entries.push(propsEntry);
  }

  const assetsEntry = await mirrorGeneratedDirectory({
    toolDir,
    sourceDir: assetDir,
    category: "local-render",
    folderName: "assets",
    label: "Render assets",
    note: "Public assets copied for Remotion, including generated voiceover/music files."
  });
  if (assetsEntry) {
    directories.push(assetsEntry);
  }

  const audioTempEntry = await mirrorGeneratedDirectory({
    toolDir,
    sourceDir: path.join(outputRoot, "audio-temp"),
    category: "local-render",
    folderName: "audio-temp",
    label: "Voiceover temp audio",
    note: "Temporary voiceover source files generated before WAV conversion."
  });
  if (audioTempEntry) {
    directories.push(audioTempEntry);
  }

  report.generatedArchive = {
    folder: archiveDir,
    primaryVideoPath: videoEntry?.destinationPath || "",
    files: entries,
    directories
  };
  report.toolFolderOutputPath = videoEntry?.destinationPath || "";
  return report.generatedArchive;
}

try {
  const render = await runRender(propsPath, outputPath);
  const stat = await fs.stat(outputPath);
  report.ok = true;
  report.sizeBytes = stat.size;
  report.render = render;
  await mirrorLocalRenderOutputs(report);
  await writeJson(reportPath, report);
  const reportEntry = await mirrorGeneratedFile({
    toolDir,
    sourcePath: reportPath,
    category: "local-render",
    fileName: "local-reel-report.json",
    label: "Local render report",
    note: "Final render report with paths and render status."
  });
  if (reportEntry) {
    report.generatedArchive.files.push(reportEntry);
    await writeJson(reportPath, report);
    await mirrorGeneratedFile({
      toolDir,
      sourcePath: reportPath,
      category: "local-render",
      fileName: "local-reel-report.json",
      label: "Local render report",
      note: "Final render report with paths and render status."
    });
  }
  console.log(`Local MP4: ${outputPath}`);
  if (report.toolFolderOutputPath) {
    console.log(`Tool folder MP4: ${report.toolFolderOutputPath}`);
  }
  console.log(`Report: ${reportPath}`);
} catch (error) {
  report.error = error.message;
  report.stack = error.stack;
  await writeJson(reportPath, report);
  await mirrorGeneratedFile({
    toolDir,
    sourcePath: reportPath,
    category: "local-render",
    fileName: "local-reel-report.json",
    label: "Failed local render report",
    note: "Render failed; this report keeps the error details."
  });
  console.error(`Local render failed: ${error.message}`);
  console.error(`Report: ${reportPath}`);
  process.exitCode = 1;
}
