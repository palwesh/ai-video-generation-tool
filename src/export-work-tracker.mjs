import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawn } from "node:child_process";
import { zipSync, strToU8 } from "fflate";
import { readWorkbookTable, normalizeWorkbookObjects } from "./lib/input.mjs";
import { slugify } from "./lib/slug.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const outputPath = path.join(projectRoot, "outputs", "work-tracker", "tool-work-tracker.xlsx");
const configPath = path.join(projectRoot, "config", "default.json");
const uiStatePath = path.join(projectRoot, "work", "ui-state.json");

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (!item.startsWith("--")) continue;
    const key = item.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
    } else {
      args[key] = next;
      index += 1;
    }
  }
  return args;
}

function resolveProjectPath(value, fallback = "") {
  const raw = String(value || fallback || "").trim();
  if (!raw) return "";
  return path.isAbsolute(raw) ? raw : path.resolve(projectRoot, raw);
}

async function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function clean(value, fallback = "") {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return text || fallback;
}

function truncate(value, max = 600) {
  const text = clean(value);
  return text.length > max ? `${text.slice(0, max - 3)}...` : text;
}

function normalizeKey(value) {
  return clean(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function artifactKey(row, name) {
  const nameKey = normalizeKey(name);
  return nameKey || `row-${Number(row || 0)}`;
}

function rowKey(row, name) {
  return `${Number(row || 0)}:${artifactKey(row, name)}`;
}

function fileUrl(filePath) {
  return filePath ? pathToFileURL(path.resolve(filePath)).href : "";
}

function folderUrl(folderPath) {
  if (!folderPath) return "";
  const resolved = path.resolve(folderPath);
  return pathToFileURL(resolved.endsWith(path.sep) ? resolved : `${resolved}${path.sep}`).href;
}

function formulaEscape(value) {
  return String(value || "").replace(/"/g, "\"\"");
}

function linkFormula(url, label = "Open") {
  if (!url) return "";
  return {
    formula: `HYPERLINK("${formulaEscape(url)}","${formulaEscape(label)}")`,
    fallback: label
  };
}

function fileLink(filePath, label = "Open file") {
  return linkFormula(fileUrl(filePath), label);
}

function folderLink(folderPath, label = "Open folder") {
  return linkFormula(folderUrl(folderPath), label);
}

function webLink(url, label = "Open link") {
  return linkFormula(url, label);
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function modifiedAt(filePath) {
  try {
    return (await fs.stat(filePath)).mtime.toISOString();
  } catch {
    return "";
  }
}

async function listFiles(rootDir, predicate = () => true) {
  const files = [];
  async function walk(currentDir) {
    let entries = [];
    try {
      entries = await fs.readdir(currentDir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const entryPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        await walk(entryPath);
      } else if (entry.isFile() && predicate(entryPath)) {
        files.push(entryPath);
      }
    }
  }
  await walk(rootDir);
  return files.sort();
}

function runLargeXlsxAnalyzer(inputPath, baseUrl = "") {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(projectRoot, "scripts", "analyze-xlsx-light.py");
    const child = spawn("python3", [scriptPath, inputPath, "--base-url", baseUrl, "--full-tools"], {
      cwd: projectRoot,
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

async function loadTools(inputPath, config) {
  const stat = await fs.stat(inputPath);
  if (path.extname(inputPath).toLowerCase() === ".xlsx" && stat.size > 20 * 1024 * 1024) {
    const analyzed = await runLargeXlsxAnalyzer(inputPath, config.toolBaseUrl || "");
    return {
      tools: analyzed.tools.map((tool) => ({
        source_row_number: Number(tool.source_row_number || tool.row || 0),
        tool_name: tool.tool_name || tool.name || "",
        tool_url: tool.tool_url || tool.url || "",
        tool_route: tool.tool_route || "",
        topic: tool.topic || tool.tool_name || tool.name || "",
        description: tool.description || "",
        script: tool.script || "",
        target_user: tool.target_user || "",
        main_benefit: tool.main_benefit || "",
        language: tool.language || "",
        category: tool.category || "",
        priority: tool.priority || "",
        status: tool.status || ""
      })),
      analysis: analyzed.analysis || {}
    };
  }

  const table = await readWorkbookTable(inputPath);
  return {
    tools: normalizeWorkbookObjects(table.objects, {
      toolBaseUrl: config.toolBaseUrl || ""
    }),
    analysis: {
      headers: table.headers,
      detectedToolRows: table.objects.length,
      fileName: path.basename(inputPath)
    }
  };
}

function latestByKey(items, keyFn) {
  const map = new Map();
  for (const item of items) {
    const keys = keyFn(item).filter(Boolean);
    for (const key of keys) {
      const current = map.get(key);
      const currentTime = Date.parse(current?.generatedAt || current?.endedAt || current?.modifiedAt || "") || 0;
      const nextTime = Date.parse(item.generatedAt || item.endedAt || item.modifiedAt || "") || 0;
      if (!current || nextTime >= currentTime) {
        map.set(key, item);
      }
    }
  }
  return map;
}

async function scanAssetManifests() {
  const files = await listFiles(path.join(projectRoot, "outputs", "assets"), (filePath) => (
    path.basename(filePath) === "asset-manifest.json"
  ));
  const items = [];
  for (const filePath of files) {
    const manifest = await readJson(filePath);
    if (!manifest) continue;
    const row = Number(manifest.row || manifest.tool?.source_row_number || manifest.tool?.row || 0);
    const toolName = clean(manifest.tool?.tool_name || manifest.tool?.name || manifest.tool?.topic, "Unknown Tool");
    const assetsDir = manifest.assetsDir || path.dirname(filePath);
    const generatedAt = manifest.generatedAt || await modifiedAt(filePath);
    items.push({
      row,
      toolName,
      toolUrl: manifest.tool?.tool_url || manifest.tool?.url || "",
      generatedAt,
      modifiedAt: await modifiedAt(filePath),
      assetsDir,
      runDir: manifest.runDir || path.dirname(path.dirname(filePath)),
      manifestPath: filePath,
      fileCount: manifest.files?.length || manifest.capture?.files?.length || 0,
      captureEnabled: Boolean(manifest.capture?.enabled),
      summary: manifest.capture?.summary || "",
      status: manifest.status || "complete"
    });
  }
  return items.sort((a, b) => (Date.parse(b.generatedAt) || 0) - (Date.parse(a.generatedAt) || 0));
}

async function scanScripts() {
  const files = await listFiles(path.join(projectRoot, "outputs"), (filePath) => (
    path.basename(filePath) === "reel-script.json"
  ));
  const items = [];
  for (const filePath of files) {
    const script = await readJson(filePath);
    if (!script) continue;
    const row = Number(script.row || script.tool?.source_row_number || script.tool?.row || 0);
    const parentName = path.basename(path.dirname(filePath));
    const toolName = clean(script.tool?.tool_name || script.tool_name || script.topic || parentName, "Unknown Tool");
    const scenes = script.plan?.scenes || script.scenes || [];
    const scriptPackage = script.scriptPackage || script.script_package || {};
    const seo = script.seo || {};
    const generatedAt = script.generatedAt || script.generated_at || script.plan?.metadata?.generated_at || await modifiedAt(filePath);
    const markdownPath = script.markdownPath || path.join(path.dirname(filePath), "reel-script.md");
    items.push({
      row,
      toolName,
      toolUrl: script.tool?.tool_url || script.tool_url || "",
      generatedAt,
      modifiedAt: await modifiedAt(filePath),
      scriptDir: script.scriptDir || path.dirname(filePath),
      runDir: script.runDir || path.dirname(path.dirname(filePath)),
      jsonPath: filePath,
      markdownPath: await exists(markdownPath) ? markdownPath : "",
      sceneCount: script.sceneCount || scenes.length || scriptPackage.scene_count || "",
      duration: script.totalDurationSeconds || scriptPackage.total_duration_seconds || "",
      hook: scriptPackage.hook || scenes[0]?.voiceover || "",
      cta: scriptPackage.cta || scenes.at(-1)?.voiceover || "",
      caption: seo.instagram_caption || "",
      hashtags: Array.isArray(seo.hashtags) ? seo.hashtags.join(" ") : "",
      status: script.status || "complete"
    });
  }
  return items.sort((a, b) => (Date.parse(b.generatedAt) || 0) - (Date.parse(a.generatedAt) || 0));
}

async function scanHookAvatars() {
  const files = await listFiles(path.join(projectRoot, "outputs"), (filePath) => (
    path.basename(filePath) === "hook-avatar-manifest.json"
  ));
  const items = [];
  for (const filePath of files) {
    const hook = await readJson(filePath);
    if (!hook) continue;
    const row = Number(hook.row || hook.tool?.source_row_number || hook.tool?.row || 0);
    const toolName = clean(hook.tool?.tool_name || hook.tool?.name || hook.tool?.topic, "Unknown Tool");
    const generatedAt = hook.generatedAt || hook.hookAvatar?.generatedAt || await modifiedAt(filePath);
    const videoPath = hook.videoPath || hook.hookAvatar?.videoPath || "";
    items.push({
      row,
      toolName,
      toolUrl: hook.tool?.tool_url || hook.tool?.url || "",
      generatedAt,
      modifiedAt: await modifiedAt(filePath),
      status: hook.status || hook.hookAvatar?.status || "",
      presenter: hook.presenter || hook.hookAvatar?.presenter || "",
      tone: hook.tone || hook.hookAvatar?.tone || "",
      durationSeconds: hook.durationSeconds || hook.hookAvatar?.durationSeconds || "",
      hookScript: hook.hookScript || hook.hookAvatar?.hookScript || "",
      hookDir: hook.hookDir || path.dirname(filePath),
      videoPath,
      cachedScenePath: hook.cachedScenePath || hook.hookAvatar?.cachedScenePath || "",
      promptPath: hook.promptPath || "",
      manifestPath: filePath
    });
  }
  return items.sort((a, b) => (Date.parse(b.generatedAt) || 0) - (Date.parse(a.generatedAt) || 0));
}

async function scanMp4Files() {
  const files = await listFiles(path.join(projectRoot, "outputs"), (filePath) => (
    path.extname(filePath).toLowerCase() === ".mp4"
  ));
  const items = [];
  for (const filePath of files) {
    const stat = await fs.stat(filePath);
    const relative = path.relative(projectRoot, filePath);
    const parts = relative.split(path.sep);
    const toolSlug = parts.find((part) => /redactor|checker|masker|scrubber|scanner|invoice|passport|salary|photo|privacy|calendar|bank|pii/i.test(part)) || path.basename(filePath, ".mp4");
    items.push({
      filePath,
      folder: path.dirname(filePath),
      fileName: path.basename(filePath),
      guessedToolKey: normalizeKey(toolSlug.replace(/-(local|fallback|reel|final|proper|avatar|tool|demo|hindi|voice|mp4)$/i, "")),
      modifiedAt: stat.mtime.toISOString(),
      sizeMb: (stat.size / 1024 / 1024).toFixed(1)
    });
  }
  return items.sort((a, b) => (Date.parse(b.modifiedAt) || 0) - (Date.parse(a.modifiedAt) || 0));
}

function loadHistory(state) {
  return Array.isArray(state?.history) ? state.history.map((entry) => ({
    id: entry.id || "",
    row: Number(entry.row || 0),
    toolName: entry.toolName || "",
    toolUrl: entry.toolUrl || "",
    status: entry.status || "",
    mode: entry.mode || "",
    startedAt: entry.startedAt || "",
    endedAt: entry.endedAt || "",
    outputDir: entry.outputDir || "",
    toolDir: entry.toolDir || "",
    preparedWorkbook: entry.preparedWorkbook || "",
    mp4Path: entry.mp4Path || "",
    vidsUrl: entry.vidsUrl || "",
    generatedFolder: entry.generatedFolder || "",
    vidsClipCacheFolder: entry.vidsClipCacheFolder || "",
    freeVideoProviderPackFolder: entry.freeVideoProviderPackFolder || "",
    qualityScore: entry.qualityScore ?? "",
    qualityStatus: entry.qualityStatus || "",
    quotaHit: entry.quotaHit ? "Yes" : "No",
    fallback: entry.fallback || "",
    error: truncate(entry.error || "", 1000)
  })) : [];
}

function makeRows(headers, rows) {
  return [headers, ...rows];
}

function sourceScriptPreview(row) {
  return truncate(row.script || row.description || "", 500);
}

function workStatus(asset, script, hook, video) {
  const parts = [];
  if (asset) parts.push("Assets");
  if (script) parts.push("Script");
  if (hook) parts.push("Hook");
  if (video) parts.push("Video");
  return parts.length ? `${parts.join(" + ")} ready` : "Pending";
}

function buildTrackerRows(tools, maps) {
  const headers = [
    "Excel Row",
    "Idea / Tool Name",
    "Tool Link",
    "Description",
    "Source Script / Notes",
    "Category",
    "Priority",
    "Source Status",
    "Automation Status",
    "Latest Assets Date",
    "Assets Count",
    "Assets Folder",
    "Asset Manifest",
    "Latest Script Date",
    "Script Duration",
    "Script Folder",
    "Script Markdown",
    "Script JSON",
    "Latest Hook",
    "Latest CTA",
    "Hook Avatar Status",
    "Hook Avatar Folder",
    "Hook Avatar Video",
    "Hook Script Used",
    "Latest Video Date",
    "Final Video",
    "Video Folder",
    "Google Vids URL",
    "Quality",
    "Notes"
  ];

  const rows = tools.map((tool) => {
    const keys = [rowKey(tool.source_row_number, tool.tool_name), artifactKey(tool.source_row_number, tool.tool_name)];
    const asset = keys.map((key) => maps.assets.get(key)).find(Boolean);
    const script = keys.map((key) => maps.scripts.get(key)).find(Boolean);
    const hook = keys.map((key) => maps.hooks.get(key)).find(Boolean);
    const video = keys.map((key) => maps.videos.get(key)).find(Boolean);
    return [
      tool.source_row_number || "",
      tool.tool_name || "",
      tool.tool_url ? webLink(tool.tool_url, "Open tool") : "",
      truncate(tool.description, 700),
      sourceScriptPreview(tool),
      tool.category || "",
      tool.priority || "",
      tool.status || "",
      workStatus(asset, script, hook, video),
      asset?.generatedAt || "",
      asset?.fileCount || "",
      asset?.assetsDir ? folderLink(asset.assetsDir, "Open assets") : "",
      asset?.manifestPath ? fileLink(asset.manifestPath, "Open manifest") : "",
      script?.generatedAt || "",
      script?.duration || "",
      script?.scriptDir ? folderLink(script.scriptDir, "Open script folder") : "",
      script?.markdownPath ? fileLink(script.markdownPath, "Open script") : "",
      script?.jsonPath ? fileLink(script.jsonPath, "Open JSON") : "",
      truncate(script?.hook, 300),
      truncate(script?.cta, 300),
      hook?.status || "",
      hook?.hookDir ? folderLink(hook.hookDir, "Open hook") : "",
      hook?.videoPath ? fileLink(hook.videoPath, "Open hook video") : "",
      truncate(hook?.hookScript, 300),
      video?.endedAt || video?.modifiedAt || "",
      video?.mp4Path ? fileLink(video.mp4Path, "Open video") : video?.filePath ? fileLink(video.filePath, "Open video") : "",
      video?.outputDir ? folderLink(video.outputDir, "Open video folder") : video?.folder ? folderLink(video.folder, "Open folder") : "",
      video?.vidsUrl ? webLink(video.vidsUrl, "Open Vids") : "",
      video?.qualityScore || video?.qualityStatus ? `${video.qualityScore || ""} ${video.qualityStatus || ""}`.trim() : "",
      video?.error ? `Last issue: ${truncate(video.error, 220)}` : ""
    ];
  });

  return makeRows(headers, rows);
}

function buildSummaryRows({ input, generatedAt, tools, assets, scripts, hooks, history, videos, state }) {
  const completeVideoRuns = history.filter((entry) => entry.status === "complete" && entry.mp4Path);
  const failedRuns = history.filter((entry) => entry.status === "failed").length;
  const quotaProfiles = Object.values(state.quotas || {});
  return [
    ["Tool Reel Factory Work Tracker", ""],
    ["Generated At", generatedAt],
    ["Source Excel", input],
    ["Total Tool Rows", tools.length],
    ["Asset Builds Found", assets.length],
    ["Script Builds Found", scripts.length],
    ["Hook Avatar Packs Found", hooks.length],
    ["Video Runs In History", history.length],
    ["Completed Video Runs", completeVideoRuns.length],
    ["Failed Runs", failedRuns],
    ["MP4 Files Found", videos.length],
    ["Google Profile Quota Records", quotaProfiles.length],
    ["Latest UI Selected Row", state.settings?.row || ""],
    ["Latest UI Assets Folder", state.settings?.lastAssetFolder ? folderLink(state.settings.lastAssetFolder, "Open latest assets") : ""],
    ["Latest UI Script", state.settings?.lastScriptPath ? fileLink(state.settings.lastScriptPath, "Open latest script") : ""],
    ["Latest UI Hook Avatar", state.settings?.lastHookAvatarFolder ? folderLink(state.settings.lastHookAvatarFolder, "Open latest hook") : ""],
    ["Notes", "Work Tracker sheet is the main control sheet. Detail sheets keep every asset, script, video run, MP4 file, and profile quota record discovered locally."]
  ];
}

function buildAssetRows(items) {
  return makeRows([
    "Row", "Tool Name", "Tool URL", "Generated At", "Status", "Asset Count", "Capture", "Assets Folder", "Run Folder", "Manifest", "Summary"
  ], items.map((item) => [
    item.row || "",
    item.toolName,
    item.toolUrl ? webLink(item.toolUrl, "Open tool") : "",
    item.generatedAt,
    item.status,
    item.fileCount,
    item.captureEnabled ? "Yes" : "No",
    folderLink(item.assetsDir, "Open assets"),
    folderLink(item.runDir, "Open run"),
    fileLink(item.manifestPath, "Open manifest"),
    truncate(item.summary, 1200)
  ]));
}

function buildScriptRows(items) {
  return makeRows([
    "Row", "Tool Name", "Tool URL", "Generated At", "Status", "Duration", "Scenes", "Script Folder", "Markdown", "JSON", "Hook", "CTA", "Caption", "Hashtags"
  ], items.map((item) => [
    item.row || "",
    item.toolName,
    item.toolUrl ? webLink(item.toolUrl, "Open tool") : "",
    item.generatedAt,
    item.status,
    item.duration,
    item.sceneCount,
    folderLink(item.scriptDir, "Open folder"),
    item.markdownPath ? fileLink(item.markdownPath, "Open script") : "",
    fileLink(item.jsonPath, "Open JSON"),
    truncate(item.hook, 500),
    truncate(item.cta, 500),
    truncate(item.caption, 600),
    item.hashtags
  ]));
}

function buildHookRows(items) {
  return makeRows([
    "Row", "Tool Name", "Tool URL", "Generated At", "Status", "Presenter", "Tone", "Duration", "Hook Folder", "Hook Video", "Cached Scene", "Prompt", "Manifest", "Hook Script"
  ], items.map((item) => [
    item.row || "",
    item.toolName,
    item.toolUrl ? webLink(item.toolUrl, "Open tool") : "",
    item.generatedAt,
    item.status,
    item.presenter,
    item.tone,
    item.durationSeconds,
    item.hookDir ? folderLink(item.hookDir, "Open hook folder") : "",
    item.videoPath ? fileLink(item.videoPath, "Open hook video") : "",
    item.cachedScenePath ? fileLink(item.cachedScenePath, "Open cached scene") : "",
    item.promptPath ? fileLink(item.promptPath, "Open prompt") : "",
    item.manifestPath ? fileLink(item.manifestPath, "Open manifest") : "",
    truncate(item.hookScript, 700)
  ]));
}

function buildVideoRunRows(items) {
  return makeRows([
    "ID", "Row", "Tool Name", "Tool URL", "Status", "Mode", "Started At", "Ended At", "Final Video", "Output Folder", "Tool Folder", "Prepared Workbook", "Google Vids URL", "Vids Clips Folder", "Free Provider Folder", "Quality", "Quota Hit", "Fallback", "Error"
  ], items.map((item) => [
    item.id,
    item.row || "",
    item.toolName,
    item.toolUrl ? webLink(item.toolUrl, "Open tool") : "",
    item.status,
    item.mode,
    item.startedAt,
    item.endedAt,
    item.mp4Path ? fileLink(item.mp4Path, "Open video") : "",
    item.outputDir ? folderLink(item.outputDir, "Open output") : "",
    item.toolDir ? folderLink(item.toolDir, "Open tool folder") : "",
    item.preparedWorkbook ? fileLink(item.preparedWorkbook, "Open workbook") : "",
    item.vidsUrl ? webLink(item.vidsUrl, "Open Vids") : "",
    item.vidsClipCacheFolder ? folderLink(item.vidsClipCacheFolder, "Open clips") : "",
    item.freeVideoProviderPackFolder ? folderLink(item.freeVideoProviderPackFolder, "Open provider pack") : "",
    `${item.qualityScore || ""} ${item.qualityStatus || ""}`.trim(),
    item.quotaHit,
    item.fallback,
    item.error
  ]));
}

function buildVideoFileRows(items) {
  return makeRows([
    "File Name", "Modified At", "Size MB", "Guessed Tool Key", "Video File", "Folder"
  ], items.map((item) => [
    item.fileName,
    item.modifiedAt,
    item.sizeMb,
    item.guessedToolKey,
    fileLink(item.filePath, "Open video"),
    folderLink(item.folder, "Open folder")
  ]));
}

function buildProfileRows(state) {
  const profiles = Array.isArray(state.profiles) ? state.profiles : [];
  const quotaMap = state.quotas || {};
  const paths = [...new Set([...profiles.map((profile) => profile.path), ...Object.keys(quotaMap)].filter(Boolean))];
  return makeRows([
    "Profile Path", "Created At", "Plan", "AI Video Used", "AI Video Limit", "Avatar Used", "Avatar Limit", "Limit Status", "Quota Exhausted", "Updated At", "Note"
  ], paths.map((profilePath) => {
    const profile = profiles.find((item) => item.path === profilePath) || {};
    const quota = quotaMap[profilePath] || {};
    return [
      profilePath,
      profile.createdAt || "",
      quota.plan || "",
      quota.aiVideoUsed ?? "",
      quota.aiVideoMonthlyLimit ?? "",
      quota.avatarUsed ?? "",
      quota.avatarMonthlyLimit ?? "",
      quota.limitStatus || "",
      quota.quotaExhausted ? "Yes" : "No",
      quota.updatedAt || "",
      quota.quotaNote || quota.resetNote || ""
    ];
  }));
}

function xmlEscape(value) {
  return String(value ?? "")
    .slice(0, 32700)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function columnName(index) {
  let name = "";
  let number = index + 1;
  while (number > 0) {
    const remainder = (number - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    number = Math.floor((number - 1) / 26);
  }
  return name;
}

function cellXml(value, cellRef) {
  if (value && typeof value === "object" && value.formula) {
    const formula = String(value.formula).replace(/^=/, "");
    const fallback = value.fallback ? `<v>${xmlEscape(value.fallback)}</v>` : "";
    const type = value.fallback ? " t=\"str\"" : "";
    return `<c r="${cellRef}"${type}><f>${xmlEscape(formula)}</f>${fallback}</c>`;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return `<c r="${cellRef}"><v>${value}</v></c>`;
  }
  const text = xmlEscape(value);
  return `<c r="${cellRef}" t="inlineStr"><is><t>${text}</t></is></c>`;
}

function worksheetXml(rows, options = {}) {
  const maxCols = Math.max(...rows.map((row) => row.length), 1);
  const maxRows = Math.max(rows.length, 1);
  const ref = `A1:${columnName(maxCols - 1)}${maxRows}`;
  const cols = Array.from({ length: maxCols }, (_, index) => {
    const width = options.widths?.[index] || (index < 2 ? 18 : index < 5 ? 34 : 22);
    return `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`;
  }).join("");
  const sheetData = rows.map((row, rowIndex) => {
    const cells = row.map((value, columnIndex) => {
      const cellRef = `${columnName(columnIndex)}${rowIndex + 1}`;
      return cellXml(value, cellRef);
    }).join("");
    return `<row r="${rowIndex + 1}">${cells}</row>`;
  }).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <dimension ref="${ref}"/>
  <sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
  <cols>${cols}</cols>
  <sheetData>${sheetData}</sheetData>
  ${options.autoFilter !== false && rows.length > 1 ? `<autoFilter ref="${ref}"/>` : ""}
</worksheet>`;
}

function safeSheetName(value, usedNames) {
  const base = clean(value, "Sheet")
    .replace(/[:\\/?*\[\]]/g, " ")
    .slice(0, 31)
    .trim() || "Sheet";
  let name = base;
  let index = 2;
  while (usedNames.has(name.toLowerCase())) {
    const suffix = ` ${index}`;
    name = `${base.slice(0, 31 - suffix.length)}${suffix}`;
    index += 1;
  }
  usedNames.add(name.toLowerCase());
  return name;
}

async function writeWorkbook(filePath, sheets) {
  const usedNames = new Set();
  const normalizedSheets = sheets.map((sheet, index) => ({
    ...sheet,
    id: index + 1,
    name: safeSheetName(sheet.name, usedNames)
  }));
  const overrides = normalizedSheets.map((sheet) => (
    `<Override PartName="/xl/worksheets/sheet${sheet.id}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
  )).join("");
  const workbookSheets = normalizedSheets.map((sheet) => (
    `<sheet name="${xmlEscape(sheet.name)}" sheetId="${sheet.id}" r:id="rId${sheet.id}"/>`
  )).join("");
  const relationships = normalizedSheets.map((sheet) => (
    `<Relationship Id="rId${sheet.id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${sheet.id}.xml"/>`
  )).join("");
  const createdAt = new Date().toISOString();
  const files = {
    "[Content_Types].xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  ${overrides}
</Types>`,
    "_rels/.rels": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`,
    "docProps/app.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Tool Reel Factory</Application></Properties>`,
    "docProps/core.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:creator>Tool Reel Factory</dc:creator>
  <dcterms:created xsi:type="dcterms:W3CDTF">${createdAt}</dcterms:created>
</cp:coreProperties>`,
    "xl/workbook.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${workbookSheets}</sheets><calcPr calcMode="auto"/></workbook>`,
    "xl/_rels/workbook.xml.rels": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${relationships}</Relationships>`
  };
  for (const sheet of normalizedSheets) {
    files[`xl/worksheets/sheet${sheet.id}.xml`] = worksheetXml(sheet.rows, sheet);
  }
  const zipped = zipSync(Object.fromEntries(
    Object.entries(files).map(([name, content]) => [name, strToU8(content)])
  ));
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, zipped);
  return filePath;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const config = await readJson(configPath, {});
  const state = await readJson(uiStatePath, {});
  const input = resolveProjectPath(args.input || config.defaultInput || state.settings?.inputPath);
  if (!input || !fsSync.existsSync(input)) {
    throw new Error(`Source Excel not found: ${input || "missing"}`);
  }

  const generatedAt = new Date().toISOString();
  const [{ tools }, assets, scripts, hooks, mp4Files] = await Promise.all([
    loadTools(input, config),
    scanAssetManifests(),
    scanScripts(),
    scanHookAvatars(),
    scanMp4Files()
  ]);
  const history = loadHistory(state);

  const toolsBySlug = new Map(tools.map((tool) => [normalizeKey(tool.tool_name), tool]));
  const videosFromHistory = history.map((entry) => ({
    ...entry,
    generatedAt: entry.endedAt || entry.startedAt,
    modifiedAt: entry.endedAt || entry.startedAt
  }));
  const videosFromFiles = mp4Files.map((file) => {
    const tool = toolsBySlug.get(file.guessedToolKey) || null;
    return {
      ...file,
      row: tool?.source_row_number || 0,
      toolName: tool?.tool_name || file.guessedToolKey,
      mp4Path: file.filePath,
      outputDir: file.folder,
      generatedAt: file.modifiedAt
    };
  });

  const maps = {
    assets: latestByKey(assets, (item) => [rowKey(item.row, item.toolName), artifactKey(item.row, item.toolName)]),
    scripts: latestByKey(scripts, (item) => [rowKey(item.row, item.toolName), artifactKey(item.row, item.toolName)]),
    hooks: latestByKey(hooks, (item) => [rowKey(item.row, item.toolName), artifactKey(item.row, item.toolName)]),
    videos: latestByKey([...videosFromHistory, ...videosFromFiles], (item) => [
      rowKey(item.row, item.toolName),
      artifactKey(item.row, item.toolName)
    ])
  };

  const sheets = [
    {
      name: "Summary",
      rows: buildSummaryRows({ input, generatedAt, tools, assets, scripts, hooks, history, videos: mp4Files, state }),
      widths: [28, 85],
      autoFilter: false
    },
    {
      name: "Work Tracker",
      rows: buildTrackerRows(tools, maps),
      widths: [10, 34, 14, 42, 46, 24, 12, 18, 24, 23, 14, 16, 16, 23, 16, 18, 16, 14, 46, 42, 23, 14, 18, 14, 18, 42]
    },
    {
      name: "Generated Assets",
      rows: buildAssetRows(assets),
      widths: [10, 34, 14, 23, 14, 14, 12, 16, 16, 16, 70]
    },
    {
      name: "Generated Scripts",
      rows: buildScriptRows(scripts),
      widths: [10, 34, 14, 23, 14, 12, 10, 16, 16, 14, 52, 46, 62, 46]
    },
    {
      name: "Hook Avatars",
      rows: buildHookRows(hooks),
      widths: [10, 34, 14, 23, 16, 16, 16, 10, 18, 16, 16, 16, 16, 70]
    },
    {
      name: "Video Runs",
      rows: buildVideoRunRows(history),
      widths: [34, 10, 34, 14, 14, 14, 23, 23, 14, 16, 16, 16, 14, 16, 16, 22, 12, 18, 60]
    },
    {
      name: "Video Files",
      rows: buildVideoFileRows(mp4Files),
      widths: [46, 23, 12, 34, 14, 16]
    },
    {
      name: "Profiles Limits",
      rows: buildProfileRows(state),
      widths: [36, 23, 18, 14, 14, 14, 14, 18, 16, 23, 48]
    }
  ];

  const saved = await writeWorkbook(resolveProjectPath(args.output || outputPath), sheets);
  console.log(JSON.stringify({
    ok: true,
    output: saved,
    sourceInput: input,
    toolRows: tools.length,
    assets: assets.length,
    scripts: scripts.length,
    hooks: hooks.length,
    videoRuns: history.length,
    videoFiles: mp4Files.length
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
