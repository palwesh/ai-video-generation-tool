import path from "node:path";
import fs from "node:fs/promises";
import { spawn } from "node:child_process";
import dotenv from "dotenv";
import { parseArgs } from "./lib/args.mjs";
import { readJson, writeJson, ensureDir } from "./lib/fsx.mjs";
import { readWorkbookTable, normalizeWorkbookObjects } from "./lib/input.mjs";
import { processToolRow } from "./lib/tool-processor.mjs";
import { writeSimpleXlsx } from "./lib/simple-xlsx-writer.mjs";
import { fileHyperlink, folderHyperlink, hyperlinkFormula } from "./lib/link-cells.mjs";
import { cacheVidsExport, cacheVidsSceneClip, ensureVidsClipCache } from "./lib/vids-clip-cache.mjs";
import { resolveReelConfig } from "./lib/reel-planner.mjs";
import { resolveDriveSyncDir, syncToolOutputToDrive } from "./lib/drive-sync.mjs";
import {
  ensureGeneratedArchive,
  mirrorGeneratedDirectory,
  mirrorGeneratedFile
} from "./lib/generated-archive.mjs";
import { writeAvatarReferencePack } from "./lib/avatar-reference-pack.mjs";

dotenv.config({ quiet: true });

const args = parseArgs(process.argv.slice(2));
const config = await readJson("config/default.json");
function resolveDefaultInput(value, fallback = "") {
  const raw = String(value || fallback || "").trim();
  if (!raw) {
    return "";
  }
  return path.isAbsolute(raw) ? raw : path.resolve(raw);
}
const defaultInput = resolveDefaultInput(
  process.env.TRF_DEFAULT_INPUT || config.defaultInput,
  "/Users/palsahu/workplace/projects/n learn/Book1.xlsx"
);
const inputPath = path.resolve(args.input || defaultInput);
const largeXlsxThresholdBytes = Number(process.env.TRF_LARGE_XLSX_THRESHOLD_BYTES || 20 * 1024 * 1024);
const toolBaseUrl = args["base-url"] || config.toolBaseUrl || "";
const requestedLimit = Number(args.limit || 1);
const reelConfig = resolveReelConfig(config, {
  sceneCount: args["scene-count"] || args["target-scenes"] || args["max-scenes"]
});
const maxScenes = Number(args["max-scenes"] || reelConfig.sceneCount);
const prepOnly = Boolean(args["prep-only"]);
const localOnly = Boolean(args["local-only"]);
const generateInVids = Boolean(args.generate) && !localOnly && !prepOnly;
const useVidsSceneClips = generateInVids && !args["vids-timeline-export"];
const allowLocalFallback = generateInVids && !args["no-local-fallback"];
const hookVidsFirst = Boolean(args["hook-vids-first"] || args["vids-hook-first"] || args["hook-first"]);
const shouldCapture = !args["no-capture"];
const aiProvider = args["ai-provider"] || process.env.TRF_AI_PROVIDER || config.ai?.provider || "openai";
const aiModel = args["ai-model"] || process.env.OPENAI_MODEL || process.env.GEMINI_MODEL || config.ai?.openaiModel || config.aiModel || "";
const useAi = Boolean(args.ai);
const avatarMode = args["no-avatar"] ? "" : (args.avatar || args["select-avatar"] || (generateInVids ? "auto" : ""));
const defaultAvatarScenes = config.googleVids?.defaultAvatarScenes || `1,2,${reelConfig.sceneCount}`;
const freeVideoProviders = args["free-video-providers"] || config.freeVideoProviders?.defaultProviders || "all";
const creatorImages = args["creator-images"] || args["avatar-images"] || args["reference-images"] || config.avatarGeneration?.referenceImages || "";
const avatarProviderPackProviders = args["avatar-pack-providers"] || config.avatarGeneration?.providers || "heygen,did,runway,veo,pika";
const avatarClipProvider = String(args["avatar-provider"] || config.avatarGeneration?.provider || "manual").toLowerCase();
const generateAvatarClips = Boolean(args["generate-avatar-clips"] || args["generate-avatar"] || (avatarClipProvider === "heygen" && args["avatar-provider"]));
const hookAvatarStyle = String(args["hook-avatar"] || args["hook-avatar-style"] || config.voiceover?.hookAvatarStyle || "female").toLowerCase();
const ttsProvider = String(args["tts-provider"] || args["voice-provider"] || config.voiceover?.provider || "local").toLowerCase();
const shouldGenerateVoiceovers = !["", "none", "off", "local", "macos", "windows"].includes(ttsProvider);
const driveSyncDir = resolveDriveSyncDir(config, args);
const batchStamp = new Date().toISOString().replace(/[:.]/g, "-");
const batchDir = path.resolve(args.out || path.join("outputs", "runs", `one-video-agent-${batchStamp}`));
const preparedWorkbookPath = path.join(batchDir, "prepared-tool-reel-workbook.xlsx");
const reportPath = path.join(batchDir, "one-video-agent-report.json");

async function shouldUseLargeXlsxReader(filePath) {
  if (path.extname(filePath).toLowerCase() !== ".xlsx") {
    return false;
  }
  try {
    const stats = await fs.stat(filePath);
    return stats.size >= largeXlsxThresholdBytes;
  } catch {
    return false;
  }
}

function runLargeXlsxAnalyzer(filePath, baseUrl = "") {
  return new Promise((resolve, reject) => {
    const scriptPath = path.resolve("scripts/analyze-xlsx-light.py");
    const child = spawn("python3", [scriptPath, filePath, "--base-url", baseUrl || "", "--full-tools"], {
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
      if (code !== 0) {
        reject(new Error(stderr.trim() || `Large XLSX analyzer failed with exit code ${code}`));
        return;
      }
      try {
        resolve(JSON.parse(stdout));
      } catch (error) {
        reject(new Error(`Large XLSX analyzer returned invalid JSON: ${error.message}`));
      }
    });
  });
}

const extraHeaders = [
  "TRF Full Tool URL",
  "TRF Tool Route",
  "TRF Asset Folder",
  "TRF Scene Plan JSON",
  "TRF Google Vids Prompts CSV",
  "TRF Post Copy",
  "TRF Desktop Screenshot",
  "TRF Mobile Screenshot",
  "TRF Full Page Screenshot",
  "TRF Scroll Recording",
  "TRF Drive Upload Status",
  "TRF Drive Folder Link",
  "TRF Drive Video Path",
  "TRF Drive Video Link",
  "TRF Drive Folder Path",
  "TRF Drive Manifest",
  "TRF Final Reel Voiceover",
  "TRF Scene 1 Voiceover",
  "TRF Scene 2 Voiceover",
  "TRF Scene 3 Voiceover",
  "TRF Scene 4 Voiceover",
  "TRF Scene 5 Voiceover",
  "TRF Scene 6 Voiceover",
  "TRF Scene 7 Voiceover",
  "TRF Scene 1 Vids Prompt",
  "TRF Scene 2 Vids Prompt",
  "TRF Scene 3 Vids Prompt",
  "TRF Scene 4 Vids Prompt",
  "TRF Scene 5 Vids Prompt",
  "TRF Scene 6 Vids Prompt",
  "TRF Scene 7 Vids Prompt",
  "TRF Data Prep Status",
  "TRF Data Prep Note",
  "TRF Google Vids Status",
  "TRF Google Vids Link",
  "TRF Vids Clip Cache Folder",
  "TRF Vids Cached Clips",
  "TRF Final MP4 Path",
  "TRF QA Status",
  "TRF Reel Quality Score",
  "TRF Reel Quality Status",
  "TRF Reel Quality Report",
  "TRF Reel Quality Notes",
  "TRF Last Automation Run",
  "TRF Final Video Link",
  "TRF Final Video Folder Link",
  "TRF Run Folder Link",
  "TRF Generated Folder",
  "TRF Generated Files",
  "TRF Asset Brief",
  "TRF Reel Script MD",
  "TRF Reel Script JSON",
  "TRF Vids Generated Scenes Folder",
  "TRF Free Video Provider Pack",
  "TRF Free Video Provider Prompts",
  "TRF Voiceover Pack Folder",
  "TRF Voiceover Recording Script",
  "TRF Natural Voiceover Folder",
  "TRF Natural Voiceover Report",
  "TRF Avatar Reference Pack",
  "TRF Avatar Reference Folder",
  "TRF Avatar Generation Report"
];

function firstFile(files, name) {
  return files.find((filePath) => filePath.endsWith(name)) || "";
}

function setExtraValue(values, header, value) {
  const index = extraHeaders.indexOf(header);
  if (index >= 0) {
    values[index] = value;
  }
}

function normalizeHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

function baseWorkbookColumns(table) {
  const extraHeaderSet = new Set(extraHeaders.map(normalizeHeader));
  return table.headers
    .map((header, index) => ({ header, index }))
    .filter((item) => !extraHeaderSet.has(normalizeHeader(item.header)));
}

function selectedRowFrom(normalizedRows) {
  if (args.row) {
    const wanted = Number(args.row);
    const row = normalizedRows.find((item) => item.source_row_number === wanted);
    if (!row) {
      throw new Error(`Excel row ${wanted} was not found or was empty.`);
    }
    return row;
  }

  if (args["tool-name"]) {
    const wanted = String(args["tool-name"]).trim().toLowerCase();
    const row = normalizedRows.find((item) => item.tool_name.trim().toLowerCase() === wanted);
    if (!row) {
      throw new Error(`Tool name "${args["tool-name"]}" was not found.`);
    }
    return row;
  }

  const row = normalizedRows[0];
  if (!row) {
    throw new Error("No usable tool row found in the workbook.");
  }
  return row;
}

async function readAgentWorkbook(input) {
  if (!(await shouldUseLargeXlsxReader(input))) {
    const table = await readWorkbookTable(input);
    return {
      table,
      normalizedRows: normalizeWorkbookObjects(table.objects, { toolBaseUrl }),
      largeFileMode: false
    };
  }

  const analyzed = await runLargeXlsxAnalyzer(input, toolBaseUrl);
  const normalizedRows = (analyzed.tools || []).map((tool) => ({
    source_row_number: Number(tool.source_row_number || tool.row),
    tool_name: tool.tool_name || tool.name || `Tool Row ${tool.row}`,
    tool_url: tool.tool_url || tool.url || "",
    tool_route: tool.tool_route || tool.url || "",
    topic: tool.topic || tool.tool_name || tool.name || "",
    description: tool.description || "",
    script: tool.script || "",
    target_user: tool.target_user || "",
    main_benefit: tool.main_benefit || "",
    language: tool.language || "",
    category: tool.category || "",
    priority: tool.priority || "",
    status: tool.status || "",
    source_file: tool.source_file || path.basename(input)
  }));
  const headers = [
    "Tool Name",
    "Tool URL",
    "Description",
    "Script",
    "Target User",
    "Main Benefit",
    "Language",
    "Category",
    "Priority",
    "Status"
  ];
  const dataRows = normalizedRows.map((row) => [
    row.tool_name,
    row.tool_url,
    row.description,
    row.script,
    row.target_user,
    row.main_benefit,
    row.language,
    row.category,
    row.priority,
    row.status
  ]);
  return {
    table: {
      headers,
      dataRows,
      objects: dataRows.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] || ""])))
    },
    normalizedRows,
    largeFileMode: true,
    analysis: analyzed.analysis
  };
}

function enrichmentFor(normalized, result, final = {}) {
  if (!result) {
    const empty = extraHeaders.map(() => "");
    setExtraValue(empty, "TRF Full Tool URL", normalized.tool_url);
    setExtraValue(empty, "TRF Tool Route", normalized.tool_route);
    setExtraValue(empty, "TRF Drive Upload Status", "Not uploaded");
    setExtraValue(empty, "TRF Data Prep Status", "Pending");
    setExtraValue(empty, "TRF Data Prep Note", "Not processed in this run.");
    setExtraValue(empty, "TRF Google Vids Status", "Not started");
    return empty;
  }

  const scenes = result.scenePlan.scenes;
  const captureFiles = result.capture.files || [];
  const finalVoiceover = scenes.map((scene) => scene.voiceover).join(" ");
  const sceneVoiceovers = Array.from({ length: 7 }, (_, index) => scenes[index]?.voiceover || "");
  const scenePrompts = Array.from({ length: 7 }, (_, index) => scenes[index]?.video_prompt || "");
  const driveVideoLink = final.driveVideoUrl
    ? hyperlinkFormula(final.driveVideoUrl, "Open Drive video")
    : final.driveVideoPath
      ? fileHyperlink(final.driveVideoPath, "Open Drive video")
      : "";
  const driveFolderLink = final.driveFolderUrl
    ? hyperlinkFormula(final.driveFolderUrl, "Open Drive folder")
    : final.driveFolderPath
      ? folderHyperlink(final.driveFolderPath, "Open Drive folder")
      : "";
  const finalVideoLink = driveVideoLink || (final.mp4Path
    ? fileHyperlink(final.mp4Path, "Open video")
    : final.vidsUrl
      ? hyperlinkFormula(final.vidsUrl, "Open Google Vids")
      : "");
  const finalVideoFolderLink = driveFolderLink || (final.mp4Path
    ? folderHyperlink(path.dirname(final.mp4Path), "Open video folder")
    : "");

  return [
    normalized.tool_url,
    normalized.tool_route,
    result.runDir,
    result.files.scenePlanPath,
    result.files.vidsPromptsPath,
    result.files.postCopyPath,
    firstFile(captureFiles, "desktop-top.png"),
    firstFile(captureFiles, "mobile-top.png"),
    firstFile(captureFiles, "desktop-full-page.png"),
    firstFile(captureFiles, "mobile-scroll.webm"),
    final.driveSyncStatus || (final.driveFolderPath ? "Synced to Drive folder" : "Not uploaded"),
    driveFolderLink,
    final.driveVideoPath || "",
    driveVideoLink,
    final.driveFolderPath || "",
    final.driveManifestPath || "",
    finalVoiceover,
    ...sceneVoiceovers,
    ...scenePrompts,
    result.capture.enabled ? "Prepared with capture" : "Prepared without capture",
    result.capture.summary,
    final.vidsStatus || "Prompt ready",
    final.vidsUrl || "",
    final.vidsClipCacheFolder || result.files.vidsClipCachePath || path.join(result.runDir, "vids-clips"),
    Array.isArray(final.cachedVidsClips) ? final.cachedVidsClips.join("\n") : "",
    final.mp4Path || "",
    final.qaStatus || "Needs human review",
    final.qualityScore ? `${final.qualityScore}/100` : "",
    final.qualityStatus || "",
    final.qualityReportPath ? fileHyperlink(final.qualityReportPath, "Open quality report") : "",
    Array.isArray(final.qualityWarnings) ? final.qualityWarnings.slice(0, 4).join("\n") : "",
    new Date().toISOString(),
    finalVideoLink,
    finalVideoFolderLink,
    folderHyperlink(result.runDir, "Open run folder"),
    final.generatedFolder || result.files.generatedArchivePath || path.join(result.runDir, "generated"),
    Array.isArray(final.generatedFiles) ? final.generatedFiles.join("\n") : "",
    result.files.assetBriefPath || "",
    result.files.reelScriptMdPath || "",
    result.files.reelScriptJsonPath || "",
    result.files.vidsGeneratedScenesPath || "",
    result.files.freeVideoProviderPackPath || "",
    result.files.freeVideoProviderPromptsPath || "",
    final.voiceoverPackFolder
      ? folderHyperlink(final.voiceoverPackFolder, "Open voiceover pack")
      : folderHyperlink(path.join(result.runDir, "voiceovers"), "Open voiceover pack"),
    final.voiceoverRecordingScript
      ? fileHyperlink(final.voiceoverRecordingScript, "Open recording script")
      : fileHyperlink(path.join(result.runDir, "voiceovers", "recording-script.md"), "Open recording script"),
    final.naturalVoiceoverFolder
      ? folderHyperlink(final.naturalVoiceoverFolder, "Open natural voiceovers")
      : "",
    final.naturalVoiceoverReportPath
      ? fileHyperlink(final.naturalVoiceoverReportPath, "Open voiceover report")
      : "",
    final.avatarReferencePackFolder
      ? folderHyperlink(final.avatarReferencePackFolder, "Open avatar pack")
      : "",
    final.avatarReferenceFolder
      ? folderHyperlink(final.avatarReferenceFolder, "Open avatar refs")
      : "",
    final.avatarGenerationReportPath
      ? fileHyperlink(final.avatarGenerationReportPath, "Open avatar report")
      : ""
  ];
}

async function writePreparedWorkbook(table, normalizedRows, selectedRow, result, final = {}) {
  const normalizedBySourceRow = new Map(normalizedRows.map((row) => [row.source_row_number, row]));
  const baseColumns = baseWorkbookColumns(table);
  const outputRows = [
    [...baseColumns.map((item) => item.header), ...extraHeaders],
    ...table.dataRows.map((row, index) => {
      const sourceRowNumber = index + 2;
      const normalized = normalizedBySourceRow.get(sourceRowNumber);
      const baseRow = baseColumns.map((item) => row[item.index] ?? "");
      if (!normalized) {
        return [...baseRow, ...extraHeaders.map(() => "")];
      }
      const selected = sourceRowNumber === selectedRow.source_row_number;
      return [...baseRow, ...enrichmentFor(normalized, selected ? result : null, selected ? final : {})];
    })
  ];

  await writeSimpleXlsx(preparedWorkbookPath, outputRows, "Tool Reel Prep");
  return preparedWorkbookPath;
}

async function runNodeScript(label, scriptPath, scriptArgs) {
  return await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath, ...scriptArgs], {
      cwd: process.cwd(),
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      stdout += text;
      process.stdout.write(`[${label}] ${text}`);
    });

    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      stderr += text;
      process.stderr.write(`[${label}] ${text}`);
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

async function readJsonIfExists(filePath) {
  try {
    return await readJson(filePath);
  } catch {
    return null;
  }
}

async function accessOrNull(filePath) {
  return fs.access(filePath).then(() => filePath).catch(() => null);
}

function pushGenerated(generatedFiles, ...filePaths) {
  for (const filePath of filePaths.flat().filter(Boolean)) {
    if (!generatedFiles.includes(filePath)) {
      generatedFiles.push(filePath);
    }
  }
}

function splitList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function vidsProfilesFromArgs() {
  const profiles = [
    ...splitList(args["vids-profiles"]),
    ...splitList(args["profile"]),
    ...splitList(args["vids-profile"])
  ];

  if (!profiles.length) {
    profiles.push("work/google-vids-profile");
  }

  profiles.push(...splitList(args["fallback-profile"]));
  profiles.push(...splitList(args["fallback-vids-profile"]));
  profiles.push(...splitList(args["fallback-profiles"]));

  const seen = new Set();
  return profiles.filter((profile) => {
    const key = path.resolve(profile);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function safeProfileLabel(profileDir, index) {
  const trimmed = String(profileDir || "").replace(/[\\/]+$/g, "");
  const base = path.basename(trimmed) || `profile-${index + 1}`;
  const cleanBase = base
    .replace(/[/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  return `${String(index + 1).padStart(2, "0")}-${cleanBase || "profile"}`;
}

function sceneToken(sceneNumber) {
  return String(Number(sceneNumber)).padStart(2, "0");
}

function validSceneNumbers(scenes) {
  return (scenes || [])
    .map((scene) => Number(scene?.scene_number ?? scene))
    .filter(Number.isFinite);
}

function parseSceneSelection(value) {
  return String(value || "")
    .split(",")
    .flatMap((part) => {
      const trimmed = part.trim();
      if (!trimmed) {
        return [];
      }
      const range = trimmed.match(/^(\d+)\s*-\s*(\d+)$/);
      if (!range) {
        const single = Number(trimmed);
        return Number.isFinite(single) ? [single] : [];
      }
      const start = Number(range[1]);
      const end = Number(range[2]);
      const low = Math.min(start, end);
      const high = Math.max(start, end);
      return Array.from({ length: high - low + 1 }, (_, index) => low + index);
    })
    .filter((scene, index, scenes) => Number.isFinite(scene) && scenes.indexOf(scene) === index);
}

function selectedVidsSceneNumbers(scenePlan) {
  if (hookVidsFirst && !args["vids-scenes"]) {
    return [1];
  }
  let sceneNumbers = args["vids-scenes"]
    ? parseSceneSelection(args["vids-scenes"])
    : validSceneNumbers(scenePlan.scenes);
  if (args["from-scene"]) {
    sceneNumbers = sceneNumbers.filter((sceneNumber) => sceneNumber >= Number(args["from-scene"]));
  }
  if (args["to-scene"]) {
    sceneNumbers = sceneNumbers.filter((sceneNumber) => sceneNumber <= Number(args["to-scene"]));
  }
  return sceneNumbers.slice(0, Math.min(maxScenes, sceneNumbers.length));
}

function sceneNumbersFromClipPaths(paths) {
  return (paths || [])
    .map((filePath) => String(filePath || "").match(/scene[-_ ]?(\d+)/i)?.[1])
    .map((sceneNumber) => Number(sceneNumber))
    .filter((sceneNumber, index, sceneNumbers) => Number.isFinite(sceneNumber) && sceneNumbers.indexOf(sceneNumber) === index)
    .sort((a, b) => a - b);
}

async function renderLocalReel(result, steps, generatedFiles, reason, status = "Google Vids failed; local MP4 rendered") {
  const localOutputDir = path.join(batchDir, "local-render");
  const localArgs = [
    "src/render-local-reel.mjs",
    "--tool-dir", result.runDir,
    "--output", localOutputDir,
    "--hook-avatar", hookAvatarStyle,
    "--filename", `${result.slug}-local-fallback-reel.mp4`
  ];

  await runNodeScript("local-render", localArgs[0], localArgs.slice(1));
  const localReportPath = path.join(localOutputDir, "local-reel-report.json");
  const localReport = await readJson(localReportPath);

  steps.push({
    name: status.startsWith("Google Vids") ? "local_remotion_fallback" : "local_remotion_render",
    report: localReportPath,
    ok: localReport.ok,
    reason,
    savedPath: localReport.outputPath || ""
  });

  if (!localReport.ok || !localReport.outputPath) {
    throw new Error(`Local fallback render did not produce an MP4. Reason: ${localReport.error || "unknown"}`);
  }

  const archiveFiles = [
    localReport.toolFolderOutputPath,
    ...(localReport.generatedArchive?.files || []).map((item) => item.destinationPath),
    ...(localReport.generatedArchive?.directories || []).map((item) => item.destinationPath)
  ].filter(Boolean);
  pushGenerated(generatedFiles, archiveFiles);

  return {
    reportPath: localReportPath,
    qualityReportPath: localReport.qualityReportPath || "",
    qualityScore: localReport.qualityScore || localReport.quality?.score || 0,
    qualityStatus: localReport.qualityStatus || localReport.quality?.status || "",
    qualityWarnings: localReport.qualityWarnings || localReport.quality?.warnings || [],
    mp4Path: localReport.toolFolderOutputPath || localReport.outputPath,
    originalMp4Path: localReport.outputPath,
    status,
    qaStatus: localReport.quality
      ? `Quality ${localReport.quality.score}/100 - ${localReport.quality.summary}`
      : "Local MP4 rendered; final human review needed before posting"
  };
}

async function createVoiceoverPack(result, steps, generatedFiles) {
  const voiceoverPackFolder = path.join(result.runDir, "voiceovers");
  const voiceoverRecordingScript = path.join(voiceoverPackFolder, "recording-script.md");
  const voiceoverMap = path.join(voiceoverPackFolder, "voiceover-map.json");

  try {
    await runNodeScript("voiceover-pack", "src/export-voiceover-pack.mjs", [
      "--tool-dir", result.runDir
    ]);
    steps.push({
      name: "voiceover_pack",
      ok: true,
      folder: voiceoverPackFolder,
      recordingScript: voiceoverRecordingScript,
      note: "Human/neural voiceover replacement pack prepared. Drop scene-01.mp3, scene-02.mp3, etc. into this folder before final render."
    });
    pushGenerated(generatedFiles, voiceoverPackFolder, voiceoverRecordingScript, voiceoverMap);
    return {
      ok: true,
      voiceoverPackFolder,
      voiceoverRecordingScript,
      voiceoverMap
    };
  } catch (error) {
    steps.push({
      name: "voiceover_pack",
      ok: false,
      error: error.message
    });
    return {
      ok: false,
      voiceoverPackFolder,
      voiceoverRecordingScript,
      voiceoverMap,
      error: error.message
    };
  }
}

async function generateNaturalVoiceovers(result, steps, generatedFiles) {
  const voiceoverFolder = path.join(result.runDir, "voiceovers");
  const reportPath = path.join(voiceoverFolder, "voiceover-generation-report.json");
  if (!shouldGenerateVoiceovers) {
    return {
      ok: false,
      skipped: true,
      provider: ttsProvider,
      reportPath
    };
  }

  const voiceArgs = [
    "src/generate-voiceovers.mjs",
    "--tool-dir", result.runDir,
    "--provider", ttsProvider
  ];
  if (args["tts-voice"] || args["voice-id"]) {
    voiceArgs.push("--voice", String(args["tts-voice"] || args["voice-id"]));
  }
  if (args["tts-model"]) {
    voiceArgs.push("--model", String(args["tts-model"]));
  }
  if (args["tts-overwrite"]) {
    voiceArgs.push("--overwrite");
  }

  try {
    await runNodeScript(`voiceover-generate:${ttsProvider}`, voiceArgs[0], voiceArgs.slice(1));
    const report = await readJsonIfExists(reportPath);
    steps.push({
      name: "natural_voiceover_generation",
      ok: Boolean(report?.ok),
      provider: ttsProvider,
      report: reportPath,
      generatedCount: report?.generatedCount || 0,
      existingCount: report?.existingCount || 0,
      note: "Generated scene MP3 files are used by the local renderer before built-in TTS."
    });
    pushGenerated(generatedFiles, voiceoverFolder, reportPath);
    return {
      ok: Boolean(report?.ok),
      provider: ttsProvider,
      reportPath,
      folder: voiceoverFolder,
      generatedCount: report?.generatedCount || 0,
      existingCount: report?.existingCount || 0,
      error: report?.error || ""
    };
  } catch (error) {
    steps.push({
      name: "natural_voiceover_generation",
      ok: false,
      provider: ttsProvider,
      report: reportPath,
      error: error.message
    });
    return {
      ok: false,
      provider: ttsProvider,
      reportPath,
      folder: voiceoverFolder,
      error: error.message
    };
  }
}

async function createAvatarPackAndMaybeClips(result, steps, generatedFiles) {
  const hasImages = String(creatorImages || "").trim() !== "";
  if (!hasImages) {
    return {
      ok: false,
      skipped: true,
      provider: avatarClipProvider
    };
  }

  const avatarPack = await writeAvatarReferencePack(result.runDir, result.scenePlan, {
    images: creatorImages,
    providers: avatarProviderPackProviders,
    scenes: args["avatar-scenes"] || defaultAvatarScenes
  });
  steps.push({
    name: "avatar_reference_pack",
    ok: true,
    folder: avatarPack.folder,
    referenceDir: avatarPack.referenceDir,
    referenceImages: avatarPack.referenceImages.length,
    providers: avatarPack.providers,
    scenes: avatarPack.scenes,
    note: "Avatar image reference pack prepared. Generated clips should be saved in vids-clips/scene-XX.mp4."
  });
  pushGenerated(generatedFiles, avatarPack.folder, avatarPack.referenceDir, avatarPack.manifestPath);

  const resultPayload = {
    ok: true,
    provider: avatarClipProvider,
    folder: avatarPack.folder,
    referenceDir: avatarPack.referenceDir,
    manifestPath: avatarPack.manifestPath,
    referenceImages: avatarPack.referenceImages,
    generationReportPath: ""
  };

  if (!generateAvatarClips) {
    return {
      ...resultPayload,
      generated: false
    };
  }

  const avatarArgs = [
    "src/generate-avatar-clips.mjs",
    "--tool-dir", result.runDir,
    "--provider", avatarClipProvider,
    "--scenes", args["avatar-scenes"] || defaultAvatarScenes
  ];
  if (args["heygen-voice-id"] || args["voice-id"]) {
    avatarArgs.push("--voice-id", String(args["heygen-voice-id"] || args["voice-id"]));
  }
  const reportPath = path.join(result.runDir, "avatar-generation", `${avatarClipProvider}-generation-report.json`);
  try {
    await runNodeScript(`avatar-generate:${avatarClipProvider}`, avatarArgs[0], avatarArgs.slice(1));
    const report = await readJsonIfExists(reportPath);
    steps.push({
      name: "avatar_clip_generation",
      ok: Boolean(report?.ok),
      provider: avatarClipProvider,
      report: reportPath,
      generatedCount: report?.generated?.length || 0,
      note: "Generated avatar clips are cached in vids-clips and used by the local renderer."
    });
    pushGenerated(generatedFiles, reportPath, ...(report?.generated || []).flatMap((item) => [item.outputPath, item.cachedPath]).filter(Boolean));
    return {
      ...resultPayload,
      generated: Boolean(report?.ok),
      generationReportPath: reportPath,
      generatedCount: report?.generated?.length || 0,
      error: report?.error || ""
    };
  } catch (error) {
    steps.push({
      name: "avatar_clip_generation",
      ok: false,
      provider: avatarClipProvider,
      report: reportPath,
      error: error.message
    });
    return {
      ...resultPayload,
      generated: false,
      generationReportPath: reportPath,
      error: error.message
    };
  }
}

async function cacheExportForLocalRender(result, steps, sourcePath, options = {}) {
  if (!sourcePath || !await accessOrNull(sourcePath)) {
    return null;
  }
  const cached = await cacheVidsExport({
    toolDir: result.runDir,
    sourcePath,
    kind: options.kind || "full_export",
    profile: options.profile || "",
    scenes: options.scenes || result.scenePlan.scenes.map((scene) => Number(scene.scene_number)).filter(Number.isFinite),
    note: options.note || ""
  });
  if (cached?.cachedPath) {
    steps.push({
      name: options.kind === "partial_export" ? "cache_partial_google_vids_export" : "cache_google_vids_export",
      ok: true,
      savedPath: cached.cachedPath,
      cacheDir: cached.cacheDir,
      scenes: cached.entry.coveredScenes,
      note: options.note || ""
    });
  }
  return cached;
}

async function tryPartialExportForCache({ result, steps, vidsUrl, profileDir, profileLabel, partialGeneratedScenes, exportOutputDir }) {
  if (!vidsUrl || !partialGeneratedScenes.length || args["no-export"] || args["no-partial-export"]) {
    return null;
  }

  const partialOutputDir = path.join(exportOutputDir, "partial-cache");
  const partialExportArgs = [
    "src/google-vids-export.mjs",
    "--url", vidsUrl,
    "--output", partialOutputDir,
    "--timeout", String(args["export-timeout"] || 600000),
    "--filename", `${result.slug}-partial-google-vids-export.mp4`,
    "--profile", profileDir
  ];

  try {
    await runNodeScript(`partial-export:${profileLabel}`, partialExportArgs[0], partialExportArgs.slice(1));
    const partialExportReportPath = path.join(partialOutputDir, "google-vids-export-report.json");
    const partialExportReport = await readJson(partialExportReportPath);
    const savedPath = partialExportReport.savedPath || "";
    if (!partialExportReport.ok || !savedPath) {
      throw new Error(partialExportReport.error || "Partial Google Vids export did not save an MP4.");
    }
    const cached = await cacheExportForLocalRender(result, steps, savedPath, {
      kind: "partial_export",
      profile: profileDir,
      scenes: partialGeneratedScenes,
      note: `Partial Google Vids export cached after generation stopped. Inserted scenes: ${partialGeneratedScenes.join(", ")}.`
    });
    steps.push({
      name: "partial_google_vids_export",
      ok: true,
      report: partialExportReportPath,
      savedPath,
      cachedPath: cached?.cachedPath || ""
    });
    return {
      reportPath: partialExportReportPath,
      savedPath,
      cachedPath: cached?.cachedPath || ""
    };
  } catch (error) {
    const partialExportReportPath = path.join(partialOutputDir, "google-vids-export-report.json");
    const existingPartialReport = await accessOrNull(partialExportReportPath);
    steps.push({
      name: "partial_google_vids_export_failed",
      ok: false,
      report: existingPartialReport || "",
      scenes: partialGeneratedScenes,
      error: error.message
    });
    return null;
  }
}

async function generateVidsSceneClipsForProfile({
  result,
  steps,
  generatedFiles,
  cachedVidsClips,
  profileDir,
  profileLabel,
  profileIndex
}) {
  const sceneNumbers = selectedVidsSceneNumbers(result.scenePlan);
  const defaultIngredientScenes = config.googleVids?.defaultIngredientScenes || "3,4,5";
  const sceneResults = [];
  if (!sceneNumbers.length) {
    throw new Error("No Google Vids scene numbers selected for scene clip generation.");
  }

  for (const sceneNumber of sceneNumbers) {
    const token = sceneToken(sceneNumber);
    const sceneFolder = path.join(result.files.vidsGeneratedScenesPath || path.join(result.runDir, "vids-generated-scenes"), `scene-${token}`);
    const vidsOutputDir = path.join(sceneFolder, `google-vids-run-${profileLabel}`);
    const exportOutputDir = path.join(sceneFolder, `google-vids-export-${profileLabel}`);
    const vidsReportPath = path.join(vidsOutputDir, "vids-operator-report.json");
    const exportReportPath = path.join(exportOutputDir, "google-vids-export-report.json");
    const sceneClipPath = path.join(sceneFolder, `google-vids-scene-${token}.mp4`);
    const vidsArgs = [
      "src/google-vids-operate.mjs",
      "--tool-dir", result.runDir,
      "--scene", String(sceneNumber),
      "--max-scenes", "1",
      "--output", vidsOutputDir,
      "--profile", profileDir
    ];

    if (!args["no-ingredients"]) {
      vidsArgs.push(
        "--ingredients", args.ingredients || "auto",
        "--ingredients-scenes", args["ingredients-scenes"] || defaultIngredientScenes
      );
    }
    if (avatarMode) {
      vidsArgs.push("--avatar", avatarMode);
    }
    if (avatarMode && (args["avatar-scenes"] || defaultAvatarScenes)) {
      vidsArgs.push("--avatar-scenes", String(args["avatar-scenes"] || defaultAvatarScenes));
    }
    if (args["skip-portrait"]) {
      vidsArgs.push("--skip-portrait");
    }
    vidsArgs.push("--submit", "--insert", "--after-submit-wait", String(args["after-submit-wait"] || 120000));

    await ensureDir(sceneFolder);
    console.log(`Generating Google Vids scene clip ${sceneNumber}/${sceneNumbers.at(-1)} with profile ${profileDir}`);
    await runNodeScript(`vids-scene-${token}:${profileLabel}`, vidsArgs[0], vidsArgs.slice(1));
    const vidsReport = await readJson(vidsReportPath);
    const sceneVidsUrl = vidsReport.currentUrl || "";
    if (!vidsReport.ok) {
      throw new Error(vidsReport.error || `Google Vids did not complete Scene ${sceneNumber}.`);
    }

    await archiveGeneratedDirectory(result, steps, generatedFiles, {
      sourceDir: vidsOutputDir,
      category: "google-vids-scenes",
      folderName: `${profileLabel}-scene-${token}`,
      label: `Google Vids Scene ${sceneNumber} browser run`,
      note: "Scene-level Google Vids run saved for audit.",
      stepName: "archive_google_vids_scene_run"
    });

    if (args["no-export"]) {
      sceneResults.push({
        sceneNumber,
        ok: true,
        vidsUrl: sceneVidsUrl,
        report: vidsReportPath,
        exportSkipped: true
      });
      steps.push({
        name: "google_vids_scene_clip",
        profile: profileDir,
        attempt: profileIndex + 1,
        sceneNumber,
        ok: true,
        url: sceneVidsUrl,
        report: vidsReportPath,
        exportSkipped: true
      });
      continue;
    }

    const exportArgs = [
      "src/google-vids-export.mjs",
      "--url", sceneVidsUrl,
      "--output", exportOutputDir,
      "--timeout", String(args["export-timeout"] || 600000),
      "--filename", `google-vids-scene-${token}.mp4`,
      "--profile", profileDir
    ];
    await runNodeScript(`export-scene-${token}:${profileLabel}`, exportArgs[0], exportArgs.slice(1));
    const exportReport = await readJson(exportReportPath);
    const exportedPath = exportReport.savedPath || "";
    if (!exportReport.ok || !exportedPath) {
      throw new Error(exportReport.error || `Google Vids Scene ${sceneNumber} export did not save an MP4.`);
    }

    await fs.copyFile(exportedPath, sceneClipPath);
    const cached = await cacheVidsSceneClip({
      toolDir: result.runDir,
      sourcePath: sceneClipPath,
      sceneNumber,
      profile: profileDir,
      note: `Scene ${sceneNumber} generated in Google Vids and cached for local merge.`
    });
    if (cached?.cachedPath) {
      cachedVidsClips.push(cached.cachedPath);
      pushGenerated(generatedFiles, cached.cachedPath);
    }
    pushGenerated(generatedFiles, sceneClipPath);

    await archiveGeneratedDirectory(result, steps, generatedFiles, {
      sourceDir: exportOutputDir,
      category: "google-vids-scene-exports",
      folderName: `${profileLabel}-scene-${token}`,
      label: `Google Vids Scene ${sceneNumber} export`,
      note: "Scene-level Google Vids MP4 export saved for audit.",
      stepName: "archive_google_vids_scene_export"
    });

    sceneResults.push({
      sceneNumber,
      ok: true,
      vidsUrl: sceneVidsUrl,
      report: vidsReportPath,
      exportReport: exportReportPath,
      exportedPath,
      sceneClipPath,
      cachedPath: cached?.cachedPath || ""
    });
    steps.push({
      name: "google_vids_scene_clip",
      profile: profileDir,
      attempt: profileIndex + 1,
      sceneNumber,
      ok: true,
      url: sceneVidsUrl,
      report: vidsReportPath,
      exportReport: exportReportPath,
      savedPath: sceneClipPath,
      cachedPath: cached?.cachedPath || ""
    });
  }

  return {
    ok: true,
    sceneNumbers,
    scenes: sceneResults,
    vidsUrls: sceneResults.map((item) => item.vidsUrl).filter(Boolean),
    cachedPaths: sceneResults.map((item) => item.cachedPath).filter(Boolean),
    downloadedPaths: sceneResults.map((item) => item.sceneClipPath).filter(Boolean)
  };
}

async function archiveGeneratedDirectory(result, steps, generatedFiles, options = {}) {
  const entry = await mirrorGeneratedDirectory({
    toolDir: result.runDir,
    sourceDir: options.sourceDir,
    category: options.category || "misc",
    folderName: options.folderName || "",
    label: options.label || "",
    note: options.note || ""
  });
  if (!entry) {
    return null;
  }
  pushGenerated(generatedFiles, entry.destinationPath);
  steps.push({
    name: options.stepName || "archive_generated_directory",
    ok: true,
    sourcePath: entry.sourcePath,
    savedPath: entry.destinationPath,
    category: entry.category,
    note: options.note || ""
  });
  return entry;
}

async function archiveGeneratedFile(result, steps, generatedFiles, options = {}) {
  const entry = await mirrorGeneratedFile({
    toolDir: result.runDir,
    sourcePath: options.sourcePath,
    category: options.category || "misc",
    fileName: options.fileName || "",
    label: options.label || "",
    note: options.note || ""
  });
  if (!entry) {
    return null;
  }
  pushGenerated(generatedFiles, entry.destinationPath);
  steps.push({
    name: options.stepName || "archive_generated_file",
    ok: true,
    sourcePath: entry.sourcePath,
    savedPath: entry.destinationPath,
    category: entry.category,
    note: options.note || ""
  });
  return entry;
}

async function updateSourceWorkbookIfRequested(steps) {
  if (!args["update-source-workbook"]) {
    return null;
  }

  if (path.extname(inputPath).toLowerCase() !== ".xlsx") {
    const message = "Source workbook write-back is only supported for .xlsx files.";
    steps.push({ name: "source_workbook_update_skipped", ok: false, reason: message });
    return { ok: false, skipped: true, error: message };
  }

  const backupDir = path.join(batchDir, "source-workbook-backups");
  await ensureDir(backupDir);
  const sourceBase = path.basename(inputPath, path.extname(inputPath))
    .replace(/[/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "-")
    .toLowerCase() || "source-workbook";
  const backupPath = path.join(backupDir, `${sourceBase}-${new Date().toISOString().replace(/[:.]/g, "-")}.xlsx`);

  try {
    await fs.copyFile(inputPath, backupPath);
    await fs.copyFile(preparedWorkbookPath, inputPath);
    steps.push({
      name: "source_workbook_updated",
      ok: true,
      sourceWorkbook: inputPath,
      backupPath,
      preparedWorkbook: preparedWorkbookPath
    });
    return {
      ok: true,
      sourceWorkbook: inputPath,
      backupPath
    };
  } catch (error) {
    steps.push({
      name: "source_workbook_update_failed",
      ok: false,
      sourceWorkbook: inputPath,
      backupPath,
      error: error.message
    });
    return {
      ok: false,
      sourceWorkbook: inputPath,
      backupPath,
      error: error.message
    };
  }
}

async function main() {
  await ensureDir(batchDir);

  if (requestedLimit !== 1) {
    console.warn("agent:one-video always creates one video from one selected row. Use --limit 1 here, or use npm run batch for multi-row prep.");
  }

  const workbook = await readAgentWorkbook(inputPath);
  const table = workbook.table;
  const normalizedRows = workbook.normalizedRows;
  const selectedRow = selectedRowFrom(normalizedRows);
  const steps = [];

  console.log(`One-video agent input: ${inputPath}`);
  console.log(`Selected Excel row: ${selectedRow.source_row_number}`);
  console.log(`Tool: ${selectedRow.tool_name}`);
  console.log(`Tool URL: ${selectedRow.tool_url}`);
  console.log(`Output: ${batchDir}`);
  if (workbook.largeFileMode) {
    console.log(`Large workbook mode: ${workbook.analysis?.detectedToolRows || normalizedRows.length} tool rows analyzed safely`);
  }
  console.log("Video limit: 1 selected Excel row");
  console.log(`Mode: ${prepOnly ? "script/assets prep only" : localOnly ? "local-only render" : generateInVids ? "Google Vids generate/export" : "dry-run prep + prompt fill"}`);
  console.log(`Reel structure: ${reelConfig.sceneCount} scenes, ${reelConfig.totalDurationSeconds}s total`);
  console.log(`Free provider pack: ${freeVideoProviders}`);

  const result = await processToolRow(selectedRow, batchDir, config, {
    capture: shouldCapture,
    useAi,
    aiProvider,
    aiModel,
    sceneCount: reelConfig.sceneCount,
    freeVideoProviders
  });
  const vidsClipCacheFolder = await ensureVidsClipCache(result.runDir);
  const generatedFolder = await ensureGeneratedArchive(result.runDir);
  const cachedVidsClips = [];
  const generatedFiles = [];
  const voiceoverPack = await createVoiceoverPack(result, steps, generatedFiles);
  const avatarPack = await createAvatarPackAndMaybeClips(result, steps, generatedFiles);
  const naturalVoiceover = await generateNaturalVoiceovers(result, steps, generatedFiles);

  steps.push({
    name: "data_prep",
    toolDir: result.runDir,
    scenePlan: result.files.scenePlanPath,
    capturedFiles: result.capture.files.length
  });
  await writePreparedWorkbook(table, normalizedRows, selectedRow, result, {
    vidsStatus: prepOnly ? "Prepared; video skipped" : localOnly ? "Prepared; local render pending" : generateInVids ? "Prepared; Google Vids pending" : "Prompt dry-run pending",
    vidsClipCacheFolder,
    freeVideoProviderPackFolder: result.files.freeVideoProviderPackPath || "",
    freeVideoProviderPrompts: result.files.freeVideoProviderPromptsPath || "",
    voiceoverPackFolder: voiceoverPack.voiceoverPackFolder,
    voiceoverRecordingScript: voiceoverPack.voiceoverRecordingScript,
    avatarReferencePackFolder: avatarPack.folder || "",
    avatarReferenceFolder: avatarPack.referenceDir || "",
    avatarGenerationReportPath: avatarPack.generationReportPath || "",
    naturalVoiceoverFolder: naturalVoiceover.folder || "",
    naturalVoiceoverReportPath: naturalVoiceover.reportPath || "",
    cachedVidsClips,
    generatedFolder,
    generatedFiles,
    qaStatus: "Needs human review"
  });

  let vidsUrl = "";
  let exportReportPath = "";
  let mp4Path = "";
  let fallback = "";
  let fallbackReportPath = "";
  let googleVidsError = "";
  let activeVidsProfile = "";
  let partialGeneratedScenes = [];
  let vidsSceneClips = [];
  let vidsSceneUrls = [];
  const vidsProfiles = vidsProfilesFromArgs();
  const vidsProfilesTried = [];
  let googleVidsStatus = prepOnly ? "Script/assets prepared; video skipped" : localOnly ? "Local MP4 rendered" : generateInVids ? "Generated; export pending" : "Dry-run prompt fill complete";
  let qaStatus = prepOnly ? "Prep only; render or generate before posting" : generateInVids || localOnly ? "Needs final human review before posting" : "Dry-run only";
  let qualityReportPath = "";
  let qualityScore = 0;
  let qualityStatus = "";
  let qualityWarnings = [];
  let driveSync = null;
  let driveSyncError = "";
  let sourceWorkbookUpdate = null;
  const finalWorkbookPayload = () => ({
    vidsStatus: googleVidsStatus,
    vidsUrl,
    vidsClipCacheFolder,
    cachedVidsClips,
    generatedFolder,
    generatedFiles,
    mp4Path,
    qaStatus,
    qualityReportPath,
    qualityScore,
    qualityStatus,
    qualityWarnings,
    driveSyncStatus: driveSync?.status || (driveSyncError ? `Drive sync failed: ${driveSyncError}` : driveSyncDir ? (mp4Path ? "Drive sync pending" : "Skipped; no final MP4") : "Not uploaded"),
    driveVideoPath: driveSync?.driveVideoPath || "",
    driveFolderPath: driveSync?.driveFolderPath || "",
    driveManifestPath: driveSync?.driveManifestPath || "",
    voiceoverPackFolder: voiceoverPack.voiceoverPackFolder,
    voiceoverRecordingScript: voiceoverPack.voiceoverRecordingScript,
    avatarReferencePackFolder: avatarPack.folder || "",
    avatarReferenceFolder: avatarPack.referenceDir || "",
    avatarGenerationReportPath: avatarPack.generationReportPath || "",
    naturalVoiceoverFolder: naturalVoiceover.folder || "",
    naturalVoiceoverReportPath: naturalVoiceover.reportPath || "",
    sourceWorkbookUpdate
  });
  const applyQualityFromRender = (localRender) => {
    qualityReportPath = localRender.qualityReportPath || "";
    qualityScore = localRender.qualityScore || 0;
    qualityStatus = localRender.qualityStatus || "";
    qualityWarnings = Array.isArray(localRender.qualityWarnings) ? localRender.qualityWarnings : [];
  };

  if (prepOnly) {
    steps.push({
      name: "prep_only",
      ok: true,
      note: "Script, prompts, captions, screenshots, recordings, and free provider packs prepared without rendering or Google Vids generation."
    });
  } else if (localOnly) {
    const localRender = await renderLocalReel(result, steps, generatedFiles, "local-only mode", "Local MP4 rendered");
    mp4Path = localRender.mp4Path;
    fallback = "local_remotion";
    fallbackReportPath = localRender.reportPath;
    googleVidsStatus = localRender.status;
    qaStatus = localRender.qaStatus;
    applyQualityFromRender(localRender);
  } else {
    const profilesToTry = generateInVids ? vidsProfiles : vidsProfiles.slice(0, 1);
    console.log(`Google Vids profiles configured: ${profilesToTry.join(", ")}`);

    for (let profileIndex = 0; profileIndex < profilesToTry.length; profileIndex += 1) {
      const profileDir = profilesToTry[profileIndex];
      const profileLabel = safeProfileLabel(profileDir, profileIndex);
      const vidsOutputDir = path.join(batchDir, "google-vids", profileLabel);
      const targetForProfile = profileIndex === 0 || args["reuse-url-on-fallback"] ? args.url : "";
      const vidsReportPath = path.join(vidsOutputDir, "vids-operator-report.json");
      const exportOutputDir = path.join(batchDir, "export", profileLabel);
      const canTryNextProfile = generateInVids && profileIndex < profilesToTry.length - 1;
      const defaultIngredientScenes = config.googleVids?.defaultIngredientScenes || "3,4,5";
      activeVidsProfile = profileDir;
      vidsProfilesTried.push(profileDir);
      googleVidsError = "";
      mp4Path = "";
      console.log(`Trying Google Vids profile ${profileIndex + 1}/${profilesToTry.length}: ${profileDir}`);

      if (useVidsSceneClips) {
        try {
          const sceneClipRun = await generateVidsSceneClipsForProfile({
            result,
            steps,
            generatedFiles,
            cachedVidsClips,
            profileDir,
            profileLabel,
            profileIndex
          });
          vidsSceneClips = sceneClipRun.scenes;
          vidsSceneUrls = sceneClipRun.vidsUrls;
          vidsUrl = vidsSceneUrls[0] || "";
          partialGeneratedScenes = [];
          steps.push({
            name: "google_vids_scene_clips_complete",
            profile: profileDir,
            attempt: profileIndex + 1,
            ok: true,
            sceneNumbers: sceneClipRun.sceneNumbers,
            cachedPaths: sceneClipRun.cachedPaths,
            downloadedPaths: sceneClipRun.downloadedPaths
          });
          break;
        } catch (error) {
          googleVidsError = error.message;
          partialGeneratedScenes = sceneNumbersFromClipPaths(cachedVidsClips);
          steps.push({
            name: "google_vids_scene_clips_failed",
            profile: profileDir,
            attempt: profileIndex + 1,
            ok: false,
            insertedScenes: partialGeneratedScenes,
            willTryNextProfile: canTryNextProfile,
            error: error.message
          });
          if (canTryNextProfile) {
            console.warn(`Google Vids scene clip generation failed on profile ${profileDir}. Trying next configured profile.`);
            continue;
          }
          if (!allowLocalFallback) {
            throw error;
          }
        }

        break;
      }

      const vidsArgs = [
        "src/google-vids-operate.mjs",
        "--tool-dir", result.runDir,
        "--all-scenes",
        "--max-scenes", String(maxScenes),
        "--output", vidsOutputDir,
        "--profile", profileDir
      ];

      if (!args["no-ingredients"]) {
        vidsArgs.push(
          "--ingredients", args.ingredients || "auto",
          "--ingredients-scenes", args["ingredients-scenes"] || defaultIngredientScenes
        );
      }

      if (avatarMode) {
        vidsArgs.push("--avatar", avatarMode);
      }
      if (avatarMode && (args["avatar-scenes"] || defaultAvatarScenes)) {
        vidsArgs.push("--avatar-scenes", String(args["avatar-scenes"] || defaultAvatarScenes));
      }

      if (args["from-scene"]) {
        vidsArgs.push("--from-scene", String(args["from-scene"]));
      }
      if (args["to-scene"]) {
        vidsArgs.push("--to-scene", String(args["to-scene"]));
      }
      if (targetForProfile) {
        vidsArgs.push("--url", targetForProfile);
      }
      if (args["skip-portrait"]) {
        vidsArgs.push("--skip-portrait");
      }
      if (generateInVids) {
        vidsArgs.push("--submit", "--insert", "--after-submit-wait", String(args["after-submit-wait"] || 120000));
      }

      try {
        await runNodeScript(`vids:${profileLabel}`, vidsArgs[0], vidsArgs.slice(1));
        const vidsReport = await readJson(vidsReportPath);
        vidsUrl = vidsReport.currentUrl || targetForProfile || "";
        await archiveGeneratedDirectory(result, steps, generatedFiles, {
          sourceDir: vidsOutputDir,
          category: "google-vids",
          folderName: profileLabel,
          label: "Google Vids browser run",
          note: "Google Vids prompts, screenshots, page states, and operator report.",
          stepName: "archive_google_vids_run"
        });
        if (!vidsReport.ok) {
          throw new Error(vidsReport.error || "Google Vids did not complete all requested scenes.");
        }
        partialGeneratedScenes = [];

        steps.push({
          name: "google_vids",
          profile: profileDir,
          attempt: profileIndex + 1,
          report: vidsReportPath,
          ok: vidsReport.ok,
          url: vidsUrl,
          sceneNumbers: vidsReport.sceneNumbers
        });

        if (generateInVids && !args["no-export"]) {
          const exportArgs = [
            "src/google-vids-export.mjs",
            "--url", vidsUrl,
            "--output", exportOutputDir,
            "--timeout", String(args["export-timeout"] || 600000),
            "--filename", `${result.slug}-final-reel.mp4`,
            "--profile", profileDir
          ];

          await runNodeScript(`export:${profileLabel}`, exportArgs[0], exportArgs.slice(1));
          exportReportPath = path.join(exportOutputDir, "google-vids-export-report.json");
          const exportReport = await readJson(exportReportPath);
          mp4Path = exportReport.savedPath || "";
          if (!exportReport.ok || !mp4Path) {
            throw new Error(exportReport.error || "Google Vids export did not save an MP4.");
          }
          await archiveGeneratedDirectory(result, steps, generatedFiles, {
            sourceDir: exportOutputDir,
            category: "google-vids-export",
            folderName: profileLabel,
            label: "Google Vids export",
            note: "Google Vids export output and export report.",
            stepName: "archive_google_vids_export"
          });
          const allSceneNumbers = validSceneNumbers(result.scenePlan.scenes);
          const exportedSceneNumbers = validSceneNumbers(vidsReport.sceneNumbers).length
            ? validSceneNumbers(vidsReport.sceneNumbers)
            : allSceneNumbers.slice(0, Math.min(maxScenes, allSceneNumbers.length));
          const exportedEveryScene = allSceneNumbers.length > 0
            && exportedSceneNumbers.length >= allSceneNumbers.length
            && allSceneNumbers.every((sceneNumber) => exportedSceneNumbers.includes(sceneNumber));
          const cacheKind = exportedEveryScene ? "full_export" : "partial_export";
          const cached = await cacheExportForLocalRender(result, steps, mp4Path, {
            kind: cacheKind,
            profile: profileDir,
            scenes: exportedSceneNumbers,
            note: exportedEveryScene
              ? "Full Google Vids MP4 cached for future local renders."
              : `Google Vids MP4 cached for generated scene(s): ${exportedSceneNumbers.join(", ")}.`
          });
          if (cached?.cachedPath) {
            cachedVidsClips.push(cached.cachedPath);
            pushGenerated(generatedFiles, cached.cachedPath);
          }

          steps.push({
            name: "mp4_export",
            profile: profileDir,
            attempt: profileIndex + 1,
            report: exportReportPath,
            ok: exportReport.ok,
            savedPath: mp4Path
          });
        }

        break;
      } catch (error) {
        googleVidsError = error.message;
        await archiveGeneratedDirectory(result, steps, generatedFiles, {
          sourceDir: vidsOutputDir,
          category: "google-vids",
          folderName: profileLabel,
          label: "Google Vids failed browser run",
          note: "Google Vids attempt outputs saved even though generation/export failed.",
          stepName: "archive_google_vids_failed_run"
        });
        const partialReport = await readJsonIfExists(vidsReportPath);
        const partialExportReportPath = path.join(exportOutputDir, "google-vids-export-report.json");
        const partialExportReport = await readJsonIfExists(partialExportReportPath);
        vidsUrl = partialReport?.currentUrl || targetForProfile || "";
        partialGeneratedScenes = (partialReport?.steps || [])
          .filter((step) => step.name === "insert_generated_clip" && step.clicked)
          .map((step) => Number(step.sceneNumber))
          .filter(Number.isFinite);
        const partialCache = await tryPartialExportForCache({
          result,
          steps,
          vidsUrl,
          profileDir,
          profileLabel,
          partialGeneratedScenes,
          exportOutputDir
        });
        if (partialCache?.cachedPath) {
          cachedVidsClips.push(partialCache.cachedPath);
          pushGenerated(generatedFiles, partialCache.cachedPath);
        }
        await archiveGeneratedDirectory(result, steps, generatedFiles, {
          sourceDir: exportOutputDir,
          category: "google-vids-export",
          folderName: profileLabel,
          label: "Google Vids failed/partial export",
          note: "Export folder saved for debugging and partial reuse when present.",
          stepName: "archive_google_vids_failed_export"
        });

        steps.push({
          name: "google_vids_attempt_failed",
          profile: profileDir,
          attempt: profileIndex + 1,
          report: partialReport ? vidsReportPath : "",
          exportReport: partialExportReport ? partialExportReportPath : "",
          ok: false,
          url: vidsUrl,
          sceneNumbers: partialReport?.sceneNumbers || [],
          insertedScenes: partialGeneratedScenes,
          savedPath: partialExportReport?.savedPath || "",
          willTryNextProfile: canTryNextProfile,
          error: error.message
        });

        if (canTryNextProfile) {
          console.warn(`Google Vids failed on profile ${profileDir}. Trying next configured profile.`);
          continue;
        }

        if (!allowLocalFallback) {
          throw error;
        }
      }

      break;
    }

    if (generateInVids && useVidsSceneClips && !googleVidsError && !args["no-export"]) {
      const localMerge = await renderLocalReel(
        result,
        steps,
        generatedFiles,
          hookVidsFirst ? "Google Vids hook clip downloaded" : "Google Vids scene clips downloaded",
          hookVidsFirst
            ? "Google Vids hook clip downloaded; local MP4 merged with real tool assets"
            : "Google Vids scene clips downloaded; local MP4 merged"
      );
      mp4Path = localMerge.mp4Path;
      fallback = hookVidsFirst ? "local_hook_vids_merge" : "local_scene_clip_merge";
      fallbackReportPath = localMerge.reportPath;
      applyQualityFromRender(localMerge);
      googleVidsStatus = hookVidsFirst
        ? "Hook Vids clip downloaded; local MP4 merged"
        : "Scene clips downloaded; local MP4 merged";
      qaStatus = hookVidsFirst
        ? "Local MP4 merged from first Vids hook plus real tool assets; final human review needed before posting"
        : "Local MP4 merged from Vids scene clips; final human review needed before posting";
    } else if (generateInVids && googleVidsError && allowLocalFallback) {
      const fallbackStatus = partialGeneratedScenes.length
        ? `Google Vids inserted scenes ${partialGeneratedScenes.join(", ")} but failed before final export; local MP4 rendered`
        : "Google Vids failed; local MP4 rendered";
      const localFallback = await renderLocalReel(result, steps, generatedFiles, googleVidsError, fallbackStatus);
      mp4Path = localFallback.mp4Path;
      fallback = "local_remotion";
      fallbackReportPath = localFallback.reportPath;
      googleVidsStatus = localFallback.status;
      qaStatus = localFallback.qaStatus;
      applyQualityFromRender(localFallback);
    } else if (generateInVids && useVidsSceneClips && args["no-export"]) {
      googleVidsStatus = "Scene prompts generated; export skipped";
      qaStatus = "Needs scene MP4 export and final local merge";
    } else if (generateInVids && mp4Path) {
      googleVidsStatus = "Generated and exported";
      qaStatus = "Needs final human review before posting";
    } else if (generateInVids && args["no-export"]) {
      googleVidsStatus = "Generated; export skipped";
      qaStatus = "Needs MP4 export and final human review";
    }
  }

  await writePreparedWorkbook(table, normalizedRows, selectedRow, result, finalWorkbookPayload());

  const preparedWorkbookCopy = await archiveGeneratedFile(result, steps, generatedFiles, {
    sourcePath: preparedWorkbookPath,
    category: "agent",
    fileName: "prepared-tool-reel-workbook.xlsx",
    label: "Prepared workbook",
    note: "Prepared workbook copy saved inside the selected tool folder.",
    stepName: "archive_prepared_workbook"
  });

  const report = {
    ok: true,
    mode: prepOnly ? "prep_only" : localOnly ? "local_only" : generateInVids ? "generate_export" : "dry_run",
    requestedLimit,
    processedVideos: 1,
    input: inputPath,
    outputDir: batchDir,
    preparedWorkbook: preparedWorkbookPath,
    selectedRow: {
      source_row_number: selectedRow.source_row_number,
      tool_name: selectedRow.tool_name,
      tool_url: selectedRow.tool_url
    },
    toolDir: result.runDir,
    vidsUrl,
    hookVidsFirst,
    hookAvatarStyle,
    vidsSceneClipMode: useVidsSceneClips,
    vidsSceneUrls,
    vidsSceneClips,
    vidsProfile: activeVidsProfile,
    vidsProfilesTried,
    mp4Path,
    fallback,
    fallbackReportPath,
    vidsClipCacheFolder,
    freeVideoProviderPackFolder: result.files.freeVideoProviderPackPath || "",
    freeVideoProviderPrompts: result.files.freeVideoProviderPromptsPath || "",
    voiceoverPackFolder: voiceoverPack.voiceoverPackFolder,
    voiceoverRecordingScript: voiceoverPack.voiceoverRecordingScript,
    voiceoverPackOk: voiceoverPack.ok,
    voiceoverPackError: voiceoverPack.error || "",
    naturalVoiceoverProvider: naturalVoiceover.provider || ttsProvider,
    naturalVoiceoverFolder: naturalVoiceover.folder || "",
    naturalVoiceoverReportPath: naturalVoiceover.reportPath || "",
    naturalVoiceoverOk: naturalVoiceover.ok || false,
    naturalVoiceoverError: naturalVoiceover.error || "",
    avatarReferencePackFolder: avatarPack.folder || "",
    avatarReferenceFolder: avatarPack.referenceDir || "",
    avatarReferenceImages: avatarPack.referenceImages || [],
    avatarGenerationReportPath: avatarPack.generationReportPath || "",
    avatarGenerationProvider: avatarPack.provider || avatarClipProvider,
    avatarGenerationError: avatarPack.error || "",
    cachedVidsClips,
    generatedFolder,
    generatedFiles,
    qualityReportPath,
    qualityScore,
    qualityStatus,
    qualityWarnings,
    qaStatus,
    preparedWorkbookCopy: preparedWorkbookCopy?.destinationPath || "",
    agentReportCopy: "",
    googleVidsError,
    partialGeneratedScenes,
    steps
  };

  await writeJson(reportPath, report);
  if (driveSyncDir && mp4Path) {
    try {
      driveSync = await syncToolOutputToDrive({
        rootDir: driveSyncDir,
        result,
        mp4Path,
        preparedWorkbookPath,
        reportPath,
        generatedFiles
      });
      steps.push({
        name: "drive_sync",
        ok: true,
        driveFolderPath: driveSync.driveFolderPath,
        driveVideoPath: driveSync.driveVideoPath,
        report: driveSync.driveManifestPath
      });
    } catch (error) {
      driveSyncError = error.message;
      steps.push({
        name: "drive_sync_failed",
        ok: false,
        rootDir: driveSyncDir,
        error: error.message
      });
    }
  }
  Object.assign(report, {
    driveSyncDir,
    driveSyncStatus: driveSync?.status || (driveSyncError ? "failed" : driveSyncDir ? "skipped" : "disabled"),
    driveSyncError,
    driveFolderPath: driveSync?.driveFolderPath || "",
    driveVideoPath: driveSync?.driveVideoPath || "",
    driveManifestPath: driveSync?.driveManifestPath || "",
    sourceWorkbookUpdate
  });
  await writeJson(reportPath, report);
  const agentReportCopy = await archiveGeneratedFile(result, steps, generatedFiles, {
    sourcePath: reportPath,
    category: "agent",
    fileName: "one-video-agent-report.json",
    label: "One-video agent report",
    note: "Final one-video run report copy saved inside the selected tool folder.",
    stepName: "archive_agent_report"
  });
  report.agentReportCopy = agentReportCopy?.destinationPath || "";
  report.generatedFiles = generatedFiles;
  await writeJson(reportPath, report);
  await mirrorGeneratedFile({
    toolDir: result.runDir,
    sourcePath: reportPath,
    category: "agent",
    fileName: "one-video-agent-report.json",
    label: "One-video agent report",
    note: "Final one-video run report copy saved inside the selected tool folder."
  });
  await writePreparedWorkbook(table, normalizedRows, selectedRow, result, finalWorkbookPayload());
  await mirrorGeneratedFile({
    toolDir: result.runDir,
    sourcePath: preparedWorkbookPath,
    category: "agent",
    fileName: "prepared-tool-reel-workbook.xlsx",
    label: "Prepared workbook",
    note: "Final prepared workbook copy saved inside the selected tool folder."
  });
  sourceWorkbookUpdate = await updateSourceWorkbookIfRequested(steps);
  report.sourceWorkbookUpdate = sourceWorkbookUpdate;
  await writeJson(reportPath, report);
  if (driveSyncDir && mp4Path && !driveSyncError) {
    driveSync = await syncToolOutputToDrive({
      rootDir: driveSyncDir,
      result,
      mp4Path,
      preparedWorkbookPath,
      reportPath,
      generatedFiles
    });
    Object.assign(report, {
      driveSyncStatus: driveSync.status,
      driveFolderPath: driveSync.driveFolderPath,
      driveVideoPath: driveSync.driveVideoPath,
      driveManifestPath: driveSync.driveManifestPath
    });
    await writeJson(reportPath, report);
  }
  console.log(`One-video agent report: ${reportPath}`);
  console.log(`Prepared workbook: ${preparedWorkbookPath}`);
  console.log(`Tool generated folder: ${generatedFolder}`);
  if (mp4Path) {
    console.log(`Final MP4: ${mp4Path}`);
  }
  if (driveSync?.driveVideoPath) {
    console.log(`Drive synced video: ${driveSync.driveVideoPath}`);
  }
}

main().catch(async (error) => {
  await ensureDir(batchDir);
  await writeJson(reportPath, {
    ok: false,
    mode: prepOnly ? "prep_only" : localOnly ? "local_only" : generateInVids ? "generate_export" : "dry_run",
    input: inputPath,
    outputDir: batchDir,
    error: error.message,
    stack: error.stack
  });
  console.error(`One-video agent failed: ${error.message}`);
  console.error(`Report: ${reportPath}`);
  process.exitCode = 1;
});
