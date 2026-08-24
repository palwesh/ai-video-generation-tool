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
const spokenField = args["spoken-field"] || process.env.TRF_SPOKEN_FIELD || "voiceover_audio";
const hookAvatarStyle = String(args["hook-avatar"] || args["hook-avatar-style"] || process.env.TRF_HOOK_AVATAR_STYLE || "female")
  .trim()
  .toLowerCase();
const customVoiceoverDir = args["voiceover-dir"]
  ? path.resolve(args["voiceover-dir"])
  : path.join(toolDir || process.cwd(), "voiceovers");

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

function hasAsset(value) {
  if (Array.isArray(value)) {
    return value.some(hasAsset);
  }
  if (value && typeof value === "object") {
    return Object.values(value).some(hasAsset);
  }
  return Boolean(String(value || "").trim());
}

function resolveLocalCommand(command) {
  const normalized = String(command || "").trim();
  if (process.platform !== "win32") {
    return normalized;
  }
  const lower = normalized.toLowerCase();
  if (lower === "npx") return "npx.cmd";
  if (lower === "npm") return "npm.cmd";
  if (lower === "powershell") return "powershell.exe";
  return normalized;
}

function commandNeedsShell(command) {
  return process.platform === "win32" && /\.(cmd|bat)$/i.test(String(command || ""));
}

function spawnOptions(extra = {}) {
  const command = extra.command || "";
  const options = { ...extra };
  delete options.command;
  return {
    ...options,
    shell: options.shell ?? commandNeedsShell(command),
    windowsHide: true
  };
}

function commandInstallHint(command) {
  const normalized = String(command || "").toLowerCase();
  if (normalized.includes("npx")) {
    return "npx was not found. Run setup-windows.bat, then open a new PowerShell window and run the dashboard again.";
  }
  if (normalized.includes("powershell")) {
    return "PowerShell was not found. Use Windows PowerShell or install PowerShell, then retry.";
  }
  return `${command} was not found in PATH.`;
}

async function listFilesRecursive(rootDir, maxDepth = 5) {
  const files = [];
  async function walk(currentDir, depth) {
    if (depth > maxDepth) {
      return;
    }
    let entries = [];
    try {
      entries = await fs.readdir(currentDir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const entryPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        await walk(entryPath, depth + 1);
      } else if (entry.isFile()) {
        files.push(entryPath);
      }
    }
  }
  await walk(rootDir, 0);
  return files.sort();
}

function addQualityCheck(checks, id, label, ok, points, note = "") {
  checks.push({
    id,
    label,
    ok: Boolean(ok),
    points: ok ? points : 0,
    maxPoints: points,
    note
  });
}

function sceneText(scene, fields = ["voiceover", "spoken_voiceover", "voiceover_audio", "onscreen_text", "visual", "video_prompt"]) {
  return fields.map((field) => String(scene?.[field] || "")).join(" ").trim();
}

function buildQualityReport({ props, assets, audioAssets, outputPath, sizeBytes, totalDurationSeconds }) {
  const scenes = Array.isArray(props.scenes) ? props.scenes : [];
  const firstScene = scenes[0] || {};
  const lastScene = scenes[scenes.length - 1] || {};
  const hookText = sceneText(firstScene);
  const lastText = sceneText(lastScene);
  const allText = scenes.map((scene) => sceneText(scene)).join(" ");
  const checks = [];
  const warnings = [];

  const hasAvatarHook = ["female", "male", "auto"].includes(String(assets.hookAvatarStyle || "").toLowerCase())
    || hasAsset(assets.avatarHost)
    || hasAsset(assets.vidsClips?.[0]);
  addQualityCheck(
    checks,
    "avatar_hook",
    "First scene has avatar/presenter hook",
    hasAvatarHook,
    18,
    hasAvatarHook
      ? "Hook scene is configured to open with a presenter/avatar style."
      : "Add a Vids/avatar hook clip or avatar host image for the first 10 seconds."
  );

  const strongHook = hookText.length >= 45
    && /(stop|ruk|wait|problem|galti|save|easy|free|tool|seconds|sec|demo|secret|fast|quick|kaam|time)/i.test(hookText);
  addQualityCheck(
    checks,
    "hook_copy",
    "Hook copy is specific and scroll-stopping",
    strongHook,
    12,
    strongHook
      ? "Hook has enough context and problem/value language."
      : "Make the first line more specific: pain, promise, and tool outcome in one sentence."
  );

  const realToolProof = Boolean(props.toolUrl) && hasAsset([assets.desktop, assets.desktopFull, assets.mobile, assets.demoBefore, assets.demoAfter]);
  addQualityCheck(
    checks,
    "real_tool_proof",
    "Real tool URL screenshots are present",
    realToolProof,
    18,
    realToolProof
      ? "Real website captures are available for the edit."
      : "Capture the actual tool page before rendering; avoid fake UI."
  );

  const screenRecording = hasAsset([assets.demoVideo, assets.mobileScroll]);
  addQualityCheck(
    checks,
    "screen_recording",
    "Real screen recording is available",
    screenRecording,
    10,
    screenRecording
      ? "Tool interaction footage can be used in the demo/body."
      : "Add at least one short desktop/mobile recording for a less static reel."
  );

  const voiceovers = Array.isArray(audioAssets.voiceovers) ? audioAssets.voiceovers : [];
  const hasBodyVoiceoverSource = hasAsset(assets.bodyVoiceoverVideo);
  const avatarAudioScenes = new Set((assets.vidsClipAudioScenes || [])
    .map(Number)
    .filter(Number.isFinite));
  const voiceoverCoverage = scenes.filter((_, index) => {
    const sceneNumber = index + 1;
    return Boolean(
      voiceovers[index]
      || avatarAudioScenes.has(sceneNumber)
      || (hasBodyVoiceoverSource && sceneNumber > 1)
    );
  }).length;
  const voiceoverReady = scenes.length > 0 && voiceoverCoverage >= scenes.length;
  addQualityCheck(
    checks,
    "voiceover",
    "Voiceover files are generated",
    voiceoverReady,
    14,
    voiceoverReady
      ? `${voiceoverCoverage}/${scenes.length} scene(s) have voiceover coverage from local audio, avatar clips, or body voiceover source.`
      : "Generate natural voiceover files or add manual voice files in the voiceovers folder."
  );

  const captionReady = scenes.length > 0 && scenes.every((scene) => String(scene?.onscreen_text || "").trim().length >= 8);
  addQualityCheck(
    checks,
    "captions",
    "Every scene has clean on-screen caption text",
    captionReady,
    12,
    captionReady
      ? "Caption text exists for every scene."
      : "Add short, readable captions for every scene."
  );

  addQualityCheck(
    checks,
    "music",
    "Music bed is available",
    hasAsset(audioAssets.music),
    6,
    hasAsset(audioAssets.music)
      ? "Background music bed is present."
      : "Add low-volume music for reel energy."
  );

  const ctaReady = /(try|open|link|follow|share|save|comment|publish|review|check|use|visit|download|final)/i.test(lastText || allText);
  addQualityCheck(
    checks,
    "cta_review",
    "Final scene has CTA or review reminder",
    ctaReady,
    6,
    ctaReady
      ? "Final scene includes action/review language."
      : "Add a clear CTA plus final human review reminder."
  );

  const durationReady = totalDurationSeconds >= 30 && totalDurationSeconds <= 60;
  addQualityCheck(
    checks,
    "duration",
    "Reel duration is tight",
    durationReady,
    4,
    durationReady
      ? `${totalDurationSeconds}s fits the 30-60s target.`
      : `${totalDurationSeconds}s is outside the preferred 30-60s range.`
  );

  for (const check of checks) {
    if (!check.ok) {
      warnings.push(check.note);
    }
  }

  const score = checks.reduce((sum, check) => sum + check.points, 0);
  const maxScore = checks.reduce((sum, check) => sum + check.maxPoints, 0);
  const percent = maxScore ? Math.round((score / maxScore) * 100) : 0;
  const status = percent >= 88
    ? "post_ready_review"
    : percent >= 72
      ? "usable_needs_review"
      : "needs_improvement";

  return {
    ok: percent >= 72,
    score: percent,
    rawScore: score,
    maxScore,
    status,
    summary: status === "post_ready_review"
      ? "Strong draft. Do one human review, then it is close to post-ready."
      : status === "usable_needs_review"
        ? "Usable draft. Improve the missing checklist items before posting."
        : "Needs improvement before posting.",
    outputPath,
    sizeBytes,
    durationSeconds: totalDurationSeconds,
    checks,
    warnings,
    generatedAt: new Date().toISOString()
  };
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

async function firstExisting(paths) {
  for (const filePath of paths) {
    const existing = await accessOrNull(filePath);
    if (existing) {
      return existing;
    }
  }
  return null;
}

async function findBodyVoiceoverVideo(toolDir) {
  const direct = await firstExisting([
    path.join(toolDir, "voiceovers", "voiceover-source.mp4"),
    path.join(toolDir, "voiceovers", "voiceover-source.webm"),
    path.join(toolDir, "voiceovers", "voiceover-source.mov"),
    path.join(toolDir, "generated", "google-vids-voiceover", "voiceover-source.mp4"),
    path.join(toolDir, "generated", "google-vids-voiceover", "voiceover-source.webm"),
    path.join(toolDir, "generated", "google-vids-voiceover", "voiceover-source.mov")
  ]);
  if (direct) {
    return direct;
  }

  const roots = [
    path.join(toolDir, "voiceovers"),
    path.join(toolDir, "generated", "google-vids-voiceover"),
    path.join(toolDir, "google-vids-voiceover")
  ];
  for (const root of roots) {
    const files = await listFilesRecursive(root, 6);
    const source = files.find((filePath) => /voiceover[-_ ]?source\.(mp4|webm|mov)$/i.test(path.basename(filePath)))
      || files.find((filePath) => /google.*vids.*voiceover.*\.(mp4|webm|mov)$/i.test(path.basename(filePath)));
    if (source) {
      return source;
    }
  }
  return null;
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
    const executable = resolveLocalCommand(command);
    const child = spawn(executable, commandArgs, spawnOptions({
      command: executable,
      cwd: process.cwd(),
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"]
    }));

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      if (error.code === "ENOENT") {
        reject(new Error(`${label} failed: ${commandInstallHint(executable)}`));
        return;
      }
      reject(error);
    });
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

async function createMacVoiceoverWav(text, outputPath, tempPath) {
  const sayArgs = ["-r", sayRate];
  if (sayVoice) {
    sayArgs.push("-v", sayVoice);
  }
  sayArgs.push(String(text || ""), "-o", tempPath);
  await runCommand("say", "/usr/bin/say", sayArgs);
  await runCommand("afconvert", "/usr/bin/afconvert", ["-f", "WAVE", "-d", "LEI16", tempPath, outputPath]);
  return path.relative(path.resolve("public"), outputPath).split(path.sep).join("/");
}

function windowsSpeechRate(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 1;
  }
  if (numeric >= -10 && numeric <= 10) {
    return Math.round(numeric);
  }
  return Math.max(-10, Math.min(10, Math.round((numeric - 180) / 15)));
}

async function createWindowsVoiceoverWav(text, outputPath, tempDir) {
  const scriptPath = path.join(tempDir, "write-voiceover-wav.ps1");
  await fs.writeFile(scriptPath, [
    "param(",
    "  [Parameter(Mandatory=$true)][string]$Text,",
    "  [Parameter(Mandatory=$true)][string]$OutputPath,",
    "  [int]$Rate = 1,",
    "  [string]$Voice = \"\"",
    ")",
    "$ErrorActionPreference = \"Stop\"",
    "Add-Type -AssemblyName System.Speech",
    "$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer",
    "try {",
    "  $synth.Rate = [Math]::Max(-10, [Math]::Min(10, $Rate))",
    "  $synth.Volume = 100",
    "  if ($Voice) {",
    "    $match = $synth.GetInstalledVoices() | Where-Object { $_.VoiceInfo.Name -like \"*$Voice*\" -or $_.VoiceInfo.Culture.Name -like \"*$Voice*\" } | Select-Object -First 1",
    "    if ($match) { $synth.SelectVoice($match.VoiceInfo.Name) }",
    "  }",
    "  $dir = Split-Path -Parent $OutputPath",
    "  if ($dir) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }",
    "  $synth.SetOutputToWaveFile($OutputPath)",
    "  $synth.Speak($Text)",
    "} finally {",
    "  $synth.Dispose()",
    "}",
    ""
  ].join("\n"));

  const commandArgs = [
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    scriptPath,
    "-Text",
    String(text || ""),
    "-OutputPath",
    outputPath,
    "-Rate",
    String(windowsSpeechRate(sayRate))
  ];
  if (sayVoice && !/^auto$/i.test(sayVoice)) {
    commandArgs.push("-Voice", sayVoice);
  }
  await runCommand("PowerShell voiceover", "powershell.exe", commandArgs);
  return path.relative(path.resolve("public"), outputPath).split(path.sep).join("/");
}

async function createAudioAssets(scenes, assetDir, outputDir, durationSeconds = 60, options = {}) {
  if (!audioEnabled) {
    return { enabled: false, voiceovers: [], music: "" };
  }

  const tempDir = path.join(outputDir, "audio-temp");
  await ensureDir(tempDir);
  const skipSceneNumbers = new Set((options.skipSceneNumbers || []).map(Number).filter(Number.isFinite));
  const suppressFallbackSceneNumbers = new Set((options.suppressFallbackSceneNumbers || []).map(Number).filter(Number.isFinite));

  let voiceoverMode = "";
  const warnings = [];
  if (process.platform === "darwin") {
    const hasSay = await accessOrNull("/usr/bin/say");
    const hasAfconvert = await accessOrNull("/usr/bin/afconvert");
    if (hasSay && hasAfconvert) {
      voiceoverMode = "macos-say";
    } else {
      warnings.push("macOS say/afconvert was not available; voiceover WAV files were skipped.");
    }
  } else if (process.platform === "win32") {
    voiceoverMode = "windows-sapi";
  } else {
    warnings.push(`No built-in voiceover generator configured for ${process.platform}; voiceover WAV files were skipped.`);
  }

  const voiceovers = [];
  for (const [index, scene] of scenes.entries()) {
    const sceneNumber = index + 1;
    if (skipSceneNumbers.has(sceneNumber)) {
      voiceovers.push("");
      continue;
    }
    const customVoiceover = await firstExisting([
      path.join(customVoiceoverDir, `scene-${String(sceneNumber).padStart(2, "0")}.wav`),
      path.join(customVoiceoverDir, `scene-${String(sceneNumber).padStart(2, "0")}.mp3`),
      path.join(customVoiceoverDir, `scene-${String(sceneNumber).padStart(2, "0")}.m4a`),
      path.join(customVoiceoverDir, `voiceover-scene-${sceneNumber}.wav`),
      path.join(customVoiceoverDir, `voiceover-scene-${sceneNumber}.mp3`),
      path.join(customVoiceoverDir, `voiceover-scene-${sceneNumber}.m4a`)
    ]);
    if (customVoiceover) {
      voiceovers.push(await copyAsset(customVoiceover, assetDir, `voiceover-scene-${sceneNumber}`));
      continue;
    }

    if (suppressFallbackSceneNumbers.has(sceneNumber)) {
      voiceovers.push("");
      continue;
    }

    const wavPath = path.join(assetDir, `voiceover-scene-${index + 1}.wav`);
    const aiffPath = path.join(tempDir, `voiceover-scene-${index + 1}.aiff`);
    const spokenText = String(scene?.[spokenField] || scene?.spoken_voiceover || scene?.voiceover || "").trim();
    try {
      if (voiceoverMode === "macos-say") {
        voiceovers.push(await createMacVoiceoverWav(spokenText, wavPath, aiffPath));
      } else if (voiceoverMode === "windows-sapi") {
        voiceovers.push(await createWindowsVoiceoverWav(spokenText, wavPath, tempDir));
      } else {
        voiceovers.push("");
      }
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
    voiceoverMode,
    spokenField,
    customVoiceoverDir,
    voiceovers,
    music,
    warnings
  };
}

async function runRender(propsPath, outputPath) {
  return await new Promise((resolve, reject) => {
    const executable = resolveLocalCommand("npx");
    process.stdout.write(`Starting Remotion render via ${executable}\n`);
    const child = spawn(executable, [
      "remotion",
      "render",
      "src/remotion/index.jsx",
      "ToolReel",
      outputPath,
      "--props",
      propsPath,
      "--overwrite"
    ], spawnOptions({
      command: executable,
      cwd: process.cwd(),
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"]
    }));

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

    child.on("error", (error) => {
      if (error.code === "ENOENT") {
        reject(new Error(`Remotion render could not start: ${commandInstallHint(executable)}`));
        return;
      }
      reject(error);
    });
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
const avatarHostImage = args["avatar-host"]
  ? path.resolve(args["avatar-host"])
  : await accessOrNull(path.join(toolDir, "avatar-host.png"))
    || await accessOrNull(path.join(toolDir, "avatar-host.jpg"))
    || await accessOrNull(path.join(toolDir, "avatar-host.jpeg"))
    || await accessOrNull(path.join(toolDir, "generated", "avatar-host.png"))
    || await accessOrNull(path.join(toolDir, "generated", "avatar-host.jpg"))
    || await accessOrNull(path.join(toolDir, "generated", "avatar-host.jpeg"));

const assets = {
  brandLogo: "brand/altf-logo.png",
  desktop: await copyAsset(desktopTop, assetDir, "desktop-top"),
  desktopFull: await copyAsset(desktopFull, assetDir, "desktop-full-page"),
  mobile: await copyAsset(mobileTop, assetDir, "mobile-top"),
  demoBefore: await copyAsset(desktopDemoBefore, assetDir, "desktop-demo-before"),
  demoAfter: await copyAsset(desktopDemoAfter, assetDir, "desktop-demo-after"),
  demoVideo: await copyAsset(desktopDemoVideo, assetDir, "desktop-demo"),
  mobileScroll: await copyAsset(mobileScrollVideo, assetDir, "mobile-scroll"),
  avatarHost: await copyAsset(avatarHostImage, assetDir, "avatar-host"),
  hookAvatarStyle: ["female", "male", "auto"].includes(hookAvatarStyle) ? hookAvatarStyle : "female"
};
const vidsCacheAssets = await copyCachedVidsAssets(toolDir, assetDir, scenePlan.scenes.length);
assets.vidsClips = vidsCacheAssets.sceneClips;
assets.vidsClipAudioScenes = vidsCacheAssets.copiedFiles
  .filter((clip) => /avatar|hook|cta|focus/i.test(`${clip.file || ""} ${clip.note || ""} ${clip.sourcePath || ""}`))
  .map((clip) => Number(clip.sceneNumber))
  .filter(Number.isFinite);
assets.vidsTimelines = vidsCacheAssets.timelineExports;
assets.vidsClipCache = {
  cacheDir: vidsCacheAssets.cacheDir,
  manifestPath: vidsCacheAssets.manifestPath,
  copiedFiles: vidsCacheAssets.copiedFiles,
  sourceFiles: vidsCacheAssets.sourceFiles
};
const bodyVoiceoverVideoSource = await findBodyVoiceoverVideo(toolDir);
assets.bodyVoiceoverVideo = await copyAsset(bodyVoiceoverVideoSource, assetDir, "body-voiceover-source");
const bodySceneNumbers = (scenePlan.scenes || []).slice(1).map((_, index) => index + 2);
const audioAssets = await createAudioAssets(scenePlan.scenes, assetDir, outputRoot, totalDurationSeconds, {
  skipSceneNumbers: assets.vidsClipAudioScenes,
  suppressFallbackSceneNumbers: bodyVoiceoverVideoSource ? bodySceneNumbers : []
});
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
const qualityReportPath = path.join(outputRoot, "reel-quality-report.json");
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
  hookAvatarStyle: assets.hookAvatarStyle,
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

  const ctaSceneNumber = Array.isArray(scenePlan.scenes) ? scenePlan.scenes.length : 0;
  const ctaClipRecord = (report.assets?.vidsClipCache?.copiedFiles || []).find((clip) => (
    Number(clip?.sceneNumber) === ctaSceneNumber
    && /cta|avatar|scene_clip/i.test(`${clip?.kind || ""} ${clip?.file || ""} ${clip?.note || ""} ${clip?.sourcePath || ""}`)
  ));
  const ctaPublicPath = ctaSceneNumber > 0 ? report.assets?.vidsClips?.[ctaSceneNumber - 1] : "";
  const ctaClipSource = await firstExisting([
    ctaClipRecord?.sourcePath,
    ctaClipRecord?.absolutePath,
    ctaPublicPath ? path.resolve("public", ctaPublicPath) : ""
  ]);
  const ctaEntry = await mirrorGeneratedFile({
    toolDir,
    sourcePath: ctaClipSource,
    category: "local-render",
    fileName: "cta_avatar.mp4",
    label: "CTA avatar source clip",
    note: "Reusable CTA avatar clip used by the fullscreen final-scene render."
  });
  if (ctaEntry) {
    entries.push(ctaEntry);
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
    ctaAvatarPath: ctaEntry?.destinationPath || "",
    files: entries,
    directories
  };
  report.toolFolderOutputPath = videoEntry?.destinationPath || "";
  report.ctaAvatarSourcePath = ctaClipSource || "";
  report.ctaAvatarArchivePath = ctaEntry?.destinationPath || "";
  return report.generatedArchive;
}

try {
  const render = await runRender(propsPath, outputPath);
  const stat = await fs.stat(outputPath);
  const quality = buildQualityReport({
    props,
    assets,
    audioAssets,
    outputPath,
    sizeBytes: stat.size,
    totalDurationSeconds
  });
  report.ok = true;
  report.sizeBytes = stat.size;
  report.render = render;
  report.quality = quality;
  report.qualityScore = quality.score;
  report.qualityStatus = quality.status;
  report.qualityWarnings = quality.warnings;
  report.qualityReportPath = qualityReportPath;
  await writeJson(qualityReportPath, quality);
  await mirrorLocalRenderOutputs(report);
  const qualityEntry = await mirrorGeneratedFile({
    toolDir,
    sourcePath: qualityReportPath,
    category: "local-render",
    fileName: "reel-quality-report.json",
    label: "Reel quality report",
    note: "Automated production checklist for avatar hook, real demo proof, voiceover, captions, CTA, and duration."
  });
  if (qualityEntry) {
    report.generatedArchive.files.push(qualityEntry);
  }
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
  if (report.ctaAvatarArchivePath) {
    console.log(`CTA avatar clip: ${report.ctaAvatarArchivePath}`);
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
