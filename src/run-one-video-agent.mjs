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
import { cacheVidsExport, ensureVidsClipCache } from "./lib/vids-clip-cache.mjs";
import { resolveReelConfig } from "./lib/reel-planner.mjs";
import {
  ensureGeneratedArchive,
  mirrorGeneratedDirectory,
  mirrorGeneratedFile
} from "./lib/generated-archive.mjs";

dotenv.config({ quiet: true });

const args = parseArgs(process.argv.slice(2));
const defaultInput = "/Users/palsahu/workplace/projects/n learn/Book1.xlsx";
const inputPath = path.resolve(args.input || defaultInput);
const config = await readJson("config/default.json");
const toolBaseUrl = args["base-url"] || config.toolBaseUrl || "";
const requestedLimit = Number(args.limit || 1);
const reelConfig = resolveReelConfig(config, {
  sceneCount: args["scene-count"] || args["target-scenes"] || args["max-scenes"]
});
const maxScenes = Number(args["max-scenes"] || reelConfig.sceneCount);
const prepOnly = Boolean(args["prep-only"]);
const localOnly = Boolean(args["local-only"]);
const generateInVids = Boolean(args.generate) && !localOnly && !prepOnly;
const allowLocalFallback = generateInVids && !args["no-local-fallback"];
const shouldCapture = !args["no-capture"];
const useAi = Boolean(args.ai && process.env.OPENAI_API_KEY);
const avatarMode = args["no-avatar"] ? "" : (args.avatar || args["select-avatar"] || (generateInVids ? "auto" : ""));
const defaultAvatarScenes = config.googleVids?.defaultAvatarScenes || `1,2,${reelConfig.sceneCount}`;
const batchStamp = new Date().toISOString().replace(/[:.]/g, "-");
const batchDir = path.resolve(args.out || path.join("outputs", "runs", `one-video-agent-${batchStamp}`));
const preparedWorkbookPath = path.join(batchDir, "prepared-tool-reel-workbook.xlsx");
const reportPath = path.join(batchDir, "one-video-agent-report.json");

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
  "TRF Last Automation Run",
  "TRF Final Video Link",
  "TRF Final Video Folder Link",
  "TRF Run Folder Link",
  "TRF Generated Folder",
  "TRF Generated Files",
  "TRF Asset Brief",
  "TRF Reel Script MD",
  "TRF Reel Script JSON",
  "TRF Vids Generated Scenes Folder"
];

function firstFile(files, name) {
  return files.find((filePath) => filePath.endsWith(name)) || "";
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

function enrichmentFor(normalized, result, final = {}) {
  if (!result) {
    const empty = extraHeaders.map(() => "");
    empty[0] = normalized.tool_url;
    empty[1] = normalized.tool_route;
    empty[10] = "Not uploaded";
    empty[27] = "Pending";
    empty[28] = "Not processed in this run.";
    empty[29] = "Not started";
    return empty;
  }

  const scenes = result.scenePlan.scenes;
  const captureFiles = result.capture.files || [];
  const finalVoiceover = scenes.map((scene) => scene.voiceover).join(" ");
  const sceneVoiceovers = Array.from({ length: 7 }, (_, index) => scenes[index]?.voiceover || "");
  const scenePrompts = Array.from({ length: 7 }, (_, index) => scenes[index]?.video_prompt || "");
  const finalVideoLink = final.mp4Path
    ? fileHyperlink(final.mp4Path, "Open video")
    : final.vidsUrl
      ? hyperlinkFormula(final.vidsUrl, "Open Google Vids")
      : "";
  const finalVideoFolderLink = final.mp4Path
    ? folderHyperlink(path.dirname(final.mp4Path), "Open video folder")
    : "";

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
    "Not uploaded",
    "",
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
    new Date().toISOString(),
    finalVideoLink,
    finalVideoFolderLink,
    folderHyperlink(result.runDir, "Open run folder"),
    final.generatedFolder || result.files.generatedArchivePath || path.join(result.runDir, "generated"),
    Array.isArray(final.generatedFiles) ? final.generatedFiles.join("\n") : "",
    result.files.assetBriefPath || "",
    result.files.reelScriptMdPath || "",
    result.files.reelScriptJsonPath || "",
    result.files.vidsGeneratedScenesPath || ""
  ];
}

async function writePreparedWorkbook(table, normalizedRows, selectedRow, result, final = {}) {
  const normalizedBySourceRow = new Map(normalizedRows.map((row) => [row.source_row_number, row]));
  const outputRows = [
    [...table.headers, ...extraHeaders],
    ...table.dataRows.map((row, index) => {
      const sourceRowNumber = index + 2;
      const normalized = normalizedBySourceRow.get(sourceRowNumber);
      if (!normalized) {
        return [...row, ...extraHeaders.map(() => "")];
      }
      const selected = sourceRowNumber === selectedRow.source_row_number;
      return [...row, ...enrichmentFor(normalized, selected ? result : null, selected ? final : {})];
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

function validSceneNumbers(scenes) {
  return (scenes || [])
    .map((scene) => Number(scene?.scene_number ?? scene))
    .filter(Number.isFinite);
}

async function renderLocalReel(result, steps, generatedFiles, reason, status = "Google Vids failed; local MP4 rendered") {
  const localOutputDir = path.join(batchDir, "local-render");
  const localArgs = [
    "src/render-local-reel.mjs",
    "--tool-dir", result.runDir,
    "--output", localOutputDir,
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
    mp4Path: localReport.toolFolderOutputPath || localReport.outputPath,
    originalMp4Path: localReport.outputPath,
    status,
    qaStatus: "Local MP4 rendered; final human review needed before posting"
  };
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

async function main() {
  await ensureDir(batchDir);

  if (requestedLimit !== 1) {
    console.warn("agent:one-video always creates one video from one selected row. Use --limit 1 here, or use npm run batch for multi-row prep.");
  }

  const table = await readWorkbookTable(inputPath);
  const normalizedRows = normalizeWorkbookObjects(table.objects, { toolBaseUrl });
  const selectedRow = selectedRowFrom(normalizedRows);
  const steps = [];

  console.log(`One-video agent input: ${inputPath}`);
  console.log(`Selected Excel row: ${selectedRow.source_row_number}`);
  console.log(`Tool: ${selectedRow.tool_name}`);
  console.log(`Tool URL: ${selectedRow.tool_url}`);
  console.log(`Output: ${batchDir}`);
  console.log("Video limit: 1 selected Excel row");
  console.log(`Mode: ${prepOnly ? "script/assets prep only" : localOnly ? "local-only render" : generateInVids ? "Google Vids generate/export" : "dry-run prep + prompt fill"}`);
  console.log(`Reel structure: ${reelConfig.sceneCount} scenes, ${reelConfig.totalDurationSeconds}s total`);

  const result = await processToolRow(selectedRow, batchDir, config, {
    capture: shouldCapture,
    useAi,
    sceneCount: reelConfig.sceneCount
  });
  const vidsClipCacheFolder = await ensureVidsClipCache(result.runDir);
  const generatedFolder = await ensureGeneratedArchive(result.runDir);
  const cachedVidsClips = [];
  const generatedFiles = [];

  steps.push({
    name: "data_prep",
    toolDir: result.runDir,
    scenePlan: result.files.scenePlanPath,
    capturedFiles: result.capture.files.length
  });
  await writePreparedWorkbook(table, normalizedRows, selectedRow, result, {
    vidsStatus: prepOnly ? "Prepared; video skipped" : localOnly ? "Prepared; local render pending" : generateInVids ? "Prepared; Google Vids pending" : "Prompt dry-run pending",
    vidsClipCacheFolder,
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
  const vidsProfiles = vidsProfilesFromArgs();
  const vidsProfilesTried = [];
  let googleVidsStatus = prepOnly ? "Script/assets prepared; video skipped" : localOnly ? "Local MP4 rendered" : generateInVids ? "Generated; export pending" : "Dry-run prompt fill complete";
  let qaStatus = prepOnly ? "Prep only; render or generate before posting" : generateInVids || localOnly ? "Needs final human review before posting" : "Dry-run only";

  if (prepOnly) {
    steps.push({
      name: "prep_only",
      ok: true,
      note: "Script, prompts, captions, screenshots, and recordings prepared without rendering or Google Vids generation."
    });
  } else if (localOnly) {
    const localRender = await renderLocalReel(result, steps, generatedFiles, "local-only mode", "Local MP4 rendered");
    mp4Path = localRender.mp4Path;
    fallback = "local_remotion";
    fallbackReportPath = localRender.reportPath;
    googleVidsStatus = localRender.status;
    qaStatus = localRender.qaStatus;
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

    if (generateInVids && googleVidsError && allowLocalFallback) {
      const fallbackStatus = partialGeneratedScenes.length
        ? `Google Vids inserted scenes ${partialGeneratedScenes.join(", ")} but failed before final export; local MP4 rendered`
        : "Google Vids failed; local MP4 rendered";
      const localFallback = await renderLocalReel(result, steps, generatedFiles, googleVidsError, fallbackStatus);
      mp4Path = localFallback.mp4Path;
      fallback = "local_remotion";
      fallbackReportPath = localFallback.reportPath;
      googleVidsStatus = localFallback.status;
      qaStatus = localFallback.qaStatus;
    } else if (generateInVids && mp4Path) {
      googleVidsStatus = "Generated and exported";
      qaStatus = "Needs final human review before posting";
    } else if (generateInVids && args["no-export"]) {
      googleVidsStatus = "Generated; export skipped";
      qaStatus = "Needs MP4 export and final human review";
    }
  }

  await writePreparedWorkbook(table, normalizedRows, selectedRow, result, {
    vidsStatus: googleVidsStatus,
    vidsUrl,
    vidsClipCacheFolder,
    cachedVidsClips,
    generatedFolder,
    generatedFiles,
    mp4Path,
    qaStatus
  });

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
    vidsProfile: activeVidsProfile,
    vidsProfilesTried,
    mp4Path,
    fallback,
    fallbackReportPath,
    vidsClipCacheFolder,
    cachedVidsClips,
    generatedFolder,
    generatedFiles,
    preparedWorkbookCopy: preparedWorkbookCopy?.destinationPath || "",
    agentReportCopy: "",
    googleVidsError,
    partialGeneratedScenes,
    steps
  };

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
  await writePreparedWorkbook(table, normalizedRows, selectedRow, result, {
    vidsStatus: googleVidsStatus,
    vidsUrl,
    vidsClipCacheFolder,
    cachedVidsClips,
    generatedFolder,
    generatedFiles,
    mp4Path,
    qaStatus
  });
  await mirrorGeneratedFile({
    toolDir: result.runDir,
    sourcePath: preparedWorkbookPath,
    category: "agent",
    fileName: "prepared-tool-reel-workbook.xlsx",
    label: "Prepared workbook",
    note: "Final prepared workbook copy saved inside the selected tool folder."
  });
  console.log(`One-video agent report: ${reportPath}`);
  console.log(`Prepared workbook: ${preparedWorkbookPath}`);
  console.log(`Tool generated folder: ${generatedFolder}`);
  if (mp4Path) {
    console.log(`Final MP4: ${mp4Path}`);
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
