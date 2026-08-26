import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawn } from "node:child_process";
import { zipSync, strToU8 } from "fflate";
import { readWorkbookTable, normalizeWorkbookObjects } from "./lib/input.mjs";
import { readProfileRegistry, registryPathFromConfig } from "./lib/profile-registry.mjs";
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

function cellClean(value, fallback = "") {
  const text = String(value ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return text || fallback;
}

function truncateCell(value, max = 1800) {
  const text = cellClean(value);
  return text.length > max ? `${text.slice(0, max - 3)}...` : text;
}

function stringifyListItem(item) {
  if (item == null) return "";
  if (typeof item === "object") {
    return cellClean(item.voiceover || item.text || item.onscreen_text || item.keyword || item.framework || JSON.stringify(item));
  }
  return cellClean(item);
}

function joinList(value, separator = " ") {
  if (Array.isArray(value)) {
    return value.map(stringifyListItem).filter(Boolean).join(separator);
  }
  if (value && typeof value === "object") {
    return Object.entries(value)
      .map(([key, item]) => `${key}: ${stringifyListItem(item)}`)
      .filter(Boolean)
      .join(separator);
  }
  return cellClean(value);
}

function sceneLines(scenes, field, max = 2400) {
  return truncateCell((Array.isArray(scenes) ? scenes : [])
    .map((scene, index) => {
      const sceneNumber = scene.scene_number || scene.sceneNumber || index + 1;
      const text = cellClean(scene[field]);
      return text ? `Scene ${sceneNumber}: ${text}` : "";
    })
    .filter(Boolean)
    .join("\n"), max);
}

function hookOptionsText(options) {
  return truncateCell((Array.isArray(options) ? options : [])
    .map((item, index) => {
      if (!item || typeof item !== "object") return stringifyListItem(item);
      const label = item.framework || item.name || `Option ${index + 1}`;
      const text = item.voiceover || item.hook || item.text || item.onscreen_text || "";
      return cellClean(`${label}: ${text}`);
    })
    .filter(Boolean)
    .join("\n"), 1800);
}

function onscreenOverlayText(seo, scenes) {
  const overlays = Array.isArray(seo?.onscreen_overlays) ? seo.onscreen_overlays : [];
  if (overlays.length) {
    return truncateCell(overlays
      .map((item, index) => {
        if (!item || typeof item !== "object") return stringifyListItem(item);
        const sceneNumber = item.scene_number || item.sceneNumber || index + 1;
        return cellClean(`Scene ${sceneNumber}: ${item.text || item.onscreen_text || item.overlay || ""}`);
      })
      .filter(Boolean)
      .join("\n"), 2200);
  }
  return sceneLines(scenes, "onscreen_text", 2200);
}

function recommendedScenesText(value) {
  if (!Array.isArray(value)) return joinList(value, ", ");
  return value.map((item) => {
    if (typeof item === "number" || typeof item === "string") return `Scene ${item}`;
    if (item && typeof item === "object") {
      return cellClean(`Scene ${item.scene_number || item.sceneNumber || ""}: ${item.reason || item.note || item.type || JSON.stringify(item)}`);
    }
    return "";
  }).filter(Boolean).join(", ");
}

function pathListText(value) {
  if (Array.isArray(value)) {
    return value.map((item) => {
      if (!item) return "";
      if (typeof item === "object") return item.videoPath || item.path || item.filePath || JSON.stringify(item);
      return String(item);
    }).filter(Boolean).join("\n");
  }
  if (value && typeof value === "object") {
    return Object.entries(value)
      .map(([key, item]) => {
        const filePath = typeof item === "object" ? item.videoPath || item.path || item.filePath || JSON.stringify(item) : item;
        return filePath ? `${key}: ${filePath}` : "";
      })
      .filter(Boolean)
      .join("\n");
  }
  return cellClean(value);
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
    const captionPath = script.captionPath || path.join(path.dirname(filePath), "instagram-caption.txt");
    const scenesPath = script.scenesPath || path.join(path.dirname(filePath), "scenes.json");
    const hookOptions = scriptPackage.hook_options || seo.hook_options || [];
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
      captionPath: await exists(captionPath) ? captionPath : "",
      scenesPath: await exists(scenesPath) ? scenesPath : "",
      sceneCount: script.sceneCount || scenes.length || scriptPackage.scene_count || "",
      duration: script.totalDurationSeconds || scriptPackage.total_duration_seconds || "",
      language: script.scriptLanguage || scriptPackage.script_language || scriptPackage.language || script.language || "",
      scriptAngle: scriptPackage.script_angle || "",
      hook: scriptPackage.hook || scenes[0]?.voiceover || "",
      hookOptions: hookOptionsText(hookOptions),
      body: scriptPackage.body || scenes.slice(1, -1).map((scene) => cellClean(scene.voiceover)).filter(Boolean).join(" "),
      cta: scriptPackage.cta || scenes.at(-1)?.voiceover || "",
      finalScript: scriptPackage.final_script || sceneLines(scenes, "voiceover", 4500),
      engagementCta: scriptPackage.engagement_cta || seo.engagement_cta || "",
      valuePromise: scriptPackage.value_promise || "",
      retentionNotes: joinList(scriptPackage.retention_notes, "\n"),
      assetStrategy: joinList(scriptPackage.asset_strategy, "\n"),
      caption: seo.instagram_caption || "",
      hashtags: Array.isArray(seo.hashtags) ? seo.hashtags.join(" ") : "",
      keywords: joinList(seo.keywords, ", "),
      onscreenOverlays: onscreenOverlayText(seo, scenes),
      sceneVoiceovers: sceneLines(scenes, "voiceover", 4500),
      sceneOnscreenText: sceneLines(scenes, "onscreen_text", 3000),
      sceneVideoPrompts: sceneLines(scenes, "video_prompt", 6500),
      recommendedAvatarScenes: recommendedScenesText(scriptPackage.recommended_avatar_scenes),
      recommendedRealAssetScenes: recommendedScenesText(scriptPackage.recommended_real_asset_scenes),
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
    const ctaVideoPath = hook.ctaVideoPath || hook.ctaAvatar?.videoPath || hook.ctaAvatar?.cachedScenePath || "";
    const middleAvatarVideos = hook.middleAvatarVideos || hook.focusAvatarVideos || hook.avatarVideos || hook.hookAvatar?.middleAvatarVideos || {};
    items.push({
      row,
      toolName,
      toolUrl: hook.tool?.tool_url || hook.tool?.url || "",
      generatedAt,
      modifiedAt: await modifiedAt(filePath),
      status: hook.status || hook.hookAvatar?.status || "",
      ctaStatus: hook.ctaStatus || hook.ctaAvatar?.status || "",
      presenter: hook.presenter || hook.hookAvatar?.presenter || "",
      tone: hook.tone || hook.hookAvatar?.tone || "",
      avatarChoice: hook.avatarChoice?.label || hook.avatarChoice?.value || hook.googleVidsAvatar || "",
      durationSeconds: hook.durationSeconds || hook.hookAvatar?.durationSeconds || "",
      hookScript: hook.hookScript || hook.hookAvatar?.hookScript || "",
      ctaScript: hook.ctaScript || hook.ctaAvatar?.script || hook.ctaAvatar?.ctaScript || "",
      hookDir: hook.hookDir || path.dirname(filePath),
      videoPath,
      cachedScenePath: hook.cachedScenePath || hook.hookAvatar?.cachedScenePath || "",
      ctaVideoPath,
      ctaCachedScenePath: hook.ctaCachedScenePath || hook.ctaAvatar?.cachedScenePath || "",
      focusVideoPaths: pathListText(middleAvatarVideos),
      activeProfile: hook.activeProfile || hook.hookAvatar?.activeProfile || "",
      ctaActiveProfile: hook.ctaActiveProfile || hook.ctaAvatar?.activeProfile || "",
      profilesTried: hook.profilesTried || hook.hookAvatar?.profilesTried || [],
      vidsUrl: hook.vidsUrl || hook.hookAvatar?.vidsUrl || "",
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

async function scanFinalReelPackages() {
  const files = await listFiles(path.join(projectRoot, "outputs", "final-reels"), (filePath) => (
    path.basename(filePath) === "final-reel-package.json"
  ));
  const items = [];
  for (const filePath of files) {
    const pkg = await readJson(filePath);
    if (!pkg) continue;
    const row = Number(pkg.row || pkg.tool?.source_row_number || pkg.tool?.row || 0);
    const toolName = clean(pkg.tool?.tool_name || pkg.tool?.name || pkg.tool?.topic || path.basename(path.dirname(filePath)), "Unknown Tool");
    const videoPath = pkg.videoPath || pkg.outputPath || pkg.mp4Path || pkg.renderReport?.toolFolderOutputPath || pkg.renderReport?.outputPath || "";
    const finalDir = pkg.finalDir || path.dirname(filePath);
    items.push({
      id: pkg.id || path.basename(finalDir),
      row,
      toolName,
      toolUrl: pkg.tool?.tool_url || pkg.tool?.url || "",
      status: pkg.status || "complete",
      mode: "final_reel",
      generatedAt: pkg.generatedAt || pkg.generated_at || pkg.renderReport?.generatedAt || await modifiedAt(filePath),
      modifiedAt: await modifiedAt(filePath),
      mp4Path: videoPath,
      outputDir: finalDir,
      finalDir,
      generatedFolder: path.join(finalDir, "generated"),
      reportPath: pkg.reportPath || pkg.renderReport?.reportPath || "",
      packagePath: filePath,
      source: "final_reel_package",
      qualityScore: pkg.qualityScore || pkg.renderReport?.qualityScore || "",
      qualityStatus: pkg.qualityStatus || pkg.renderReport?.qualityStatus || "",
      qualityWarnings: Array.isArray(pkg.qualityWarnings) ? pkg.qualityWarnings : [],
      vidsProfile: pkg.vidsProfile || pkg.activeProfile || "",
      vidsProfilesTried: pkg.vidsProfilesTried || []
    });
  }
  return items.sort((a, b) => (Date.parse(b.generatedAt) || 0) - (Date.parse(a.generatedAt) || 0));
}

async function scanQualityReports() {
  const files = await listFiles(path.join(projectRoot, "outputs"), (filePath) => (
    path.basename(filePath) === "reel-quality-report.json"
  ));
  const items = [];
  for (const filePath of files) {
    const report = await readJson(filePath);
    if (!report) continue;
    const outputPathFromReport = report.outputPath || report.videoPath || "";
    const modified = await modifiedAt(filePath);
    const parentName = path.basename(path.dirname(filePath));
    items.push({
      reportPath: filePath,
      outputPath: outputPathFromReport,
      folder: path.dirname(filePath),
      generatedAt: report.generatedAt || modified,
      modifiedAt: modified,
      status: report.status || (report.ok ? "ready" : "needs review"),
      score: report.score ?? report.rawScore ?? "",
      durationSeconds: report.durationSeconds ?? "",
      sizeMb: report.sizeBytes ? (Number(report.sizeBytes) / 1024 / 1024).toFixed(1) : "",
      summary: report.summary || "",
      warnings: Array.isArray(report.warnings) ? report.warnings.join("\n") : "",
      checks: Array.isArray(report.checks)
        ? report.checks.map((check) => `${check.ok ? "OK" : "Check"}: ${check.label || check.name || ""}`).join("\n")
        : "",
      guessedToolKey: normalizeKey(parentName.replace(/-(local|fallback|reel|final|proper|avatar|tool|demo|hindi|voice|mp4)$/i, ""))
    });
  }
  return items.sort((a, b) => (Date.parse(b.generatedAt) || 0) - (Date.parse(a.generatedAt) || 0));
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
    vidsConfiguredProfiles: entry.vidsConfiguredProfiles || [],
    vidsPrimaryProfile: entry.vidsPrimaryProfile || entry.vidsConfiguredProfiles?.[0] || "",
    vidsFallbackProfiles: entry.vidsFallbackProfiles || [],
    vidsProfile: entry.vidsProfile || "",
    vidsProfilesTried: entry.vidsProfilesTried || [],
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

function profileListText(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean).join("\n");
  }
  return String(value || "");
}

function videoVersionKey(item = {}) {
  return item.mp4Path || item.filePath || item.outputDir || item.packagePath || item.id || "";
}

function dedupeVideoVersions(items) {
  const map = new Map();
  for (const item of items) {
    const key = path.resolve(videoVersionKey(item) || `unknown-${map.size}`);
    const current = map.get(key);
    if (!current) {
      map.set(key, item);
      continue;
    }
    map.set(key, {
      ...current,
      ...item,
      generatedAt: item.generatedAt || current.generatedAt,
      modifiedAt: item.modifiedAt || current.modifiedAt,
      mp4Path: item.mp4Path || current.mp4Path,
      outputDir: item.outputDir || current.outputDir,
      qualityScore: item.qualityScore || current.qualityScore,
      qualityStatus: item.qualityStatus || current.qualityStatus
    });
  }
  return [...map.values()].sort((a, b) => (Date.parse(b.generatedAt || b.modifiedAt) || 0) - (Date.parse(a.generatedAt || a.modifiedAt) || 0));
}

function buildVideoGroups(items) {
  const groups = new Map();
  for (const item of items) {
    const keys = [
      rowKey(item.row, item.toolName),
      artifactKey(item.row, item.toolName)
    ].filter(Boolean);
    for (const key of keys) {
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(item);
    }
  }
  for (const [key, value] of groups) {
    groups.set(key, dedupeVideoVersions(value));
  }
  return groups;
}

function videoVersionSummary(items = [], max = 1600) {
  return truncateCell(items.map((item, index) => {
    const when = item.generatedAt || item.modifiedAt || "";
    const label = `V${String(items.length - index).padStart(2, "0")}`;
    const status = item.status ? ` | ${item.status}` : "";
    const quality = item.qualityScore || item.qualityStatus ? ` | Q ${item.qualityScore || ""} ${item.qualityStatus || ""}`.trim() : "";
    const videoPath = item.mp4Path || item.filePath || "";
    return `${label} | ${when}${status}${quality} | ${videoPath}`;
  }).join("\n"), max);
}

function buildTrackerRows(tools, maps) {
  const headers = [
    "Excel Row",
    "Idea / Tool Name",
    "Tool Link",
    "Description",
    "Source Script / Notes",
    "Script Language",
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
    "Scenes JSON",
    "Instagram Caption File",
    "Script Angle",
    "Hook",
    "Hook Options",
    "Body Script",
    "CTA",
    "Full Reel Script",
    "Engagement CTA",
    "Value Promise",
    "Instagram Caption",
    "Hashtags",
    "SEO Keywords",
    "On-screen Text",
    "Scene Voiceovers",
    "Scene Video Prompts",
    "Recommended Avatar Scenes",
    "Recommended Real Asset Scenes",
    "Hook Avatar Status",
    "Hook Avatar Folder",
    "Hook Avatar Video",
    "Focus Avatar Videos",
    "CTA Avatar Video",
    "Google Vids Hook URL",
    "Hook Script Used",
    "CTA Script Used",
    "Hook Profiles Tried",
    "Video Versions Count",
    "All Video Versions",
    "Latest Video Date",
    "Final Video",
    "Video Folder",
    "Google Vids URL",
    "Vids Primary Profile",
    "Vids Fallback Profiles",
    "Vids Active Profile",
    "Vids Profiles Tried",
    "Quality",
    "Quality Report",
    "Quality Warnings",
    "Notes"
  ];

  const rows = tools.map((tool) => {
    const keys = [rowKey(tool.source_row_number, tool.tool_name), artifactKey(tool.source_row_number, tool.tool_name)];
    const asset = keys.map((key) => maps.assets.get(key)).find(Boolean);
    const script = keys.map((key) => maps.scripts.get(key)).find(Boolean);
    const hook = keys.map((key) => maps.hooks.get(key)).find(Boolean);
    const video = keys.map((key) => maps.videos.get(key)).find(Boolean);
    const videoVersions = keys.map((key) => maps.videoVersions?.get(key)).find(Boolean) || [];
    const quality = keys.map((key) => maps.quality?.get(key)).find(Boolean);
    return [
      tool.source_row_number || "",
      tool.tool_name || "",
      tool.tool_url ? webLink(tool.tool_url, "Open tool") : "",
      truncate(tool.description, 700),
      sourceScriptPreview(tool),
      script?.language || tool.language || "",
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
      script?.scenesPath ? fileLink(script.scenesPath, "Open scenes") : "",
      script?.captionPath ? fileLink(script.captionPath, "Open caption") : "",
      truncateCell(script?.scriptAngle, 300),
      truncateCell(script?.hook, 500),
      truncateCell(script?.hookOptions, 900),
      truncateCell(script?.body, 1200),
      truncateCell(script?.cta, 500),
      truncateCell(script?.finalScript, 1800),
      truncateCell(script?.engagementCta, 400),
      truncateCell(script?.valuePromise, 400),
      truncateCell(script?.caption, 900),
      truncateCell(script?.hashtags, 900),
      truncateCell(script?.keywords, 700),
      truncateCell(script?.onscreenOverlays, 1200),
      truncateCell(script?.sceneVoiceovers, 1800),
      truncateCell(script?.sceneVideoPrompts, 2200),
      truncateCell(script?.recommendedAvatarScenes, 500),
      truncateCell(script?.recommendedRealAssetScenes, 500),
      hook?.status || "",
      hook?.hookDir ? folderLink(hook.hookDir, "Open hook") : "",
      hook?.videoPath ? fileLink(hook.videoPath, "Open hook video") : "",
      truncateCell(hook?.focusVideoPaths, 900),
      hook?.ctaVideoPath ? fileLink(hook.ctaVideoPath, "Open CTA video") : "",
      hook?.vidsUrl ? webLink(hook.vidsUrl, "Open Vids") : "",
      truncateCell(hook?.hookScript, 500),
      truncateCell(hook?.ctaScript, 500),
      profileListText(hook?.profilesTried),
      videoVersions.length || "",
      videoVersionSummary(videoVersions),
      video?.endedAt || video?.generatedAt || video?.modifiedAt || "",
      video?.mp4Path ? fileLink(video.mp4Path, "Open video") : video?.filePath ? fileLink(video.filePath, "Open video") : "",
      video?.outputDir ? folderLink(video.outputDir, "Open video folder") : video?.folder ? folderLink(video.folder, "Open folder") : "",
      video?.vidsUrl ? webLink(video.vidsUrl, "Open Vids") : "",
      video?.vidsPrimaryProfile || video?.vidsConfiguredProfiles?.[0] || "",
      profileListText(video?.vidsFallbackProfiles),
      video?.vidsProfile || "",
      profileListText(video?.vidsProfilesTried),
      video?.qualityScore || video?.qualityStatus ? `${video.qualityScore || ""} ${video.qualityStatus || ""}`.trim() : quality ? `${quality.score || ""} ${quality.status || ""}`.trim() : "",
      quality?.reportPath ? fileLink(quality.reportPath, "Open report") : "",
      truncateCell(quality?.warnings, 900),
      video?.error ? `Last issue: ${truncate(video.error, 220)}` : ""
    ];
  });

  return makeRows(headers, rows);
}

function buildSummaryRows({ input, generatedAt, tools, assets, scripts, hooks, history, videos, finalReelPackages, videoVersions, qualityReports, state }) {
  const completeVideoRuns = history.filter((entry) => entry.status === "complete" && entry.mp4Path);
  const failedRuns = history.filter((entry) => entry.status === "failed").length;
  const quotaProfiles = Object.values(state.quotas || {});
  return [
    ["AI Reel Creator by Prathak Work Tracker", ""],
    ["Generated At", generatedAt],
    ["Source Excel", input],
    ["Total Tool Rows", tools.length],
    ["Asset Builds Found", assets.length],
    ["Script Builds Found", scripts.length],
    ["Hook Avatar Packs Found", hooks.length],
    ["Video Runs In History", history.length],
    ["Completed Video Runs", completeVideoRuns.length],
    ["Failed Runs", failedRuns],
    ["Final Reel Packages Found", finalReelPackages.length],
    ["Total Video Versions Found", videoVersions.length],
    ["MP4 Files Found", videos.length],
    ["Quality Reports Found", qualityReports.length],
    ["Google Profile Quota Records", quotaProfiles.length],
    ["Latest UI Selected Row", state.settings?.row || ""],
    ["Latest UI Assets Folder", state.settings?.lastAssetFolder ? folderLink(state.settings.lastAssetFolder, "Open latest assets") : ""],
    ["Latest UI Script", state.settings?.lastScriptPath ? fileLink(state.settings.lastScriptPath, "Open latest script") : ""],
    ["Latest UI Hook Avatar", state.settings?.lastHookAvatarFolder ? folderLink(state.settings.lastHookAvatarFolder, "Open latest hook") : ""],
    ["Notes", "Work Tracker is the main control sheet. It maintains tool idea, tool link, script language, hook, body, CTA, final script, captions, hashtags, SEO keywords, assets, avatar clips, final videos, Google Vids profile usage, and quality status discovered locally."]
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
    "Row", "Tool Name", "Tool URL", "Generated At", "Status", "Language", "Duration", "Scenes", "Script Folder", "Markdown", "JSON", "Scenes JSON", "Caption File", "Script Angle", "Hook", "Hook Options", "Body Script", "CTA", "Full Reel Script", "Engagement CTA", "Value Promise", "Caption", "Hashtags", "SEO Keywords", "On-screen Text", "Scene Voiceovers", "Scene Video Prompts", "Avatar Scenes", "Real Asset Scenes", "Retention Notes", "Asset Strategy"
  ], items.map((item) => [
    item.row || "",
    item.toolName,
    item.toolUrl ? webLink(item.toolUrl, "Open tool") : "",
    item.generatedAt,
    item.status,
    item.language,
    item.duration,
    item.sceneCount,
    folderLink(item.scriptDir, "Open folder"),
    item.markdownPath ? fileLink(item.markdownPath, "Open script") : "",
    fileLink(item.jsonPath, "Open JSON"),
    item.scenesPath ? fileLink(item.scenesPath, "Open scenes") : "",
    item.captionPath ? fileLink(item.captionPath, "Open caption") : "",
    truncateCell(item.scriptAngle, 500),
    truncateCell(item.hook, 800),
    truncateCell(item.hookOptions, 1200),
    truncateCell(item.body, 1800),
    truncateCell(item.cta, 800),
    truncateCell(item.finalScript, 2600),
    truncateCell(item.engagementCta, 700),
    truncateCell(item.valuePromise, 700),
    truncateCell(item.caption, 1200),
    truncateCell(item.hashtags, 1200),
    truncateCell(item.keywords, 900),
    truncateCell(item.onscreenOverlays, 1600),
    truncateCell(item.sceneVoiceovers, 2400),
    truncateCell(item.sceneVideoPrompts, 3200),
    truncateCell(item.recommendedAvatarScenes, 700),
    truncateCell(item.recommendedRealAssetScenes, 700),
    truncateCell(item.retentionNotes, 1400),
    truncateCell(item.assetStrategy, 1400)
  ]));
}

function buildHookRows(items) {
  return makeRows([
    "Row", "Tool Name", "Tool URL", "Generated At", "Status", "CTA Status", "Presenter", "Avatar Choice", "Tone", "Duration", "Hook Folder", "Hook Video", "Cached Hook Scene", "Focus Avatar Videos", "CTA Avatar Video", "CTA Cached Scene", "Prompt", "Manifest", "Google Vids URL", "Active Profile", "CTA Active Profile", "Profiles Tried", "Hook Script", "CTA Script"
  ], items.map((item) => [
    item.row || "",
    item.toolName,
    item.toolUrl ? webLink(item.toolUrl, "Open tool") : "",
    item.generatedAt,
    item.status,
    item.ctaStatus,
    item.presenter,
    item.avatarChoice,
    item.tone,
    item.durationSeconds,
    item.hookDir ? folderLink(item.hookDir, "Open hook folder") : "",
    item.videoPath ? fileLink(item.videoPath, "Open hook video") : "",
    item.cachedScenePath ? fileLink(item.cachedScenePath, "Open cached scene") : "",
    truncateCell(item.focusVideoPaths, 1000),
    item.ctaVideoPath ? fileLink(item.ctaVideoPath, "Open CTA video") : "",
    item.ctaCachedScenePath ? fileLink(item.ctaCachedScenePath, "Open CTA scene") : "",
    item.promptPath ? fileLink(item.promptPath, "Open prompt") : "",
    item.manifestPath ? fileLink(item.manifestPath, "Open manifest") : "",
    item.vidsUrl ? webLink(item.vidsUrl, "Open Vids") : "",
    item.activeProfile,
    item.ctaActiveProfile,
    profileListText(item.profilesTried),
    truncateCell(item.hookScript, 900),
    truncateCell(item.ctaScript, 900)
  ]));
}

function buildVideoRunRows(items) {
  return makeRows([
    "ID", "Row", "Tool Name", "Tool URL", "Status", "Mode", "Started At", "Ended At", "Final Video", "Output Folder", "Tool Folder", "Prepared Workbook", "Google Vids URL", "Vids Primary Profile", "Vids Fallback Profiles", "Vids Active Profile", "Vids Profiles Tried", "Vids Clips Folder", "Free Provider Folder", "Quality", "Quota Hit", "Fallback", "Error"
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
    item.vidsPrimaryProfile || item.vidsConfiguredProfiles?.[0] || "",
    profileListText(item.vidsFallbackProfiles),
    item.vidsProfile || "",
    profileListText(item.vidsProfilesTried),
    item.vidsClipCacheFolder ? folderLink(item.vidsClipCacheFolder, "Open clips") : "",
    item.freeVideoProviderPackFolder ? folderLink(item.freeVideoProviderPackFolder, "Open provider pack") : "",
    `${item.qualityScore || ""} ${item.qualityStatus || ""}`.trim(),
    item.quotaHit,
    item.fallback,
    item.error
  ]));
}

function buildVideoVersionRows(items) {
  const grouped = new Map();
  for (const item of items) {
    const key = rowKey(item.row, item.toolName);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(item);
  }
  const numberedRows = [];
  for (const versions of grouped.values()) {
    const oldestFirst = [...versions].sort((a, b) => (Date.parse(a.generatedAt || a.modifiedAt) || 0) - (Date.parse(b.generatedAt || b.modifiedAt) || 0));
    oldestFirst.forEach((item, index) => {
      numberedRows.push({
        ...item,
        versionNumber: index + 1,
        versionLabel: `V${String(index + 1).padStart(2, "0")}`
      });
    });
  }
  return makeRows([
    "Row", "Tool Name", "Tool URL", "Version", "Generated At", "Status", "Mode", "Source", "Final Video", "Output Folder", "Generated Folder", "Package/Report", "Google Vids URL", "Vids Active Profile", "Vids Profiles Tried", "Quality", "Warnings", "Notes"
  ], numberedRows
    .sort((a, b) => (Date.parse(b.generatedAt || b.modifiedAt) || 0) - (Date.parse(a.generatedAt || a.modifiedAt) || 0))
    .map((item) => [
      item.row || "",
      item.toolName,
      item.toolUrl ? webLink(item.toolUrl, "Open tool") : "",
      item.versionLabel,
      item.generatedAt || item.modifiedAt || "",
      item.status || "",
      item.mode || "",
      item.source || "",
      item.mp4Path ? fileLink(item.mp4Path, "Open video") : item.filePath ? fileLink(item.filePath, "Open video") : "",
      item.outputDir ? folderLink(item.outputDir, "Open folder") : item.folder ? folderLink(item.folder, "Open folder") : "",
      item.generatedFolder ? folderLink(item.generatedFolder, "Open generated") : "",
      item.packagePath ? fileLink(item.packagePath, "Open package") : item.reportPath ? fileLink(item.reportPath, "Open report") : "",
      item.vidsUrl ? webLink(item.vidsUrl, "Open Vids") : "",
      item.vidsProfile || "",
      profileListText(item.vidsProfilesTried),
      item.qualityScore || item.qualityStatus ? `${item.qualityScore || ""} ${item.qualityStatus || ""}`.trim() : "",
      truncateCell(Array.isArray(item.qualityWarnings) ? item.qualityWarnings.join("\n") : item.qualityWarnings, 900),
      item.error ? `Last issue: ${truncateCell(item.error, 500)}` : ""
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

function buildPostCopyRows(items) {
  return makeRows([
    "Row", "Tool Name", "Tool URL", "Language", "Hook", "Caption", "Hashtags", "SEO Keywords", "Engagement CTA", "Caption File", "Script Folder"
  ], items.map((item) => [
    item.row || "",
    item.toolName,
    item.toolUrl ? webLink(item.toolUrl, "Open tool") : "",
    item.language,
    truncateCell(item.hook, 900),
    truncateCell(item.caption, 1600),
    truncateCell(item.hashtags, 1200),
    truncateCell(item.keywords, 900),
    truncateCell(item.engagementCta, 700),
    item.captionPath ? fileLink(item.captionPath, "Open caption") : "",
    item.scriptDir ? folderLink(item.scriptDir, "Open script folder") : ""
  ]));
}

function buildQualityRows(items) {
  return makeRows([
    "Generated At", "Status", "Score", "Duration", "Size MB", "Final Video", "Folder", "Report", "Summary", "Warnings", "Checks"
  ], items.map((item) => [
    item.generatedAt,
    item.status,
    item.score,
    item.durationSeconds,
    item.sizeMb,
    item.outputPath ? fileLink(item.outputPath, "Open video") : "",
    item.folder ? folderLink(item.folder, "Open folder") : "",
    item.reportPath ? fileLink(item.reportPath, "Open report") : "",
    truncateCell(item.summary, 1200),
    truncateCell(item.warnings, 1600),
    truncateCell(item.checks, 1800)
  ]));
}

function buildProfileRows(state, registryEntries = []) {
  const profiles = Array.isArray(state.profiles) ? state.profiles : [];
  const quotaMap = state.quotas || {};
  const registryByPath = new Map(registryEntries.map((profile) => [profile.path, profile]));
  const paths = [...new Set([
    ...profiles.map((profile) => profile.path),
    ...registryEntries.map((profile) => profile.path),
    ...Object.keys(quotaMap)
  ].filter(Boolean))];
  return makeRows([
    "Profile Name", "Expected Email/Login ID", "Detected Google Email", "Profile Path", "Enabled", "Priority", "Profile Status", "Created At", "Plan", "AI Video Used", "AI Video Limit", "Avatar Used", "Avatar Limit", "Limit Status", "Quota Exhausted", "Last Used", "Last Login Check", "Last Quota Hit At", "Updated At", "Note"
  ], paths.map((profilePath) => {
    const profile = profiles.find((item) => item.path === profilePath) || {};
    const registry = registryByPath.get(profilePath) || {};
    const quota = quotaMap[profilePath] || {};
    return [
      registry.profileName || profile.registryProfileName || profile.displayName || path.basename(profilePath),
      registry.expectedEmail || profile.expectedEmail || "",
      registry.detectedEmail || profile.email || "",
      profilePath,
      (registry.enabled ?? profile.enabled) === false ? "No" : "Yes",
      registry.priority || profile.priority || "",
      registry.status || profile.statusLabel || profile.status || "",
      profile.createdAt || "",
      quota.plan || "",
      quota.aiVideoUsed ?? "",
      quota.aiVideoMonthlyLimit ?? "",
      quota.avatarUsed ?? "",
      quota.avatarMonthlyLimit ?? "",
      quota.limitStatus || registry.limitStatus || "",
      quota.quotaExhausted ? "Yes" : "No",
      registry.lastUsed || profile.lastUsed || "",
      registry.lastLoginCheck || profile.lastLoginCheck || "",
      quota.lastQuotaHitAt || registry.lastQuotaHitAt || "",
      quota.updatedAt || "",
      registry.notes || quota.quotaNote || quota.resetNote || ""
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
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>AI Reel Creator by Prathak</Application></Properties>`,
    "docProps/core.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:creator>AI Reel Creator by Prathak</dc:creator>
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
  const [{ tools }, assets, scripts, hooks, mp4Files, finalReelPackages, qualityReports, registryEntries] = await Promise.all([
    loadTools(input, config),
    scanAssetManifests(),
    scanScripts(),
    scanHookAvatars(),
    scanMp4Files(),
    scanFinalReelPackages(),
    scanQualityReports(),
    readProfileRegistry(registryPathFromConfig(projectRoot, config)).catch(() => [])
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
  const allVideoVersions = dedupeVideoVersions([
    ...videosFromHistory,
    ...finalReelPackages,
    ...videosFromFiles
  ]);
  const qualityByOutput = new Map(
    qualityReports
      .filter((item) => item.outputPath)
      .map((item) => [path.resolve(item.outputPath), item])
  );
  const qualityForVideos = allVideoVersions.map((video) => {
    const quality = video.mp4Path ? qualityByOutput.get(path.resolve(video.mp4Path)) : null;
    if (!quality) return null;
    return {
      ...quality,
      row: video.row || 0,
      toolName: video.toolName || quality.guessedToolKey,
      generatedAt: quality.generatedAt || video.generatedAt,
      modifiedAt: quality.modifiedAt || video.modifiedAt
    };
  }).filter(Boolean);

  const maps = {
    assets: latestByKey(assets, (item) => [rowKey(item.row, item.toolName), artifactKey(item.row, item.toolName)]),
    scripts: latestByKey(scripts, (item) => [rowKey(item.row, item.toolName), artifactKey(item.row, item.toolName)]),
    hooks: latestByKey(hooks, (item) => [rowKey(item.row, item.toolName), artifactKey(item.row, item.toolName)]),
    videos: latestByKey(allVideoVersions, (item) => [
      rowKey(item.row, item.toolName),
      artifactKey(item.row, item.toolName)
    ]),
    videoVersions: buildVideoGroups(allVideoVersions),
    quality: latestByKey(qualityForVideos, (item) => [
      rowKey(item.row, item.toolName),
      artifactKey(item.row, item.toolName),
      item.guessedToolKey
    ])
  };

  const sheets = [
    {
      name: "Summary",
      rows: buildSummaryRows({ input, generatedAt, tools, assets, scripts, hooks, history, videos: mp4Files, finalReelPackages, videoVersions: allVideoVersions, qualityReports, state }),
      widths: [28, 85],
      autoFilter: false
    },
    {
      name: "Work Tracker",
      rows: buildTrackerRows(tools, maps),
      widths: [10, 34, 14, 42, 46, 16, 24, 12, 18, 24, 23, 14, 16, 16, 23, 16, 18, 16, 14, 14, 14, 24, 46, 46, 60, 46, 70, 42, 40, 60, 46, 40, 52, 58, 64, 28, 28, 23, 14, 18, 42, 18, 18, 14, 46, 46, 30, 23, 14, 18, 42, 26, 30, 26, 30, 18, 16, 42, 42]
    },
    {
      name: "Generated Assets",
      rows: buildAssetRows(assets),
      widths: [10, 34, 14, 23, 14, 14, 12, 16, 16, 16, 70]
    },
    {
      name: "Generated Scripts",
      rows: buildScriptRows(scripts),
      widths: [10, 34, 14, 23, 14, 16, 12, 10, 16, 16, 14, 14, 16, 34, 52, 52, 64, 46, 76, 46, 44, 70, 52, 42, 58, 66, 76, 24, 28, 52, 52]
    },
    {
      name: "Post Copy",
      rows: buildPostCopyRows(scripts),
      widths: [10, 34, 14, 16, 52, 76, 56, 44, 42, 16, 16]
    },
    {
      name: "Hook Avatars",
      rows: buildHookRows(hooks),
      widths: [10, 34, 14, 23, 16, 16, 16, 22, 16, 10, 18, 16, 16, 48, 16, 16, 16, 16, 14, 26, 26, 30, 70, 70]
    },
    {
      name: "Video Runs",
      rows: buildVideoRunRows(history),
      widths: [34, 10, 34, 14, 14, 14, 23, 23, 14, 16, 16, 16, 14, 26, 30, 26, 30, 16, 16, 22, 12, 18, 60]
    },
    {
      name: "Video Versions",
      rows: buildVideoVersionRows(allVideoVersions),
      widths: [10, 34, 14, 10, 23, 14, 16, 18, 14, 16, 16, 16, 14, 26, 30, 22, 52, 60]
    },
    {
      name: "Video Files",
      rows: buildVideoFileRows(mp4Files),
      widths: [46, 23, 12, 34, 14, 16]
    },
    {
      name: "Quality Reports",
      rows: buildQualityRows(qualityReports),
      widths: [23, 18, 12, 12, 12, 16, 16, 16, 62, 62, 62]
    },
    {
      name: "Profiles Limits",
      rows: buildProfileRows(state, registryEntries),
      widths: [26, 32, 32, 36, 10, 10, 18, 23, 18, 14, 14, 14, 14, 18, 16, 23, 23, 23, 23, 48]
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
    finalReelPackages: finalReelPackages.length,
    qualityReports: qualityReports.length,
    profiles: registryEntries.length,
    videoRuns: history.length,
    videoFiles: mp4Files.length,
    videoVersions: allVideoVersions.length
  }, null, 2));
}

try {
  await main();
} catch (error) {
  console.error(error);
  process.exit(1);
}
