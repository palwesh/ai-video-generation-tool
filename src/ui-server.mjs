import http from "node:http";
import fs from "node:fs/promises";
import fsSync from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { parseArgs } from "./lib/args.mjs";
import { ensureDir, readJson, writeJson } from "./lib/fsx.mjs";
import { readWorkbookTable, normalizeWorkbookObjects } from "./lib/input.mjs";
import { writeSimpleXlsx } from "./lib/simple-xlsx-writer.mjs";
import { fileHyperlink, folderHyperlink, hyperlinkFormula } from "./lib/link-cells.mjs";
import { freeVideoProviders as availableFreeVideoProviders } from "./lib/free-video-providers.mjs";
import { captureToolWebsite } from "./lib/capture.mjs";
import { slugify } from "./lib/slug.mjs";
import { generateFallbackScenePlan } from "./lib/fallback.mjs";
import { optimizeScenePlan, buildReelScriptPackage } from "./lib/scene-optimizer.mjs";
import { validateScenePlan } from "./lib/scenes-schema.mjs";
import { roleForScene } from "./lib/reel-planner.mjs";
import { buildGoogleVidsClipPrompt, buildGoogleVidsMasterPrompt } from "./lib/vids-master-prompt.mjs";
import { cacheVidsExport, cacheVidsSceneClip, ensureVidsClipCache } from "./lib/vids-clip-cache.mjs";
import {
  buildViralHookOptions,
  buildViralSeoData,
  normalizeViralLanguage,
  selectViralHook,
  viralOnscreenTextForRole,
  viralVoiceoverForRole
} from "./lib/viral-script.mjs";

dotenv.config({ quiet: true });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const args = parseArgs(process.argv.slice(2));
const port = Number(args.port || process.env.TRF_UI_PORT || 4317);
const configPath = path.join(projectRoot, "config/default.json");
const appConfig = JSON.parse(fsSync.readFileSync(configPath, "utf8"));
function resolveProjectPath(value, fallback = "") {
  const raw = String(value || fallback || "").trim();
  if (!raw) {
    return "";
  }
  return path.isAbsolute(raw) ? raw : path.resolve(projectRoot, raw);
}
const defaultInput = resolveProjectPath(
  process.env.TRF_DEFAULT_INPUT || appConfig.defaultInput,
  "/Users/palsahu/workplace/projects/n learn/Book1.xlsx"
);
const largeXlsxThresholdBytes = Number(process.env.TRF_LARGE_XLSX_THRESHOLD_BYTES || 20 * 1024 * 1024);
const googleVidsConfig = appConfig.googleVids || {};
const defaultProfiles = Array.isArray(googleVidsConfig.defaultProfiles) && googleVidsConfig.defaultProfiles.length
  ? googleVidsConfig.defaultProfiles
  : ["work/hr-anslation.com", "work/shejal.sahu-anslation.com-profile", "work/google-vids-profile", "work/google-vids-profile-2"];
const defaultAvatar = googleVidsConfig.defaultAvatar || "auto";
const defaultAvatarScenes = googleVidsConfig.defaultAvatarScenes || "1,2,6";
const defaultIngredientScenes = googleVidsConfig.defaultIngredientScenes || "3,4,5";
const defaultFreeVideoProviders = appConfig.freeVideoProviders?.defaultProviders || "capcut,pika,runway,canva,did,shotstack";
const defaultAiProvider = appConfig.ai?.provider || "openai";
const defaultAiModel = appConfig.ai?.openaiModel || appConfig.aiModel || "gpt-5-mini";
const defaultGeminiModel = appConfig.ai?.geminiModel || "gemini-2.5-pro";
const defaultVoiceoverProvider = appConfig.voiceover?.provider || "local";
const defaultOpenAiTtsModel = appConfig.voiceover?.openaiModel || "gpt-4o-mini-tts";
const defaultOpenAiTtsVoice = appConfig.voiceover?.openaiVoice || "verse";
const defaultElevenLabsModel = appConfig.voiceover?.elevenLabsModel || "eleven_multilingual_v2";
const defaultEdgeTtsVoice = appConfig.voiceover?.edgeVoice || "hi-IN-SwaraNeural";
const defaultEdgeTtsRate = appConfig.voiceover?.edgeRate || "+6%";
const defaultHookAvatarStyle = appConfig.voiceover?.hookAvatarStyle || "female";
const defaultAvatarGenerationProvider = appConfig.avatarGeneration?.provider || "manual";
const defaultAvatarReferenceImages = appConfig.avatarGeneration?.referenceImages || "";
const defaultAvatarGenerationProviders = appConfig.avatarGeneration?.providers || "heygen,did,runway,veo,pika";
const defaultHeygenVoiceId = appConfig.avatarGeneration?.heygenVoiceId || "";
const avatarOptions = Array.isArray(googleVidsConfig.avatarOptions) && googleVidsConfig.avatarOptions.length
  ? googleVidsConfig.avatarOptions
  : [{ label: "Auto Realistic", value: "auto" }];
const runs = new Map();
const queues = new Map();
const assetRuns = new Map();
const hookAvatarRuns = new Map();
const finalReelRuns = new Map();
const scriptVideoRuns = new Map();
const uiStatePath = path.join(projectRoot, "work", "ui-state.json");
const trackerWorkbookPath = path.join(projectRoot, "outputs", "work-tracker", "tool-work-tracker.xlsx");
let stateWrite = Promise.resolve();

const defaultQuotaTemplate = {
  plan: "Manual / free",
  aiVideoMonthlyLimit: 10,
  avatarMonthlyLimit: 10,
  aiVideoUsed: 0,
  avatarUsed: 0,
  quotaExhausted: false,
  quotaExhaustedAt: "",
  limitStatus: "",
  resetNote: "Monthly reset",
  quotaNote: "",
  lastQuotaHitAt: "",
  updatedAt: ""
};

const defaultDocs = [
  "WINDOWS-RUN-GUIDE.md",
  "README.md",
  "docs/master-automation-doc.md",
  "docs/free-video-providers.md",
  "docs/windows-setup.md",
  "docs/portable-git-setup.md",
  "outputs/free-mode-guide.md",
  "outputs/agent-setup-pack.md",
  "outputs/full-test-report.md"
];

const queueProgressHeaders = [
  "TRF Queue Status",
  "TRF Queue Run ID",
  "TRF Queue Tool Name",
  "TRF Queue Final Video",
  "TRF Queue Final MP4 Path",
  "TRF Queue Drive Video",
  "TRF Queue Drive Video Path",
  "TRF Queue Drive Folder",
  "TRF Queue Drive Folder Path",
  "TRF Queue Generated Folder",
  "TRF Queue Generated Folder Path",
  "TRF Queue Vids Cache",
  "TRF Queue Vids Cache Path",
  "TRF Queue Free Provider Pack",
  "TRF Queue Free Provider Pack Path",
  "TRF Queue Google Vids",
  "TRF Queue Google Vids URL",
  "TRF Queue Vids Primary Profile",
  "TRF Queue Vids Fallback Profiles",
  "TRF Queue Vids Active Profile",
  "TRF Queue Vids Profiles Tried",
  "TRF Queue Prepared Workbook",
  "TRF Queue Run Folder",
  "TRF Queue Error",
  "TRF Queue Updated At"
];

function json(res, statusCode, data) {
  const body = JSON.stringify(data, null, 2);
  res.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body)
  });
  res.end(body);
}

function safeError(error) {
  return {
    ok: false,
    error: error?.message || String(error)
  };
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Request body is too large."));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!body.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Invalid JSON body."));
      }
    });
    req.on("error", reject);
  });
}

function readBinaryBody(req, maxBytes = 50 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    req.on("data", (chunk) => {
      total += chunk.length;
      if (total > maxBytes) {
        reject(new Error(`Upload is too large. Max ${Math.round(maxBytes / 1024 / 1024)} MB.`));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function sendSse(res, event, data) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function timestampSlug() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function safeUploadFileName(value) {
  const fallback = "tools.xlsx";
  let raw = String(value || fallback).trim();
  try {
    raw = decodeURIComponent(raw);
  } catch {
    // Keep the raw header value if it is not URI encoded.
  }
  const base = path.basename(raw || fallback);
  const extension = path.extname(base).toLowerCase();
  if (![".xlsx", ".xls", ".csv"].includes(extension)) {
    throw new Error("Please choose an .xlsx, .xls, or .csv file.");
  }
  const name = path.basename(base, extension)
    .replace(/[^a-z0-9._ -]+/gi, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "tools";
  return `${name}${extension}`;
}

function safeAvatarFileName(value) {
  const fallback = "avatar.png";
  let raw = String(value || fallback).trim();
  try {
    raw = decodeURIComponent(raw);
  } catch {
    // Keep the raw header value if it is not URI encoded.
  }
  const base = path.basename(raw || fallback);
  const extension = path.extname(base).toLowerCase();
  if (![".png", ".jpg", ".jpeg", ".webp"].includes(extension)) {
    throw new Error("Please choose a .png, .jpg, .jpeg, or .webp avatar image.");
  }
  const name = path.basename(base, extension)
    .replace(/[^a-z0-9._ -]+/gi, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "avatar";
  return `${name}${extension}`;
}

function normalizeProfileList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeProfilePath(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return "";
  }
  const cleaned = raw
    .replace(/^\.\/+/, "")
    .replace(/[\\]+/g, "/")
    .replace(/\/+/g, "/")
    .replace(/^\/+/, "");
  const withWork = cleaned.startsWith("work/") ? cleaned : `work/${cleaned}`;
  const resolved = path.resolve(projectRoot, withWork);
  const workRoot = path.resolve(projectRoot, "work");
  if (resolved !== workRoot && !resolved.startsWith(`${workRoot}${path.sep}`)) {
    throw new Error("Profile path must stay inside the project work folder.");
  }
  return path.relative(projectRoot, resolved);
}

function normalizeProfilePathOrNull(value) {
  try {
    return normalizeProfilePath(value);
  } catch {
    return "";
  }
}

function safeProfileName(value) {
  return String(value || "")
    .trim()
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function profileBasename(profilePath) {
  return String(profilePath || "").replace(/[\\]+/g, "/").split("/").filter(Boolean).pop() || "";
}

function asFiniteNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clamp(number, min, max) {
  return Math.max(min, Math.min(max, number));
}

async function shouldUseLargeXlsxReader(inputPath) {
  if (path.extname(inputPath).toLowerCase() !== ".xlsx") {
    return false;
  }
  try {
    const stats = await fs.stat(inputPath);
    return stats.size >= largeXlsxThresholdBytes;
  } catch {
    return false;
  }
}

function runLargeXlsxAnalyzer(inputPath, baseUrl = "", options = {}) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(projectRoot, "scripts", "analyze-xlsx-light.py");
    const analyzerArgs = [scriptPath, inputPath, "--base-url", baseUrl || ""];
    if (options.fullTools) {
      analyzerArgs.push("--full-tools");
    }
    if (options.ideasOnly) {
      analyzerArgs.push("--ideas-only");
      if (options.ideasLimit) {
        analyzerArgs.push("--ideas-limit", String(options.ideasLimit));
      }
    }
    if (options.targetRow) {
      analyzerArgs.push("--target-row", String(options.targetRow));
    }
    const child = spawn("python3", analyzerArgs, {
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

function parseSceneList(value, maxScenes = 6) {
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
    .filter((scene) => Number.isInteger(scene) && scene >= 1 && scene <= maxScenes)
    .filter((scene, index, scenes) => scenes.indexOf(scene) === index);
}

function allSceneList(maxScenes) {
  return Array.from({ length: maxScenes }, (_, index) => String(index + 1)).join(",");
}

function creditSafeModeEnabled(value) {
  return value === true || String(value || "").trim().toLowerCase() === "true";
}

function googleGenerationMode(mode) {
  return ["google", "google-full", "google-hook"].includes(String(mode || ""));
}

function normalizeRunBody(body = {}) {
  let mode = String(body.mode || "local").trim() || "local";
  if (creditSafeModeEnabled(body.creditSafeMode) && googleGenerationMode(mode)) {
    mode = "local";
  }
  const maxScenes = clamp(asFiniteNumber(body.maxScenes, 6), 3, 6);
  const normalized = {
    ...body,
    mode,
    maxScenes,
    input: String(body.input || defaultInput).trim(),
    row: asFiniteNumber(body.row, 2)
  };

  if (mode === "google-full" && normalized.useAvatar !== false && !String(normalized.avatarScenes || "").trim()) {
    normalized.avatarScenes = allSceneList(maxScenes);
  }

  if (mode === "google-hook" && normalized.useAvatar !== false && !String(normalized.avatarScenes || "").trim()) {
    normalized.avatarScenes = "1";
  }

  if ((mode === "google" || mode === "dry") && normalized.useAvatar !== false && !String(normalized.avatarScenes || "").trim()) {
    normalized.avatarScenes = defaultAvatarScenes;
  }

  if ((mode === "google" || mode === "google-full" || mode === "google-hook" || mode === "dry") && !String(normalized.ingredientScenes || "").trim()) {
    normalized.ingredientScenes = defaultIngredientScenes;
  }
  if (!String(normalized.freeVideoProviders || "").trim()) {
    normalized.freeVideoProviders = defaultFreeVideoProviders;
  }
  if (!String(normalized.aiProvider || "").trim()) {
    normalized.aiProvider = defaultAiProvider;
  }
  if (!String(normalized.aiModel || "").trim()) {
    normalized.aiModel = normalized.aiProvider === "gemini" ? defaultGeminiModel : defaultAiModel;
  }
  if (!String(normalized.ttsProvider || "").trim()) {
    normalized.ttsProvider = defaultVoiceoverProvider;
  }
  if (!String(normalized.ttsModel || "").trim()) {
    normalized.ttsModel = normalized.ttsProvider === "elevenlabs"
      ? defaultElevenLabsModel
      : normalized.ttsProvider === "edge"
        ? "edge-tts"
        : defaultOpenAiTtsModel;
  }
  if (!String(normalized.ttsVoice || "").trim()) {
    normalized.ttsVoice = normalized.ttsProvider === "edge" ? defaultEdgeTtsVoice : defaultOpenAiTtsVoice;
  }
  if (!String(normalized.avatarReferenceImages || "").trim()) {
    normalized.avatarReferenceImages = defaultAvatarReferenceImages;
  }
  if (!String(normalized.hookAvatarStyle || "").trim()) {
    normalized.hookAvatarStyle = defaultHookAvatarStyle;
  }
  if (!String(normalized.hookAvatarCharacter || "").trim()) {
    normalized.hookAvatarCharacter = "auto_by_reel";
  }
  normalized.videoSize = normalizeVidsVideoSize(normalized.videoSize || normalized.hookVideoSize || normalized.vidsVideoSize || "portrait");
  normalized.hookVideoSize = normalizeVidsVideoSize(normalized.hookVideoSize || normalized.videoSize || "portrait");
  if (!String(normalized.avatarClipProvider || "").trim()) {
    normalized.avatarClipProvider = defaultAvatarGenerationProvider;
  }
  if (!String(normalized.avatarPackProviders || "").trim()) {
    normalized.avatarPackProviders = defaultAvatarGenerationProviders;
  }
  if (!String(normalized.heygenVoiceId || "").trim()) {
    normalized.heygenVoiceId = defaultHeygenVoiceId;
  }

  return normalized;
}

function quotaEstimateFor(body, rowCount = 1) {
  const normalized = normalizeRunBody(body);
  const maxScenes = normalized.maxScenes;
  const generating = normalized.mode === "google" || normalized.mode === "google-full" || normalized.mode === "google-hook";
  if (!generating) {
    return {
      aiVideoClips: 0,
      avatarClips: 0,
      totalSceneJobs: 0,
      rowCount,
      note: normalized.mode === "dry" ? "Prompt fill only; no Vids generation submit." : "No Google Vids quota used."
    };
  }

  const targetSceneCount = normalized.mode === "google-hook" ? 1 : maxScenes;
  const targetScenes = normalized.mode === "google-hook" ? [1] : Array.from({ length: maxScenes }, (_, index) => index + 1);
  const avatarScenes = normalized.useAvatar === false
    ? []
    : parseSceneList(normalized.avatarScenes || (normalized.mode === "google-hook" ? "1" : defaultAvatarScenes), maxScenes)
      .filter((scene) => targetScenes.includes(scene));
  const avatarClips = avatarScenes.length * rowCount;
  const aiVideoClips = Math.max(0, targetSceneCount - avatarScenes.length) * rowCount;

  return {
    aiVideoClips,
    avatarClips,
    totalSceneJobs: targetSceneCount * rowCount,
    rowCount,
    note: normalized.mode === "google-hook"
      ? "Only Scene 1 hook is generated in Google Vids; the final reel is merged locally with real tool assets."
      : "Estimate only. Failed generations can still consume Google quota."
  };
}

async function loadUiState() {
  try {
    const loaded = await readJson(uiStatePath);
    return {
      version: 1,
      history: Array.isArray(loaded.history) ? loaded.history : [],
      quotas: loaded.quotas && typeof loaded.quotas === "object" ? loaded.quotas : {},
      profiles: Array.isArray(loaded.profiles) ? loaded.profiles : [],
      removedProfiles: Array.isArray(loaded.removedProfiles) ? loaded.removedProfiles : [],
      settings: loaded.settings && typeof loaded.settings === "object" ? loaded.settings : {}
    };
  } catch {
    return { version: 1, history: [], quotas: {}, profiles: [], removedProfiles: [], settings: {} };
  }
}

async function saveUiState(state) {
  const trimmed = {
    version: 1,
    history: (state.history || []).slice(0, 200),
    quotas: state.quotas || {},
    profiles: (state.profiles || []).slice(0, 50),
    removedProfiles: [...new Set((state.removedProfiles || []).map(normalizeProfilePathOrNull).filter(Boolean))].slice(0, 100),
    settings: state.settings && typeof state.settings === "object" ? state.settings : {}
  };
  stateWrite = stateWrite.then(() => writeJson(uiStatePath, trimmed));
  await stateWrite;
  return trimmed;
}

async function updateUiState(mutator) {
  const state = await loadUiState();
  const result = await mutator(state);
  await saveUiState(state);
  return result ?? state;
}

function profileQuota(state, profilePath) {
  const profile = String(profilePath || "").trim();
  if (!profile) {
    return { ...defaultQuotaTemplate };
  }
  const quota = {
    ...defaultQuotaTemplate,
    ...(state.quotas?.[profile] || {}),
    profile
  };
  const aiLimit = Number(quota.aiVideoMonthlyLimit || 0);
  const avatarLimit = Number(quota.avatarMonthlyLimit || 0);
  const aiUsed = Number(quota.aiVideoUsed || 0);
  const avatarUsed = Number(quota.avatarUsed || 0);
  const detectedExhausted = Boolean(
    quota.quotaExhausted ||
    quota.limitStatus === "limit_used" ||
    quota.lastQuotaHitAt ||
    (aiLimit > 0 && aiUsed >= aiLimit) ||
    (avatarLimit > 0 && avatarUsed >= avatarLimit)
  );
  return {
    ...quota,
    aiVideoUsed: detectedExhausted && aiLimit > 0 ? Math.max(aiUsed, aiLimit) : aiUsed,
    avatarUsed: detectedExhausted && avatarLimit > 0 ? Math.max(avatarUsed, avatarLimit) : avatarUsed,
    quotaExhausted: detectedExhausted,
    limitStatus: detectedExhausted ? "limit_used" : (quota.limitStatus || "")
  };
}

function quotaHitFromReport(report) {
  const text = [
    report?.error,
    report?.googleVidsError,
    ...(Array.isArray(report?.steps) ? report.steps.map((step) => step.error) : [])
  ].filter(Boolean).join("\n");
  return quotaHitFromText(text);
}

function quotaHitFromText(value) {
  return /hit your limits|quota|limit reached|generation limit|credits|credit exhausted|limit used/i.test(String(value || ""));
}

async function markProfileQuotaHit(profilePath, note = "Google Vids reported generation limit/quota hit.") {
  const profile = normalizeProfilePath(profilePath);
  const now = new Date().toISOString();
  await updateUiState((state) => {
    const current = profileQuota(state, profile);
    const aiVideoMonthlyLimit = Number(current.aiVideoMonthlyLimit || defaultQuotaTemplate.aiVideoMonthlyLimit);
    const avatarMonthlyLimit = Number(current.avatarMonthlyLimit || defaultQuotaTemplate.avatarMonthlyLimit);
    state.quotas[profile] = {
      ...current,
      aiVideoUsed: Math.max(Number(current.aiVideoUsed || 0), aiVideoMonthlyLimit),
      avatarUsed: Math.max(Number(current.avatarUsed || 0), avatarMonthlyLimit),
      quotaExhausted: true,
      quotaExhaustedAt: now,
      limitStatus: "limit_used",
      lastQuotaHitAt: now,
      quotaNote: note,
      updatedAt: now
    };
  });
}

async function recordProfileAvatarUse(profilePath) {
  const profile = normalizeProfilePath(profilePath);
  await updateUiState((state) => {
    const current = profileQuota(state, profile);
    if (current.quotaExhausted || current.limitStatus === "limit_used") {
      return;
    }
    state.quotas[profile] = {
      ...current,
      avatarUsed: clamp(Number(current.avatarUsed || 0) + 1, 0, 5000),
      quotaNote: current.quotaNote || "Usage is estimated from successful avatar clip runs.",
      estimatedUsageUpdatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  });
}

async function recordProfileAiVideoUse(profilePath, count = 1) {
  const profile = normalizeProfilePath(profilePath);
  await updateUiState((state) => {
    const current = profileQuota(state, profile);
    if (current.quotaExhausted || current.limitStatus === "limit_used") {
      return;
    }
    state.quotas[profile] = {
      ...current,
      aiVideoUsed: clamp(Number(current.aiVideoUsed || 0) + Math.max(1, Number(count || 1)), 0, 5000),
      quotaNote: current.quotaNote || "Usage is estimated from successful Google Vids runs.",
      estimatedUsageUpdatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  });
}

function historyEntryForRun(run) {
  const report = run.report || {};
  const selectedRow = report.selectedRow || {};
  const error = report.error || report.googleVidsError || "";
  return {
    id: run.id,
    kind: run.kind || "video",
    status: run.status,
    mode: run.body?.mode || report.mode || "",
    input: run.body?.input || report.input || "",
    row: Number(run.body?.row || selectedRow.source_row_number || 0),
    toolName: selectedRow.tool_name || "",
    toolUrl: selectedRow.tool_url || "",
    outputDir: run.outputDir,
    toolDir: report.toolDir || "",
    preparedWorkbook: report.preparedWorkbook || "",
    sourceWorkbookUpdate: report.sourceWorkbookUpdate || null,
    mp4Path: report.mp4Path || "",
    vidsSceneClipMode: Boolean(report.vidsSceneClipMode),
    vidsSceneClips: report.vidsSceneClips || [],
    vidsSceneUrls: report.vidsSceneUrls || [],
    driveSyncStatus: report.driveSyncStatus || "",
    driveSyncError: report.driveSyncError || "",
    driveFolderPath: report.driveFolderPath || "",
    driveVideoPath: report.driveVideoPath || "",
    driveManifestPath: report.driveManifestPath || "",
    vidsUrl: report.vidsUrl || "",
    vidsClipCacheFolder: report.vidsClipCacheFolder || "",
    freeVideoProviderPackFolder: report.freeVideoProviderPackFolder || "",
    freeVideoProviderPrompts: report.freeVideoProviderPrompts || "",
    cachedVidsClips: report.cachedVidsClips || [],
    generatedFolder: report.generatedFolder || "",
    generatedFiles: report.generatedFiles || [],
    qualityReportPath: report.qualityReportPath || "",
    qualityScore: report.qualityScore || 0,
    qualityStatus: report.qualityStatus || "",
    qualityWarnings: report.qualityWarnings || [],
    qaStatus: report.qaStatus || "",
    vidsConfiguredProfiles: report.vidsConfiguredProfiles || [],
    vidsPrimaryProfile: report.vidsPrimaryProfile || report.vidsConfiguredProfiles?.[0] || "",
    vidsFallbackProfiles: report.vidsFallbackProfiles || [],
    vidsProfile: report.vidsProfile || "",
    vidsProfilesTried: report.vidsProfilesTried || [],
    fallback: report.fallback || "",
    partialGeneratedScenes: report.partialGeneratedScenes || [],
    quotaHit: quotaHitFromReport(report),
    error,
    startedAt: run.startedAt,
    endedAt: run.endedAt,
    exitCode: run.exitCode,
    queueId: run.queueId || "",
    queueItemId: run.queueItemId || ""
  };
}

async function recordRunHistory(run) {
  if ((run.kind || "video") !== "video") {
    return;
  }

  const entry = historyEntryForRun(run);
  await updateUiState((state) => {
    state.history = [entry, ...state.history.filter((item) => item.id !== entry.id)].slice(0, 200);
    if (entry.quotaHit) {
      for (const profile of entry.vidsProfilesTried || []) {
        const current = profileQuota(state, profile);
        const aiVideoMonthlyLimit = Number(current.aiVideoMonthlyLimit || defaultQuotaTemplate.aiVideoMonthlyLimit);
        const avatarMonthlyLimit = Number(current.avatarMonthlyLimit || defaultQuotaTemplate.avatarMonthlyLimit);
        state.quotas[profile] = {
          ...current,
          aiVideoUsed: Math.max(Number(current.aiVideoUsed || 0), aiVideoMonthlyLimit),
          avatarUsed: Math.max(Number(current.avatarUsed || 0), avatarMonthlyLimit),
          quotaExhausted: true,
          quotaExhaustedAt: entry.endedAt,
          limitStatus: "limit_used",
          lastQuotaHitAt: entry.endedAt,
          quotaNote: "Google Vids reported generation limit/quota hit.",
          updatedAt: new Date().toISOString()
        };
      }
    } else if (entry.status === "complete" && (entry.mode === "generate_export" || entry.mode === "google" || entry.mode === "google-full" || entry.mode === "google-hook")) {
      const profile = entry.vidsProfile || entry.vidsProfilesTried?.[0] || "";
      if (profile && !entry.fallback) {
        const estimate = quotaEstimateFor(run.body || {}, 1);
        const current = profileQuota(state, profile);
        state.quotas[profile] = {
          ...current,
          aiVideoUsed: clamp(Number(current.aiVideoUsed || 0) + Number(estimate.aiVideoClips || 0), 0, 5000),
          avatarUsed: clamp(Number(current.avatarUsed || 0) + Number(estimate.avatarClips || 0), 0, 5000),
          quotaNote: current.quotaNote || "Usage is estimated from successful dashboard runs.",
          estimatedUsageUpdatedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
    }
  });
}

function latestHistoryByInputAndRow(history, inputPath) {
  const wantedInput = path.resolve(inputPath || defaultInput);
  const byRow = new Map();
  for (const entry of history || []) {
    if (entry.kind && entry.kind !== "video") {
      continue;
    }
    const entryInput = entry.input ? path.resolve(entry.input) : "";
    if (entryInput && entryInput !== wantedInput) {
      continue;
    }
    if (!byRow.has(entry.row)) {
      byRow.set(entry.row, entry);
    }
  }
  return byRow;
}

function allowedOutputPath(targetPath) {
  const resolved = path.resolve(targetPath);
  const allowedRoots = [
    projectRoot,
    process.env.TRF_DRIVE_SYNC_DIR || "",
    appConfig.driveSync?.rootDir || "",
    path.join(os.homedir(), "Library", "CloudStorage"),
    path.join(os.homedir(), "Google Drive")
  ].filter(Boolean).map((item) => path.resolve(item));
  return allowedRoots.some((root) => resolved === root || resolved.startsWith(`${root}${path.sep}`));
}

async function readJsonSafe(filePath) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch {
    return null;
  }
}

function bestBrowserProfileInfo(localState) {
  const cache = localState?.profile?.info_cache || {};
  const lastUsed = localState?.profile?.last_used;
  const orderedKeys = [
    lastUsed,
    ...Object.keys(cache).sort((a, b) => {
      const left = cache[b]?.active_time || 0;
      const right = cache[a]?.active_time || 0;
      return left - right;
    })
  ].filter(Boolean);

  for (const key of orderedKeys) {
    const info = cache[key];
    if (info?.user_name || info?.gaia_name || info?.name) {
      return {
        browserProfile: key,
        email: info.user_name || "",
        googleName: info.gaia_name || info.gaia_given_name || "",
        profileName: info.name || "",
        hostedDomain: info.hosted_domain || "",
        lastActive: info.active_time || "",
        managed: Boolean(info.is_managed)
      };
    }
  }

  return {
    browserProfile: "",
    email: "",
    googleName: "",
    profileName: "",
    hostedDomain: "",
    lastActive: "",
    managed: false
  };
}

async function profileIdentity(profilePath) {
  const resolved = path.resolve(projectRoot, profilePath);
  const localState = await readJsonSafe(path.join(resolved, "Local State"));
  const info = bestBrowserProfileInfo(localState);
  return {
    ...info,
    loggedIn: Boolean(info.email || info.googleName)
  };
}

function profileDisplayLabel(profile, index) {
  const alias = {
    "work/hr-anslation.com": "HR profile",
    "work/shejal.sahu-anslation.com-profile": "Sejal profile"
  }[profile.path];
  const prefix = `Profile ${index + 1}`;
  const identity = profile.email || profile.googleName || profile.profileName || "";
  if (alias && identity) {
    return `${prefix} - ${alias} (${identity})`;
  }
  if (alias) {
    return `${prefix} - ${alias}`;
  }
  if (identity) {
    return `${prefix} - ${identity}`;
  }
  return `${prefix} - ${path.basename(profile.path)}`;
}

function mimeType(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === ".html") return "text/html; charset=utf-8";
  if (extension === ".css") return "text/css; charset=utf-8";
  if (extension === ".js") return "text/javascript; charset=utf-8";
  if (extension === ".json") return "application/json; charset=utf-8";
  if (extension === ".png") return "image/png";
  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg";
  if (extension === ".mp3") return "audio/mpeg";
  if (extension === ".m4a" || extension === ".aac") return "audio/mp4";
  if (extension === ".wav") return "audio/wav";
  if (extension === ".ogg") return "audio/ogg";
  if (extension === ".webm") return "video/webm";
  if (extension === ".mp4") return "video/mp4";
  if (extension === ".xlsx") return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  return "application/octet-stream";
}

async function serveStatic(req, res, pathname) {
  const fileName = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const uiRoot = path.join(projectRoot, "ui");
  const filePath = path.resolve(uiRoot, fileName);
  if (filePath !== uiRoot && !filePath.startsWith(`${uiRoot}${path.sep}`)) {
    json(res, 403, { ok: false, error: "Forbidden." });
    return;
  }

  try {
    const data = await fs.readFile(filePath);
    res.writeHead(200, { "content-type": mimeType(filePath) });
    res.end(data);
  } catch {
    json(res, 404, { ok: false, error: "Not found." });
  }
}

function allowedDocPath(targetPath) {
  const resolved = path.resolve(projectRoot, targetPath || "");
  const relative = path.relative(projectRoot, resolved).replace(/[\\]+/g, "/");
  if (relative.startsWith("../") || path.isAbsolute(relative)) {
    return false;
  }
  if (!/\.(md|txt)$/i.test(relative)) {
    return false;
  }
  return relative === "README.md" ||
    relative === "WINDOWS-RUN-GUIDE.md" ||
    relative.startsWith("docs/") ||
    relative.startsWith("outputs/");
}

function docTitleFrom(content, fallback) {
  const heading = content.split(/\r?\n/).find((line) => /^#\s+/.test(line.trim()));
  return heading ? heading.replace(/^#\s+/, "").trim() : fallback;
}

async function listDocs() {
  const docs = [];
  const candidates = [...defaultDocs];
  try {
    const entries = await fs.readdir(path.join(projectRoot, "docs"), { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && /\.(md|txt)$/i.test(entry.name)) {
        candidates.push(`docs/${entry.name}`);
      }
    }
  } catch {
    // Docs folder is optional.
  }
  try {
    const entries = await fs.readdir(path.join(projectRoot, "outputs"), { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && /\.(md|txt)$/i.test(entry.name)) {
        candidates.push(`outputs/${entry.name}`);
      }
    }
  } catch {
    // Outputs markdown files are optional.
  }

  const seen = new Set();
  for (const candidate of candidates) {
    const resolved = path.resolve(projectRoot, candidate);
    const relative = path.relative(projectRoot, resolved).replace(/[\\]+/g, "/");
    if (seen.has(relative) || !allowedDocPath(relative)) {
      continue;
    }
    seen.add(relative);
    try {
      const content = await fs.readFile(resolved, "utf8");
      const stat = await fs.stat(resolved);
      docs.push({
        path: relative,
        title: docTitleFrom(content, relative),
        bytes: stat.size,
        updatedAt: stat.mtime.toISOString(),
        preview: content.replace(/\s+/g, " ").trim().slice(0, 180)
      });
    } catch {
      // Skip missing default docs.
    }
  }
  return docs;
}

async function readDoc(docPath) {
  const resolved = path.resolve(projectRoot, String(docPath || ""));
  const relative = path.relative(projectRoot, resolved).replace(/[\\]+/g, "/");
  if (!allowedDocPath(relative)) {
    throw new Error("Document path is not allowed.");
  }
  const content = await fs.readFile(resolved, "utf8");
  const stat = await fs.stat(resolved);
  return {
    path: relative,
    title: docTitleFrom(content, relative),
    bytes: stat.size,
    updatedAt: stat.mtime.toISOString(),
    content
  };
}

async function listProfiles() {
  const state = await loadUiState();
  const removedProfiles = new Set((state.removedProfiles || []).map(normalizeProfilePathOrNull).filter(Boolean));
  const workDir = path.join(projectRoot, "work");
  const found = [];

  const pushProfile = (value) => {
    const profilePath = normalizeProfilePath(value);
    if (!removedProfiles.has(profilePath) && !found.includes(profilePath)) {
      found.push(profilePath);
    }
  };

  for (const profile of defaultProfiles) {
    pushProfile(profile);
  }

  for (const saved of state.profiles || []) {
    try {
      pushProfile(saved.path || saved);
    } catch {
      // Ignore invalid profile paths from older local state edits.
    }
  }

  try {
    const entries = await fs.readdir(workDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }
      const absoluteCandidate = path.join(workDir, entry.name);
      const looksLikeBrowserProfile = entry.name.startsWith("google-vids-profile") ||
        fsSync.existsSync(path.join(absoluteCandidate, "Local State")) ||
        fsSync.existsSync(path.join(absoluteCandidate, "Default", "Preferences"));
      if (!looksLikeBrowserProfile) {
        continue;
      }
      pushProfile(path.join("work", entry.name));
    }
  } catch {
    // The work directory is optional; defaults above keep the UI usable.
  }

  const profiles = [];
  for (let index = 0; index < found.length; index += 1) {
    const profilePath = found[index];
    const identity = await profileIdentity(profilePath);
    const profile = {
      id: profilePath,
      label: "",
      path: profilePath,
      absolutePath: path.resolve(projectRoot, profilePath),
      exists: fsSync.existsSync(path.resolve(projectRoot, profilePath)),
      ...identity
    };
    profile.label = profileDisplayLabel(profile, index);
    profiles.push(profile);
  }

  return profiles;
}

async function addProfile(body) {
  const rawName = String(body.profile || body.name || "").trim();
  let profilePath = "";
  if (rawName) {
    const candidate = rawName.includes("/") ? rawName : safeProfileName(rawName);
    profilePath = normalizeProfilePath(candidate || rawName);
  } else {
    const existing = await listProfiles();
    let next = existing.length + 1;
    do {
      profilePath = normalizeProfilePath(`google-vids-profile-${next}`);
      next += 1;
    } while (fsSync.existsSync(path.resolve(projectRoot, profilePath)));
  }

  await ensureDir(path.resolve(projectRoot, profilePath));
  await updateUiState((state) => {
    const existing = new Set((state.profiles || []).map((item) => normalizeProfilePath(item.path || item)));
    state.removedProfiles = (state.removedProfiles || [])
      .map(normalizeProfilePathOrNull)
      .filter((item) => item !== profilePath);
    if (!existing.has(profilePath)) {
      state.profiles.push({
        path: profilePath,
        createdAt: new Date().toISOString()
      });
    }
  });

  const profiles = await listProfiles();
  return {
    profile: profiles.find((item) => item.path === profilePath) || { path: profilePath },
    profiles
  };
}

async function removeProfile(body) {
  const profilePath = normalizeProfilePath(body.profile || body.path || "");
  if (!profilePath) {
    throw new Error("Profile path is required.");
  }

  const absoluteProfilePath = path.resolve(projectRoot, profilePath);
  const workRoot = path.resolve(projectRoot, "work");
  if (absoluteProfilePath === workRoot || !absoluteProfilePath.startsWith(`${workRoot}${path.sep}`)) {
    throw new Error("Profile path must stay inside the project work folder.");
  }

  const existed = fsSync.existsSync(absoluteProfilePath);
  if (existed) {
    await fs.rm(absoluteProfilePath, { recursive: true, force: true });
  }

  await updateUiState((state) => {
    state.profiles = (state.profiles || []).filter((item) => {
      try {
        return normalizeProfilePath(item.path || item) !== profilePath;
      } catch {
        return false;
      }
    });
    state.removedProfiles = [...new Set([
      ...(state.removedProfiles || []).map(normalizeProfilePathOrNull).filter(Boolean),
      profilePath
    ])];
    if (state.quotas && typeof state.quotas === "object") {
      delete state.quotas[profilePath];
    }
    if (state.settings && typeof state.settings === "object") {
      for (const key of [
        "lastHookAvatarProfile",
        "hookPrimaryProfile",
        "hookFallbackProfile",
        "scriptVideoPrimaryProfile",
        "scriptVideoFallbackProfile",
        "globalPrimaryProfile",
        "globalFallbackProfile"
      ]) {
        if (state.settings[key] === profilePath) {
          state.settings[key] = "";
        }
      }
      state.settings.updatedAt = new Date().toISOString();
    }
  });

  return {
    profile: profilePath,
    deletedFolder: existed,
    profiles: await listProfiles()
  };
}

async function renameProfile(body) {
  const fromProfile = normalizeProfilePath(body.profile || body.from || body.path || "");
  const rawName = String(body.name || body.to || body.newName || "").trim();
  if (!fromProfile) {
    throw new Error("Profile path is required.");
  }
  if (!rawName) {
    throw new Error("New profile name is required.");
  }

  const baseName = profileBasename(rawName.includes("/") ? rawName : safeProfileName(rawName));
  if (!baseName) {
    throw new Error("New profile name is invalid.");
  }
  const toProfile = normalizeProfilePath(path.posix.join("work", baseName));
  if (fromProfile === toProfile) {
    return {
      fromProfile,
      profile: toProfile,
      renamed: false,
      profiles: await listProfiles()
    };
  }

  const fromAbsolute = path.resolve(projectRoot, fromProfile);
  const toAbsolute = path.resolve(projectRoot, toProfile);
  const workRoot = path.resolve(projectRoot, "work");
  if (!fromAbsolute.startsWith(`${workRoot}${path.sep}`) || !toAbsolute.startsWith(`${workRoot}${path.sep}`)) {
    throw new Error("Profile path must stay inside the project work folder.");
  }
  if (!fsSync.existsSync(fromAbsolute)) {
    throw new Error(`Profile folder not found: ${fromProfile}`);
  }
  if (fsSync.existsSync(toAbsolute)) {
    throw new Error(`Profile already exists: ${toProfile}`);
  }

  await ensureDir(path.dirname(toAbsolute));
  await fs.rename(fromAbsolute, toAbsolute);

  await updateUiState((state) => {
    let hadSavedProfile = false;
    state.profiles = (state.profiles || []).map((item) => {
      try {
        const itemPath = normalizeProfilePath(item.path || item);
        if (itemPath !== fromProfile) {
          return item;
        }
        hadSavedProfile = true;
        return {
          ...(typeof item === "object" && item ? item : {}),
          path: toProfile,
          renamedFrom: fromProfile,
          renamedAt: new Date().toISOString()
        };
      } catch {
        return item;
      }
    });
    if (!hadSavedProfile) {
      state.profiles.push({
        path: toProfile,
        createdAt: new Date().toISOString(),
        renamedFrom: fromProfile,
        renamedAt: new Date().toISOString()
      });
    }
    state.removedProfiles = [...new Set([
      ...(state.removedProfiles || [])
        .map(normalizeProfilePathOrNull)
        .filter((item) => item && item !== toProfile),
      fromProfile
    ])];
    if (state.quotas && Object.prototype.hasOwnProperty.call(state.quotas, fromProfile)) {
      state.quotas[toProfile] = {
        ...state.quotas[fromProfile],
        profile: toProfile,
        renamedFrom: fromProfile,
        updatedAt: new Date().toISOString()
      };
      delete state.quotas[fromProfile];
    }
    if (state.settings && typeof state.settings === "object") {
      for (const key of [
        "lastHookAvatarProfile",
        "hookPrimaryProfile",
        "hookFallbackProfile",
        "scriptVideoPrimaryProfile",
        "scriptVideoFallbackProfile",
        "globalPrimaryProfile",
        "globalFallbackProfile"
      ]) {
        if (state.settings[key] === fromProfile) {
          state.settings[key] = toProfile;
        }
      }
      state.settings.updatedAt = new Date().toISOString();
    }
  });

  const profiles = await listProfiles();
  return {
    fromProfile,
    profile: toProfile,
    renamed: true,
    profiles
  };
}

async function listTools(inputPath, options = {}) {
  const config = await readJson(path.join(projectRoot, "config/default.json"));
  const resolvedInput = path.resolve(inputPath || defaultInput);
  const limit = Number(options.limit || 0);
  const applyLimit = (items) => Number.isFinite(limit) && limit > 0 ? items.slice(0, limit) : items;
  if (await shouldUseLargeXlsxReader(resolvedInput)) {
    const analyzed = await runLargeXlsxAnalyzer(resolvedInput, config.toolBaseUrl || "");
    const state = await loadUiState();
    const latestByRow = latestHistoryByInputAndRow(state.history, resolvedInput);
    return applyLimit((analyzed.tools || []).map((tool) => {
      const latest = latestByRow.get(tool.row);
      return {
        row: tool.row,
        name: tool.name,
        url: tool.url,
        status: latest?.status || tool.status || "",
        category: tool.category || "",
        priority: tool.priority || "",
        lastRunId: latest?.id || "",
        lastMode: latest?.mode || "",
        lastMp4Path: latest?.mp4Path || "",
        lastVidsUrl: latest?.vidsUrl || "",
        lastQualityScore: latest?.qualityScore || 0,
        lastQualityStatus: latest?.qualityStatus || "",
        lastError: latest?.error || "",
        lastEndedAt: latest?.endedAt || ""
      };
    }));
  }
  const table = await readWorkbookTable(resolvedInput);
  const rows = normalizeWorkbookObjects(table.objects, {
    toolBaseUrl: config.toolBaseUrl || ""
  });
  const state = await loadUiState();
  const latestByRow = latestHistoryByInputAndRow(state.history, resolvedInput);

  return applyLimit(rows.map((row) => {
    const latest = latestByRow.get(row.source_row_number);
    return {
      row: row.source_row_number,
      name: row.tool_name,
      url: row.tool_url,
      status: latest?.status || row.status || "",
      category: row.category || "",
      priority: row.priority || "",
      lastRunId: latest?.id || "",
      lastMode: latest?.mode || "",
      lastMp4Path: latest?.mp4Path || "",
      lastVidsUrl: latest?.vidsUrl || "",
      lastQualityScore: latest?.qualityScore || 0,
      lastQualityStatus: latest?.qualityStatus || "",
      lastError: latest?.error || "",
      lastEndedAt: latest?.endedAt || ""
    };
  }));
}

async function analyzeInputWorkbook(inputPath) {
  const config = await readJson(path.join(projectRoot, "config/default.json"));
  const resolvedInput = path.resolve(inputPath || defaultInput);
  if (await shouldUseLargeXlsxReader(resolvedInput)) {
    const analyzed = await runLargeXlsxAnalyzer(resolvedInput, config.toolBaseUrl || "");
    return analyzed.analysis;
  }
  const table = await readWorkbookTable(resolvedInput);
  const rows = normalizeWorkbookObjects(table.objects, {
    toolBaseUrl: config.toolBaseUrl || ""
  });
  const statusCounts = {};
  const categoryCounts = {};

  for (const row of rows) {
    const status = row.status || "Blank";
    const category = row.category || "Uncategorized";
    statusCounts[status] = (statusCounts[status] || 0) + 1;
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
  }

  return {
    input: resolvedInput,
    fileName: path.basename(resolvedInput),
    headers: table.headers,
    columnCount: table.headers.length,
    rawRowCount: table.objects.length,
    detectedToolRows: rows.length,
    withUrl: rows.filter((row) => row.tool_url).length,
    missingUrl: rows.filter((row) => !row.tool_url).length,
    withDescription: rows.filter((row) => row.description).length,
    withScript: rows.filter((row) => row.script).length,
    statusCounts,
    categoryCounts,
    preview: rows.slice(0, 8).map((row) => ({
      row: row.source_row_number,
      name: row.tool_name,
      url: row.tool_url,
      description: row.description,
      script: row.script,
      status: row.status,
      category: row.category
    })),
    warnings: [
      rows.some((row) => !row.tool_url) ? "Some rows do not have a tool URL." : "",
      rows.some((row) => !row.description) ? "Some rows do not have a description." : "",
      rows.length === 0 ? "No usable tool rows detected." : ""
    ].filter(Boolean)
  };
}

function toolOptionsFromTools(tools = []) {
  return tools.map((tool) => ({
    row: Number(tool.source_row_number || tool.row || 0),
    name: tool.tool_name || tool.name || "",
    status: tool.status || "",
    category: tool.category || "",
    priority: tool.priority || ""
  })).filter((tool) => tool.row && tool.name);
}

function ideaNameOptionsFromTools(tools = []) {
  return tools.map((tool) => ({
    row: Number(tool.source_row_number || tool.row || 0),
    name: tool.tool_name || tool.name || "",
    url: tool.tool_url || tool.url || "",
    status: tool.status || "",
    category: tool.category || "",
    priority: tool.priority || ""
  })).filter((tool) => tool.row && tool.name);
}

function compactAnalysisForUi(analysis) {
  return {
    ...(analysis || {}),
    preview: (analysis?.preview || []).map((row) => ({
      ...row,
      script: row.script ? "Script available" : ""
    }))
  };
}

function compactIdeaAnalysis(analysis, tools = []) {
  return {
    input: analysis?.input || "",
    fileName: analysis?.fileName || "",
    detectedToolRows: tools.length || analysis?.detectedToolRows || 0,
    ideaOnlyMode: true,
    warnings: analysis?.warnings || ["Only tool idea names were loaded."]
  };
}

async function analyzeInputWorkbookPackage(inputPath, options = {}) {
  const config = await readJson(path.join(projectRoot, "config/default.json"));
  const resolvedInput = path.resolve(inputPath || defaultInput);
  const includeToolOptions = Boolean(options.includeToolOptions);

  if (await shouldUseLargeXlsxReader(resolvedInput)) {
    const analyzed = await runLargeXlsxAnalyzer(resolvedInput, config.toolBaseUrl || "");
    return {
      analysis: compactAnalysisForUi(analyzed.analysis),
      toolOptions: includeToolOptions ? toolOptionsFromTools(analyzed.tools || []) : []
    };
  }

  const analysis = compactAnalysisForUi(await analyzeInputWorkbook(resolvedInput));
  if (!includeToolOptions) {
    return { analysis, toolOptions: [] };
  }

  const table = await readWorkbookTable(resolvedInput);
  const rows = normalizeWorkbookObjects(table.objects, {
    toolBaseUrl: config.toolBaseUrl || ""
  });
  return {
    analysis,
    toolOptions: toolOptionsFromTools(rows)
  };
}

async function listToolIdeas(inputPath) {
  const config = await readJson(path.join(projectRoot, "config/default.json"));
  const resolvedInput = path.resolve(inputPath || defaultInput);

  if (await shouldUseLargeXlsxReader(resolvedInput)) {
    const ideas = await runLargeXlsxAnalyzer(resolvedInput, config.toolBaseUrl || "", {
      ideasOnly: true,
      ideasLimit: config.ui?.ideaListLimit || 0
    });
    return {
      input: resolvedInput,
      fileName: path.basename(resolvedInput),
      tools: ideaNameOptionsFromTools(ideas.tools || []),
      analysis: compactIdeaAnalysis(ideas.analysis || {}, ideas.tools || []),
      warnings: ideas.analysis?.warnings || []
    };
  }

  const table = await readWorkbookTable(resolvedInput);
  const rows = normalizeWorkbookObjects(table.objects, {
    toolBaseUrl: config.toolBaseUrl || ""
  });
  return {
    input: resolvedInput,
    fileName: path.basename(resolvedInput),
    tools: ideaNameOptionsFromTools(rows),
    analysis: {
      input: resolvedInput,
      fileName: path.basename(resolvedInput),
      detectedToolRows: rows.length,
      ideaOnlyMode: true,
      warnings: ["Only tool idea names were loaded."]
    },
    warnings: ["Only tool idea names were loaded."]
  };
}

function assetKind(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  if ([".png", ".jpg", ".jpeg", ".webp"].includes(extension)) return "image";
  if ([".mp4", ".webm", ".mov"].includes(extension)) return "video";
  if ([".mp3", ".m4a", ".wav", ".aac", ".ogg"].includes(extension)) return "audio";
  if ([".json"].includes(extension)) return "json";
  if ([".md", ".txt"].includes(extension)) return "text";
  return "file";
}

function publicAssetFile(filePath) {
  return {
    name: path.basename(filePath),
    path: filePath,
    relativePath: path.relative(projectRoot, filePath).replace(/[\\]+/g, "/"),
    kind: assetKind(filePath),
    url: `/file?path=${encodeURIComponent(filePath)}`
  };
}

async function listFilesRecursive(rootDir) {
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
      } else if (entry.isFile()) {
        files.push(entryPath);
      }
    }
  }
  await walk(rootDir);
  return files.sort();
}

async function fileModifiedAt(filePath) {
  try {
    const stat = await fs.stat(filePath);
    return stat.mtime.toISOString();
  } catch {
    return "";
  }
}

function artifactToolName(value = {}) {
  return scriptTextClean(value.tool_name || value.name || value.topic, "");
}

function sameArtifactTool(left = {}, right = {}) {
  const leftName = artifactToolName(left).toLowerCase();
  const rightName = artifactToolName(right).toLowerCase();
  if (!leftName || !rightName) {
    return true;
  }
  return leftName === rightName;
}

function sameArtifactRow(value, rowNumber) {
  const row = Number(value?.row || value?.source_row_number || value?.tool?.source_row_number || value?.tool?.row || 0);
  return !row || row === Number(rowNumber);
}

function artifactGeneratedAt(value, fallback = "") {
  return value?.generatedAt || value?.plan?.metadata?.generated_at || fallback || "";
}

function sortLatestArtifacts(items = []) {
  return [...items].sort((left, right) => {
    const leftTime = Date.parse(left.generatedAt || left.modifiedAt || "") || 0;
    const rightTime = Date.parse(right.generatedAt || right.modifiedAt || "") || 0;
    return rightTime - leftTime;
  });
}

function artifactTime(value = {}) {
  return value.generatedAt || value.generated_at || value.updatedAt || value.modifiedAt || value.startedAt || value.endedAt || "";
}

async function existingOutputPath(paths = []) {
  for (const item of paths) {
    const candidate = String(item || "").trim();
    if (!candidate) continue;
    const resolved = path.resolve(candidate);
    if (!allowedOutputPath(resolved)) continue;
    try {
      await fs.access(resolved);
      return resolved;
    } catch {
      // Keep looking for another saved output.
    }
  }
  return "";
}

function clipText(value, maxLength = 900) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text;
}

async function toolRowForInput(inputPath, rowNumber) {
  const config = await readJson(path.join(projectRoot, "config/default.json"));
  const resolvedInput = path.resolve(inputPath || defaultInput);
  const sourceRowNumber = Number(rowNumber || 2);
  if (!Number.isFinite(sourceRowNumber) || sourceRowNumber < 2) {
    throw new Error("Please choose a valid Excel row number.");
  }

  if (await shouldUseLargeXlsxReader(resolvedInput)) {
    const analyzed = await runLargeXlsxAnalyzer(resolvedInput, config.toolBaseUrl || "", { targetRow: sourceRowNumber });
    const row = (analyzed.tools || []).find((tool) => Number(tool.source_row_number || tool.row) === sourceRowNumber);
    if (!row) {
      throw new Error(`Row ${sourceRowNumber} was not found in the workbook.`);
    }
    return {
      ...row,
      source_row_number: Number(row.source_row_number || row.row || sourceRowNumber),
      tool_name: row.tool_name || row.name || `Tool Row ${sourceRowNumber}`,
      tool_url: row.tool_url || row.url || ""
    };
  }

  const table = await readWorkbookTable(resolvedInput);
  const rows = normalizeWorkbookObjects(table.objects, {
    toolBaseUrl: config.toolBaseUrl || ""
  });
  const row = rows.find((tool) => Number(tool.source_row_number) === sourceRowNumber);
  if (!row) {
    throw new Error(`Row ${sourceRowNumber} was not found in the workbook.`);
  }
  return row;
}

function assetSummaryMarkdown(result) {
  const tool = result.tool || {};
  const files = result.files || [];
  return [
    `# ${tool.tool_name || "Tool"} Asset Build`,
    "",
    `- Excel row: ${tool.source_row_number || result.row}`,
    `- Tool URL: ${tool.tool_url || "Missing"}`,
    `- Assets folder: ${result.assetsDir}`,
    `- Built at: ${result.generatedAt}`,
    "",
    "## Tool Details",
    "",
    `Description: ${clipText(tool.description || "No description found.", 1200)}`,
    "",
    tool.script ? `Existing script: ${clipText(tool.script, 1600)}` : "Existing script: Not found.",
    "",
    "## Capture Summary",
    "",
    result.capture?.summary || "No capture summary.",
    "",
    "## Asset Files",
    "",
    ...(files.length ? files.map((file) => `- ${file.relativePath}`) : ["- No media files were captured."])
  ].join("\n");
}

async function buildToolAssets(body, options = {}) {
  const log = typeof options.log === "function" ? options.log : () => {};
  log("Reading config and selected Excel row.");
  const config = await readJson(path.join(projectRoot, "config/default.json"));
  const input = path.resolve(String(body.input || defaultInput).trim());
  const rowNumber = Number(body.row || 2);
  log(`Input workbook: ${input}`);
  log(`Selected Excel row: ${rowNumber}`);
  const tool = await toolRowForInput(input, rowNumber);
  log(`Tool loaded: ${tool.tool_name || tool.name || `Row ${rowNumber}`}`);
  if (tool.tool_url) {
    log(`Tool URL: ${tool.tool_url}`);
  }
  const slug = slugify(tool.tool_name || tool.topic || `row-${rowNumber}`);
  const runDir = path.resolve(projectRoot, "outputs", "assets", `${slug}_${timestampSlug()}`);
  const assetsDir = path.join(runDir, "assets");
  await ensureDir(assetsDir);
  log(`Assets folder created: ${assetsDir}`);

  let capture = {
    enabled: false,
    summary: "Capture did not run.",
    files: []
  };

  try {
    log("Opening actual tool page and capturing screenshots/screen recordings.");
    capture = await captureToolWebsite(tool, assetsDir, {
      ...config,
      capture: {
        ...(config.capture || {}),
        recordWebm: body.recordVideo === false ? false : config.capture?.recordWebm !== false,
        scrollSteps: clamp(asFiniteNumber(body.scrollSteps, config.capture?.scrollSteps || 4), 1, 10)
      }
    });
    log(`Capture complete. Reference files: ${capture.files?.length || 0}`);
  } catch (error) {
    capture = {
      enabled: false,
      summary: `Capture failed: ${error.message}`,
      files: []
    };
    log(`Capture warning: ${error.message}`, "stderr");
  }

  log("Indexing generated asset files.");
  const generatedAt = new Date().toISOString();
  const capturedPathSet = new Set([
    ...(capture.files || []),
    ...(await listFilesRecursive(assetsDir))
  ]);
  const mediaFiles = Array.from(capturedPathSet).sort().map(publicAssetFile);
  const result = {
    id: `${slug}_${timestampSlug()}`,
    status: capture.enabled ? "complete" : "complete_with_warning",
    input,
    row: Number(tool.source_row_number || rowNumber),
    tool,
    runDir,
    assetsDir,
    generatedAt,
    capture: {
      enabled: capture.enabled,
      summary: capture.summary,
      files: [...mediaFiles]
    },
    files: [...mediaFiles]
  };

  const toolDetailsPath = path.join(assetsDir, "tool-details.json");
  const manifestPath = path.join(assetsDir, "asset-manifest.json");
  const summaryPath = path.join(assetsDir, "asset-summary.md");
  log("Writing tool details, asset summary, and manifest.");
  await writeJson(toolDetailsPath, tool);
  result.files.push(publicAssetFile(toolDetailsPath));
  result.manifestPath = manifestPath;
  result.files.push(publicAssetFile(manifestPath));
  result.summaryPath = summaryPath;
  result.files.push(publicAssetFile(summaryPath));
  await fs.writeFile(summaryPath, `${assetSummaryMarkdown(result)}\n`, "utf8");
  await writeJson(manifestPath, result);

  await updateUiState((state) => {
    state.settings = {
      ...(state.settings || {}),
      inputPath: input,
      row: Number(tool.source_row_number || rowNumber),
      lastAssetFolder: assetsDir,
      lastAssetRunFolder: runDir,
      updatedAt: new Date().toISOString()
    };
  });
  log(`Asset build ready. Total files: ${result.files.length}`);

  return result;
}

function scriptTextClean(value, fallback = "") {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text || fallback;
}

function limitScriptWords(value, maxWords = 22) {
  const words = scriptTextClean(value).split(" ").filter(Boolean);
  if (words.length <= maxWords) {
    return words.join(" ");
  }
  return `${words.slice(0, maxWords).join(" ")}.`;
}

function shortScriptPhrase(value, fallback = "ye tool", maxWords = 5, maxChars = 42) {
  const cleaned = scriptTextClean(value, fallback)
    .replace(/[|:]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (cleaned.length <= maxChars && cleaned.split(/\s+/).length <= maxWords) {
    return cleaned;
  }
  return cleaned
    .split(/\s+/)
    .filter((word) => word !== "&")
    .slice(0, maxWords)
    .join(" ")
    .slice(0, maxChars)
    .replace(/\s+\S*$/, "")
    .trim() || fallback;
}

function shortToolLabel(row) {
  const raw = scriptTextClean(row.tool_name || row.topic, "ye tool");
  if (/pii/i.test(raw) && /redact/i.test(raw)) {
    return "PII Redactor";
  }
  if (/pdf/i.test(raw) && /image/i.test(raw) && /redact/i.test(raw)) {
    return "PDF & Image Redactor";
  }
  return shortScriptPhrase(raw, "ye tool", 4, 34);
}

function scriptBenefitLine(row) {
  const text = scriptTextClean(`${row.description || ""} ${row.main_benefit || ""} ${row.script || ""}`);
  if (/pii|privacy|redact|sensitive|secret|email|phone|id/i.test(text)) {
    return "names, emails, IDs aur secrets ko share karne se pehle locally mask karta hai";
  }
  if (/summar|check|review|warning|risk/i.test(text)) {
    return "summary, warning points aur next steps ko fast review-ready banata hai";
  }
  if (/convert|format|clean|extract/i.test(text)) {
    return "messy input ko clean usable output me convert karta hai";
  }
  return limitScriptWords(row.main_benefit || row.description || "manual work ko faster aur cleaner banata hai", 12).replace(/\.$/, "");
}

function hashtagValue(value) {
  const text = String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 4)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
  return text ? `#${text}` : "";
}

function toolScriptSeo(row, plan) {
  return buildViralSeoData(row, plan);
}

function enhanceScenePlanForReel(plan, row, capture) {
  const scenes = Array.isArray(plan?.scenes) ? plan.scenes : [];
  const hasAssets = Array.isArray(capture?.files) && capture.files.length > 0;
  const hook = selectViralHook(row);

  return {
    ...plan,
    scenes: scenes.map((scene, index) => {
      const sceneNumber = index + 1;
      const lastScene = sceneNumber === scenes.length;
      const role = roleForScene(sceneNumber, scenes.length);
      const next = { ...scene };
      if (sceneNumber === 1) {
        next.voiceover = hook.voiceover;
        next.onscreen_text = hook.onscreen_text;
        next.visual = "Male or female avatar opens face-to-camera with a strong scroll-stopping line, then points to the real tool page on laptop.";
      } else if (lastScene) {
        next.voiceover = viralVoiceoverForRole("review_cta", row);
        next.onscreen_text = viralOnscreenTextForRole("review_cta", row);
      } else if (sceneNumber === 2) {
        next.voiceover = viralVoiceoverForRole("intro", row);
        next.onscreen_text = viralOnscreenTextForRole("intro", row);
      } else if (/demo/i.test(next.visual || next.video_prompt || "") || role.id === "demo" || role.id === "demo_workflow") {
        next.voiceover = viralVoiceoverForRole(role.id === "demo_workflow" ? "demo_workflow" : "demo", row);
        next.onscreen_text = viralOnscreenTextForRole(role.id === "demo_workflow" ? "demo_workflow" : "demo", row);
      } else if (hasAssets && ["workflow", "workflow_output", "proof_before_after"].includes(role.id)) {
        next.voiceover = viralVoiceoverForRole(role.id, row);
        next.onscreen_text = viralOnscreenTextForRole(role.id, row);
      } else {
        next.voiceover = viralVoiceoverForRole(role.id, row);
        next.onscreen_text = viralOnscreenTextForRole(role.id, row);
      }
      next.promotion_angle = role.id === "hook" || role.id === "hook_intro" ? hook.framework : "proof_first_tool_demo";
      next.engagement_goal = lastScene ? "save_comment_share" : "watch_time";
      return next;
    })
  };
}

async function scriptCaptureContext(body, input, rowNumber, tool = {}) {
  let assetsDir = String(body.assetsDir || body.assetFolder || "").trim();
  if (!assetsDir) {
    const state = await loadUiState();
    const settings = state.settings || {};
    const sameInput = !settings.inputPath || path.resolve(settings.inputPath) === path.resolve(input);
    const sameRow = !settings.row || Number(settings.row) === Number(rowNumber);
    if (sameInput && sameRow && settings.lastAssetFolder) {
      assetsDir = settings.lastAssetFolder;
    }
  }

  if (!assetsDir) {
    return {
      assetsDir: "",
      capture: {
        enabled: false,
        summary: "No asset folder selected. Script generated from Excel row details only.",
        files: []
      },
      assetBuild: null
    };
  }

  const resolvedAssetsDir = path.resolve(assetsDir);
  if (!allowedOutputPath(resolvedAssetsDir)) {
    throw new Error("Asset folder path is not allowed.");
  }

  let assetBuild = null;
  try {
    assetBuild = await readJson(path.join(resolvedAssetsDir, "asset-manifest.json"));
  } catch {
    assetBuild = null;
  }

  if (assetBuild) {
    const manifestRow = Number(assetBuild.row || assetBuild.tool?.source_row_number || assetBuild.tool?.row || 0);
    const manifestToolName = scriptTextClean(assetBuild.tool?.tool_name || assetBuild.tool?.name, "");
    const selectedToolName = scriptTextClean(tool.tool_name || tool.name, "");
    const sameRow = !manifestRow || manifestRow === Number(rowNumber);
    const sameTool = !manifestToolName || !selectedToolName || manifestToolName === selectedToolName;
    if (!sameRow || !sameTool) {
      return {
        assetsDir: "",
        capture: {
          enabled: false,
          summary: `Skipped stale asset folder. It belongs to ${manifestToolName || `row ${manifestRow}`}, not selected row ${rowNumber}.`,
          files: []
        },
        assetBuild: null
      };
    }
  }

  const files = assetBuild?.files?.length
    ? assetBuild.files
    : (await listFilesRecursive(resolvedAssetsDir)).map(publicAssetFile);

  return {
    assetsDir: resolvedAssetsDir,
    capture: {
      enabled: Boolean(assetBuild?.capture?.enabled || files.length),
      summary: assetBuild?.capture?.summary || `Using ${files.length} existing asset file(s) from ${resolvedAssetsDir}.`,
      files
    },
    assetBuild
  };
}

function scriptMarkdown(result) {
  const scenes = result.plan?.scenes || [];
  const pkg = result.scriptPackage || {};
  const seo = result.seo || {};
  const hookOptions = pkg.hook_options || seo.hook_options || [];
  return [
    `# ${result.tool?.tool_name || "Tool"} Reel Script`,
    "",
    `- Excel row: ${result.row}`,
    `- Script type: ${result.scriptLanguage || pkg.script_language || "Hinglish"}`,
    `- Duration: ${result.totalDurationSeconds} seconds`,
    `- Tool URL: ${result.tool?.tool_url || "Missing"}`,
    `- Assets folder: ${result.assetsDir || "Not used"}`,
    `- Generated at: ${result.generatedAt}`,
    "",
    "## Hook",
    "",
    pkg.hook || "",
    "",
    "## Hook Options",
    "",
    ...(hookOptions.length
      ? hookOptions.map((hook, index) => `${index + 1}. ${hook.voiceover} (${hook.framework})`)
      : ["No alternate hooks generated."]),
    "",
    "## Body",
    "",
    pkg.body || "",
    "",
    "## CTA",
    "",
    pkg.cta || "",
    "",
    "## Scene Plan",
    "",
    ...scenes.flatMap((scene) => [
      `### Scene ${scene.scene_number} - ${scene.duration}s`,
      "",
      `Voiceover: ${scene.voiceover}`,
      "",
      `On-screen text: ${scene.onscreen_text}`,
      "",
      `Visual: ${scene.visual}`,
      "",
      `Video prompt: ${scene.video_prompt}`,
      ""
    ]),
    "## Instagram Caption",
    "",
    seo.instagram_caption || "",
    "",
    "## Engagement CTA",
    "",
    pkg.engagement_cta || seo.engagement_cta || "Save this workflow, comment TOOL, and share with someone who needs this.",
    "",
    "## Hashtags",
    "",
    (seo.hashtags || []).join(" ")
  ].join("\n");
}

async function generateReelScript(body) {
  const config = await readJson(path.join(projectRoot, "config/default.json"));
  const input = path.resolve(String(body.input || defaultInput).trim());
  const rowNumber = Number(body.row || 2);
  const sceneCount = clamp(asFiniteNumber(body.sceneCount || body.maxScenes, 5), 3, 6);
  const tool = await toolRowForInput(input, rowNumber);
  const scriptLanguage = normalizeViralLanguage(
    body.scriptLanguage || body.script_language || body.language || tool.script_language || tool.language || config.language || "Hinglish"
  );
  const scriptTool = {
    ...tool,
    language: scriptLanguage,
    script_language: scriptLanguage
  };
  const { assetsDir, capture, assetBuild } = await scriptCaptureContext(body, input, rowNumber, tool);
  const slug = slugify(scriptTool.tool_name || scriptTool.topic || `row-${rowNumber}`);
  const runDir = assetsDir ? path.dirname(assetsDir) : path.resolve(projectRoot, "outputs", "scripts", `${slug}_${timestampSlug()}`);
  const scriptDir = path.join(runDir, "scripts");
  await ensureDir(scriptDir);

  const basePlan = generateFallbackScenePlan(scriptTool, capture.summary, {
    ...config,
    sceneCount,
    language: scriptLanguage
  });
  const enhancedPlan = enhanceScenePlanForReel(basePlan, scriptTool, capture);
  const optimizedBasePlan = optimizeScenePlan(enhancedPlan, scriptTool, capture, {
    ...config,
    sceneCount,
    language: scriptLanguage
  });
  const optimizedPlan = enhanceScenePlanForReel(optimizedBasePlan, scriptTool, capture);
  optimizedPlan.metadata = {
    ...(optimizedPlan.metadata || {}),
    language: scriptLanguage,
    script_type: scriptLanguage,
    script_package: buildReelScriptPackage(optimizedPlan, scriptTool, capture, {
      sceneCount,
      sceneDurationSeconds: 10,
      totalDurationSeconds: sceneCount * 10
    })
  };
  validateScenePlan(optimizedPlan, { sceneCount });

  const generatedAt = new Date().toISOString();
  const scriptPackage = {
    ...optimizedPlan.metadata.script_package,
    hook_options: optimizedPlan.metadata.script_package?.hook_options || buildViralHookOptions(scriptTool).slice(0, 5),
    source_existing_script_used: Boolean(scriptTool.script),
    source_description_used: Boolean(scriptTool.description),
    script_language: scriptLanguage,
    language: scriptLanguage,
    script_style: `${scriptLanguage} Instagram Reel, UGC/SaaS, retention-first Hook-Body-CTA`,
    recommended_avatar_scenes: [1, sceneCount],
    recommended_real_asset_scenes: optimizedPlan.metadata.script_package?.asset_strategy?.use_real_tool_assets_for || []
  };
  const seo = toolScriptSeo(scriptTool, optimizedPlan);
  const result = {
    id: `script-${slug}-${timestampSlug()}`,
    status: "complete",
    input,
    row: Number(scriptTool.source_row_number || rowNumber),
    scriptLanguage,
    tool: scriptTool,
    assetsDir,
    runDir,
    scriptDir,
    generatedAt,
    sceneCount,
    totalDurationSeconds: sceneCount * 10,
    capture,
    assetBuild: assetBuild ? {
      id: assetBuild.id,
      status: assetBuild.status,
      generatedAt: assetBuild.generatedAt,
      files: assetBuild.files || []
    } : null,
    plan: optimizedPlan,
    scriptPackage,
    seo,
    files: []
  };

  const jsonPath = path.join(scriptDir, "reel-script.json");
  const markdownPath = path.join(scriptDir, "reel-script.md");
  const scenesPath = path.join(scriptDir, "scenes.json");
  const captionPath = path.join(scriptDir, "instagram-caption.txt");
  await writeJson(jsonPath, result);
  await fs.writeFile(markdownPath, `${scriptMarkdown(result)}\n`, "utf8");
  await writeJson(scenesPath, optimizedPlan);
  await fs.writeFile(captionPath, `${seo.instagram_caption}\n\n${seo.hashtags.join(" ")}\n`, "utf8");
  result.scriptPath = jsonPath;
  result.markdownPath = markdownPath;
  result.files = [jsonPath, markdownPath, scenesPath, captionPath].map(publicAssetFile);

  await updateUiState((state) => {
    state.settings = {
      ...(state.settings || {}),
      inputPath: input,
      row: Number(scriptTool.source_row_number || rowNumber),
      lastScriptFolder: scriptDir,
      lastScriptPath: markdownPath,
      lastScriptJsonPath: jsonPath,
      sceneCount,
      scriptLanguage,
      updatedAt: new Date().toISOString()
    };
  });

  return result;
}

function normalizeEditorScriptText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function normalizeEditorHashtags(value) {
  const raw = Array.isArray(value)
    ? value.join(" ")
    : String(value || "");
  return raw
    .split(/[\s,]+/)
    .map((item) => item.trim().replace(/[.,;:]+$/g, ""))
    .filter(Boolean)
    .map((item) => item.startsWith("#") ? item : `#${item.replace(/^#+/, "")}`)
    .filter((item, index, items) => items.indexOf(item) === index)
    .slice(0, 30);
}

function resolveScriptUpdatePath(body = {}) {
  const fromPath = String(body.scriptPath || "").trim();
  const fromDir = String(body.scriptDir || body.folder || "").trim();
  const candidate = fromPath
    ? path.resolve(fromPath)
    : path.resolve(fromDir, "reel-script.json");
  if (path.basename(candidate) !== "reel-script.json") {
    throw new Error("Only reel-script.json can be updated from the script editor.");
  }
  if (!allowedOutputPath(candidate)) {
    throw new Error("Script path is not allowed.");
  }
  return candidate;
}

function applyScriptEditorUpdate(existing = {}, editor = {}) {
  const updated = cloneJson(existing);
  const scenes = Array.isArray(updated.plan?.scenes) ? updated.plan.scenes : [];
  const incomingScenes = Array.isArray(editor.scenes) ? editor.scenes : [];
  const incomingByNumber = new Map(incomingScenes.map((scene, index) => [
    Number(scene.scene_number || index + 1),
    scene
  ]));
  const nextScenes = scenes.map((scene, index) => {
    const sceneNumber = Number(scene.scene_number || index + 1);
    const incoming = incomingByNumber.get(sceneNumber) || {};
    return {
      ...scene,
      scene_number: sceneNumber,
      voiceover: normalizeEditorScriptText(incoming.voiceover ?? scene.voiceover),
      onscreen_text: normalizeEditorScriptText(incoming.onscreen_text ?? scene.onscreen_text),
      visual: normalizeEditorScriptText(incoming.visual ?? scene.visual),
      duration: Number(incoming.duration || scene.duration || 10)
    };
  });

  const fallbackBody = nextScenes.slice(1, -1).map((scene) => scene.voiceover).filter(Boolean).join(" ");
  const hook = normalizeEditorScriptText(editor.hook || nextScenes[0]?.voiceover || "");
  const body = normalizeEditorScriptText(editor.body || fallbackBody);
  const cta = normalizeEditorScriptText(editor.cta || nextScenes.at(-1)?.voiceover || "");
  if (nextScenes.length) {
    nextScenes[0].voiceover = hook || nextScenes[0].voiceover;
    nextScenes[nextScenes.length - 1].voiceover = cta || nextScenes[nextScenes.length - 1].voiceover;
  }

  const scriptPackage = {
    ...(updated.scriptPackage || updated.plan?.metadata?.script_package || {}),
    hook,
    body,
    cta,
    final_script: nextScenes.map((scene) => `Scene ${scene.scene_number}: ${scene.voiceover}`).join("\n"),
    script_language: updated.scriptLanguage || updated.scriptPackage?.script_language || updated.plan?.metadata?.language || "Hinglish",
    updated_by_dashboard: true,
    updated_at: new Date().toISOString()
  };
  const seo = {
    ...(updated.seo || {}),
    instagram_caption: String(editor.caption ?? updated.seo?.instagram_caption ?? "").trim(),
    hashtags: normalizeEditorHashtags(editor.hashtags ?? updated.seo?.hashtags ?? [])
  };

  updated.plan = {
    ...(updated.plan || {}),
    scenes: nextScenes,
    metadata: {
      ...(updated.plan?.metadata || {}),
      script_package: scriptPackage,
      scene_count: nextScenes.length,
      total_duration_seconds: nextScenes.reduce((total, scene) => total + Number(scene.duration || 10), 0),
      updated_by_dashboard: true,
      updated_at: new Date().toISOString()
    }
  };
  updated.scriptPackage = scriptPackage;
  updated.seo = seo;
  updated.sceneCount = nextScenes.length;
  updated.totalDurationSeconds = updated.plan.metadata.total_duration_seconds;
  updated.status = "updated";
  updated.updatedAt = new Date().toISOString();
  return updated;
}

async function updateReelScript(body = {}) {
  const scriptPath = resolveScriptUpdatePath(body);
  const scriptDir = path.dirname(scriptPath);
  const existing = await readJson(scriptPath);
  if (!existing || typeof existing !== "object") {
    throw new Error("Existing reel script JSON could not be read.");
  }
  const updated = applyScriptEditorUpdate(existing, body.editor || {});
  const markdownPath = existing.markdownPath || path.join(scriptDir, "reel-script.md");
  const scenesPath = path.join(scriptDir, "scenes.json");
  const captionPath = path.join(scriptDir, "instagram-caption.txt");
  const backupPath = path.join(scriptDir, `reel-script.backup-${timestampSlug()}.json`);
  await writeJson(backupPath, existing);
  updated.scriptDir = scriptDir;
  updated.scriptPath = scriptPath;
  updated.markdownPath = markdownPath;
  updated.files = [scriptPath, markdownPath, scenesPath, captionPath, backupPath].map(publicAssetFile);
  await writeJson(scriptPath, updated);
  await fs.writeFile(markdownPath, `${scriptMarkdown(updated)}\n`, "utf8");
  await writeJson(scenesPath, updated.plan);
  await fs.writeFile(captionPath, `${updated.seo.instagram_caption || ""}\n\n${(updated.seo.hashtags || []).join(" ")}\n`, "utf8");

  await updateUiState((state) => {
    state.settings = {
      ...(state.settings || {}),
      inputPath: updated.input || body.input || state.settings?.inputPath || defaultInput,
      row: Number(updated.row || body.row || state.settings?.row || 2),
      lastScriptFolder: scriptDir,
      lastScriptPath: markdownPath,
      lastScriptJsonPath: scriptPath,
      sceneCount: updated.sceneCount || updated.plan?.scenes?.length || state.settings?.sceneCount,
      scriptLanguage: updated.scriptLanguage || updated.scriptPackage?.script_language || state.settings?.scriptLanguage,
      updatedAt: new Date().toISOString()
    };
  });

  return updated;
}

function normalizeCustomScriptTitle(body = {}, scriptText = "") {
  const explicit = scriptTextClean(body.title || body.topic || body.reelTitle || body.videoTitle, "");
  if (explicit) {
    return shortScriptPhrase(explicit, "Custom Script Reel", 8, 72);
  }
  const firstLine = String(scriptText || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean) || "";
  const cleaned = firstLine.replace(/^(hook|title|topic)\s*[:|-]\s*/i, "");
  return shortScriptPhrase(cleaned, "Custom Script Reel", 8, 72);
}

function normalizeScriptVideoDuration(body = {}) {
  const sceneCountFromDuration = Math.round(asFiniteNumber(body.durationSeconds || body.duration, 50) / 10);
  return clamp(asFiniteNumber(body.sceneCount || body.maxScenes, sceneCountFromDuration), 3, 6) * 10;
}

function splitScriptSentences(value = "") {
  const cleaned = String(value || "")
    .replace(/\r/g, "\n")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" ");
  return cleaned
    .split(/(?<=[.!?।])\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function scriptChunks(value = "", count = 1) {
  const target = Math.max(1, Number(count || 1));
  const sentences = splitScriptSentences(value);
  const source = sentences.length >= target
    ? sentences
    : String(value || "").replace(/\s+/g, " ").trim().split(/\s+/).filter(Boolean);
  if (!source.length) {
    return Array.from({ length: target }, () => "");
  }
  if (source.length <= target) {
    return Array.from({ length: target }, (_, index) => source[index] || "");
  }
  const chunks = [];
  for (let index = 0; index < target; index += 1) {
    const start = Math.floor((index * source.length) / target);
    const end = Math.floor(((index + 1) * source.length) / target);
    chunks.push(source.slice(start, Math.max(start + 1, end)).join(" ").trim());
  }
  return chunks;
}

function customScriptHook(title, scriptText, language = "Hinglish") {
  const sentences = splitScriptSentences(scriptText);
  const firstSentence = sentences[0] || scriptTextClean(scriptText, "");
  const secondSentence = sentences[1] || "";
  const clipped = limitScriptWords(firstSentence, 20);
  const shortStarter = clipped.split(/\s+/).filter(Boolean).length < 6;
  if (/^(stop|wait|ruk|dekho)\b/i.test(clipped) && shortStarter) {
    const context = limitScriptWords(secondSentence || `${title} ka simple shortcut dekhna zaroori hai`, 17);
    return limitScriptWords(`${clipped.replace(/[.!?।]+$/g, "")}. ${context}`, 23);
  }
  if (/^(stop|wait|ruk|dekho|agar|ye|this|don't|before|secret|mistake|warning)\b/i.test(clipped)) {
    return clipped;
  }
  if (language === "English") {
    return limitScriptWords(`Stop scrolling. If this topic matters to you, watch this simple ${title} breakdown till the end.`, 22);
  }
  if (language === "Hindi") {
    return limitScriptWords(`Stop scrolling. Agar ${title} aapke काम ka है, ye short video end tak देखना.`, 22);
  }
  return limitScriptWords(`Stop scrolling. Agar ${title} tumhare kaam ka hai, ye short video end tak dekhna.`, 22);
}

function customScriptCta(title, scriptText, language = "Hinglish") {
  const sentences = splitScriptSentences(scriptText);
  const last = sentences.at(-1) || "";
  if (/\b(comment|follow|save|share|try|link|subscribe|dm|caption)\b/i.test(last)) {
    return limitScriptWords(last, 24);
  }
  if (language === "English") {
    return limitScriptWords(`If this helped, save it, share it, and follow for the next useful ${title} style reel.`, 24);
  }
  if (language === "Hindi") {
    return limitScriptWords(`Agar ye useful लगा, reel save करो, share करो, aur next helpful video ke liye follow karo.`, 24);
  }
  return limitScriptWords(`Agar ye useful laga, reel save karo, share karo, aur next helpful video ke liye follow karo.`, 24);
}

function customOnscreenText(value, fallback = "Watch this") {
  return shortScriptPhrase(value, fallback, 7, 52)
    .replace(/[.!?।]+$/g, "");
}

function customScriptHashtags(title, language = "Hinglish") {
  const titleHash = hashtagValue(title);
  const base = [
    "#reels",
    "#instagramreels",
    "#viralreels",
    "#aitools",
    "#productivity",
    "#learnwithreels",
    "#contentcreator",
    "#shortvideo",
    "#trendingshorts",
    "#valuecontent",
    titleHash
  ].filter(Boolean);
  if (language === "Hindi") {
    base.push("#hindireels", "#learninhindi");
  } else if (language === "Hinglish") {
    base.push("#hinglishreels", "#hindienglish");
  }
  return [...new Set(base)].slice(0, 15);
}

function buildCustomScriptPlan(body = {}) {
  const rawScript = String(body.script || body.rawScript || body.videoScript || "").trim();
  if (!rawScript) {
    throw new Error("Script text required hai.");
  }
  const language = normalizeViralLanguage(body.language || body.scriptLanguage || "Hinglish");
  const totalDurationSeconds = normalizeScriptVideoDuration(body);
  const sceneCount = totalDurationSeconds / 10;
  const title = normalizeCustomScriptTitle(body, rawScript);
  const tone = String(body.tone || "energetic").trim() || "energetic";
  const presenter = normalizeHookPresenter(body.presenter || body.hookAvatarStyle || defaultHookAvatarStyle);
  const videoSize = normalizeVidsVideoSize(body.videoSize || body.vidsVideoSize || body.aspectRatio || "portrait");
  const videoSizeLabel = vidsVideoSizeLabel(videoSize);
  const hook = customScriptHook(title, rawScript, language);
  const cta = customScriptCta(title, rawScript, language);
  const bodySource = splitScriptSentences(rawScript).slice(1, -1).join(" ") || rawScript;
  const middleChunks = scriptChunks(bodySource, Math.max(1, sceneCount - 2));
  const topicLine = language === "English"
    ? `${title} in simple words`
    : language === "Hindi"
      ? `${title} simple तरीके से`
      : `${title} simple way me`;

  const scenes = Array.from({ length: sceneCount }, (_, index) => {
    const sceneNumber = index + 1;
    const isHook = sceneNumber === 1;
    const isCta = sceneNumber === sceneCount;
    const voiceover = isHook ? hook : isCta ? cta : limitScriptWords(middleChunks[index - 1] || bodySource, 26);
    const onscreenText = isHook
      ? customOnscreenText(hook, "Stop scrolling")
      : isCta
        ? customOnscreenText(cta, "Save and follow")
        : customOnscreenText(voiceover, topicLine);
    const visual = isHook
      ? `${hookPresenterDirection(presenter)} opens face-to-camera with ${hookToneDirection(tone)}. Realistic portrait creator video, clean desk, phone and laptop as context.`
      : isCta
        ? `${hookPresenterDirection(presenter)} closes face-to-camera with a confident save/share/follow CTA. Phone shows a generic social post draft, no real account details.`
        : `Realistic modern creator explainer scene with ${hookPresenterDirection(presenter)}, subtle laptop/phone b-roll, cursor-like highlights on abstract notes only if useful, clean professional room.`;
    return {
      scene_number: sceneNumber,
      duration: 10,
      voiceover,
      visual,
      onscreen_text: onscreenText,
      video_prompt: [
        vidsVideoSizeSceneOpening(videoSize),
        vidsVideoSizePromptLine(videoSize),
        `Topic: ${title}.`,
        `Scene ${sceneNumber}/${sceneCount}.`,
        `Show exactly this: ${visual}`,
        "Use a realistic human avatar/creator speaking directly to camera with natural Hinglish/Hindi/English delivery based on the script.",
        "Camera: fast but professional reel pacing, subtle push-in on key lines, clean jump cuts, stable portrait framing.",
        "Lighting/environment: modern SaaS/UGC desk setup, soft daylight, laptop and phone visible when relevant, no real personal information.",
        `Voiceover line: ${voiceover}`,
        `On-screen caption text: ${onscreenText}`,
        "Avoid fake app UI, avoid unrelated stock footage, keep the same creator/avatar style across scenes."
      ].join(" ")
    };
  });

  const plan = {
    scenes,
    metadata: {
      generated_at: new Date().toISOString(),
      generator: "custom_script_video",
      language,
      script_type: language,
      video_size: videoSize,
      video_size_label: videoSizeLabel,
      scene_count: sceneCount,
      scene_duration_seconds: 10,
      total_duration_seconds: totalDurationSeconds,
      tone,
      presenter,
      script_package: {
        hook,
        body: middleChunks.join(" "),
        cta,
        final_script: scenes.map((scene) => `Scene ${scene.scene_number}: ${scene.voiceover}`).join("\n"),
        script_language: language,
        source: "manual_pasted_script"
      }
    }
  };
  validateScenePlan(plan, { sceneCount });
  return { plan, title, language, sceneCount, totalDurationSeconds, hook, body: middleChunks.join(" "), cta, tone, presenter, videoSize, videoSizeLabel };
}

function customScriptVideoMarkdown(result = {}) {
  const scenes = result.plan?.scenes || [];
  const seo = result.seo || {};
  return [
    `# ${result.title || "Custom Script Video"}`,
    "",
    `- Flow: General script video`,
    `- Script type: ${result.language || "Hinglish"}`,
    `- Video size: ${result.videoSizeLabel || vidsVideoSizeLabel(result.videoSize || "portrait")}`,
    `- Duration: ${result.totalDurationSeconds || scenes.length * 10} seconds`,
    `- Folder: ${result.videoDir || ""}`,
    `- Generated at: ${result.generatedAt || ""}`,
    "",
    "## Optimized Hook",
    "",
    result.hook || scenes[0]?.voiceover || "",
    "",
    "## Body",
    "",
    result.body || scenes.slice(1, -1).map((scene) => scene.voiceover).join(" "),
    "",
    "## CTA",
    "",
    result.cta || scenes.at(-1)?.voiceover || "",
    "",
    "## Scene Plan",
    "",
    ...scenes.flatMap((scene) => [
      `### Scene ${scene.scene_number} - ${scene.duration}s`,
      "",
      `Voiceover: ${scene.voiceover}`,
      "",
      `On-screen text: ${scene.onscreen_text}`,
      "",
      `Visual: ${scene.visual}`,
      "",
      `Video prompt: ${scene.video_prompt}`,
      ""
    ]),
    "## Caption",
    "",
    seo.instagram_caption || "",
    "",
    "## Hashtags",
    "",
    (seo.hashtags || []).join(" ")
  ].join("\n");
}

async function prepareCustomScriptVideo(body = {}) {
  const build = buildCustomScriptPlan(body);
  const slug = slugify(build.title || "custom-script-video");
  const videoDir = body.videoDir && allowedOutputPath(body.videoDir)
    ? path.resolve(body.videoDir)
    : path.resolve(projectRoot, "outputs", "script-videos", `${slug}_${timestampSlug()}`);
  const assetsDir = path.join(videoDir, "assets");
  const generatedDir = path.join(videoDir, "generated");
  await ensureDir(videoDir);
  await ensureDir(assetsDir);
  await ensureDir(generatedDir);

  const manifest = {
    tool: {
      tool_name: build.title,
      topic: build.title,
      tool_url: String(body.referenceUrl || body.toolUrl || "").trim(),
      description: scriptTextClean(body.description || body.context, "Manual script based video."),
      category: "general_script_video",
      language: build.language
    },
    generated_at: new Date().toISOString(),
    generator: "custom_script_video",
    video_size: build.videoSize,
    video_size_label: build.videoSizeLabel,
    capture: {
      enabled: false,
      summary: "Manual script video. No real tool assets required.",
      files: []
    },
    files: {
      scene_plan: path.join(videoDir, "scene-plan.json"),
      manifest: path.join(videoDir, "manifest.json"),
      render_dir: generatedDir
    }
  };
  const seo = {
    instagram_caption: [
      build.language === "English"
        ? `${build.title}: quick, useful breakdown. Save this reel and share it with someone who needs the shortcut.`
        : build.language === "Hindi"
          ? `${build.title}: quick aur useful breakdown. Reel save करो aur jise ye help kare uske साथ share करो.`
          : `${build.title}: quick aur useful breakdown. Reel save karo aur jise ye help kare uske saath share karo.`,
      String(body.referenceUrl || body.toolUrl || "").trim() ? `Link: ${String(body.referenceUrl || body.toolUrl).trim()}` : ""
    ].filter(Boolean).join("\n"),
    hashtags: customScriptHashtags(build.title, build.language)
  };
  const result = {
    id: `script-video-${slug}-${timestampSlug()}`,
    status: "prepared",
    kind: "script_video",
    title: build.title,
    language: build.language,
    sceneCount: build.sceneCount,
    totalDurationSeconds: build.totalDurationSeconds,
    tone: build.tone,
    presenter: build.presenter,
    videoSize: build.videoSize,
    videoSizeLabel: build.videoSizeLabel,
    hook: build.hook,
    body: build.body,
    cta: build.cta,
    rawScript: String(body.script || body.rawScript || body.videoScript || "").trim(),
    videoDir,
    assetsDir,
    generatedDir,
    scenePlanPath: manifest.files.scene_plan,
    manifestPath: manifest.files.manifest,
    markdownPath: path.join(videoDir, "optimized-script.md"),
    rawScriptPath: path.join(videoDir, "input-script.txt"),
    masterPromptPath: path.join(videoDir, "google-vids-master-prompt.txt"),
    generatedAt: new Date().toISOString(),
    manifest,
    plan: build.plan,
    seo,
    files: []
  };
  const masterPrompt = buildGoogleVidsMasterPrompt(build.plan, manifest);
  await writeJson(result.scenePlanPath, build.plan);
  await writeJson(result.manifestPath, manifest);
  await fs.writeFile(result.rawScriptPath, `${result.rawScript}\n`, "utf8");
  await fs.writeFile(result.markdownPath, `${customScriptVideoMarkdown(result)}\n`, "utf8");
  await fs.writeFile(result.masterPromptPath, `${masterPrompt}\n`, "utf8");
  const promptFiles = [];
  for (const scene of build.plan.scenes) {
    const promptPath = path.join(videoDir, `google-vids-scene-${String(scene.scene_number).padStart(2, "0")}-prompt.txt`);
    await fs.writeFile(promptPath, `${buildGoogleVidsClipPrompt(build.plan, scene.scene_number, manifest)}\n`, "utf8");
    promptFiles.push(promptPath);
  }
  result.files = [
    result.scenePlanPath,
    result.manifestPath,
    result.rawScriptPath,
    result.markdownPath,
    result.masterPromptPath,
    ...promptFiles
  ].map(publicAssetFile);

  await updateUiState((state) => {
    state.settings = {
      ...(state.settings || {}),
      lastScriptVideoFolder: videoDir,
      lastScriptVideoScenePlan: result.scenePlanPath,
      lastScriptVideoLanguage: build.language,
      lastScriptVideoDurationSeconds: build.totalDurationSeconds,
      scriptVideoSize: build.videoSize,
      updatedAt: new Date().toISOString()
    };
  });

  return result;
}

function publicScriptVideoRun(run) {
  return {
    id: run.id,
    kind: "script_video",
    status: run.status,
    body: run.body,
    result: run.result,
    error: run.error,
    outputDir: run.outputDir || "",
    report: run.report || null,
    startedAt: run.startedAt,
    endedAt: run.endedAt,
    steps: run.steps || [],
    logs: run.logs.slice(-300)
  };
}

function addScriptVideoLog(run, text, stream = "system") {
  const entry = {
    at: new Date().toISOString(),
    stream,
    text: String(text || "")
  };
  run.logs.push(entry);
  if (run.logs.length > 1600) {
    run.logs.splice(0, run.logs.length - 1600);
  }
  for (const client of run.clients) {
    sendSse(client, "log", entry);
  }
}

function setScriptVideoStep(run, id, label, status = "running", detail = "") {
  const existing = run.steps.find((step) => step.id === id);
  const next = {
    id,
    label,
    status,
    detail: String(detail || ""),
    updatedAt: new Date().toISOString()
  };
  if (existing) {
    Object.assign(existing, next);
  } else {
    run.steps.push(next);
  }
  for (const client of run.clients) {
    sendSse(client, "progress", { active: next, steps: run.steps });
  }
  addScriptVideoLog(run, detail ? `${label}: ${detail}` : label, status === "failed" ? "stderr" : "stdout");
}

function finishScriptVideoRun(run, status, result = null, error = "") {
  if (run.status !== "running") {
    return;
  }
  run.status = status;
  run.result = result || run.result;
  run.error = error;
  run.endedAt = new Date().toISOString();
  const data = publicScriptVideoRun(run);
  for (const client of run.clients) {
    sendSse(client, "status", data);
    client.end();
  }
  run.clients.clear();
}

function runScriptVideoNodeScript(run, label, scriptPath, scriptArgs) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath, ...scriptArgs], {
      cwd: projectRoot,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"]
    });
    run.child = child;
    addScriptVideoLog(run, `${process.execPath} ${scriptPath} ${scriptArgs.join(" ")}`);
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      stdout += text;
      addScriptVideoLog(run, `[${label}] ${text.trimEnd()}`, "stdout");
    });
    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      stderr += text;
      addScriptVideoLog(run, `[${label}] ${text.trimEnd()}`, "stderr");
    });
    child.on("error", (error) => {
      run.child = null;
      reject(error);
    });
    child.on("close", (code) => {
      run.child = null;
      if (code === 0) {
        resolve({ code, stdout, stderr });
        return;
      }
      reject(new Error(`${label} failed with exit code ${code}. ${stderr || stdout}`.trim()));
    });
  });
}

async function generateCustomScriptVideoForProfile(prepared, body, run, profile, profileIndex = 0) {
  const profileLabel = safeHookProfileLabel(profile, profileIndex);
  const operateDir = path.join(prepared.videoDir, "google-vids", profileLabel, "operate");
  const exportDir = path.join(prepared.videoDir, "google-vids", profileLabel, "export");
  await ensureDir(operateDir);
  await ensureDir(exportDir);
  const sceneCount = Number(prepared.sceneCount || prepared.plan?.scenes?.length || 5);
  const sceneList = allSceneList(sceneCount);
  const afterSubmitWait = clamp(asFiniteNumber(body.afterSubmitWait || body.afterSubmitWaitMs, 120000), 30000, 600000);
  const manualRecoveryWait = clamp(asFiniteNumber(body.manualRecoveryWait || body.manualRecoveryWaitMs, 600000), 0, 1800000);
  const requestedAvatar = String(body.avatar || body.googleVidsAvatar || defaultAvatar || "auto");
  const selectedAvatar = requestedAvatar === "auto_by_reel"
    ? (normalizeHookPresenter(body.presenter || prepared.presenter) === "male" ? "William" : "Mia")
    : requestedAvatar;
  const videoSize = normalizeVidsVideoSize(body.videoSize || prepared.videoSize || prepared.plan?.metadata?.video_size || "portrait");
  const operateArgs = [
    "--scenes", prepared.scenePlanPath,
    "--manifest", prepared.manifestPath,
    "--all-scenes",
    "--max-scenes", String(sceneCount),
    "--output", operateDir,
    "--profile", profile,
    "--video-size", videoSize,
    "--avatar", selectedAvatar,
    "--avatar-scenes", sceneList,
    "--submit",
    "--insert",
    "--after-submit-wait", String(afterSubmitWait),
    "--manual-recovery-wait", String(manualRecoveryWait)
  ];
  if (body.url) {
    operateArgs.push("--url", String(body.url));
  }
  if (videoSize === "portrait") {
    operateArgs.push("--require-portrait");
  }

  setScriptVideoStep(run, "vids", "Google Vids", "running", `Generating ${sceneCount} ${vidsVideoSizeLabel(videoSize)} avatar scene(s) with ${profile}.`);
  let operateError = null;
  await runScriptVideoNodeScript(run, `script-video-vids:${profileLabel}`, "src/google-vids-operate.mjs", operateArgs)
    .catch((error) => {
      operateError = error;
    });
  const vidsReportPath = path.join(operateDir, "vids-operator-report.json");
  const vidsReport = await readJsonArtifact(vidsReportPath);
  if (operateError || !vidsReport?.ok) {
    const message = vidsReport?.manualAction
      ? `${vidsReport.error || operateError?.message || "Google Vids script video generation did not complete."} Manual action: ${vidsReport.manualAction}`
      : vidsReport?.error || operateError?.message || "Google Vids script video generation did not complete.";
    const error = new Error(message);
    error.report = vidsReport;
    throw error;
  }

  const vidsUrl = vidsReport.currentUrl || "";
  if (body.noExport || body.prepareOnly) {
    return {
      ...prepared,
      status: "generated_in_vids_export_skipped",
      activeProfile: profile,
      vidsUrl,
      vidsReportPath,
      operateDir,
      exportDir
    };
  }

  setScriptVideoStep(run, "export", "Export MP4", "running", `Downloading final Google Vids MP4 with ${profile}.`);
  let exportError = null;
  await runScriptVideoNodeScript(run, `script-video-export:${profileLabel}`, "src/google-vids-export.mjs", [
    "--url", vidsUrl,
    "--output", exportDir,
    "--timeout", String(body.exportTimeout || 600000),
    "--filename", "script-video-reel.mp4",
    "--profile", profile,
    "--manual-recovery-wait", String(manualRecoveryWait)
  ]).catch((error) => {
    exportError = error;
  });
  const exportReportPath = path.join(exportDir, "google-vids-export-report.json");
  const exportReport = await readJsonArtifact(exportReportPath);
  const exportedPath = exportReport?.savedPath || "";
  if (exportError || !exportReport?.ok || !exportedPath) {
    const message = exportReport?.manualAction
      ? `${exportReport.error || exportReport?.failure || exportError?.message || "Google Vids export did not save custom script MP4."} Manual action: ${exportReport.manualAction}`
      : exportReport?.error || exportReport?.failure || exportError?.message || "Google Vids export did not save custom script MP4.";
    const error = new Error(message);
    error.report = exportReport;
    throw error;
  }

  const finalPath = path.join(prepared.videoDir, "final_script_video.mp4");
  await fs.copyFile(exportedPath, finalPath);
  const cached = await cacheVidsExport({
    toolDir: prepared.videoDir,
    sourcePath: finalPath,
    kind: "custom_script_video",
    profile,
    scenes: Array.from({ length: sceneCount }, (_, index) => index + 1),
    note: "General script video generated/exported from Google Vids.",
    qualityStatus: "needs_human_review"
  });
  await recordProfileAiVideoUse(profile, sceneCount).catch(() => {});
  const result = {
    ...prepared,
    status: "complete",
    activeProfile: profile,
    vidsUrl,
    vidsReportPath,
    exportReportPath,
    operateDir,
    exportDir,
    exportedPath,
    videoPath: finalPath,
    outputPath: finalPath,
    cachedExportPath: cached?.cachedPath || "",
    summary: "General script video exported from Google Vids. Human review before posting.",
    files: [
      ...(prepared.files || []),
      finalPath,
      cached?.cachedPath,
      vidsReportPath,
      exportReportPath
    ].filter(Boolean).map((item) => typeof item === "string" ? publicAssetFile(item) : item)
  };
  await writeJson(path.join(prepared.videoDir, "script-video-package.json"), result);
  return result;
}

async function generateCustomScriptVideoWithGoogleVids(prepared, body, run) {
  const profiles = hookProfilesFromBody(body);
  if (!profiles.length) {
    throw new Error("At least one Google Vids profile is required.");
  }
  const attempts = [];
  let lastError = null;
  const quotaState = await loadUiState();
  for (let index = 0; index < profiles.length; index += 1) {
    const profile = profiles[index];
    const canTryNext = index < profiles.length - 1;
    const quota = profileQuota(quotaState, profile);
    if (quota.quotaExhausted || quota.limitStatus === "limit_used") {
      lastError = new Error(`Google Vids profile limit used: ${profile}. Fallback profile try ho sakta hai.`);
      attempts.push({ profile, ok: false, quotaHit: true, skipped: true, willTryNext: canTryNext, error: lastError.message });
      addScriptVideoLog(run, `Skipping limit-used profile: ${profile}`, "stderr");
      if (canTryNext) {
        continue;
      }
      break;
    }
    try {
      const result = await generateCustomScriptVideoForProfile(prepared, body, run, profile, index);
      attempts.push({
        profile,
        ok: true,
        status: result.status,
        videoPath: result.videoPath || "",
        vidsUrl: result.vidsUrl || ""
      });
      result.attempts = attempts;
      return result;
    } catch (error) {
      lastError = error;
      const report = error.report || null;
      const quotaHit = Boolean(report?.quotaHit) || quotaHitFromText(error.message);
      attempts.push({
        profile,
        ok: false,
        quotaHit,
        loginNeeded: Boolean(report?.loginNeeded),
        requiresManualAction: Boolean(report?.requiresManualAction),
        manualAction: report?.manualAction || "",
        willTryNext: canTryNext,
        error: error.message
      });
      addScriptVideoLog(run, `Profile failed: ${profile}. ${error.message}`, "stderr");
      if (quotaHit) {
        await markProfileQuotaHit(profile, error.message).catch(() => {});
      }
      if (canTryNext) {
        addScriptVideoLog(run, `Trying fallback profile next: ${profiles[index + 1]}`);
        continue;
      }
    }
  }
  const error = lastError || new Error("Google Vids custom script video generation failed.");
  error.attempts = attempts;
  throw error;
}

async function startCustomScriptVideoRun(body = {}) {
  if (creditSafeModeEnabled(body.creditSafeMode) && !body.prepareOnly) {
    throw new Error("Credit Safe Mode is ON. Custom script Google Vids generation is blocked.");
  }
  const id = `script-video-${timestampSlug()}`;
  const run = {
    id,
    kind: "script_video",
    status: "running",
    body,
    result: null,
    report: null,
    error: "",
    outputDir: "",
    startedAt: new Date().toISOString(),
    endedAt: null,
    steps: [],
    logs: [],
    clients: new Set(),
    child: null
  };
  scriptVideoRuns.set(id, run);
  setScriptVideoStep(run, "start", "Script Video", "running", "Preparing custom script video package.");

  setTimeout(async () => {
    let prepared = null;
    try {
      setScriptVideoStep(run, "script", "Optimize Script", "running", "Cleaning script, hook/body/CTA, and timing.");
      prepared = await prepareCustomScriptVideo(body);
      run.outputDir = prepared.videoDir;
      run.result = prepared;
      setScriptVideoStep(run, "script", "Optimize Script", "complete", `${prepared.sceneCount} scene(s), ${prepared.totalDurationSeconds}s ready.`);
      if (body.prepareOnly) {
        finishScriptVideoRun(run, "complete", prepared);
        return;
      }
      const result = await generateCustomScriptVideoWithGoogleVids(prepared, body, run);
      run.outputDir = result.videoDir || prepared.videoDir;
      run.result = result;
      run.report = {
        mode: "custom-script-video",
        toolDir: result.videoDir,
        mp4Path: result.videoPath || result.outputPath || "",
        vidsUrl: result.vidsUrl || "",
        vidsProfile: result.activeProfile || "",
        vidsProfilesTried: (result.attempts || []).map((attempt) => attempt.profile).filter(Boolean),
        qaStatus: "Needs human review",
        error: ""
      };
      setScriptVideoStep(run, "done", "Video saved", "complete", result.videoPath || result.videoDir);
      addScriptVideoLog(run, `Custom script video ready: ${result.videoPath || result.videoDir}`, "stdout");
      finishScriptVideoRun(run, "complete", result);
    } catch (error) {
      setScriptVideoStep(run, "failed", "Script video failed", "failed", error.message);
      run.report = {
        mode: "custom-script-video",
        toolDir: prepared?.videoDir || "",
        mp4Path: "",
        qaStatus: "failed",
        error: error.message
      };
      addScriptVideoLog(run, error.message, "stderr");
      finishScriptVideoRun(run, "failed", run.result, error.message);
    }
  }, 0);

  return run;
}

function normalizeHookPresenter(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (["male", "female", "auto"].includes(raw)) {
    return raw;
  }
  return "female";
}

function normalizeVidsVideoSize(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (/^(landscape|horizontal|16:9|youtube|wide)$/i.test(raw)) {
    return "landscape";
  }
  if (/^(square|1:1|post)$/i.test(raw)) {
    return "square";
  }
  return "portrait";
}

function vidsVideoSizeLabel(value) {
  const size = normalizeVidsVideoSize(value);
  if (size === "landscape") return "Landscape 16:9";
  if (size === "square") return "Square 1:1";
  return "Portrait 9:16";
}

function vidsVideoSizePromptLine(value) {
  const size = normalizeVidsVideoSize(value);
  if (size === "landscape") {
    return "Strictly landscape 16:9 for a wide YouTube/website video, not portrait or square; keep presenter, captions, and device screen inside safe margins.";
  }
  if (size === "square") {
    return "Strictly square 1:1 for social feed video, not portrait or landscape; keep presenter, captions, and device screen inside safe margins.";
  }
  return "Strictly portrait 9:16 for Instagram Reels, not landscape or square; keep presenter, captions, and device screen inside mobile safe margins.";
}

function vidsVideoSizePromptLead(seconds, value, description) {
  const size = normalizeVidsVideoSize(value);
  if (size === "landscape") {
    return `Create a ${seconds}-second 16:9 landscape AI avatar ${description} clip.`;
  }
  if (size === "square") {
    return `Create a ${seconds}-second 1:1 square AI avatar ${description} clip.`;
  }
  return `Create a ${seconds}-second 9:16 vertical portrait AI avatar ${description} clip.`;
}

function vidsVideoSizeSceneOpening(value) {
  const size = normalizeVidsVideoSize(value);
  if (size === "landscape") {
    return "Create a 10-second 16:9 landscape video for YouTube or a wide social post.";
  }
  if (size === "square") {
    return "Create a 10-second 1:1 square video for a social feed post.";
  }
  return "Create a 10-second 9:16 vertical video for Instagram Reels.";
}

function normalizeHookTone(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (["energetic", "professional", "friendly", "urgent"].includes(raw)) {
    return raw;
  }
  return "energetic";
}

function googleVidsAvatarOption(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return null;
  }
  return avatarOptions.find((option) => String(option?.value || "").trim() === raw)
    || avatarOptions.find((option) => String(option?.label || "").trim() === raw)
    || null;
}

function googleVidsAvatarLabel(value) {
  const raw = String(value || "").trim();
  if (raw === "auto_by_reel") {
    return "Auto by reel";
  }
  if (raw === "auto") {
    return "Google Vids auto";
  }
  const option = googleVidsAvatarOption(raw);
  return option?.label || raw || "Google Vids auto";
}

function hasGoogleVidsAvatar(value) {
  return Boolean(googleVidsAvatarOption(value));
}

function hookAvatarAutoChoice(value, reason) {
  const selected = hasGoogleVidsAvatar(value) ? value : "auto";
  return {
    mode: "auto_by_reel",
    value: selected,
    label: googleVidsAvatarLabel(selected),
    reason
  };
}

function selectHookAvatarForReel(tool = {}, scriptBuild = {}, requested = "auto_by_reel", presenter = "auto") {
  const raw = String(requested || "auto_by_reel").trim();
  if (raw && raw !== "auto_by_reel") {
    return {
      mode: raw === "auto" ? "google_auto" : "manual",
      value: raw,
      label: googleVidsAvatarLabel(raw),
      reason: raw === "auto"
        ? "Google Vids will choose a realistic avatar automatically."
        : "Manually selected in the dashboard."
    };
  }

  const pkg = scriptBuild.scriptPackage || scriptBuild.plan?.metadata?.script_package || {};
  const context = scriptTextClean([
    tool.tool_name,
    tool.name,
    tool.topic,
    tool.category,
    tool.primary_feature,
    tool.target_audience,
    tool.description,
    tool.script,
    pkg.hook,
    pkg.body,
    pkg.cta
  ].filter(Boolean).join(" ")).toLowerCase();

  if (/privacy|redact|sensitive|secret|security|pii|safe sharing|mask|blur|client data/.test(context)) {
    return hookAvatarAutoChoice("Eleanor", "Privacy/safety reel needs a calm, trustworthy professional avatar.");
  }
  if (/invoice|payment|tax|finance|receipt|bill|money|budget|pricing/.test(context)) {
    return hookAvatarAutoChoice("Sebastian", "Finance/business reel needs a confident professional avatar.");
  }
  if (/creator|instagram|reel|caption|marketing|content|social|viral|post/.test(context)) {
    return hookAvatarAutoChoice("Sofia", "Creator/marketing reel needs an energetic UGC-style avatar.");
  }
  if (/developer|code|api|json|regex|terminal|automation|script|website|tool/.test(context)) {
    return hookAvatarAutoChoice("Levi", "Developer/tooling reel needs a technical creator avatar.");
  }
  if (/student|learn|study|education|notes|quiz|school|college/.test(context)) {
    return hookAvatarAutoChoice("Finley", "Learning reel needs a friendly explanatory avatar.");
  }
  if (presenter === "male") {
    return hookAvatarAutoChoice("William", "Presenter is male, so a realistic male avatar is preferred.");
  }
  if (presenter === "female") {
    return hookAvatarAutoChoice("Mia", "Presenter is female, so a realistic female avatar is preferred.");
  }
  return hookAvatarAutoChoice("auto", "No strong content signal found, so Google Vids auto is safest.");
}

function hookPresenterDirection(presenter) {
  if (presenter === "male") {
    return "realistic Indian male SaaS creator, confident face-to-camera delivery, modern desk setup";
  }
  if (presenter === "auto") {
    return "realistic Indian UGC creator, male or female, confident face-to-camera delivery, modern desk setup";
  }
  return "realistic Indian female SaaS creator, confident face-to-camera delivery, modern desk setup";
}

function hookToneDirection(tone) {
  const map = {
    energetic: "high-energy but natural, fast first sentence, curious expression, clear hand gestures",
    professional: "calm professional authority, crisp delivery, subtle gestures, trustworthy expression",
    friendly: "warm helpful creator tone, conversational delivery, slight smile, approachable energy",
    urgent: "pattern-interrupt urgency, direct eye contact, sharp pauses, mistake-avoidance framing"
  };
  return map[tone] || map.energetic;
}

function hookWordLimit(durationSeconds) {
  const duration = clamp(asFiniteNumber(durationSeconds, 10), 6, 10);
  return clamp(Math.round(duration * 2.35), 14, 26);
}

function hookNeedsPatternInterrupt(text) {
  return !/^(stop|wait|ruk|dekho|agar|yeh|ye|one|this|don't|do not|before|warning|secret|mistake)\b/i.test(text);
}

function buildHookAvatarScript(tool, scriptBuild = {}, options = {}) {
  const durationSeconds = clamp(asFiniteNumber(options.durationSeconds, 10), 6, 10);
  const language = normalizeViralLanguage(options.scriptLanguage || scriptBuild.scriptLanguage || tool.language || "Hinglish");
  const scenes = scriptBuild.plan?.scenes || [];
  const pkg = scriptBuild.scriptPackage || scriptBuild.plan?.metadata?.script_package || {};
  const explicitHook = scriptTextClean(options.hookText, "");
  const selectedHook = scriptTextClean(
    explicitHook
      || pkg.hook
      || scenes[0]?.voiceover
      || selectViralHook({ ...tool, language, script_language: language }).voiceover,
    ""
  );
  const toolLabel = shortToolLabel(tool);
  const benefit = scriptBenefitLine(tool);
  const context = scriptTextClean(`${tool.tool_name || ""} ${tool.topic || ""} ${tool.description || ""} ${tool.script || ""}`).toLowerCase();
  if (!explicitHook && /pii|privacy|redact|sensitive|secret|email|phone|id/i.test(context)) {
    return limitScriptWords(
      "Stop scrolling. Client data share karne se pehle names, emails, IDs leak ho sakte hain. Ye tool seconds me sensitive data mask karta hai.",
      hookWordLimit(durationSeconds)
    );
  }
  if (!explicitHook && /invoice|bill|payment|tax|receipt/i.test(context)) {
    return limitScriptWords(
      `Stop scrolling. Invoice check manually karte waqt small mistake costly ho sakti hai. ${toolLabel} seconds me review-ready result deta hai.`,
      hookWordLimit(durationSeconds)
    );
  }
  const intro = language === "English"
    ? "Stop scrolling."
    : "Stop scrolling.";
  const base = hookNeedsPatternInterrupt(selectedHook)
    ? `${intro} Agar ${toolLabel} ka kaam manually kar rahe ho, ye tool ${benefit}.`
    : selectedHook;
  const withProof = /tool|website|seconds|sec|demo|kaam|work/i.test(base)
    ? base
    : `${base} ${toolLabel} ${benefit}.`;
  return limitScriptWords(withProof, hookWordLimit(durationSeconds));
}

function buildHookOnscreenText(scriptText, tool) {
  const firstSentence = scriptTextClean(scriptText)
    .split(/(?<=[.!?])\s+/)[0]
    .replace(/[.!?]+$/g, "");
  return shortScriptPhrase(firstSentence, `${shortToolLabel(tool)} in seconds`, 7, 54);
}

function brandedToolLabel(tool, language = "Hinglish") {
  const label = shortToolLabel(tool);
  if (/^alt\s*f|^altftool/i.test(label)) {
    return label;
  }
  return normalizeViralLanguage(language) === "English" ? `AltFTool's ${label}` : `AltFTool ka ${label}`;
}

function buildCtaAvatarScript(tool, scriptBuild = {}, options = {}) {
  const durationSeconds = clamp(asFiniteNumber(options.durationSeconds, 8), 6, 10);
  const language = normalizeViralLanguage(options.scriptLanguage || scriptBuild.scriptLanguage || tool.language || "Hinglish");
  const toolLabel = brandedToolLabel(tool, language);
  const maxWords = hookWordLimit(durationSeconds);
  const lines = language === "English"
    ? `Try ${toolLabel}, the link is in the caption. Save this reel and follow for the next useful micro-tool demo.`
    : language === "Hindi"
      ? `${toolLabel} try करो, link caption में है. Reel save करो और next useful micro-tool demo के लिए follow करो.`
      : `${toolLabel} try karo, link caption me hai. Reel save karo aur next useful micro-tool demo ke liye follow karo.`;
  return limitScriptWords(lines, maxWords);
}

function buildCtaOnscreenText(tool, language = "Hinglish") {
  const label = brandedToolLabel(tool, language);
  const normalized = normalizeViralLanguage(language);
  const base = normalized === "English"
    ? `${label}: link in caption`
    : normalized === "Hindi"
      ? `${label}: link caption में`
      : `${label}: link caption me`;
  return shortScriptPhrase(base, "Link caption me", 7, 54);
}

function middleAvatarSceneNumbers(value, sceneCount = 6) {
  const selected = parseSceneList(value || "2", sceneCount)
    .filter((sceneNumber) => sceneNumber > 1 && sceneNumber < sceneCount);
  if (selected.length) {
    return selected.slice(0, 2);
  }
  return sceneCount >= 4 ? [2] : [];
}

function buildMiddleAvatarScript(tool, scriptBuild = {}, sceneNumber = 2, options = {}) {
  const durationSeconds = clamp(asFiniteNumber(options.durationSeconds, 8), 6, 10);
  const language = normalizeViralLanguage(options.scriptLanguage || scriptBuild.scriptLanguage || tool.language || "Hinglish");
  const label = brandedToolLabel(tool, language);
  const scenes = Array.isArray(scriptBuild.plan?.scenes) ? scriptBuild.plan.scenes : [];
  const sourceScene = scenes.find((scene) => Number(scene.scene_number) === Number(sceneNumber));
  const sourceText = scriptTextClean(sourceScene?.voiceover, "");
  const base = language === "English"
    ? `Quick focus: ${label} keeps the workflow simple. Use demo data, run the visible step, then review before sharing.`
    : language === "Hindi"
      ? `Quick focus: ${label} में workflow simple है. Demo data use करो, visible step run करो, फिर share से पहले review करो.`
      : `Quick focus: ${label} me workflow simple hai. Demo data use karo, visible step run karo, phir share se pehle review karo.`;
  const combined = sourceText && sourceText.length < 95
    ? `${base} ${sourceText}`
    : base;
  return limitScriptWords(combined, hookWordLimit(durationSeconds));
}

function buildMiddleOnscreenText(tool, language = "Hinglish") {
  const label = brandedToolLabel(tool, language);
  const normalized = normalizeViralLanguage(language);
  const base = normalized === "English"
    ? `Focus: ${label}`
    : normalized === "Hindi"
      ? `Focus: ${label}`
      : `Focus: ${label}`;
  return shortScriptPhrase(base, "Focus karo", 7, 54);
}

function captureFilePathsFromArtifacts(...sources) {
  const files = [];
  for (const source of sources.filter(Boolean)) {
    const sourceFiles = [
      ...(source.capture?.files || []),
      ...(source.files || [])
    ];
    for (const item of sourceFiles) {
      const filePath = typeof item === "string" ? item : item?.path;
      if (filePath && !files.includes(filePath)) {
        files.push(filePath);
      }
    }
  }
  return files;
}

function hookAvatarReadme(result) {
  const middleScenes = Array.isArray(result.middleAvatarScenes) ? result.middleAvatarScenes : [];
  const ctaLines = result.includeCtaAvatar === false ? [] : [
    `${5 + middleScenes.length}. Generate/download the CTA MP4 and keep/copy it as \`cta_avatar.mp4\` and \`../vids-clips/scene-${String(result.ctaSceneNumber || 6).padStart(2, "0")}.mp4\`.`
  ];
  const middleLines = middleScenes.map((sceneNumber, index) => (
    `${5 + index}. Generate/download the mid-reel focus avatar MP4 for Scene ${sceneNumber} and keep/copy it as \`focus_avatar_scene_${String(sceneNumber).padStart(2, "0")}.mp4\` and \`../vids-clips/scene-${String(sceneNumber).padStart(2, "0")}.mp4\`.`
  ));
  const middleScriptLines = middleScenes.length ? [
    "",
    "Middle focus avatar scripts:",
    "",
    ...middleScenes.map((sceneNumber) => `Scene ${sceneNumber}: ${result.middleAvatarScripts?.[sceneNumber] || ""}`)
  ] : [];
  const middlePromptLines = middleScenes.length ? [
    "",
    "Google Vids middle focus prompts:",
    "",
    ...middleScenes.map((sceneNumber) => `Scene ${sceneNumber} prompt:\n${result.googleVidsMiddlePrompts?.[sceneNumber] || ""}`)
  ] : [];
  const ctaScriptLines = result.includeCtaAvatar === false ? [] : [
    "",
    "CTA script:",
    "",
    result.ctaScript
  ];
  const ctaPromptLines = result.includeCtaAvatar === false ? [] : [
    "",
    "Google Vids CTA prompt:",
    "",
    result.googleVidsCtaPrompt
  ];
  return [
    `# Hook + Focus + CTA Avatar - ${result.tool?.tool_name || "Tool"}`,
    "",
    "Purpose: generate the first hook clip, optional mid-reel focus avatar clip, and optional final CTA avatar clip for the Reel.",
    "",
    "Use this flow:",
    "",
    "1. Generate/open Google Vids from the dashboard.",
    `2. Use AI Avatar in ${result.videoSizeLabel || vidsVideoSizeLabel(result.videoSize || "portrait")} mode for the hook scene.`,
    "3. Download the generated hook MP4.",
    "4. Keep/copy the hook MP4 as `hook_avatar.mp4` and `../vids-clips/scene-01.mp4`.",
    ...middleLines,
    ...ctaLines,
    "",
    "Google Vids character:",
    "",
    result.avatarChoice?.label || result.googleVidsAvatar || "Google Vids auto",
    result.avatarChoice?.reason ? `Reason: ${result.avatarChoice.reason}` : "",
    result.avatarReferences?.length ? `Custom avatar reference: ${result.avatarReferences.join(", ")}` : "",
    "",
    "Hook script:",
    "",
    result.hookScript,
    ...middleScriptLines,
    ...ctaScriptLines,
    "",
    "Google Vids prompt:",
    "",
    result.googleVidsPrompt,
    ...middlePromptLines,
    ...ctaPromptLines,
    "",
    "Safety: use fictional/demo data only and review the generated human/avatar clip before posting.",
    ""
  ].join("\n");
}

function safeHookProfileLabel(profileDir, index = 0) {
  const base = path.basename(String(profileDir || "").replace(/[\\/]+$/g, "")) || `profile-${index + 1}`;
  const cleanBase = base
    .replace(/[/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  return `${String(index + 1).padStart(2, "0")}-${cleanBase || "profile"}`;
}

async function prepareHookAvatar(body = {}) {
  const input = path.resolve(String(body.input || defaultInput).trim());
  const rowNumber = Number(body.row || 2);
  const presenter = normalizeHookPresenter(body.presenter || body.hookAvatarStyle || defaultHookAvatarStyle);
  const tone = normalizeHookTone(body.tone || "energetic");
  const videoSize = normalizeVidsVideoSize(body.videoSize || body.vidsVideoSize || body.aspectRatio || "portrait");
  const videoSizeLabel = vidsVideoSizeLabel(videoSize);
  const videoSizeLine = vidsVideoSizePromptLine(videoSize);
  const durationSeconds = clamp(asFiniteNumber(body.durationSeconds || body.duration, 10), 6, 10);
  const tool = await toolRowForInput(input, rowNumber);
  const artifacts = await findToolArtifacts({
    input,
    row: rowNumber,
    toolName: tool.tool_name,
    toolUrl: tool.tool_url
  });
  let scriptBuild = artifacts.latestScript?.scriptBuild || null;
  if (!scriptBuild) {
    scriptBuild = await generateReelScript({
      input,
      row: rowNumber,
      sceneCount: clamp(asFiniteNumber(body.sceneCount, 5), 3, 6),
      scriptLanguage: body.scriptLanguage || tool.language || "Hinglish",
      assetsDir: body.assetsDir || artifacts.latestAssets?.folder || ""
    });
  }

  const runDir = scriptBuild.runDir
    || (scriptBuild.scriptDir ? path.dirname(scriptBuild.scriptDir) : "")
    || artifacts.latestAssets?.runDir
    || path.resolve(projectRoot, "outputs", "hook-avatar", `${slugify(tool.tool_name || `row-${rowNumber}`)}_${timestampSlug()}`);
  if (!allowedOutputPath(runDir)) {
    throw new Error("Hook output folder is not allowed.");
  }

  const hookDir = path.join(runDir, "hook-avatar");
  const assetsDir = scriptBuild.assetsDir || artifacts.latestAssets?.folder || path.join(runDir, "assets");
  await ensureDir(hookDir);
  await ensureDir(assetsDir);
  const avatarReferenceFiles = await avatarReferenceFilesFromBody(body);
  const vidsClipCacheFolder = await ensureVidsClipCache(runDir);
  const scriptScenes = Array.isArray(scriptBuild.plan?.scenes) ? scriptBuild.plan.scenes : [];
  const reelSceneCount = clamp(
    asFiniteNumber(scriptBuild.sceneCount || scriptBuild.plan?.metadata?.scene_count || scriptScenes.length, 6),
    3,
    6
  );
  const ctaSceneNumber = reelSceneCount;
  const includeCtaAvatar = body.includeCtaAvatar !== false;
  const includeMiddleAvatar = body.includeMiddleAvatar !== false && body.includeFocusAvatar !== false;
  const focusDurationSeconds = clamp(asFiniteNumber(body.focusDurationSeconds || body.middleDurationSeconds || durationSeconds, 8), 6, 10);
  const middleScenes = includeMiddleAvatar
    ? middleAvatarSceneNumbers(body.middleAvatarScenes || body.focusAvatarScenes, reelSceneCount)
    : [];
  const hookScript = buildHookAvatarScript(tool, scriptBuild, {
    durationSeconds,
    scriptLanguage: body.scriptLanguage || scriptBuild.scriptLanguage
  });
  const ctaDurationSeconds = clamp(asFiniteNumber(body.ctaDurationSeconds || body.ctaDuration || durationSeconds, 8), 6, 10);
  const ctaScript = buildCtaAvatarScript(tool, scriptBuild, {
    durationSeconds: ctaDurationSeconds,
    scriptLanguage: body.scriptLanguage || scriptBuild.scriptLanguage
  });
  const avatarChoice = selectHookAvatarForReel(
    tool,
    scriptBuild,
    body.avatar || body.googleVidsAvatar || "auto_by_reel",
    presenter
  );
  const googleVidsAvatar = avatarChoice.value || "auto";
  const characterDirection = googleVidsAvatar === "auto"
    ? "Google Vids should auto-select the most realistic portrait AI avatar for this reel hook."
    : `Use/select the Google Vids AI avatar character "${avatarChoice.label}" if available.`;
  const customAvatarDirection = avatarReferenceFiles.length
    ? `Use the attached custom avatar reference photo (${path.basename(avatarReferenceFiles[0])}) as the face/style guide when the tool supports image references; otherwise keep the selected presenter gender and style consistent.`
    : "";
  const onscreenText = buildHookOnscreenText(hookScript, tool);
  const ctaOnscreenText = buildCtaOnscreenText(tool, body.scriptLanguage || scriptBuild.scriptLanguage || tool.language || "Hinglish");
  const middleAvatarScripts = Object.fromEntries(middleScenes.map((sceneNumber) => [
    sceneNumber,
    buildMiddleAvatarScript(tool, scriptBuild, sceneNumber, {
      durationSeconds: focusDurationSeconds,
      scriptLanguage: body.scriptLanguage || scriptBuild.scriptLanguage
    })
  ]));
  const middleAvatarOnscreenText = Object.fromEntries(middleScenes.map((sceneNumber) => [
    sceneNumber,
    buildMiddleOnscreenText(tool, body.scriptLanguage || scriptBuild.scriptLanguage || tool.language || "Hinglish")
  ]));
  const hookScene = {
    scene_number: 1,
    duration: durationSeconds,
    voiceover: hookScript,
    onscreen_text: onscreenText,
    visual: `${characterDirection} ${customAvatarDirection} ${hookPresenterDirection(presenter)}. ${hookToneDirection(tone)}. ${videoSizeLabel} frame. Hook starts immediately, face fills the upper frame, laptop beside presenter briefly shows the real AltFTool page.`,
    video_prompt: [
      vidsVideoSizePromptLead(durationSeconds, videoSize, "hook"),
      videoSizeLine,
      characterDirection,
      customAvatarDirection,
      hookPresenterDirection(presenter),
      hookToneDirection(tone),
      `The avatar speaks this exact line naturally in the first 2 seconds without greeting: ${hookScript}`,
      "Modern SaaS desk setup, soft daylight, clean background, direct eye contact, quick push-in camera move.",
      "Laptop beside presenter should briefly show the real AltFTool/tool page context, not a fake generated app.",
      "No fake UI, no personal information, no unrelated stock footage, no slow intro."
    ].join(" ")
  };
  const middleAvatarScenePlan = middleScenes.map((sceneNumber) => ({
    scene_number: sceneNumber,
    duration: focusDurationSeconds,
    voiceover: middleAvatarScripts[sceneNumber],
    onscreen_text: middleAvatarOnscreenText[sceneNumber],
    visual: `${characterDirection} ${customAvatarDirection} ${hookPresenterDirection(presenter)}. ${hookToneDirection("professional")} Mid-reel human focus break beside a laptop showing the real AltFTool demo; the avatar points at the useful workflow and keeps attention before the screen demo continues.`,
    video_prompt: [
      vidsVideoSizePromptLead(focusDurationSeconds, videoSize, `focus Scene ${sceneNumber}`),
      videoSizeLine,
      characterDirection,
      customAvatarDirection,
      hookPresenterDirection(presenter),
      "Professional but engaging mid-reel focus break, direct eye contact, short hand gesture toward the laptop screen.",
      `The avatar speaks this exact line naturally: ${middleAvatarScripts[sceneNumber]}`,
      "Keep the real AltFTool/tool page visible on a laptop or phone as context, but do not invent UI. This clip will be used between real screenshots and demo footage.",
      "No fake UI, no personal information, no unrelated stock footage, no generic B-roll."
    ].join(" ")
  }));
  const ctaScene = {
    scene_number: ctaSceneNumber,
    duration: ctaDurationSeconds,
    voiceover: ctaScript,
    onscreen_text: ctaOnscreenText,
    visual: `${characterDirection} ${customAvatarDirection} ${hookPresenterDirection(presenter)}. ${hookToneDirection("friendly")} Final face-to-camera CTA, phone shows an Instagram draft/caption area, laptop has the real AltFTool page visible in the background.`,
    video_prompt: [
      vidsVideoSizePromptLead(ctaDurationSeconds, videoSize, "CTA"),
      videoSizeLine,
      characterDirection,
      customAvatarDirection,
      hookPresenterDirection(presenter),
      "Friendly confident closing energy, direct eye contact, natural hand gesture toward the caption area.",
      `The avatar speaks this exact line naturally: ${ctaScript}`,
      "Show a phone with a generic Instagram caption draft saying link in caption, no real account details, and a laptop in the background with the actual AltFTool/tool context.",
      "End with a clear save/follow gesture and human review reminder. No fake UI, no personal information, no unrelated stock footage."
    ].join(" ")
  };
  const scenePlan = {
    scenes: [
      hookScene,
      ...middleAvatarScenePlan,
      ...(includeCtaAvatar ? [ctaScene] : [])
    ].sort((a, b) => Number(a.scene_number) - Number(b.scene_number)),
    metadata: {
      generated_at: new Date().toISOString(),
      language: scriptBuild.scriptLanguage || tool.language || "Hinglish",
      script_type: scriptBuild.scriptLanguage || tool.language || "Hinglish",
      hook_avatar_only: !includeCtaAvatar && !middleScenes.length,
      hook_cta_avatar_pack: includeCtaAvatar,
      hook_focus_cta_avatar_pack: Boolean(includeCtaAvatar || middleScenes.length),
      middle_avatar_scenes: middleScenes,
      reel_scene_count: reelSceneCount,
      cta_scene_number: ctaSceneNumber,
      video_size: videoSize,
      video_size_label: videoSizeLabel,
      google_vids_avatar: googleVidsAvatar,
      avatar_choice: avatarChoice,
      source_script_path: scriptBuild.scriptPath || ""
    }
  };
  const manifest = {
    version: 1,
    row: Number(tool.source_row_number || rowNumber),
    tool,
    runDir,
    hookDir,
    assetsDir,
    capture: {
      files: captureFilePathsFromArtifacts(scriptBuild.assetBuild, artifacts.latestAssets?.assetBuild)
        .filter((filePath) => /\.(png|jpe?g|webp)$/i.test(filePath))
        .slice(0, 6)
    },
    avatarReferences: avatarReferenceFiles,
    hookAvatar: {
      presenter,
      avatarChoice,
      googleVidsAvatar,
      videoSize,
      videoSizeLabel,
      portrait: videoSize === "portrait",
      tone,
      durationSeconds,
      status: "prepared",
      hookScript,
      onscreenText,
      videoPath: "",
      cachedScenePath: ""
    },
    middleAvatars: middleScenes.map((sceneNumber) => ({
      presenter,
      avatarChoice,
      googleVidsAvatar,
      videoSize,
      videoSizeLabel,
      portrait: videoSize === "portrait",
      tone: "professional",
      durationSeconds: focusDurationSeconds,
      sceneNumber,
      status: "prepared",
      focusScript: middleAvatarScripts[sceneNumber],
      onscreenText: middleAvatarOnscreenText[sceneNumber],
      videoPath: "",
      cachedScenePath: ""
    })),
    ctaAvatar: includeCtaAvatar ? {
      presenter,
      avatarChoice,
      googleVidsAvatar,
      videoSize,
      videoSizeLabel,
      portrait: videoSize === "portrait",
      tone: "friendly",
      durationSeconds: ctaDurationSeconds,
      sceneNumber: ctaSceneNumber,
      status: "prepared",
      ctaScript,
      onscreenText: ctaOnscreenText,
      videoPath: "",
      cachedScenePath: ""
    } : null
  };
  const scenePlanPath = path.join(hookDir, "scene-plan.json");
  const manifestPath = path.join(hookDir, "manifest.json");
  const hookScriptPath = path.join(hookDir, "hook-script.txt");
  const ctaScriptPath = path.join(hookDir, "cta-script.txt");
  const middleScriptPaths = Object.fromEntries(middleScenes.map((sceneNumber) => [
    sceneNumber,
    path.join(hookDir, `focus-script-scene-${String(sceneNumber).padStart(2, "0")}.txt`)
  ]));
  const promptPath = path.join(hookDir, "google-vids-hook-prompt.txt");
  const ctaPromptPath = path.join(hookDir, "google-vids-cta-prompt.txt");
  const middlePromptPaths = Object.fromEntries(middleScenes.map((sceneNumber) => [
    sceneNumber,
    path.join(hookDir, `google-vids-focus-scene-${String(sceneNumber).padStart(2, "0")}-prompt.txt`)
  ]));
  const saveAsPath = path.join(hookDir, "save-as.txt");
  const hookManifestPath = path.join(hookDir, "hook-avatar-manifest.json");
  const promptReferenceFiles = [
    ...avatarReferenceFiles,
    ...manifest.capture.files
  ];
  const googleVidsPrompt = buildGoogleVidsClipPrompt(scenePlan, 1, manifest, {
    referenceFiles: promptReferenceFiles
  });
  const googleVidsMiddlePrompts = Object.fromEntries(middleScenes.map((sceneNumber) => [
    sceneNumber,
    buildGoogleVidsClipPrompt(scenePlan, sceneNumber, manifest, {
      referenceFiles: promptReferenceFiles
    })
  ]));
  const googleVidsCtaPrompt = includeCtaAvatar
    ? buildGoogleVidsClipPrompt(scenePlan, ctaSceneNumber, manifest, {
      referenceFiles: promptReferenceFiles
    })
    : "";
  const result = {
    id: `hook-avatar-${slugify(tool.tool_name || `row-${rowNumber}`)}-${timestampSlug()}`,
    status: "prepared",
    input,
    row: Number(tool.source_row_number || rowNumber),
    tool,
    runDir,
    hookDir,
    assetsDir,
    vidsClipCacheFolder,
    generatedAt: new Date().toISOString(),
    presenter,
    avatarChoice,
    googleVidsAvatar,
    videoSize,
    videoSizeLabel,
    portrait: videoSize === "portrait",
    tone,
    durationSeconds,
    focusDurationSeconds,
    includeMiddleAvatar: Boolean(middleScenes.length),
    middleAvatarScenes: middleScenes,
    middleAvatarScripts,
    middleAvatarOnscreenText,
    ctaDurationSeconds,
    includeCtaAvatar,
    ctaSceneNumber,
    hookScript,
    onscreenText,
    ctaScript: includeCtaAvatar ? ctaScript : "",
    ctaOnscreenText: includeCtaAvatar ? ctaOnscreenText : "",
    googleVidsPrompt,
    googleVidsMiddlePrompts,
    googleVidsCtaPrompt,
    avatarReferences: avatarReferenceFiles,
    avatarHostImage: avatarReferenceFiles[0] || "",
    scenePlanPath,
    manifestPath,
    hookScriptPath,
    middleScriptPaths,
    ctaScriptPath: includeCtaAvatar ? ctaScriptPath : "",
    promptPath,
    middlePromptPaths,
    ctaPromptPath: includeCtaAvatar ? ctaPromptPath : "",
    saveAsPath,
    hookManifestPath,
    videoPath: "",
    cachedScenePath: "",
    ctaVideoPath: "",
    ctaCachedScenePath: "",
    files: []
  };
  manifest.hookAvatar.id = result.id;
  manifest.hookAvatar.generatedAt = result.generatedAt;
  for (const middleAvatar of manifest.middleAvatars || []) {
    middleAvatar.id = result.id;
    middleAvatar.generatedAt = result.generatedAt;
  }
  if (manifest.ctaAvatar) {
    manifest.ctaAvatar.id = result.id;
    manifest.ctaAvatar.generatedAt = result.generatedAt;
  }
  await writeJson(scenePlanPath, scenePlan);
  await writeJson(manifestPath, manifest);
  await fs.writeFile(hookScriptPath, `${hookScript}\n`, "utf8");
  await fs.writeFile(promptPath, `${googleVidsPrompt}\n`, "utf8");
  for (const sceneNumber of middleScenes) {
    await fs.writeFile(middleScriptPaths[sceneNumber], `${middleAvatarScripts[sceneNumber]}\n`, "utf8");
    await fs.writeFile(middlePromptPaths[sceneNumber], `${googleVidsMiddlePrompts[sceneNumber]}\n`, "utf8");
  }
  if (includeCtaAvatar) {
    await fs.writeFile(ctaScriptPath, `${ctaScript}\n`, "utf8");
    await fs.writeFile(ctaPromptPath, `${googleVidsCtaPrompt}\n`, "utf8");
  }
  await fs.writeFile(saveAsPath, [
    path.join(hookDir, "hook_avatar.mp4"),
    path.join(assetsDir, "hook_avatar.mp4"),
    path.join(vidsClipCacheFolder, "scene-01.mp4"),
    ...middleScenes.flatMap((sceneNumber) => [
      path.join(hookDir, `focus_avatar_scene_${String(sceneNumber).padStart(2, "0")}.mp4`),
      path.join(assetsDir, `focus_avatar_scene_${String(sceneNumber).padStart(2, "0")}.mp4`),
      path.join(vidsClipCacheFolder, `scene-${String(sceneNumber).padStart(2, "0")}.mp4`)
    ]),
    ...(includeCtaAvatar ? [
      path.join(hookDir, "cta_avatar.mp4"),
      path.join(assetsDir, "cta_avatar.mp4"),
      path.join(vidsClipCacheFolder, `scene-${String(ctaSceneNumber).padStart(2, "0")}.mp4`)
    ] : [])
  ].join("\n") + "\n", "utf8");
  await fs.writeFile(path.join(hookDir, "README.md"), `${hookAvatarReadme({ ...result, googleVidsPrompt, googleVidsCtaPrompt })}\n`, "utf8");
  result.files = [
    ...avatarReferenceFiles,
    scenePlanPath,
    manifestPath,
    hookScriptPath,
    ...Object.values(middleScriptPaths),
    includeCtaAvatar ? ctaScriptPath : "",
    promptPath,
    ...Object.values(middlePromptPaths),
    includeCtaAvatar ? ctaPromptPath : "",
    saveAsPath,
    path.join(hookDir, "README.md")
  ].filter(Boolean).map(publicAssetFile);
  await writeJson(hookManifestPath, result);
  result.files.push(publicAssetFile(hookManifestPath));

  await updateUiState((state) => {
    state.settings = {
      ...(state.settings || {}),
      inputPath: input,
      row: Number(tool.source_row_number || rowNumber),
      lastHookAvatarFolder: hookDir,
      lastHookAvatarManifest: hookManifestPath,
      hookAvatarPresenter: presenter,
      hookAvatarCharacter: body.avatar || body.googleVidsAvatar || "auto_by_reel",
      avatarHostImage: avatarReferenceFiles[0] || state.settings?.avatarHostImage || "",
      hookVideoSize: videoSize,
      lastHookAvatarCharacter: googleVidsAvatar,
      lastHookAvatarCharacterLabel: avatarChoice.label,
      hookAvatarTone: tone,
      hookAvatarDurationSeconds: durationSeconds,
      updatedAt: new Date().toISOString()
    };
  });

  return result;
}

async function updateHookAvatarManifest(prepared, patch = {}) {
  const current = await readJsonArtifact(prepared.hookManifestPath) || prepared;
  const next = {
    ...current,
    ...patch,
    hookAvatar: {
      ...(current.hookAvatar || {}),
      ...(patch.hookAvatar || {})
    },
    ctaAvatar: {
      ...(current.ctaAvatar || {}),
      ...(patch.ctaAvatar || {})
    },
    files: undefined,
    updatedAt: new Date().toISOString()
  };
  next.files = [
    next.scenePlanPath,
    next.manifestPath,
    next.hookScriptPath,
    ...Object.values(next.middleScriptPaths || {}),
    next.ctaScriptPath,
    next.promptPath,
    ...Object.values(next.middlePromptPaths || {}),
    next.ctaPromptPath,
    next.saveAsPath,
    path.join(next.hookDir, "README.md"),
    next.videoPath,
    next.cachedScenePath,
    ...Object.values(next.middleAvatarVideos || {}),
    ...Object.values(next.middleAvatarCachedScenes || {}),
    next.ctaVideoPath,
    next.ctaCachedScenePath,
    next.hookManifestPath
  ].filter(Boolean).map(publicAssetFile);
  await writeJson(next.hookManifestPath, next);
  return next;
}

function publicHookAvatarRun(run) {
  return {
    id: run.id,
    status: run.status,
    body: run.body,
    result: run.result,
    error: run.error,
    startedAt: run.startedAt,
    endedAt: run.endedAt,
    logs: run.logs.slice(-300)
  };
}

function addHookAvatarLog(run, text, stream = "system") {
  const entry = {
    at: new Date().toISOString(),
    stream,
    text: String(text || "")
  };
  run.logs.push(entry);
  if (run.logs.length > 1000) {
    run.logs.splice(0, run.logs.length - 1000);
  }
  for (const client of run.clients) {
    sendSse(client, "log", entry);
  }
}

function finishHookAvatarRun(run, status, result = null, error = "") {
  if (run.status !== "running") {
    return;
  }
  run.status = status;
  run.result = result || run.result;
  run.error = error;
  run.endedAt = new Date().toISOString();
  const data = publicHookAvatarRun(run);
  for (const client of run.clients) {
    sendSse(client, "status", data);
    client.end();
  }
  run.clients.clear();
}

function runHookNodeScript(run, label, scriptPath, scriptArgs) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath, ...scriptArgs], {
      cwd: projectRoot,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"]
    });
    run.child = child;
    addHookAvatarLog(run, `${process.execPath} ${scriptPath} ${scriptArgs.join(" ")}`);
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      stdout += text;
      addHookAvatarLog(run, `[${label}] ${text.trimEnd()}`, "stdout");
    });
    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      stderr += text;
      addHookAvatarLog(run, `[${label}] ${text.trimEnd()}`, "stderr");
    });
    child.on("error", reject);
    child.on("close", (code) => {
      run.child = null;
      if (code === 0) {
        resolve({ code, stdout, stderr });
        return;
      }
      reject(new Error(`${label} failed with exit code ${code}. ${stderr || stdout}`.trim()));
    });
  });
}

function hookProfilesFromBody(body = {}) {
  const fromProfiles = normalizeProfileList(body.profiles || body.vidsProfiles || "");
  const explicit = fromProfiles.length
    ? fromProfiles
    : [
      body.profile || body.primaryProfile || defaultProfiles[0],
      body.fallbackEnabled === false || body.disableFallback ? "" : (body.fallbackProfile || "")
    ];
  const seen = new Set();
  return explicit
    .map((profile) => String(profile || "").trim())
    .filter(Boolean)
    .map((profile) => normalizeProfilePath(profile))
    .filter((profile) => {
      const key = path.resolve(projectRoot, profile);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    })
    .slice(0, 2);
}

async function generateHookAvatarForProfile(prepared, body, run, profile, profileIndex = 0, options = {}) {
  const sceneKind = options.sceneKind === "cta" ? "cta" : options.sceneKind === "focus" ? "focus" : "hook";
  const isCta = sceneKind === "cta";
  const isFocus = sceneKind === "focus";
  const sceneNumber = Number(options.sceneNumber || (isCta ? prepared.ctaSceneNumber : isFocus ? prepared.middleAvatarScenes?.[0] : 1) || 1);
  const sceneToken = String(sceneNumber).padStart(2, "0");
  const fileName = isCta ? "cta_avatar.mp4" : isFocus ? `focus_avatar_scene_${sceneToken}.mp4` : "hook_avatar.mp4";
  const sceneLabel = isCta ? "CTA avatar" : isFocus ? `focus avatar Scene ${sceneNumber}` : "hook avatar";
  const reportLabel = isCta ? "cta" : isFocus ? `focus-${sceneToken}` : "hook";
  const profileLabel = safeHookProfileLabel(profile, profileIndex);
  const outputLabel = isCta ? `${profileLabel}-cta` : isFocus ? `${profileLabel}-focus-${sceneToken}` : profileLabel;
  const operateDir = path.join(prepared.hookDir, "google-vids", outputLabel);
  const exportDir = path.join(prepared.hookDir, "google-vids-export", outputLabel);
  await ensureDir(operateDir);
  await ensureDir(exportDir);
  const afterSubmitWait = clamp(asFiniteNumber(body.afterSubmitWait || body.afterSubmitWaitMs, 120000), 30000, 600000);
  const manualRecoveryWait = clamp(asFiniteNumber(body.manualRecoveryWait || body.manualRecoveryWaitMs, 600000), 0, 1800000);
  const selectedAvatar = String(prepared.googleVidsAvatar || prepared.avatarChoice?.value || body.avatar || defaultAvatar || "auto");
  const videoSize = normalizeVidsVideoSize(body.videoSize || prepared.videoSize || prepared.scenePlan?.metadata?.video_size || "portrait");
  const operateArgs = [
    "--scenes", prepared.scenePlanPath,
    "--manifest", prepared.manifestPath,
    "--scene", String(sceneNumber),
    "--max-scenes", "1",
    "--output", operateDir,
    "--profile", profile,
    "--video-size", videoSize,
    "--avatar", selectedAvatar,
    "--avatar-scenes", String(sceneNumber),
    "--submit",
    "--insert",
    "--after-submit-wait", String(afterSubmitWait),
    "--manual-recovery-wait", String(manualRecoveryWait)
  ];
  if (body.url) {
    operateArgs.push("--url", String(body.url));
  }
  if (videoSize === "portrait") {
    operateArgs.push("--require-portrait");
  }

  addHookAvatarLog(run, `Selected Google Vids avatar: ${prepared.avatarChoice?.label || selectedAvatar} (${prepared.avatarChoice?.reason || "manual/default"}).`);
  addHookAvatarLog(run, `Opening Google Vids for ${sceneLabel} generation using ${profile} in ${vidsVideoSizeLabel(videoSize)}.`);
  let operateError = null;
  await runHookNodeScript(run, `${reportLabel}-vids:${profileLabel}`, "src/google-vids-operate.mjs", operateArgs)
    .catch((error) => {
      operateError = error;
    });
  const vidsReportPath = path.join(operateDir, "vids-operator-report.json");
  const vidsReport = await readJsonArtifact(vidsReportPath);
  if (operateError || !vidsReport?.ok) {
    const message = vidsReport?.manualAction
      ? `${vidsReport.error || operateError?.message || `Google Vids ${sceneLabel} generation did not complete.`} Manual action: ${vidsReport.manualAction}`
      : vidsReport?.error || operateError?.message || `Google Vids ${sceneLabel} generation did not complete.`;
    const error = new Error(message);
    error.report = vidsReport;
    throw error;
  }
  const vidsUrl = vidsReport.currentUrl || "";
  const noExport = Boolean(body.noExport || body.prepareOnly);
  if (noExport) {
    const avatarPatchKey = isCta ? "ctaAvatar" : isFocus ? "focusAvatar" : "hookAvatar";
    return updateHookAvatarManifest(prepared, {
      status: isCta ? "cta_generated_in_vids_export_skipped" : isFocus ? "focus_generated_in_vids_export_skipped" : "generated_in_vids_export_skipped",
      [isCta ? "ctaVidsUrl" : isFocus ? "focusVidsUrl" : "vidsUrl"]: vidsUrl,
      [isCta ? "ctaVidsReportPath" : isFocus ? "focusVidsReportPath" : "vidsReportPath"]: vidsReportPath,
      [isCta ? "ctaOperateDir" : isFocus ? "focusOperateDir" : "operateDir"]: operateDir,
      [avatarPatchKey]: {
        status: "generated_in_vids_export_skipped",
        vidsUrl,
        vidsReportPath
      }
    });
  }

  addHookAvatarLog(run, `Exporting one-scene ${sceneLabel} MP4 from Google Vids using ${profile}.`);
  let exportError = null;
  await runHookNodeScript(run, `${reportLabel}-export:${profileLabel}`, "src/google-vids-export.mjs", [
    "--url", vidsUrl,
    "--output", exportDir,
    "--timeout", String(body.exportTimeout || 600000),
    "--filename", fileName,
    "--profile", profile,
    "--manual-recovery-wait", String(manualRecoveryWait)
  ]).catch((error) => {
    exportError = error;
  });
  const exportReportPath = path.join(exportDir, "google-vids-export-report.json");
  const exportReport = await readJsonArtifact(exportReportPath);
  const exportedPath = exportReport?.savedPath || "";
  if (exportError || !exportReport?.ok || !exportedPath) {
    const message = exportReport?.manualAction
      ? `${exportReport.error || exportReport?.failure || exportError?.message || `Google Vids export did not save ${sceneLabel} MP4.`} Manual action: ${exportReport.manualAction}`
      : exportReport?.error || exportReport?.failure || exportError?.message || `Google Vids export did not save ${sceneLabel} MP4.`;
    const error = new Error(message);
    error.report = exportReport;
    throw error;
  }

  const videoPath = path.join(prepared.hookDir, fileName);
  const assetsVideoPath = path.join(prepared.assetsDir, fileName);
  await fs.copyFile(exportedPath, videoPath);
  await ensureDir(prepared.assetsDir);
  await fs.copyFile(exportedPath, assetsVideoPath);
  const cached = await cacheVidsSceneClip({
    toolDir: prepared.runDir,
    sourcePath: videoPath,
    sceneNumber,
    profile,
    note: `${isCta ? "CTA" : isFocus ? "Focus" : "Hook"} avatar generated via Google Vids from the dashboard avatar flow.`,
    qualityStatus: "needs_human_review"
  });
  const patch = isCta ? {
    status: prepared.videoPath ? "complete" : "cta_complete",
    activeProfile: prepared.activeProfile || profile,
    ctaActiveProfile: profile,
    ctaVidsUrl: vidsUrl,
    ctaVidsReportPath: vidsReportPath,
    ctaExportReportPath: exportReportPath,
    ctaOperateDir: operateDir,
    ctaExportDir: exportDir,
    ctaVideoPath: videoPath,
    assetsCtaVideoPath: assetsVideoPath,
    ctaCachedScenePath: cached?.cachedPath || "",
    ctaAvatar: {
      status: "complete",
      activeProfile: profile,
      vidsUrl,
      vidsReportPath,
      exportReportPath,
      videoPath,
      assetsCtaVideoPath: assetsVideoPath,
      cachedScenePath: cached?.cachedPath || ""
    }
  } : isFocus ? {
    status: prepared.ctaVideoPath || prepared.videoPath ? "complete" : "focus_complete",
    activeProfile: prepared.activeProfile || profile,
    middleAvatarProfiles: {
      ...(prepared.middleAvatarProfiles || {}),
      [sceneNumber]: profile
    },
    middleAvatarVideos: {
      ...(prepared.middleAvatarVideos || {}),
      [sceneNumber]: videoPath
    },
    middleAvatarAssetVideos: {
      ...(prepared.middleAvatarAssetVideos || {}),
      [sceneNumber]: assetsVideoPath
    },
    middleAvatarCachedScenes: {
      ...(prepared.middleAvatarCachedScenes || {}),
      [sceneNumber]: cached?.cachedPath || ""
    },
    middleAvatarReports: {
      ...(prepared.middleAvatarReports || {}),
      [sceneNumber]: {
        vidsUrl,
        vidsReportPath,
        exportReportPath,
        operateDir,
        exportDir
      }
    }
  } : {
    status: "complete",
    activeProfile: profile,
    profilesTried: [profile],
    vidsUrl,
    vidsReportPath,
    exportReportPath,
    operateDir,
    exportDir,
    videoPath,
    assetsHookVideoPath: assetsVideoPath,
    cachedScenePath: cached?.cachedPath || "",
    hookAvatar: {
      status: "complete",
      activeProfile: profile,
      vidsUrl,
      vidsReportPath,
      exportReportPath,
      videoPath,
      assetsHookVideoPath: assetsVideoPath,
      cachedScenePath: cached?.cachedPath || ""
    }
  };
  const result = await updateHookAvatarManifest(prepared, patch);
  await recordProfileAvatarUse(profile);
  await updateUiState((state) => {
    const settingsPatch = isCta ? {
      lastCtaAvatarProfile: profile,
      lastCtaAvatarVideo: videoPath,
      lastCtaAvatarCachedScene: cached?.cachedPath || ""
    } : isFocus ? {
      lastMiddleAvatarProfile: profile,
      lastMiddleAvatarVideo: videoPath,
      lastMiddleAvatarCachedScene: cached?.cachedPath || "",
      lastMiddleAvatarScene: sceneNumber
    } : {
      lastHookAvatarProfile: profile,
      lastHookAvatarVideo: videoPath,
      lastHookAvatarCachedScene: cached?.cachedPath || "",
      lastHookAvatarCharacter: prepared.googleVidsAvatar || "",
      lastHookAvatarCharacterLabel: prepared.avatarChoice?.label || ""
    };
    state.settings = {
      ...(state.settings || {}),
      ...settingsPatch,
      updatedAt: new Date().toISOString()
    };
  });
  return result;
}

async function generateHookAvatarWithGoogleVids(prepared, body, run) {
  const profiles = hookProfilesFromBody(body);
  if (!profiles.length) {
    throw new Error("At least one Google Vids profile is required.");
  }
  const attempts = [];
  let lastError = null;
  const quotaState = await loadUiState();
  for (let index = 0; index < profiles.length; index += 1) {
    const profile = profiles[index];
    const canTryNext = index < profiles.length - 1;
    const quota = profileQuota(quotaState, profile);
    if (quota.quotaExhausted || quota.limitStatus === "limit_used") {
      lastError = new Error(`Google Vids profile limit used: ${profile}. Select another profile or enable fallback.`);
      attempts.push({
        profile,
        ok: false,
        quotaHit: true,
        skipped: true,
        willTryNext: canTryNext,
        error: lastError.message
      });
      addHookAvatarLog(run, `Skipping limit-used profile: ${profile}`, "stderr");
      await updateHookAvatarManifest(prepared, {
        status: canTryNext ? "retrying_fallback_profile" : "failed",
        activeProfile: "",
        profilesTried: profiles.slice(0, index + 1),
        attempts,
        error: lastError.message,
        hookAvatar: {
          status: canTryNext ? "retrying_fallback_profile" : "failed",
          profilesTried: profiles.slice(0, index + 1),
          attempts,
          error: lastError.message
        }
      }).then((partial) => {
        run.result = partial;
      }).catch(() => {});
      if (canTryNext) {
        addHookAvatarLog(run, `Trying fallback profile next: ${profiles[index + 1]}`);
        continue;
      }
      break;
    }
    try {
      addHookAvatarLog(run, `Trying profile ${index + 1}/${profiles.length}: ${profile}`);
      let result = await generateHookAvatarForProfile(prepared, body, run, profile, index, {
        sceneKind: "hook",
        sceneNumber: 1
      });
      const middleWarnings = [];
      for (const middleSceneNumber of result.middleAvatarScenes || []) {
        let focusWarning = "";
        for (let focusIndex = index; focusIndex < profiles.length; focusIndex += 1) {
          const focusProfile = profiles[focusIndex];
          const focusQuota = profileQuota(await loadUiState(), focusProfile);
          if (focusQuota.quotaExhausted || focusQuota.limitStatus === "limit_used") {
            focusWarning = `Google Vids profile limit used for focus Scene ${middleSceneNumber}: ${focusProfile}.`;
            addHookAvatarLog(run, `Skipping limit-used focus profile: ${focusProfile}`, "stderr");
            continue;
          }
          try {
            addHookAvatarLog(run, `Hook complete. Generating mid-reel focus avatar for Scene ${middleSceneNumber} using ${focusProfile}.`);
            result = await generateHookAvatarForProfile(result, body, run, focusProfile, focusIndex, {
              sceneKind: "focus",
              sceneNumber: middleSceneNumber
            });
            focusWarning = "";
            break;
          } catch (focusError) {
            const report = focusError.report || null;
            focusWarning = focusError.message;
            if (Boolean(report?.quotaHit) || quotaHitFromText(focusError.message)) {
              await markProfileQuotaHit(focusProfile, "Google Vids focus avatar generation hit quota/credits limit.");
            }
            addHookAvatarLog(run, `Focus avatar Scene ${middleSceneNumber} failed with ${focusProfile}: ${focusError.message}`, "stderr");
          }
        }
        if (focusWarning && !result.middleAvatarVideos?.[middleSceneNumber]) {
          middleWarnings.push(`Scene ${middleSceneNumber}: ${focusWarning}`);
          result = await updateHookAvatarManifest(result, {
            status: "partial_focus_failed",
            middleAvatarWarnings: [
              ...(result.middleAvatarWarnings || []),
              `Scene ${middleSceneNumber}: ${focusWarning}`
            ]
          });
        }
      }
      let ctaWarning = "";
      if (result.includeCtaAvatar !== false) {
        for (let ctaIndex = index; ctaIndex < profiles.length; ctaIndex += 1) {
          const ctaProfile = profiles[ctaIndex];
          const ctaQuota = profileQuota(await loadUiState(), ctaProfile);
          if (ctaQuota.quotaExhausted || ctaQuota.limitStatus === "limit_used") {
            ctaWarning = `Google Vids profile limit used for CTA: ${ctaProfile}.`;
            addHookAvatarLog(run, `Skipping limit-used CTA profile: ${ctaProfile}`, "stderr");
            continue;
          }
          try {
            addHookAvatarLog(run, `Hook complete. Generating CTA avatar for final scene ${result.ctaSceneNumber || "last"} using ${ctaProfile}.`);
            result = await generateHookAvatarForProfile(result, body, run, ctaProfile, ctaIndex, {
              sceneKind: "cta",
              sceneNumber: result.ctaSceneNumber
            });
            ctaWarning = "";
            break;
          } catch (ctaError) {
            const report = ctaError.report || null;
            ctaWarning = ctaError.message;
            if (Boolean(report?.quotaHit) || quotaHitFromText(ctaError.message)) {
              await markProfileQuotaHit(ctaProfile, "Google Vids CTA avatar generation hit quota/credits limit.");
            }
            addHookAvatarLog(run, `CTA avatar failed with ${ctaProfile}: ${ctaError.message}`, "stderr");
          }
        }
        if (ctaWarning && !result.ctaVideoPath && !result.ctaAvatar?.videoPath) {
          addHookAvatarLog(run, `CTA avatar not generated, keeping hook clip: ${ctaWarning}`, "stderr");
          result = await updateHookAvatarManifest(result, {
            status: "partial_cta_failed",
            ctaError: ctaWarning,
            ctaAvatar: {
              ...(result.ctaAvatar || {}),
              status: "failed",
              error: ctaWarning
            }
          });
        }
      }
      attempts.push({
        profile,
        ok: true,
        status: ctaWarning || middleWarnings.length ? "partial_avatar_failed" : "complete",
        videoPath: result.videoPath || "",
        middleAvatarVideos: result.middleAvatarVideos || {},
        ctaVideoPath: result.ctaVideoPath || "",
        cachedScenePath: result.cachedScenePath || "",
        middleAvatarCachedScenes: result.middleAvatarCachedScenes || {},
        ctaCachedScenePath: result.ctaCachedScenePath || "",
        vidsUrl: result.vidsUrl || "",
        ctaVidsUrl: result.ctaVidsUrl || "",
        warning: [ctaWarning, ...middleWarnings].filter(Boolean).join(" | ")
      });
      const successfulProfiles = [...new Set([
        profile,
        ...Object.values(result.middleAvatarProfiles || {}),
        result.ctaActiveProfile
      ].filter(Boolean))];
      return updateHookAvatarManifest(result, {
        status: ctaWarning || middleWarnings.length ? "partial_avatar_failed" : "complete",
        activeProfile: profile,
        profilesTried: successfulProfiles.length ? successfulProfiles : profiles.slice(0, index + 1),
        attempts,
        hookAvatar: {
          activeProfile: profile,
          profilesTried: successfulProfiles.length ? successfulProfiles : profiles.slice(0, index + 1),
          attempts
        }
      });
    } catch (error) {
      lastError = error;
      const report = error.report || null;
      const quotaHit = Boolean(report?.quotaHit) || quotaHitFromText(error.message);
      attempts.push({
        profile,
        ok: false,
        quotaHit,
        loginNeeded: Boolean(report?.loginNeeded),
        requiresManualAction: Boolean(report?.requiresManualAction),
        manualAction: report?.manualAction || "",
        safety: report?.safety || null,
        safetySnapshot: report?.safetySnapshot || null,
        willTryNext: canTryNext,
        error: error.message
      });
      addHookAvatarLog(run, `Profile failed: ${profile} | ${error.message}`, "stderr");
      if (quotaHit) {
        await markProfileQuotaHit(profile, "Google Vids avatar generation hit quota/credits limit.");
        addHookAvatarLog(run, `Marked profile limit used: ${profile}`, "stderr");
      }
      await updateHookAvatarManifest(prepared, {
        status: canTryNext ? "retrying_fallback_profile" : "failed",
        activeProfile: "",
        profilesTried: profiles.slice(0, index + 1),
        attempts,
        error: error.message,
        hookAvatar: {
          status: canTryNext ? "retrying_fallback_profile" : "failed",
          profilesTried: profiles.slice(0, index + 1),
          attempts,
          error: error.message
        }
      }).then((partial) => {
        run.result = partial;
      }).catch(() => {});
      if (canTryNext) {
        addHookAvatarLog(run, `Trying fallback profile next: ${profiles[index + 1]}`);
        continue;
      }
    }
  }
  throw lastError || new Error("Google Vids avatar generation failed for all selected profiles.");
}

async function startHookAvatarRun(body = {}) {
  if (creditSafeModeEnabled(body.creditSafeMode) && !body.prepareOnly) {
    throw new Error("Credit Safe Mode is ON. Use Prepare Avatar Pack or turn Credit Safe off before Google Vids generation.");
  }
  const id = `hook-avatar-${timestampSlug()}`;
  const run = {
    id,
    status: "running",
    body,
    result: null,
    error: "",
    startedAt: new Date().toISOString(),
    endedAt: null,
    logs: [],
    clients: new Set(),
    child: null
  };
  hookAvatarRuns.set(id, run);
  addHookAvatarLog(run, "Starting hook+focus+CTA avatar workflow.");

  setTimeout(async () => {
    let prepared = null;
    try {
      prepared = await prepareHookAvatar(body);
      run.result = prepared;
      addHookAvatarLog(run, `Hook pack prepared: ${prepared.hookDir}`, "stdout");
      if (body.prepareOnly) {
        finishHookAvatarRun(run, "complete", prepared);
        return;
      }
      const generated = await generateHookAvatarWithGoogleVids(prepared, body, run);
      addHookAvatarLog(run, `Avatar clips ready: ${generated.ctaVideoPath || generated.videoPath || generated.hookDir}`, "stdout");
      finishHookAvatarRun(run, "complete", generated);
    } catch (error) {
      if (prepared?.hookManifestPath) {
        await updateHookAvatarManifest(prepared, {
          status: "failed",
          error: error.message,
          hookAvatar: {
            status: "failed",
            error: error.message
          }
        }).then((partial) => {
          run.result = partial;
        }).catch(() => {});
      }
      addHookAvatarLog(run, error.message, "stderr");
      finishHookAvatarRun(run, "failed", run.result, error.message);
    }
  }, 0);

  return run;
}

function publicFinalReelRun(run) {
  return {
    id: run.id,
    kind: run.kind || "video",
    status: run.status,
    body: run.body,
    result: run.result,
    error: run.error,
    outputDir: run.outputDir || "",
    report: run.report || null,
    startedAt: run.startedAt,
    endedAt: run.endedAt,
    steps: run.steps || [],
    logs: run.logs.slice(-300)
  };
}

function addFinalReelLog(run, text, stream = "system") {
  const entry = {
    at: new Date().toISOString(),
    stream,
    text: String(text || "")
  };
  run.logs.push(entry);
  if (run.logs.length > 1600) {
    run.logs.splice(0, run.logs.length - 1600);
  }
  for (const client of run.clients) {
    sendSse(client, "log", entry);
  }
}

function setFinalReelStep(run, id, label, status = "running", detail = "") {
  const existing = run.steps.find((step) => step.id === id);
  const next = {
    id,
    label,
    status,
    detail: String(detail || ""),
    updatedAt: new Date().toISOString()
  };
  if (existing) {
    Object.assign(existing, next);
  } else {
    run.steps.push(next);
  }
  for (const client of run.clients) {
    sendSse(client, "progress", { active: next, steps: run.steps });
  }
  if (detail) {
    addFinalReelLog(run, `${label}: ${detail}`, status === "failed" ? "stderr" : "stdout");
  } else {
    addFinalReelLog(run, label, status === "failed" ? "stderr" : "stdout");
  }
}

function finishFinalReelRun(run, status, result = null, error = "") {
  if (run.status !== "running") {
    return;
  }
  run.status = status;
  run.result = result || run.result;
  run.error = error;
  run.endedAt = new Date().toISOString();
  const data = publicFinalReelRun(run);
  for (const client of run.clients) {
    sendSse(client, "status", data);
    client.end();
  }
  run.clients.clear();
}

async function existingFile(filePath) {
  if (!filePath) {
    return "";
  }
  const resolved = path.resolve(String(filePath));
  try {
    const stat = await fs.stat(resolved);
    return stat.isFile() ? resolved : "";
  } catch {
    return "";
  }
}

async function existingDirectory(dirPath) {
  if (!dirPath) {
    return "";
  }
  const resolved = path.resolve(String(dirPath));
  try {
    const stat = await fs.stat(resolved);
    return stat.isDirectory() ? resolved : "";
  } catch {
    return "";
  }
}

async function firstExistingFile(paths = []) {
  for (const filePath of paths.filter(Boolean)) {
    const existing = await existingFile(filePath);
    if (existing) {
      return existing;
    }
  }
  return "";
}

async function existingMediaFiles(paths = []) {
  const result = [];
  for (const filePath of paths) {
    if (!/\.(png|jpe?g|webp|mp4|webm|mov)$/i.test(String(filePath || ""))) {
      continue;
    }
    const existing = await existingFile(filePath);
    if (existing && !result.includes(existing)) {
      result.push(existing);
    }
  }
  return result;
}

function sceneCountFromPlan(scenePlan = {}) {
  return Math.max(1, Math.min(7, Number(scenePlan?.scenes?.length || scenePlan?.metadata?.scene_count || 5) || 5));
}

function normalizeFinalVoiceProvider(value) {
  const provider = String(value || "auto").trim().toLowerCase();
  if (["openai", "elevenlabs", "eleven", "edge", "edge-tts", "free", "local", "none", "google-vids-voiceover", "vids-voiceover"].includes(provider)) {
    return provider;
  }
  if (provider === "auto") {
    return "free";
  }
  return "free";
}

async function copyVideoCacheIntoFinal(sourceDir, destinationDir) {
  const source = await existingDirectory(sourceDir);
  if (!source) {
    return [];
  }
  await ensureDir(destinationDir);
  const files = await listFilesRecursive(source);
  const copied = [];
  for (const filePath of files) {
    if (!/\.(mp4|webm|mov|json)$/i.test(filePath)) {
      continue;
    }
    const relative = path.relative(source, filePath);
    const destination = path.join(destinationDir, relative);
    await ensureDir(path.dirname(destination));
    await fs.copyFile(filePath, destination);
    copied.push(destination);
  }
  return copied;
}

async function copyVoiceoversIntoFinal(sourceDir, finalDir) {
  const source = await existingDirectory(sourceDir);
  if (!source) {
    return [];
  }
  const destinationDir = path.join(finalDir, "voiceovers");
  await ensureDir(destinationDir);
  const files = await listFilesRecursive(source);
  const copied = [];
  for (const filePath of files) {
    if (!/\.(mp3|wav|m4a|aac|ogg|mp4|webm|mov|json|txt|md)$/i.test(filePath)) {
      continue;
    }
    const relative = path.relative(source, filePath);
    const destination = path.join(destinationDir, relative);
    await ensureDir(path.dirname(destination));
    await fs.copyFile(filePath, destination);
    copied.push(destination);
  }
  return copied;
}

async function existingVoiceoverFiles(voiceoverDir) {
  const dir = await existingDirectory(voiceoverDir);
  if (!dir) {
    return [];
  }
  const files = await listFilesRecursive(dir);
  return files.filter((filePath) => /\.(mp3|wav|m4a|aac)$/i.test(filePath));
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value || {}));
}

function finalReelReadme(result) {
  return [
    `# Final Reel - ${result.tool?.tool_name || result.tool?.name || "Tool"}`,
    "",
    "This folder was prepared by the Basic Final Reel step.",
    "",
    "- `scene-plan.json` is the script/timeline used by Remotion.",
    "- `manifest.json` points to the real tool screenshots and screen recordings.",
    "- `vids-clips/` stores reusable avatar or AI scene clips. Scene 1 is used for the hook when a downloaded hook clip exists.",
    "- `render/final_reel.mp4` is the local render output.",
    "- `generated/local-render/` keeps a tool-centric copy of the final MP4 and render reports.",
    "",
    "Safety: use fictional/demo data only and do a final human review before posting.",
    ""
  ].join("\n");
}

async function prepareFinalReelPackage(body = {}, run) {
  const input = path.resolve(String(body.input || defaultInput).trim());
  const rowNumber = Number(body.row || 2);
  const tool = await toolRowForInput(input, rowNumber);
  const artifacts = await findToolArtifacts({
    input,
    row: rowNumber,
    toolName: tool.tool_name,
    toolUrl: tool.tool_url
  });

  let scriptBuild = artifacts.latestScript?.scriptBuild || null;
  if (!scriptBuild) {
    setFinalReelStep(run, "script", "Script", "running", "No saved script found, generating a fresh reel script.");
    scriptBuild = await generateReelScript({
      input,
      row: rowNumber,
      sceneCount: clamp(asFiniteNumber(body.sceneCount, 5), 3, 6),
      scriptLanguage: body.scriptLanguage || tool.language || "Hinglish",
      assetsDir: body.assetsDir || artifacts.latestAssets?.folder || ""
    });
  }

  const assetBuild = artifacts.latestAssets?.assetBuild || scriptBuild.assetBuild || null;
  if (!assetBuild) {
    throw new Error("Assets missing. Step 1 Build Assets run karo, phir Final Reel render karo.");
  }

  const slug = slugify(tool.tool_name || tool.name || `row-${rowNumber}`);
  const finalDir = path.resolve(projectRoot, "outputs", "final-reels", `${slug}_${timestampSlug()}`);
  const renderDir = path.join(finalDir, "render");
  await ensureDir(finalDir);
  await ensureDir(renderDir);
  const copiedVoiceovers = await copyVoiceoversIntoFinal(body.voiceoverDir || body.vidsVoiceoverDir, finalDir);
  const voiceoverDir = path.join(finalDir, "voiceovers");
  await ensureDir(voiceoverDir);
  const sourceVoiceoverDir = body.voiceoverDir || body.vidsVoiceoverDir || "";
  const sourceVoiceoverRoot = sourceVoiceoverDir && path.basename(path.resolve(sourceVoiceoverDir)) === "voiceovers"
    ? path.dirname(path.resolve(sourceVoiceoverDir))
    : path.resolve(sourceVoiceoverDir || finalDir);
  const voiceoverSourceVideo = await firstExistingFile([
    body.voiceoverSourceVideo,
    body.voiceoverSourcePath,
    body.vidsVoiceoverExport,
    body.lastVidsVoiceoverExport,
    sourceVoiceoverDir ? path.join(sourceVoiceoverDir, "voiceover-source.mp4") : "",
    sourceVoiceoverDir ? path.join(sourceVoiceoverDir, "voiceover-source.webm") : "",
    sourceVoiceoverDir ? path.join(sourceVoiceoverDir, "voiceover-source.mov") : "",
    sourceVoiceoverRoot ? path.join(sourceVoiceoverRoot, "generated", "google-vids-voiceover", "voiceover-source.mp4") : "",
    sourceVoiceoverRoot ? path.join(sourceVoiceoverRoot, "generated", "google-vids-voiceover", "voiceover-source.webm") : "",
    sourceVoiceoverRoot ? path.join(sourceVoiceoverRoot, "generated", "google-vids-voiceover", "voiceover-source.mov") : ""
  ]);
  let copiedVoiceoverSourceVideo = "";
  if (voiceoverSourceVideo) {
    const sourceExt = path.extname(voiceoverSourceVideo) || ".mp4";
    const generatedVoiceoverDir = path.join(finalDir, "generated", "google-vids-voiceover");
    await ensureDir(generatedVoiceoverDir);
    copiedVoiceoverSourceVideo = path.join(generatedVoiceoverDir, `voiceover-source${sourceExt}`);
    await fs.copyFile(voiceoverSourceVideo, copiedVoiceoverSourceVideo);
    const voiceoverDirCopy = path.join(voiceoverDir, `voiceover-source${sourceExt}`);
    await fs.copyFile(voiceoverSourceVideo, voiceoverDirCopy);
    copiedVoiceovers.push(voiceoverDirCopy, copiedVoiceoverSourceVideo);
  }

  const captureFiles = await existingMediaFiles(captureFilePathsFromArtifacts(assetBuild, scriptBuild.assetBuild));
  const rawPlan = cloneJson(scriptBuild.plan || {});
  const scenes = Array.isArray(rawPlan.scenes) ? rawPlan.scenes : [];
  if (!scenes.length) {
    throw new Error("Script has no scenes. Generate Reel Script again before rendering.");
  }
  const sceneDurationSeconds = Number(rawPlan.metadata?.scene_duration_seconds || scenes[0]?.duration || 10) || 10;
  rawPlan.metadata = {
    ...(rawPlan.metadata || {}),
    generated_at: rawPlan.metadata?.generated_at || scriptBuild.generatedAt || new Date().toISOString(),
    language: scriptBuild.scriptLanguage || rawPlan.metadata?.language || tool.language || "Hinglish",
    script_type: scriptBuild.scriptLanguage || rawPlan.metadata?.script_type || tool.language || "Hinglish",
    scene_count: scenes.length,
    scene_duration_seconds: sceneDurationSeconds,
    total_duration_seconds: Number(scriptBuild.totalDurationSeconds || rawPlan.metadata?.total_duration_seconds || scenes.length * sceneDurationSeconds),
    script_package: scriptBuild.scriptPackage || rawPlan.metadata?.script_package || {}
  };

  const hookAvatar = artifacts.latestHookAvatar?.hookAvatar || {};
  const hookFolder = hookAvatar.hookDir || artifacts.latestHookAvatar?.folder || "";
  const assetsDir = assetBuild.assetsDir || artifacts.latestAssets?.folder || scriptBuild.assetsDir || "";
  const hookVideoPath = await firstExistingFile([
    body.hookAvatarVideo,
    hookAvatar.videoPath,
    hookAvatar.hookAvatar?.videoPath,
    hookAvatar.cachedScenePath,
    hookAvatar.hookAvatar?.cachedScenePath,
    hookFolder ? path.join(hookFolder, "hook_avatar.mp4") : "",
    assetsDir ? path.join(assetsDir, "hook_avatar.mp4") : ""
  ]);
  const ctaSceneNumber = scenes.length;
  const ctaVideoPath = await firstExistingFile([
    body.ctaAvatarVideo,
    hookAvatar.ctaVideoPath,
    hookAvatar.ctaAvatar?.videoPath,
    hookAvatar.ctaCachedScenePath,
    hookAvatar.ctaAvatar?.cachedScenePath,
    assetsDir ? path.join(assetsDir, "cta_avatar.mp4") : "",
    hookFolder ? path.join(hookFolder, "cta_avatar.mp4") : ""
  ]);

  const vidsClipCacheFolder = await ensureVidsClipCache(finalDir);
  const copiedClipFiles = [];
  const sourceClipDirs = [
    artifacts.latestAssets?.runDir ? path.join(artifacts.latestAssets.runDir, "vids-clips") : "",
    artifacts.latestScript?.runDir ? path.join(artifacts.latestScript.runDir, "vids-clips") : "",
    artifacts.latestHookAvatar?.runDir ? path.join(artifacts.latestHookAvatar.runDir, "vids-clips") : "",
    hookAvatar.vidsClipCacheFolder || ""
  ].filter(Boolean);
  const seenClipDirs = new Set();
  for (const sourceDir of sourceClipDirs) {
    const resolved = path.resolve(sourceDir);
    if (seenClipDirs.has(resolved) || resolved === path.resolve(vidsClipCacheFolder)) {
      continue;
    }
    seenClipDirs.add(resolved);
    copiedClipFiles.push(...await copyVideoCacheIntoFinal(sourceDir, vidsClipCacheFolder));
  }

  let cachedHook = null;
  if (hookVideoPath) {
    cachedHook = await cacheVidsSceneClip({
      toolDir: finalDir,
      sourcePath: hookVideoPath,
      sceneNumber: 1,
      profile: hookAvatar.activeProfile || "",
      note: "Hook avatar clip reused by the Basic Final Reel render.",
      qualityStatus: "needs_human_review"
    });
  }
  let cachedCta = null;
  if (ctaVideoPath) {
    cachedCta = await cacheVidsSceneClip({
      toolDir: finalDir,
      sourcePath: ctaVideoPath,
      sceneNumber: ctaSceneNumber,
      profile: hookAvatar.ctaActiveProfile || hookAvatar.ctaAvatar?.activeProfile || hookAvatar.activeProfile || "",
      note: "CTA avatar clip reused by the Basic Final Reel render.",
      qualityStatus: "needs_human_review"
    });
  }

  const scenePlanPath = path.join(finalDir, "scene-plan.json");
  const manifestPath = path.join(finalDir, "manifest.json");
  const packagePath = path.join(finalDir, "final-reel-package.json");
  const readmePath = path.join(finalDir, "README.md");
  const manifest = {
    tool,
    generated_at: new Date().toISOString(),
    generator: "basic_final_reel",
    capture: {
      enabled: Boolean(captureFiles.length),
      summary: assetBuild.capture?.summary || scriptBuild.capture?.summary || "Using saved Basic workflow assets.",
      files: captureFiles
    },
    vids_clip_cache: {
      folder: vidsClipCacheFolder,
      copied_files: copiedClipFiles,
      scene_01_hook: cachedHook?.cachedPath || "",
      cta_scene: cachedCta?.cachedPath || ""
    },
    source_artifacts: {
      assetsManifest: artifacts.latestAssets?.path || assetBuild.manifestPath || "",
      scriptJson: artifacts.latestScript?.path || scriptBuild.scriptPath || "",
      hookManifest: artifacts.latestHookAvatar?.path || hookAvatar.hookManifestPath || "",
      voiceoverDir: body.voiceoverDir || body.vidsVoiceoverDir || "",
      voiceoverSourceVideo: copiedVoiceoverSourceVideo || voiceoverSourceVideo || ""
    },
    decisions: {
      hook: hookVideoPath
        ? "Using downloaded/cached hook avatar clip for Scene 1."
        : "No hook avatar clip found; using local presenter fallback for Scene 1.",
      body: "Using real tool screenshots/screen recordings with generated voiceover.",
      cta: ctaVideoPath
        ? `Using cached CTA avatar clip for Scene ${ctaSceneNumber}.`
        : "No CTA avatar clip found; using local CTA review scene with generated voiceover.",
      voiceoverProvider: normalizeFinalVoiceProvider(body.voiceoverProvider)
    },
    files: {
      scene_plan: scenePlanPath,
      manifest: manifestPath,
      package: packagePath,
      render_dir: renderDir,
      voiceover_dir: voiceoverDir,
      vids_clip_cache: vidsClipCacheFolder
    }
  };
  const pkg = {
    id: `final-reel-${slug}-${timestampSlug()}`,
    status: "prepared",
    input,
    row: Number(tool.source_row_number || rowNumber),
    tool,
    finalDir,
    renderDir,
    scenePlanPath,
    manifestPath,
    packagePath,
    readmePath,
    sceneCount: scenes.length,
    totalDurationSeconds: rawPlan.metadata.total_duration_seconds,
    captureFileCount: captureFiles.length,
    hookVideoPath,
    ctaVideoPath,
    voiceoverDir,
    voiceoverSourceVideo: copiedVoiceoverSourceVideo,
    copiedVoiceovers,
    decisions: manifest.decisions,
    sourceArtifacts: manifest.source_artifacts,
    files: []
  };
  await writeJson(scenePlanPath, rawPlan);
  await writeJson(manifestPath, manifest);
  await writeJson(packagePath, pkg);
  await fs.writeFile(readmePath, finalReelReadme(pkg), "utf8");
  pkg.files = [scenePlanPath, manifestPath, packagePath, readmePath, hookVideoPath, ctaVideoPath, ...copiedVoiceovers]
    .filter(Boolean)
    .map(publicAssetFile);
  await writeJson(packagePath, pkg);
  return pkg;
}

function runFinalNodeScript(run, label, scriptPath, scriptArgs) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath, ...scriptArgs], {
      cwd: projectRoot,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"]
    });
    run.child = child;
    addFinalReelLog(run, `${process.execPath} ${scriptPath} ${scriptArgs.join(" ")}`);
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      stdout += text;
      addFinalReelLog(run, `[${label}] ${text.trimEnd()}`, "stdout");
    });
    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      stderr += text;
      addFinalReelLog(run, `[${label}] ${text.trimEnd()}`, "stderr");
    });
    child.on("error", reject);
    child.on("close", (code) => {
      run.child = null;
      if (code === 0) {
        resolve({ code, stdout, stderr });
        return;
      }
      reject(new Error(`${label} failed with exit code ${code}. ${stderr || stdout}`.trim()));
    });
  });
}

function runFinalExternalCommand(run, label, command, commandArgs) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, commandArgs, {
      cwd: projectRoot,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"]
    });
    run.child = child;
    addFinalReelLog(run, `${command} ${commandArgs.join(" ")}`);
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      stdout += text;
      addFinalReelLog(run, `[${label}] ${text.trimEnd()}`, "stdout");
    });
    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      stderr += text;
      addFinalReelLog(run, `[${label}] ${text.trimEnd()}`, "stderr");
    });
    child.on("error", (error) => {
      run.child = null;
      reject(error);
    });
    child.on("close", (code) => {
      run.child = null;
      if (code === 0) {
        resolve({ code, stdout, stderr });
        return;
      }
      reject(new Error(`${label} failed with exit code ${code}. ${stderr || stdout}`.trim()));
    });
  });
}

async function commandAvailable(command) {
  return await new Promise((resolve) => {
    const child = spawn(command, ["-version"], {
      cwd: projectRoot,
      env: process.env,
      stdio: "ignore"
    });
    child.on("error", () => resolve(false));
    child.on("close", (code) => resolve(code === 0));
  });
}

function remainingSceneNumbers(scenePlan = {}, body = {}) {
  const scenes = Array.isArray(scenePlan.scenes) ? scenePlan.scenes : [];
  const available = scenes.map((scene) => Number(scene.scene_number)).filter(Number.isFinite);
  const fallback = Array.from({ length: sceneCountFromPlan(scenePlan) }, (_, index) => index + 1);
  const all = available.length ? available : fallback;
  const fromScene = clamp(asFiniteNumber(body.fromScene || body.remainingFromScene, 2), 2, Math.max(2, all.at(-1) || 2));
  const toScene = clamp(asFiniteNumber(body.toScene || body.remainingToScene, all.at(-1) || fromScene), fromScene, all.at(-1) || fromScene);
  const limit = asFiniteNumber(body.remainingLimit || body.maxRemainingScenes, 0);
  const selected = all.filter((sceneNumber) => sceneNumber >= fromScene && sceneNumber <= toScene);
  return limit > 0 ? selected.slice(0, limit) : selected;
}

function durationForScene(scenePlan = {}, sceneNumber, fallback = 10) {
  const scene = Array.isArray(scenePlan.scenes)
    ? scenePlan.scenes.find((item) => Number(item.scene_number) === Number(sceneNumber))
    : null;
  return clamp(asFiniteNumber(scene?.duration || scenePlan.metadata?.scene_duration_seconds, fallback), 3, 30);
}

async function extractRemainingVidsAssets(prepared, exportedPath, sceneNumbers, run) {
  const scenePlan = await readJson(prepared.scenePlanPath).catch(() => ({}));
  const voiceoverDir = path.join(prepared.finalDir, "voiceovers");
  const clipsDir = await ensureVidsClipCache(prepared.finalDir);
  await ensureDir(voiceoverDir);
  const report = {
    ok: false,
    skipped: false,
    exportedPath,
    voiceoverDir,
    clipsDir,
    extractedVoiceovers: [],
    extractedClips: [],
    warnings: []
  };

  if (!await commandAvailable("ffmpeg")) {
    report.skipped = true;
    report.warning = "ffmpeg not found. Full Google Vids MP4 was saved, but scene audio/video split was skipped.";
    report.warnings.push(report.warning);
    addFinalReelLog(run, report.warning, "stderr");
    return report;
  }

  let offsetSeconds = 0;
  for (const sceneNumber of sceneNumbers) {
    const duration = durationForScene(scenePlan, sceneNumber, 10);
    const token = String(sceneNumber).padStart(2, "0");
    const audioPath = path.join(voiceoverDir, `scene-${token}.m4a`);
    const clipTempPath = path.join(prepared.finalDir, "temp", `vids-scene-${token}.mp4`);
    await ensureDir(path.dirname(clipTempPath));

    await runFinalExternalCommand(run, `ffmpeg-audio-scene-${token}`, "ffmpeg", [
      "-y",
      "-ss", String(offsetSeconds),
      "-i", exportedPath,
      "-t", String(duration),
      "-vn",
      "-c:a", "aac",
      "-b:a", "160k",
      audioPath
    ]);
    report.extractedVoiceovers.push(audioPath);

    await runFinalExternalCommand(run, `ffmpeg-video-scene-${token}`, "ffmpeg", [
      "-y",
      "-ss", String(offsetSeconds),
      "-i", exportedPath,
      "-t", String(duration),
      "-c:v", "libx264",
      "-pix_fmt", "yuv420p",
      "-c:a", "aac",
      clipTempPath
    ]);
    const cached = await cacheVidsSceneClip({
      toolDir: prepared.finalDir,
      sourcePath: clipTempPath,
      sceneNumber,
      profile: "",
      note: `Scene ${sceneNumber} split from Google Vids remaining-scenes export.`,
      qualityStatus: "needs_human_review"
    });
    if (cached?.cachedPath) {
      report.extractedClips.push(cached.cachedPath);
    }
    offsetSeconds += duration;
  }

  report.ok = true;
  return report;
}

async function generateRemainingVidsForProfile(prepared, body, run, profile, profileIndex = 0) {
  const scenePlan = await readJson(prepared.scenePlanPath);
  const sceneNumbers = remainingSceneNumbers(scenePlan, body);
  if (!sceneNumbers.length) {
    throw new Error("No remaining scenes found after hook. Generate a script with at least 2 scenes.");
  }

  const profileLabel = safeHookProfileLabel(profile, profileIndex);
  const remainingDir = path.join(prepared.finalDir, "google-vids-remaining", profileLabel);
  const operateDir = path.join(remainingDir, "operate");
  const exportDir = path.join(remainingDir, "export");
  await ensureDir(operateDir);
  await ensureDir(exportDir);
  const afterSubmitWait = clamp(asFiniteNumber(body.afterSubmitWait || body.afterSubmitWaitMs, 120000), 30000, 600000);
  const manualRecoveryWait = clamp(asFiniteNumber(body.manualRecoveryWait || body.manualRecoveryWaitMs, 600000), 0, 1800000);
  const operateArgs = [
    "--scenes", prepared.scenePlanPath,
    "--manifest", prepared.manifestPath,
    "--all-scenes",
    "--from-scene", String(sceneNumbers[0]),
    "--to-scene", String(sceneNumbers.at(-1)),
    "--max-scenes", String(sceneNumbers.length),
    "--output", operateDir,
    "--profile", profile,
    "--video-size", "portrait",
    "--require-portrait",
    "--ingredients", String(body.ingredients || "auto"),
    "--submit",
    "--insert",
    "--after-submit-wait", String(afterSubmitWait),
    "--manual-recovery-wait", String(manualRecoveryWait)
  ];
  if (body.url) {
    operateArgs.push("--url", String(body.url));
  }

  addFinalReelLog(run, `Opening Google Vids for remaining scenes ${sceneNumbers.join(", ")} using ${profile}.`);
  let operateError = null;
  await runFinalNodeScript(run, `remaining-vids:${profileLabel}`, "src/google-vids-operate.mjs", operateArgs)
    .catch((error) => {
      operateError = error;
    });
  const vidsReportPath = path.join(operateDir, "vids-operator-report.json");
  const vidsReport = await readJsonArtifact(vidsReportPath);
  if (operateError || !vidsReport?.ok) {
    const message = vidsReport?.manualAction
      ? `${vidsReport.error || operateError?.message || "Google Vids remaining scene generation did not complete."} Manual action: ${vidsReport.manualAction}`
      : vidsReport?.error || operateError?.message || "Google Vids remaining scene generation did not complete.";
    const error = new Error(message);
    error.report = vidsReport;
    throw error;
  }

  const vidsUrl = vidsReport.currentUrl || "";
  if (body.noExport || body.prepareOnly) {
    return {
      status: "generated_in_vids_export_skipped",
      sceneNumbers,
      activeProfile: profile,
      vidsUrl,
      vidsReportPath,
      operateDir,
      exportDir
    };
  }

  addFinalReelLog(run, `Exporting remaining scenes MP4 from Google Vids using ${profile}.`);
  let exportError = null;
  await runFinalNodeScript(run, `remaining-export:${profileLabel}`, "src/google-vids-export.mjs", [
    "--url", vidsUrl,
    "--output", exportDir,
    "--timeout", String(body.exportTimeout || 600000),
    "--filename", "remaining-scenes.mp4",
    "--profile", profile,
    "--manual-recovery-wait", String(manualRecoveryWait)
  ]).catch((error) => {
    exportError = error;
  });
  const exportReportPath = path.join(exportDir, "google-vids-export-report.json");
  const exportReport = await readJsonArtifact(exportReportPath);
  const exportedPath = exportReport?.savedPath || "";
  if (exportError || !exportReport?.ok || !exportedPath) {
    const message = exportReport?.manualAction
      ? `${exportReport.error || exportReport?.failure || exportError?.message || "Google Vids export did not save remaining scenes MP4."} Manual action: ${exportReport.manualAction}`
      : exportReport?.error || exportReport?.failure || exportError?.message || "Google Vids export did not save remaining scenes MP4.";
    const error = new Error(message);
    error.report = exportReport;
    throw error;
  }

  const generatedDir = path.join(prepared.finalDir, "generated", "google-vids-remaining");
  await ensureDir(generatedDir);
  const generatedExportPath = path.join(generatedDir, "remaining-scenes.mp4");
  await fs.copyFile(exportedPath, generatedExportPath);
  const cachedExport = await cacheVidsExport({
    toolDir: prepared.finalDir,
    sourcePath: generatedExportPath,
    kind: "partial_export",
    profile,
    scenes: sceneNumbers,
    note: `Google Vids remaining-scenes export for scenes ${sceneNumbers.join(", ")}. Hook scene 1 was skipped.`,
    qualityStatus: "needs_human_review"
  });
  const extracted = await extractRemainingVidsAssets(prepared, generatedExportPath, sceneNumbers, run);

  const packageData = await readJsonArtifact(prepared.packagePath) || prepared;
  const resultPatch = {
    remainingVids: {
      status: "complete",
      sceneNumbers,
      activeProfile: profile,
      vidsUrl,
      vidsReportPath,
      exportReportPath,
      operateDir,
      exportDir,
      exportedPath: generatedExportPath,
      cachedExportPath: cachedExport?.cachedPath || "",
      extracted
    }
  };
  const nextPackage = {
    ...packageData,
    ...resultPatch,
    status: "remaining_vids_ready",
    updatedAt: new Date().toISOString()
  };
  nextPackage.files = [
    ...(packageData.files || []),
    generatedExportPath,
    cachedExport?.cachedPath,
    ...(extracted.extractedVoiceovers || []),
    ...(extracted.extractedClips || []),
    vidsReportPath,
    exportReportPath
  ].filter(Boolean).map((item) => typeof item === "string" ? publicAssetFile(item) : item);
  await writeJson(prepared.packagePath, nextPackage);
  return {
    ...nextPackage,
    finalDir: prepared.finalDir,
    renderDir: prepared.renderDir,
    scenePlanPath: prepared.scenePlanPath,
    manifestPath: prepared.manifestPath,
    packagePath: prepared.packagePath,
    remainingVids: resultPatch.remainingVids
  };
}

async function generateRemainingVidsWithGoogleVids(prepared, body, run) {
  const profiles = hookProfilesFromBody(body);
  if (!profiles.length) {
    throw new Error("At least one Google Vids profile is required.");
  }
  const attempts = [];
  let lastError = null;
  const quotaState = await loadUiState();
  for (let index = 0; index < profiles.length; index += 1) {
    const profile = profiles[index];
    const canTryNext = index < profiles.length - 1;
    const quota = profileQuota(quotaState, profile);
    if (quota.quotaExhausted || quota.limitStatus === "limit_used") {
      lastError = new Error(`Google Vids profile limit used: ${profile}. Select another profile or enable fallback.`);
      attempts.push({ profile, ok: false, quotaHit: true, skipped: true, willTryNext: canTryNext, error: lastError.message });
      addFinalReelLog(run, `Skipping limit-used profile: ${profile}`, "stderr");
      if (canTryNext) {
        continue;
      }
      break;
    }
    try {
      setFinalReelStep(run, "vids", "Google Vids scenes", "running", `Trying profile ${index + 1}/${profiles.length}: ${profile}`);
      const result = await generateRemainingVidsForProfile(prepared, body, run, profile, index);
      attempts.push({
        profile,
        ok: true,
        status: result.remainingVids?.status || result.status,
        exportedPath: result.remainingVids?.exportedPath || "",
        sceneNumbers: result.remainingVids?.sceneNumbers || []
      });
      result.remainingVids.attempts = attempts;
      await recordProfileAiVideoUse(profile, result.remainingVids?.sceneNumbers?.length || 1);
      return result;
    } catch (error) {
      lastError = error;
      const report = error.report || null;
      const quotaHit = Boolean(report?.quotaHit) || quotaHitFromText(error.message);
      attempts.push({
        profile,
        ok: false,
        quotaHit,
        loginNeeded: Boolean(report?.loginNeeded),
        requiresManualAction: Boolean(report?.requiresManualAction),
        manualAction: report?.manualAction || "",
        willTryNext: canTryNext,
        error: error.message
      });
      addFinalReelLog(run, `Profile failed: ${profile}. ${error.message}`, "stderr");
      if (quotaHit) {
        await markProfileQuotaHit(profile, error.message).catch(() => {});
      }
      if (canTryNext) {
        addFinalReelLog(run, `Trying fallback profile next: ${profiles[index + 1]}`);
        continue;
      }
    }
  }
  const error = lastError || new Error("Google Vids remaining-scenes generation failed.");
  error.attempts = attempts;
  throw error;
}

function voiceoverScriptForScenes(scenePlan = {}, sceneNumbers = []) {
  const scenes = Array.isArray(scenePlan.scenes) ? scenePlan.scenes : [];
  const selected = scenes.filter((scene) => sceneNumbers.includes(Number(scene.scene_number)));
  return selected
    .map((scene) => String(scene.voiceover || scene.spoken_voiceover || scene.voiceover_audio || "").replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n\n");
}

function inferVidsVoiceGender(body = {}) {
  const explicit = String(body.voiceGender || body.vidsVoiceGender || "").trim().toLowerCase();
  if (["female", "male"].includes(explicit)) {
    return explicit;
  }
  const avatarText = String([
    body.hookAvatarCharacter,
    body.hookAvatarCharacterLabel,
    body.avatar,
    body.avatarLabel,
    body.googleVidsAvatar
  ].filter(Boolean).join(" ")).toLowerCase();
  if (/(mia|sofia|eleanor|female|woman|girl|feminine)/i.test(avatarText)) {
    return "female";
  }
  if (/(sebastian|levi|william|jamal|male|man|boy|masculine)/i.test(avatarText)) {
    return "male";
  }
  const presenter = normalizeHookPresenter(body.presenter || body.hookAvatarStyle || defaultHookAvatarStyle);
  if (presenter === "male") {
    return "male";
  }
  return "female";
}

async function extractVidsVoiceoverAudio(prepared, exportedPath, sceneNumbers, run) {
  const scenePlan = await readJson(prepared.scenePlanPath).catch(() => ({}));
  const voiceoverDir = path.join(prepared.finalDir, "voiceovers");
  await ensureDir(voiceoverDir);
  const report = {
    ok: false,
    skipped: false,
    exportedPath,
    voiceoverDir,
    fullAudioPath: "",
    extractedVoiceovers: [],
    warnings: []
  };

  if (!await commandAvailable("ffmpeg")) {
    report.skipped = true;
    report.warning = "ffmpeg not found. Google Vids voiceover MP4 was saved, but audio extraction was skipped.";
    report.warnings.push(report.warning);
    addFinalReelLog(run, report.warning, "stderr");
    return report;
  }

  const fullAudioPath = path.join(voiceoverDir, "voiceover-full.m4a");
  await runFinalExternalCommand(run, "ffmpeg-voiceover-full", "ffmpeg", [
    "-y",
    "-i", exportedPath,
    "-vn",
    "-c:a", "aac",
    "-b:a", "160k",
    fullAudioPath
  ]);
  report.fullAudioPath = fullAudioPath;

  let offsetSeconds = 0;
  for (const sceneNumber of sceneNumbers) {
    const duration = durationForScene(scenePlan, sceneNumber, 10);
    const token = String(sceneNumber).padStart(2, "0");
    const audioPath = path.join(voiceoverDir, `scene-${token}.m4a`);
    await runFinalExternalCommand(run, `ffmpeg-voiceover-scene-${token}`, "ffmpeg", [
      "-y",
      "-ss", String(offsetSeconds),
      "-i", exportedPath,
      "-t", String(duration),
      "-vn",
      "-c:a", "aac",
      "-b:a", "160k",
      audioPath
    ]);
    report.extractedVoiceovers.push(audioPath);
    offsetSeconds += duration;
  }

  report.ok = true;
  return report;
}

async function generateVidsVoiceoverForProfile(prepared, body, run, profile, profileIndex = 0) {
  const scenePlan = await readJson(prepared.scenePlanPath);
  const sceneNumbers = remainingSceneNumbers(scenePlan, body);
  if (!sceneNumbers.length) {
    throw new Error("No script scenes found after hook. Generate a script with at least 2 scenes.");
  }
  const scriptText = voiceoverScriptForScenes(scenePlan, sceneNumbers);
  if (!scriptText) {
    throw new Error("Selected scenes have no voiceover text.");
  }

  const profileLabel = safeHookProfileLabel(profile, profileIndex);
  const voiceoverRoot = path.join(prepared.finalDir, "google-vids-voiceover", profileLabel);
  const operateDir = path.join(voiceoverRoot, "operate");
  const exportDir = path.join(voiceoverRoot, "export");
  const generatedDir = path.join(prepared.finalDir, "generated", "google-vids-voiceover");
  const voiceoverDir = path.join(prepared.finalDir, "voiceovers");
  await ensureDir(operateDir);
  await ensureDir(exportDir);
  await ensureDir(generatedDir);
  await ensureDir(voiceoverDir);

  const scriptPath = path.join(voiceoverDir, "google-vids-voiceover-script.txt");
  await fs.writeFile(scriptPath, `${scriptText}\n`, "utf8");
  const voiceGender = inferVidsVoiceGender(body);
  const afterSubmitWait = clamp(asFiniteNumber(body.afterSubmitWait || body.afterSubmitWaitMs, 480000), 60000, 900000);
  const minAfterSubmitWait = clamp(asFiniteNumber(body.minAfterSubmitWait || body.minAfterSubmitWaitMs, 120000), 30000, Math.min(afterSubmitWait, 300000));
  const manualRecoveryWait = clamp(asFiniteNumber(body.manualRecoveryWait || body.manualRecoveryWaitMs, 600000), 0, 1800000);
  const operateArgs = [
    "--script", scriptPath,
    "--output", operateDir,
    "--profile", profile,
    "--voice-gender", voiceGender,
    "--require-blank-start",
    "--require-voice-config",
    "--require-audio-tag",
    "--after-submit-wait", String(afterSubmitWait),
    "--min-after-submit-wait", String(minAfterSubmitWait),
    "--manual-recovery-wait", String(manualRecoveryWait)
  ];
  if (body.voiceLabel || body.vidsVoiceLabel) {
    operateArgs.push("--voice-label", String(body.voiceLabel || body.vidsVoiceLabel));
  }
  if (body.url) {
    operateArgs.push("--url", String(body.url));
  }

  addFinalReelLog(run, `Opening Google Vids Voiceover tab for scenes ${sceneNumbers.join(", ")} using ${profile}. Voice: ${voiceGender}. Waiting up to ${Math.round(afterSubmitWait / 1000)}s after submit.`);
  let operateError = null;
  await runFinalNodeScript(run, `vids-voiceover:${profileLabel}`, "src/google-vids-voiceover.mjs", operateArgs)
    .catch((error) => {
      operateError = error;
    });
  const voiceoverReportPath = path.join(operateDir, "google-vids-voiceover-report.json");
  const voiceoverReport = await readJsonArtifact(voiceoverReportPath);
  if (operateError || !voiceoverReport?.ok) {
    const message = voiceoverReport?.manualAction
      ? `${voiceoverReport.error || operateError?.message || "Google Vids voiceover generation did not complete."} Manual action: ${voiceoverReport.manualAction}`
      : voiceoverReport?.error || operateError?.message || "Google Vids voiceover generation did not complete.";
    const error = new Error(message);
    error.report = voiceoverReport;
    throw error;
  }

  const vidsUrl = voiceoverReport.currentUrl || "";
  if (body.noExport || body.prepareOnly) {
    return {
      status: "voiceover_prepared_export_skipped",
      sceneNumbers,
      activeProfile: profile,
      vidsUrl,
      scriptPath,
      voiceoverReportPath,
      operateDir,
      exportDir
    };
  }

  addFinalReelLog(run, `Exporting Google Vids voiceover project MP4 using ${profile}.`);
  let exportError = null;
  await runFinalNodeScript(run, `vids-voiceover-export:${profileLabel}`, "src/google-vids-export.mjs", [
    "--url", vidsUrl,
    "--output", exportDir,
    "--timeout", String(body.exportTimeout || 600000),
    "--filename", "voiceover-source.mp4",
    "--profile", profile,
    "--manual-recovery-wait", String(manualRecoveryWait)
  ]).catch((error) => {
    exportError = error;
  });
  const exportReportPath = path.join(exportDir, "google-vids-export-report.json");
  const exportReport = await readJsonArtifact(exportReportPath);
  const exportedPath = exportReport?.savedPath || "";
  if (exportError || !exportReport?.ok || !exportedPath) {
    const message = exportReport?.manualAction
      ? `${exportReport.error || exportReport?.failure || exportError?.message || "Google Vids voiceover export did not save MP4."} Manual action: ${exportReport.manualAction}`
      : exportReport?.error || exportReport?.failure || exportError?.message || "Google Vids voiceover export did not save MP4.";
    const error = new Error(message);
    error.report = exportReport;
    throw error;
  }

  const generatedExportPath = path.join(generatedDir, "voiceover-source.mp4");
  await fs.copyFile(exportedPath, generatedExportPath);
  const extracted = await extractVidsVoiceoverAudio(prepared, generatedExportPath, sceneNumbers, run);
  const packageData = await readJsonArtifact(prepared.packagePath) || prepared;
  const resultPatch = {
    vidsVoiceover: {
      status: "complete",
      sceneNumbers,
      voiceGender,
      activeProfile: profile,
      vidsUrl,
      scriptPath,
      voiceoverReportPath,
      exportReportPath,
      operateDir,
      exportDir,
      exportedPath: generatedExportPath,
      extracted
    }
  };
  const nextPackage = {
    ...packageData,
    ...resultPatch,
    status: "vids_voiceover_ready",
    voiceoverDir,
    updatedAt: new Date().toISOString()
  };
  nextPackage.files = [
    ...(packageData.files || []),
    scriptPath,
    generatedExportPath,
    extracted.fullAudioPath,
    ...(extracted.extractedVoiceovers || []),
    voiceoverReportPath,
    exportReportPath
  ].filter(Boolean).map((item) => typeof item === "string" ? publicAssetFile(item) : item);
  await writeJson(prepared.packagePath, nextPackage);
  return {
    ...nextPackage,
    finalDir: prepared.finalDir,
    renderDir: prepared.renderDir,
    scenePlanPath: prepared.scenePlanPath,
    manifestPath: prepared.manifestPath,
    packagePath: prepared.packagePath,
    voiceoverDir,
    vidsVoiceover: resultPatch.vidsVoiceover
  };
}

async function generateVidsVoiceoverWithGoogleVids(prepared, body, run) {
  const profiles = hookProfilesFromBody(body);
  if (!profiles.length) {
    throw new Error("At least one Google Vids profile is required.");
  }
  const attempts = [];
  let lastError = null;
  const quotaState = await loadUiState();
  for (let index = 0; index < profiles.length; index += 1) {
    const profile = profiles[index];
    const canTryNext = index < profiles.length - 1;
    const quota = profileQuota(quotaState, profile);
    if (quota.quotaExhausted || quota.limitStatus === "limit_used") {
      lastError = new Error(`Google Vids profile limit used: ${profile}. Select another profile or enable fallback.`);
      attempts.push({ profile, ok: false, quotaHit: true, skipped: true, willTryNext: canTryNext, error: lastError.message });
      addFinalReelLog(run, `Skipping limit-used profile: ${profile}`, "stderr");
      if (canTryNext) {
        continue;
      }
      break;
    }
    try {
      setFinalReelStep(run, "voiceover", "Vids Voiceover", "running", `Trying profile ${index + 1}/${profiles.length}: ${profile}`);
      const result = await generateVidsVoiceoverForProfile(prepared, body, run, profile, index);
      attempts.push({
        profile,
        ok: true,
      status: result.vidsVoiceover?.status || result.status,
      exportedPath: result.vidsVoiceover?.exportedPath || "",
      voiceGender: result.vidsVoiceover?.voiceGender || "",
      sceneNumbers: result.vidsVoiceover?.sceneNumbers || []
      });
      result.vidsVoiceover.attempts = attempts;
      return result;
    } catch (error) {
      lastError = error;
      const report = error.report || null;
      const quotaHit = Boolean(report?.quotaHit) || quotaHitFromText(error.message);
      attempts.push({
        profile,
        ok: false,
        quotaHit,
        loginNeeded: Boolean(report?.loginNeeded),
        requiresManualAction: Boolean(report?.requiresManualAction),
        manualAction: report?.manualAction || "",
        willTryNext: canTryNext,
        error: error.message
      });
      addFinalReelLog(run, `Profile failed: ${profile}. ${error.message}`, "stderr");
      if (quotaHit) {
        await markProfileQuotaHit(profile, error.message).catch(() => {});
      }
      if (canTryNext) {
        addFinalReelLog(run, `Trying fallback profile next: ${profiles[index + 1]}`);
        continue;
      }
    }
  }
  const error = lastError || new Error("Google Vids voiceover generation failed.");
  error.attempts = attempts;
  throw error;
}

async function generateFinalVoiceovers(prepared, body, run) {
  const provider = normalizeFinalVoiceProvider(body.voiceoverProvider);
  const existingVoiceovers = await existingVoiceoverFiles(prepared.voiceoverDir || path.join(prepared.finalDir, "voiceovers"));
  if (existingVoiceovers.length && !body.forceVoiceover) {
    return {
      ok: true,
      skipped: true,
      provider: "existing",
      existingCount: existingVoiceovers.length,
      files: existingVoiceovers,
      note: `Using ${existingVoiceovers.length} existing Vids/manual voiceover file(s).`
    };
  }
  if (provider === "google-vids-voiceover" || provider === "vids-voiceover") {
    return {
      ok: false,
      skipped: true,
      provider,
      note: "Google Vids voiceover files were not found. Run Generate Vids Voiceover first."
    };
  }
  if (provider === "local" || provider === "none") {
    return {
      ok: false,
      skipped: true,
      provider,
      note: provider === "none"
        ? "External voiceover generation skipped by user option."
        : "Using built-in local voiceover fallback during render."
    };
  }
  const args = [
    "--tool-dir", prepared.finalDir,
    "--provider", provider,
    "--spoken-field", "voiceover",
    "--overwrite"
  ];
  await runFinalNodeScript(run, `voiceover:${provider}`, "src/generate-voiceovers.mjs", args);
  const reportPath = path.join(prepared.finalDir, "voiceovers", "voiceover-generation-report.json");
  const report = await readJsonArtifact(reportPath);
  return {
    ok: Boolean(report?.ok),
    provider,
    reportPath,
    generatedCount: report?.generatedCount || 0,
    existingCount: report?.existingCount || 0,
    warnings: report?.warnings || []
  };
}

async function renderFinalReel(prepared, body, run) {
  const presenter = normalizeHookPresenter(body.presenter || body.hookAvatarStyle || defaultHookAvatarStyle);
  const avatarHostImage = await existingAvatarReferencePath(
    body.avatarHostImage || body.avatarReferenceImage || body.customAvatarImage || body.avatarImage || ""
  );
  const renderArgs = [
    "--tool-dir", prepared.finalDir,
    "--output", prepared.renderDir,
    "--filename", "final_reel.mp4",
    "--hook-avatar", presenter
  ];
  if (avatarHostImage) {
    renderArgs.push("--avatar-host", avatarHostImage);
    addFinalReelLog(run, `Using custom avatar host image: ${avatarHostImage}`);
  }
  await runFinalNodeScript(run, "render:local", "src/render-local-reel.mjs", renderArgs);
  const reportPath = path.join(prepared.renderDir, "local-reel-report.json");
  const report = await readJsonArtifact(reportPath);
  if (!report?.ok) {
    throw new Error(report?.error || "Final local reel render failed.");
  }
  return {
    report,
    reportPath,
    outputPath: report.toolFolderOutputPath || report.outputPath || path.join(prepared.renderDir, "final_reel.mp4"),
    qualityReportPath: report.qualityReportPath || path.join(prepared.renderDir, "reel-quality-report.json")
  };
}

async function startFinalReelRun(body = {}) {
  const id = `final-reel-${timestampSlug()}`;
  const run = {
    id,
    kind: "video",
    status: "running",
    body: {
      ...body,
      mode: body.mode || "basic-final-local"
    },
    result: null,
    report: null,
    error: "",
    outputDir: "",
    startedAt: new Date().toISOString(),
    endedAt: null,
    logs: [],
    steps: [],
    clients: new Set(),
    child: null
  };
  finalReelRuns.set(id, run);
  setFinalReelStep(run, "start", "Final Reel", "running", `Starting row ${Number(body.row || 2)}.`);

  setTimeout(async () => {
    let prepared = null;
    try {
      setFinalReelStep(run, "artifacts", "Reading artifacts", "running", "Finding saved assets, script, and hook clips.");
      prepared = await prepareFinalReelPackage(body, run);
      run.outputDir = prepared.finalDir;
      run.result = prepared;
      setFinalReelStep(run, "artifacts", "Reading artifacts", "complete", `${prepared.captureFileCount} real asset file(s) linked.`);

      setFinalReelStep(run, "voiceover", "Voiceover", "running", "Trying selected voice provider, then local fallback if needed.");
      let voiceover = null;
      try {
        voiceover = await generateFinalVoiceovers(prepared, body, run);
        const note = voiceover.skipped
          ? voiceover.note
          : `${voiceover.generatedCount || 0} generated, ${voiceover.existingCount || 0} existing.`;
        setFinalReelStep(run, "voiceover", "Voiceover", voiceover.ok || voiceover.skipped ? "complete" : "warning", note);
      } catch (error) {
        voiceover = { ok: false, provider: normalizeFinalVoiceProvider(body.voiceoverProvider), error: error.message };
        setFinalReelStep(run, "voiceover", "Voiceover fallback", "warning", `${error.message} Local render voiceover will be used.`);
      }

      setFinalReelStep(run, "render", "Rendering video", "running", "Merging hook, real demo footage, CTA, captions, and music.");
      const rendered = await renderFinalReel(prepared, body, run);
      const quality = rendered.report.quality || {};
      setFinalReelStep(run, "render", "Rendering video", "complete", `Saved MP4. Quality ${rendered.report.qualityScore || quality.score || 0}/100.`);

      const result = {
        ...prepared,
        status: "complete",
        outputPath: rendered.outputPath,
        videoPath: rendered.outputPath,
        reportPath: rendered.reportPath,
        qualityReportPath: rendered.qualityReportPath,
        qualityScore: rendered.report.qualityScore || quality.score || 0,
        qualityStatus: rendered.report.qualityStatus || quality.status || "",
        qualityWarnings: rendered.report.qualityWarnings || quality.warnings || [],
        voiceover,
        audio: rendered.report.audio || null,
        renderReport: rendered.report,
        summary: quality.summary || "Final reel rendered. Do one human review before posting.",
        files: [
          rendered.outputPath,
          rendered.reportPath,
          rendered.qualityReportPath,
          prepared.scenePlanPath,
          prepared.manifestPath,
          prepared.packagePath,
          prepared.readmePath
        ].filter(Boolean).map(publicAssetFile)
      };
      await writeJson(prepared.packagePath, result);

      run.report = {
        mode: "basic-final-local",
        input: prepared.input,
        selectedRow: {
          source_row_number: prepared.row,
          tool_name: prepared.tool?.tool_name || prepared.tool?.name || "",
          tool_url: prepared.tool?.tool_url || prepared.tool?.url || ""
        },
        toolDir: prepared.finalDir,
        mp4Path: rendered.outputPath,
        generatedFolder: path.join(prepared.finalDir, "generated"),
        qualityReportPath: rendered.qualityReportPath,
        qualityScore: result.qualityScore,
        qualityStatus: result.qualityStatus,
        qualityWarnings: result.qualityWarnings,
        qaStatus: "Needs human review",
        error: ""
      };
      await recordRunHistory({
        ...run,
        status: "complete",
        endedAt: new Date().toISOString()
      });
      await updateUiState((state) => {
        state.settings = {
          ...(state.settings || {}),
          inputPath: prepared.input,
          row: prepared.row,
          lastFinalReelFolder: prepared.finalDir,
          lastFinalReelVideo: rendered.outputPath,
          lastFinalReelReport: rendered.reportPath,
          updatedAt: new Date().toISOString()
        };
      });
      setFinalReelStep(run, "start", "Final Reel", "complete", `Completed row ${prepared.row}.`);
      setFinalReelStep(run, "done", "Final saved", "complete", rendered.outputPath);
      addFinalReelLog(run, `Final reel ready: ${rendered.outputPath}`, "stdout");
      finishFinalReelRun(run, "complete", result);
    } catch (error) {
      setFinalReelStep(run, "start", "Final Reel", "failed", `Stopped at row ${Number(body.row || 2)}.`);
      setFinalReelStep(run, "failed", "Final failed", "failed", error.message);
      run.report = {
        mode: "basic-final-local",
        input: body.input || defaultInput,
        selectedRow: {
          source_row_number: Number(body.row || 0),
          tool_name: body.toolName || "",
          tool_url: body.toolUrl || ""
        },
        toolDir: prepared?.finalDir || "",
        mp4Path: "",
        qualityScore: 0,
        qualityStatus: "failed",
        error: error.message
      };
      await recordRunHistory({
        ...run,
        status: "failed",
        endedAt: new Date().toISOString()
      }).catch(() => {});
      addFinalReelLog(run, error.message, "stderr");
      finishFinalReelRun(run, "failed", run.result, error.message);
    }
  }, 0);

  return run;
}

async function startRemainingVidsRun(body = {}) {
  if (creditSafeModeEnabled(body.creditSafeMode)) {
    throw new Error("Credit Safe Mode is ON. Remaining Google Vids scene generation is blocked.");
  }
  const id = `remaining-vids-${timestampSlug()}`;
  const run = {
    id,
    kind: "remaining_vids",
    status: "running",
    body: {
      ...body,
      mode: "remaining-vids"
    },
    result: null,
    report: null,
    error: "",
    outputDir: "",
    startedAt: new Date().toISOString(),
    endedAt: null,
    logs: [],
    steps: [],
    clients: new Set(),
    child: null
  };
  finalReelRuns.set(id, run);
  setFinalReelStep(run, "start", "Remaining Vids", "running", `Skipping hook and preparing scene 2 onwards for row ${Number(body.row || 2)}.`);

  setTimeout(async () => {
    let prepared = null;
    try {
      setFinalReelStep(run, "artifacts", "Reading artifacts", "running", "Finding script, assets, and existing hook clip.");
      prepared = await prepareFinalReelPackage(body, run);
      run.outputDir = prepared.finalDir;
      run.result = prepared;
      setFinalReelStep(run, "artifacts", "Reading artifacts", "complete", `${prepared.sceneCount} scene script ready; hook stays untouched.`);

      setFinalReelStep(run, "vids", "Google Vids scenes", "running", "Generating/downloading scene 2 onwards from Google Vids.");
      const result = await generateRemainingVidsWithGoogleVids(prepared, body, run);
      const remaining = result.remainingVids || {};
      const extracted = remaining.extracted || {};
      const extractNote = extracted.ok
        ? `${extracted.extractedVoiceovers?.length || 0} voiceover(s), ${extracted.extractedClips?.length || 0} clip(s) extracted.`
        : extracted.warning || "Google Vids MP4 saved. Scene split skipped.";
      setFinalReelStep(run, "vids", "Google Vids scenes", "complete", `Scenes ${(remaining.sceneNumbers || []).join(", ")} ready. ${extractNote}`);

      run.report = {
        mode: "remaining-vids",
        input: result.input,
        selectedRow: {
          source_row_number: result.row,
          tool_name: result.tool?.tool_name || result.tool?.name || "",
          tool_url: result.tool?.tool_url || result.tool?.url || ""
        },
        toolDir: result.finalDir,
        generatedFolder: path.join(result.finalDir, "generated", "google-vids-remaining"),
        mp4Path: remaining.exportedPath || remaining.cachedExportPath || "",
        sceneNumbers: remaining.sceneNumbers || [],
        qaStatus: "Needs human review",
        error: ""
      };
      await recordRunHistory({
        ...run,
        status: "complete",
        endedAt: new Date().toISOString()
      }).catch(() => {});
      await updateUiState((state) => {
        state.settings = {
          ...(state.settings || {}),
          inputPath: result.input || body.input || defaultInput,
          row: result.row || Number(body.row || 2),
          lastFinalReelFolder: result.finalDir,
          lastRemainingVidsFolder: result.remainingVids?.operateDir ? path.dirname(result.remainingVids.operateDir) : "",
          lastRemainingVidsExport: remaining.exportedPath || "",
          updatedAt: new Date().toISOString()
        };
      });
      setFinalReelStep(run, "done", "Remaining scenes saved", "complete", remaining.exportedPath || result.finalDir);
      addFinalReelLog(run, `Remaining Google Vids scenes ready: ${remaining.exportedPath || result.finalDir}`, "stdout");
      finishFinalReelRun(run, "complete", {
        ...result,
        kind: "remaining_vids",
        status: "remaining_vids_ready",
        summary: `Hook skipped. Google Vids remaining scenes ${(remaining.sceneNumbers || []).join(", ")} saved. Run Render Final Reel next.`,
        files: [
          ...(result.files || []),
          remaining.exportedPath,
          remaining.cachedExportPath,
          ...(remaining.extracted?.extractedVoiceovers || []),
          ...(remaining.extracted?.extractedClips || [])
        ].filter(Boolean).map((item) => typeof item === "string" ? publicAssetFile(item) : item)
      });
    } catch (error) {
      setFinalReelStep(run, "failed", "Remaining Vids failed", "failed", error.message);
      run.report = {
        mode: "remaining-vids",
        input: body.input || defaultInput,
        selectedRow: {
          source_row_number: Number(body.row || 0),
          tool_name: body.toolName || "",
          tool_url: body.toolUrl || ""
        },
        toolDir: prepared?.finalDir || "",
        mp4Path: "",
        qaStatus: "failed",
        error: error.message
      };
      await recordRunHistory({
        ...run,
        status: "failed",
        endedAt: new Date().toISOString()
      }).catch(() => {});
      addFinalReelLog(run, error.message, "stderr");
      finishFinalReelRun(run, "failed", run.result, error.message);
    }
  }, 0);

  return run;
}

async function startVidsVoiceoverRun(body = {}) {
  if (creditSafeModeEnabled(body.creditSafeMode)) {
    throw new Error("Credit Safe Mode is ON. Google Vids Voiceover generation is blocked.");
  }
  const id = `vids-voiceover-${timestampSlug()}`;
  const run = {
    id,
    kind: "vids_voiceover",
    status: "running",
    body: {
      ...body,
      mode: "vids-voiceover"
    },
    result: null,
    report: null,
    error: "",
    outputDir: "",
    startedAt: new Date().toISOString(),
    endedAt: null,
    logs: [],
    steps: [],
    clients: new Set(),
    child: null
  };
  finalReelRuns.set(id, run);
  setFinalReelStep(run, "start", "Vids Voiceover", "running", `Skipping hook and preparing narration for row ${Number(body.row || 2)}.`);

  setTimeout(async () => {
    let prepared = null;
    try {
      setFinalReelStep(run, "artifacts", "Reading artifacts", "running", "Finding script, assets, and hook clip. Hook video will stay as-is.");
      prepared = await prepareFinalReelPackage(body, run);
      run.outputDir = prepared.finalDir;
      run.result = prepared;
      setFinalReelStep(run, "artifacts", "Reading artifacts", "complete", `${prepared.sceneCount} scene script ready; Vids Voiceover will use scene 2 onwards.`);

      setFinalReelStep(run, "voiceover", "Vids Voiceover", "running", "Opening Google Vids Voiceover tab and generating narration.");
      const result = await generateVidsVoiceoverWithGoogleVids(prepared, body, run);
      const voice = result.vidsVoiceover || {};
      const extracted = voice.extracted || {};
      const extractNote = extracted.ok
        ? `${extracted.extractedVoiceovers?.length || 0} scene audio file(s) extracted.`
        : extracted.warning || "Voiceover MP4 saved. Audio extraction skipped.";
      setFinalReelStep(run, "voiceover", "Vids Voiceover", "complete", `Scenes ${(voice.sceneNumbers || []).join(", ")} narration ready. ${extractNote}`);

      run.report = {
        mode: "vids-voiceover",
        input: result.input,
        selectedRow: {
          source_row_number: result.row,
          tool_name: result.tool?.tool_name || result.tool?.name || "",
          tool_url: result.tool?.tool_url || result.tool?.url || ""
        },
        toolDir: result.finalDir,
        generatedFolder: path.join(result.finalDir, "generated", "google-vids-voiceover"),
        mp4Path: voice.exportedPath || "",
        voiceoverDir: result.voiceoverDir || path.join(result.finalDir, "voiceovers"),
        voiceGender: voice.voiceGender || "",
        sceneNumbers: voice.sceneNumbers || [],
        qaStatus: "Needs human review",
        error: ""
      };
      await recordRunHistory({
        ...run,
        status: "complete",
        endedAt: new Date().toISOString()
      }).catch(() => {});
      await updateUiState((state) => {
        state.settings = {
          ...(state.settings || {}),
          inputPath: result.input || body.input || defaultInput,
          row: result.row || Number(body.row || 2),
          lastFinalReelFolder: result.finalDir,
          lastVidsVoiceoverFolder: result.voiceoverDir || path.join(result.finalDir, "voiceovers"),
          lastVidsVoiceoverExport: voice.exportedPath || "",
          updatedAt: new Date().toISOString()
        };
      });
      setFinalReelStep(run, "done", "Vids voiceover saved", "complete", result.voiceoverDir || result.finalDir);
      addFinalReelLog(run, `Google Vids voiceover ready: ${result.voiceoverDir || result.finalDir}`, "stdout");
      finishFinalReelRun(run, "complete", {
        ...result,
        kind: "vids_voiceover",
        status: "vids_voiceover_ready",
        summary: `Hook skipped. Google Vids voiceover for scenes ${(voice.sceneNumbers || []).join(", ")} saved. Run Render Final Reel next.`,
        files: [
          ...(result.files || []),
          voice.scriptPath,
          voice.exportedPath,
          voice.extracted?.fullAudioPath,
          ...(voice.extracted?.extractedVoiceovers || [])
        ].filter(Boolean).map((item) => typeof item === "string" ? publicAssetFile(item) : item)
      });
    } catch (error) {
      setFinalReelStep(run, "failed", "Vids Voiceover failed", "failed", error.message);
      run.report = {
        mode: "vids-voiceover",
        input: body.input || defaultInput,
        selectedRow: {
          source_row_number: Number(body.row || 0),
          tool_name: body.toolName || "",
          tool_url: body.toolUrl || ""
        },
        toolDir: prepared?.finalDir || "",
        mp4Path: "",
        qaStatus: "failed",
        error: error.message
      };
      await recordRunHistory({
        ...run,
        status: "failed",
        endedAt: new Date().toISOString()
      }).catch(() => {});
      addFinalReelLog(run, error.message, "stderr");
      finishFinalReelRun(run, "failed", run.result, error.message);
    }
  }, 0);

  return run;
}

async function readJsonArtifact(filePath) {
  try {
    return await readJson(filePath);
  } catch {
    return null;
  }
}

async function findToolArtifacts(body = {}) {
  const input = path.resolve(String(body.input || defaultInput).trim());
  const rowNumber = Number(body.row || 2);
  const suppliedToolName = scriptTextClean(body.toolName || body.name, "");
  const tool = suppliedToolName
    ? {
      source_row_number: rowNumber,
      tool_name: suppliedToolName,
      tool_url: String(body.toolUrl || body.url || "")
    }
    : await toolRowForInput(input, rowNumber);
  const assetsRoot = path.join(projectRoot, "outputs", "assets");
  const scriptsRoot = path.join(projectRoot, "outputs", "scripts");
  const hooksRoot = path.join(projectRoot, "outputs", "hook-avatar");
  const [assetFiles, scriptRootFiles, assetScriptFiles, hookRootFiles] = await Promise.all([
    listFilesRecursive(assetsRoot),
    listFilesRecursive(scriptsRoot),
    listFilesRecursive(assetsRoot),
    listFilesRecursive(hooksRoot)
  ]);

  const assetManifests = [];
  for (const filePath of assetFiles.filter((item) => path.basename(item) === "asset-manifest.json")) {
    const manifest = await readJsonArtifact(filePath);
    if (!manifest || !sameArtifactRow(manifest, rowNumber) || !sameArtifactTool(manifest.tool || {}, tool)) {
      continue;
    }
    const modifiedAt = await fileModifiedAt(filePath);
    assetManifests.push({
      kind: "assets",
      path: filePath,
      folder: manifest.assetsDir || path.dirname(filePath),
      runDir: manifest.runDir || path.dirname(path.dirname(filePath)),
      generatedAt: artifactGeneratedAt(manifest, modifiedAt),
      modifiedAt,
      row: Number(manifest.row || rowNumber),
      toolName: artifactToolName(manifest.tool || tool),
      fileCount: manifest.files?.length || manifest.capture?.files?.length || 0,
      summary: manifest.capture?.summary || "",
      assetBuild: manifest
    });
  }

  const scriptFiles = [
    ...scriptRootFiles,
    ...assetScriptFiles
  ].filter((item, index, items) => (
    path.basename(item) === "reel-script.json" && items.indexOf(item) === index
  ));
  const scripts = [];
  for (const filePath of scriptFiles) {
    const scriptBuild = await readJsonArtifact(filePath);
    if (!scriptBuild || !sameArtifactRow(scriptBuild, rowNumber) || !sameArtifactTool(scriptBuild.tool || {}, tool)) {
      continue;
    }
    const modifiedAt = await fileModifiedAt(filePath);
    scripts.push({
      kind: "script",
      path: filePath,
      folder: scriptBuild.scriptDir || path.dirname(filePath),
      runDir: scriptBuild.runDir || path.dirname(path.dirname(filePath)),
      generatedAt: artifactGeneratedAt(scriptBuild, modifiedAt),
      modifiedAt,
      row: Number(scriptBuild.row || rowNumber),
      toolName: artifactToolName(scriptBuild.tool || tool),
      duration: scriptBuild.totalDurationSeconds || scriptBuild.plan?.metadata?.total_duration_seconds || 0,
      sceneCount: scriptBuild.sceneCount || scriptBuild.plan?.scenes?.length || 0,
      scriptBuild
    });
  }

  const hookFiles = [
    ...assetFiles,
    ...scriptRootFiles,
    ...hookRootFiles
  ].filter((item, index, items) => (
    path.basename(item) === "hook-avatar-manifest.json" && items.indexOf(item) === index
  ));
  const hookAvatars = [];
  for (const filePath of hookFiles) {
    const hookAvatar = await readJsonArtifact(filePath);
    if (!hookAvatar || !sameArtifactRow(hookAvatar, rowNumber) || !sameArtifactTool(hookAvatar.tool || {}, tool)) {
      continue;
    }
    const modifiedAt = await fileModifiedAt(filePath);
    hookAvatars.push({
      kind: "hook_avatar",
      path: filePath,
      folder: hookAvatar.hookDir || path.dirname(filePath),
      runDir: hookAvatar.runDir || path.dirname(path.dirname(filePath)),
      generatedAt: artifactGeneratedAt(hookAvatar, modifiedAt),
      modifiedAt,
      row: Number(hookAvatar.row || rowNumber),
      toolName: artifactToolName(hookAvatar.tool || tool),
      status: hookAvatar.status || hookAvatar.hookAvatar?.status || "",
      duration: hookAvatar.durationSeconds || hookAvatar.hookAvatar?.durationSeconds || 0,
      videoPath: hookAvatar.videoPath || hookAvatar.hookAvatar?.videoPath || "",
      cachedScenePath: hookAvatar.cachedScenePath || hookAvatar.hookAvatar?.cachedScenePath || "",
      hookAvatar
    });
  }

  const latestAssets = sortLatestArtifacts(assetManifests)[0] || null;
  const latestScript = sortLatestArtifacts(scripts)[0] || null;
  const latestHookAvatar = sortLatestArtifacts(hookAvatars)[0] || null;
  const latestHookAvatarHasVideo = Boolean(
    latestHookAvatar?.videoPath
    || latestHookAvatar?.cachedScenePath
    || latestHookAvatar?.hookAvatar?.videoPath
    || latestHookAvatar?.hookAvatar?.hookAvatar?.videoPath
    || latestHookAvatar?.hookAvatar?.ctaVideoPath
    || latestHookAvatar?.hookAvatar?.ctaCachedScenePath
    || latestHookAvatar?.hookAvatar?.ctaAvatar?.videoPath
    || latestHookAvatar?.hookAvatar?.ctaAvatar?.cachedScenePath
    || Object.values(latestHookAvatar?.hookAvatar?.middleAvatarVideos || {}).some(Boolean)
  );
  return {
    input,
    row: rowNumber,
    tool: {
      row: Number(tool.source_row_number || rowNumber),
      name: tool.tool_name || tool.name || "",
      url: tool.tool_url || tool.url || ""
    },
    hasAssets: Boolean(latestAssets),
    hasScript: Boolean(latestScript),
    hasHookAvatar: Boolean(latestHookAvatar),
    hasHookAvatarVideo: latestHookAvatarHasVideo,
    latestAssets,
    latestScript,
    latestHookAvatar,
    assets: sortLatestArtifacts(assetManifests).slice(0, 5).map((item) => ({
      ...item,
      assetBuild: undefined
    })),
    scripts: sortLatestArtifacts(scripts).slice(0, 5).map((item) => ({
      ...item,
      scriptBuild: undefined
    })),
    hookAvatars: sortLatestArtifacts(hookAvatars).slice(0, 5).map((item) => ({
      ...item,
      hasVideo: Boolean(item.videoPath || item.cachedScenePath || item.hookAvatar?.ctaVideoPath || item.hookAvatar?.ctaCachedScenePath || item.hookAvatar?.ctaAvatar?.videoPath || item.hookAvatar?.ctaAvatar?.cachedScenePath || Object.values(item.hookAvatar?.middleAvatarVideos || {}).some(Boolean)),
      hookAvatar: undefined
    }))
  };
}

function videoCandidateRow(value = {}) {
  return Number(
    value.row
    || value.selectedRow?.source_row_number
    || value.selectedRow?.row
    || value.tool?.source_row_number
    || value.tool?.row
    || 0
  );
}

function videoCandidateTool(value = {}) {
  const selectedRow = value.selectedRow || {};
  const tool = value.tool || {};
  return {
    name: tool.tool_name || tool.name || selectedRow.tool_name || selectedRow.name || "",
    url: tool.tool_url || tool.url || selectedRow.tool_url || selectedRow.url || ""
  };
}

function videoPathsFromPackage(value = {}) {
  const files = Array.isArray(value.files) ? value.files : [];
  const filePaths = files
    .filter((file) => String(file?.kind || "").toLowerCase() === "video" || /\.(mp4|webm|mov)$/i.test(String(file?.path || file?.name || "")))
    .map((file) => file.path || "");
  return [
    value.videoPath,
    value.outputPath,
    value.mp4Path,
    value.renderReport?.toolFolderOutputPath,
    value.renderReport?.outputPath,
    ...filePaths
  ];
}

function videoPathsFromRunReport(value = {}) {
  const files = Array.isArray(value.files) ? value.files : [];
  const filePaths = files
    .filter((file) => String(file?.kind || "").toLowerCase() === "video" || /\.(mp4|webm|mov)$/i.test(String(file?.path || file?.name || "")))
    .map((file) => file.path || "");
  return [
    value.mp4Path,
    value.videoPath,
    value.outputPath,
    value.finalVideoPath,
    value.localFallback?.mp4Path,
    value.localFallback?.videoPath,
    value.rendered?.outputPath,
    value.renderReport?.toolFolderOutputPath,
    value.renderReport?.outputPath,
    ...filePaths
  ];
}

async function finalVideoCandidateFromFile(filePath, source) {
  const data = await readJsonArtifact(filePath);
  if (!data || typeof data !== "object") return null;
  const row = videoCandidateRow(data);
  const tool = videoCandidateTool(data);
  const videoPath = await existingOutputPath(source === "agent_report"
    ? videoPathsFromRunReport(data)
    : videoPathsFromPackage(data));
  if (!row || !videoPath) return null;
  const folder = data.finalDir || data.toolDir || data.outputDir || path.dirname(path.dirname(videoPath));
  const modifiedAt = await fileModifiedAt(filePath);
  return {
    row,
    toolName: tool.name,
    toolUrl: tool.url,
    status: data.status || data.qaStatus || "complete",
    videoPath,
    videoUrl: `/file?path=${encodeURIComponent(videoPath)}`,
    folder,
    folderPath: folder,
    qualityScore: Number(data.qualityScore || data.renderReport?.qualityScore || data.quality?.score || 0),
    qualityStatus: data.qualityStatus || data.renderReport?.qualityStatus || data.quality?.status || "",
    generatedAt: artifactTime(data) || modifiedAt,
    modifiedAt,
    source,
    sourcePath: filePath,
    sourceUrl: `/file?path=${encodeURIComponent(filePath)}`
  };
}

async function listToolVideoStatus(body = {}) {
  const finalRoot = path.join(projectRoot, "outputs", "final-reels");
  const runsRoot = path.join(projectRoot, "outputs", "runs");
  const [finalFiles, runFiles] = await Promise.all([
    listFilesRecursive(finalRoot),
    listFilesRecursive(runsRoot)
  ]);
  const candidateFiles = [
    ...finalFiles.filter((item) => path.basename(item) === "final-reel-package.json").map((filePath) => ({ filePath, source: "final_reel" })),
    ...runFiles.filter((item) => path.basename(item) === "one-video-agent-report.json").map((filePath) => ({ filePath, source: "agent_report" }))
  ];
  const candidates = [];
  for (const item of candidateFiles) {
    const candidate = await finalVideoCandidateFromFile(item.filePath, item.source);
    if (candidate) {
      candidates.push(candidate);
    }
  }
  const byRow = {};
  for (const candidate of sortLatestArtifacts(candidates)) {
    if (!byRow[String(candidate.row)]) {
      byRow[String(candidate.row)] = candidate;
    }
  }
  return {
    input: String(body.input || defaultInput),
    count: Object.keys(byRow).length,
    videos: Object.values(byRow),
    byRow
  };
}

function publicAssetRun(run) {
  return {
    id: run.id,
    status: run.status,
    body: run.body,
    result: run.result,
    error: run.error,
    startedAt: run.startedAt,
    endedAt: run.endedAt,
    logs: run.logs.slice(-300)
  };
}

function addAssetLog(run, text, stream = "system") {
  const entry = {
    at: new Date().toISOString(),
    stream,
    text: String(text || "")
  };
  run.logs.push(entry);
  if (run.logs.length > 1000) {
    run.logs.splice(0, run.logs.length - 1000);
  }
  for (const client of run.clients) {
    sendSse(client, "log", entry);
  }
}

function finishAssetRun(run, status, result = null, error = "") {
  if (run.status !== "running") {
    return;
  }
  run.status = status;
  run.result = result;
  run.error = error;
  run.endedAt = new Date().toISOString();
  const data = publicAssetRun(run);
  for (const client of run.clients) {
    sendSse(client, "status", data);
    client.end();
  }
  run.clients.clear();
}

async function startAssetBuildRun(body) {
  const id = `asset-${timestampSlug()}`;
  const run = {
    id,
    status: "running",
    body,
    result: null,
    error: "",
    startedAt: new Date().toISOString(),
    endedAt: null,
    logs: [],
    clients: new Set()
  };
  assetRuns.set(id, run);
  addAssetLog(run, `POST /api/assets/build-run`);
  addAssetLog(run, `Starting asset build for row ${Number(body.row || 2)}.`);

  setTimeout(async () => {
    try {
      const result = await buildToolAssets(body, {
        log: (message, stream = "stdout") => addAssetLog(run, message, stream)
      });
      addAssetLog(run, "Asset build completed.", "stdout");
      finishAssetRun(run, "complete", result);
    } catch (error) {
      addAssetLog(run, error.message, "stderr");
      finishAssetRun(run, "failed", null, error.message);
    }
  }, 0);

  return run;
}

async function saveUploadedInput(req, options = {}) {
  const originalName = req.headers["x-file-name"] || "tools.xlsx";
  const safeName = safeUploadFileName(originalName);
  const data = await readBinaryBody(req);
  if (!data.length) {
    throw new Error("Selected file was empty.");
  }

  const uploadDir = path.join(projectRoot, "work", "uploads");
  await ensureDir(uploadDir);
  const savedName = `${timestampSlug()}-${safeName}`;
  const savedPath = path.resolve(uploadDir, savedName);
  const relativePath = path.relative(projectRoot, savedPath);
  if (relativePath.startsWith("../") || path.isAbsolute(relativePath)) {
    throw new Error("Upload path escaped the project folder.");
  }
  await fs.writeFile(savedPath, data);

  if (options.analyze === false) {
    await updateUiState((state) => {
      state.settings = {
        ...(state.settings || {}),
        inputPath: savedPath,
        updatedAt: new Date().toISOString()
      };
    });
    return {
      input: savedPath,
      relativePath,
      originalName: String(originalName || ""),
      savedName,
      bytes: data.length,
      tools: [],
      analysis: null,
      savedOnly: true
    };
  }

  let tools = [];
  let analysis = null;
  const config = await readJson(path.join(projectRoot, "config/default.json"));
  if (await shouldUseLargeXlsxReader(savedPath)) {
    const analyzed = await runLargeXlsxAnalyzer(savedPath, config.toolBaseUrl || "");
    tools = analyzed.tools || [];
    analysis = compactAnalysisForUi(analyzed.analysis || null);
  } else {
    tools = await listTools(savedPath);
    analysis = compactAnalysisForUi(await analyzeInputWorkbook(savedPath));
  }
  await updateUiState((state) => {
    state.settings = {
      ...(state.settings || {}),
      inputPath: savedPath,
      row: tools[0]?.row || state.settings?.row || 2,
      updatedAt: new Date().toISOString()
    };
  });
  return {
    input: savedPath,
    relativePath,
    originalName: String(originalName || ""),
    savedName,
    bytes: data.length,
    tools,
    analysis
  };
}

function normalizeAvatarReferencePath(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return "";
  }
  if (!/\.(png|jpe?g|webp)$/i.test(raw)) {
    return "";
  }
  const resolved = path.isAbsolute(raw) ? path.resolve(raw) : path.resolve(projectRoot, raw);
  if (!allowedOutputPath(resolved)) {
    return "";
  }
  return resolved;
}

async function existingAvatarReferencePath(value) {
  const resolved = normalizeAvatarReferencePath(value);
  if (!resolved) {
    return "";
  }
  return fsSync.existsSync(resolved) ? resolved : "";
}

async function avatarReferenceFilesFromBody(body = {}) {
  const source = [
    body.avatarHostImage,
    body.avatarReferenceImage,
    body.customAvatarImage,
    body.avatarImage,
    body.avatarReferenceImages
  ].filter(Boolean).join(",");
  const files = [];
  for (const item of source.split(",").map((value) => value.trim()).filter(Boolean)) {
    const found = await existingAvatarReferencePath(item);
    if (found && !files.includes(found)) {
      files.push(found);
    }
  }
  return files.slice(0, 3);
}

async function saveUploadedAvatarReference(req) {
  const originalName = req.headers["x-file-name"] || "avatar.png";
  const safeName = safeAvatarFileName(originalName);
  const data = await readBinaryBody(req, 12 * 1024 * 1024);
  if (!data.length) {
    throw new Error("Selected avatar image was empty.");
  }

  const uploadDir = path.join(projectRoot, "work", "avatar-references");
  await ensureDir(uploadDir);
  const savedName = `${timestampSlug()}-${safeName}`;
  const savedPath = path.resolve(uploadDir, savedName);
  const relativePath = path.relative(projectRoot, savedPath);
  if (relativePath.startsWith("../") || path.isAbsolute(relativePath)) {
    throw new Error("Avatar upload path escaped the project folder.");
  }
  await fs.writeFile(savedPath, data);
  await updateUiState((state) => {
    state.settings = {
      ...(state.settings || {}),
      avatarHostImage: savedPath,
      updatedAt: new Date().toISOString()
    };
  });
  return {
    avatar: publicAssetFile(savedPath),
    path: savedPath,
    relativePath,
    originalName: String(originalName || ""),
    savedName,
    bytes: data.length
  };
}

function publicRun(run) {
  return {
    id: run.id,
    kind: run.kind || "video",
    status: run.status,
    command: run.command,
    args: run.args,
    row: run.body?.row || null,
    mode: run.body?.mode || "",
    queueId: run.queueId || "",
    queueItemId: run.queueItemId || "",
    outputDir: run.outputDir,
    startedAt: run.startedAt,
    endedAt: run.endedAt,
    exitCode: run.exitCode,
    signal: run.signal,
    report: run.report,
    logs: run.logs.slice(-300)
  };
}

async function readRunReport(run) {
  const reportPath = path.join(run.outputDir, "one-video-agent-report.json");
  try {
    run.report = await readJson(reportPath);
  } catch {
    run.report = null;
  }
}

function addLog(run, stream, text) {
  const entry = {
    at: new Date().toISOString(),
    stream,
    text
  };
  run.logs.push(entry);
  if (run.logs.length > 2000) {
    run.logs.splice(0, run.logs.length - 2000);
  }
  for (const client of run.clients) {
    sendSse(client, "log", entry);
  }
}

function finishRun(run, status, code, signal) {
  if (run.status !== "running") {
    return;
  }
  run.status = status;
  run.exitCode = code;
  run.signal = signal;
  run.endedAt = new Date().toISOString();
  readRunReport(run).finally(async () => {
    await recordRunHistory(run).catch((error) => {
      addLog(run, "stderr", `History save failed: ${error.message}\n`);
    });
    const data = publicRun(run);
    for (const callback of run.callbacks || []) {
      await Promise.resolve(callback(run)).catch((error) => {
        addLog(run, "stderr", `Queue update failed: ${error.message}\n`);
      });
    }
    for (const client of run.clients) {
      sendSse(client, "status", data);
      client.end();
    }
    run.clients.clear();
  });
}

function runArgsFromBody(body, outputDir) {
  const normalized = normalizeRunBody(body);
  const input = normalized.input;
  const row = Number(normalized.row || 2);
  const mode = normalized.mode;
  const maxScenes = normalized.maxScenes;
  const profiles = normalizeProfileList(body.profiles);
  const runArgs = [
    "src/run-one-video-agent.mjs",
    "--input", input,
    "--row", String(Number.isFinite(row) ? row : 2),
    "--limit", "1",
    "--scene-count", String(Number.isFinite(maxScenes) ? maxScenes : 6),
    "--out", outputDir
  ];
  if (body.driveSyncDir) {
    runArgs.push("--drive-sync-dir", String(body.driveSyncDir));
  }
  if (body.updateSourceWorkbook) {
    runArgs.push("--update-source-workbook");
  }
  if (normalized.freeVideoProviders) {
    runArgs.push("--free-video-providers", String(normalized.freeVideoProviders));
  }
  if (body.useAiScript) {
    runArgs.push("--ai");
    runArgs.push("--ai-provider", String(normalized.aiProvider || defaultAiProvider));
    if (normalized.aiModel) {
      runArgs.push("--ai-model", String(normalized.aiModel));
    }
  }
  if (normalized.ttsProvider && !["local", "none", "off"].includes(String(normalized.ttsProvider).toLowerCase())) {
    runArgs.push("--tts-provider", String(normalized.ttsProvider));
    if (normalized.ttsModel) {
      runArgs.push("--tts-model", String(normalized.ttsModel));
    }
    if (normalized.ttsVoice) {
      runArgs.push("--tts-voice", String(normalized.ttsVoice));
    }
  }
  if (normalized.hookAvatarStyle) {
    runArgs.push("--hook-avatar", String(normalized.hookAvatarStyle));
  }
  if (normalized.videoSize) {
    runArgs.push("--video-size", String(normalized.videoSize));
  }
  if (normalized.avatarReferenceImages) {
    runArgs.push("--creator-images", String(normalized.avatarReferenceImages));
    runArgs.push("--avatar-pack-providers", String(normalized.avatarPackProviders || defaultAvatarGenerationProviders));
    if (normalized.avatarClipProvider) {
      runArgs.push("--avatar-provider", String(normalized.avatarClipProvider));
    }
    if (normalized.generateAvatarClips) {
      runArgs.push("--generate-avatar-clips");
    }
    if (normalized.heygenVoiceId) {
      runArgs.push("--heygen-voice-id", String(normalized.heygenVoiceId));
    }
  }

  if (mode === "prep" || mode === "free-providers") {
    runArgs.push("--prep-only");
  } else if (mode === "local") {
    runArgs.push("--local-only");
  } else {
    runArgs.push("--max-scenes", String(Number.isFinite(maxScenes) ? maxScenes : 6));
    if (mode === "google" || mode === "google-full" || mode === "google-hook") {
      runArgs.push("--generate");
      if (mode === "google-hook") {
        runArgs.push("--hook-vids-first", "--vids-scenes", "1");
      }
    }
    if (body.useIngredients !== false) {
      runArgs.push("--ingredients", String(body.ingredients || "auto"));
      runArgs.push("--ingredients-scenes", String(body.ingredientScenes || defaultIngredientScenes));
    } else {
      runArgs.push("--no-ingredients");
    }
    if (body.useAvatar !== false) {
      runArgs.push("--avatar", String(body.avatar || defaultAvatar));
    }
    if (body.useAvatar !== false && normalized.avatarScenes) {
      runArgs.push("--avatar-scenes", String(normalized.avatarScenes));
    }
    if (profiles.length) {
      runArgs.push("--vids-profiles", profiles.join(","));
    }
    if (body.reuseUrlOnFallback) {
      runArgs.push("--reuse-url-on-fallback");
    }
    if (body.noLocalFallback) {
      runArgs.push("--no-local-fallback");
    }
  }
  if (body.noCapture) {
    runArgs.push("--no-capture");
  }

  return runArgs;
}

async function startRun(body, options = {}) {
  const normalized = normalizeRunBody(body);
  const id = options.id || timestampSlug();
  const outputDir = options.outputDir || path.resolve(projectRoot, "outputs", "runs", `ui-one-video-${id}`);
  const runArgs = runArgsFromBody(normalized, outputDir);
  const run = {
    id,
    kind: "video",
    status: "running",
    command: process.execPath,
    args: runArgs,
    body: normalized,
    queueId: options.queueId || "",
    queueItemId: options.queueItemId || "",
    outputDir,
    startedAt: new Date().toISOString(),
    endedAt: null,
    exitCode: null,
    signal: null,
    report: null,
    logs: [],
    clients: new Set(),
    callbacks: options.onFinish ? new Set([options.onFinish]) : new Set(),
    child: null
  };

  runs.set(id, run);
  const child = spawn(process.execPath, runArgs, {
    cwd: projectRoot,
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"]
  });
  run.child = child;

  addLog(run, "system", `${process.execPath} ${runArgs.join(" ")}\n`);
  child.stdout.on("data", (chunk) => addLog(run, "stdout", chunk.toString()));
  child.stderr.on("data", (chunk) => addLog(run, "stderr", chunk.toString()));
  child.on("error", (error) => {
    addLog(run, "stderr", `${error.message}\n`);
    finishRun(run, "failed", 1, null);
  });
  child.on("close", (code, signal) => {
    finishRun(run, code === 0 ? "complete" : "failed", code, signal);
  });

  return run;
}

async function startProfileLogin(body) {
  const id = `login-${timestampSlug()}`;
  const profile = normalizeProfilePath(body.profile || "work/google-vids-profile-2");
  const waitMs = Number(body.waitMs || 600000);
  const outputDir = path.resolve(projectRoot, "outputs", "runs", `ui-${id}`);
  await ensureDir(path.resolve(projectRoot, profile));
  await updateUiState((state) => {
    const existing = new Set((state.profiles || []).map((item) => normalizeProfilePath(item.path || item)));
    if (!existing.has(profile)) {
      state.profiles.push({
        path: profile,
        createdAt: new Date().toISOString()
      });
    }
  });
  const runArgs = [
    "src/google-vids-login.mjs",
    "--profile", profile,
    "--wait-ms", String(Number.isFinite(waitMs) ? waitMs : 600000)
  ];
  const run = {
    id,
    kind: "login",
    status: "running",
    command: process.execPath,
    args: runArgs,
    body: { profile },
    queueId: "",
    queueItemId: "",
    outputDir,
    startedAt: new Date().toISOString(),
    endedAt: null,
    exitCode: null,
    signal: null,
    report: null,
    logs: [],
    clients: new Set(),
    callbacks: new Set(),
    child: null
  };

  runs.set(id, run);
  const child = spawn(process.execPath, runArgs, {
    cwd: projectRoot,
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"]
  });
  run.child = child;

  addLog(run, "system", `${process.execPath} ${runArgs.join(" ")}\n`);
  child.stdout.on("data", (chunk) => addLog(run, "stdout", chunk.toString()));
  child.stderr.on("data", (chunk) => addLog(run, "stderr", chunk.toString()));
  child.on("error", (error) => {
    addLog(run, "stderr", `${error.message}\n`);
    finishRun(run, "failed", 1, null);
  });
  child.on("close", (code, signal) => {
    finishRun(run, code === 0 ? "complete" : "failed", code, signal);
  });

  return run;
}

async function stopRun(id) {
  const run = runs.get(id);
  if (!run) {
    return null;
  }
  if (run.child && run.status === "running") {
    run.child.kill("SIGTERM");
    addLog(run, "system", "Stop requested.\n");
  }
  return run;
}

function parseRowSelection(value) {
  if (Array.isArray(value)) {
    return value.map((item) => Number(item)).filter(Number.isFinite);
  }
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
    .filter((row, index, rows) => Number.isFinite(row) && rows.indexOf(row) === index);
}

async function rowsForQueue(body) {
  const input = String(body.input || defaultInput).trim();
  const tools = await listTools(input);
  const availableRows = new Set(tools.map((tool) => tool.row));
  const explicitRows = parseRowSelection(body.rows);
  if (explicitRows.length) {
    return explicitRows.filter((row) => availableRows.has(row)).slice(0, 50);
  }

  const startRow = asFiniteNumber(body.startRow || body.row, 2);
  const limit = clamp(asFiniteNumber(body.queueLimit || body.limit, 1), 1, 50);
  return tools
    .filter((tool) => tool.row >= startRow)
    .slice(0, limit)
    .map((tool) => tool.row);
}

function runSummary(run) {
  const report = run.report || {};
  return {
    runId: run.id,
    status: run.status,
    mode: run.body?.mode || report.mode || "",
    outputDir: run.outputDir,
    mp4Path: report.mp4Path || "",
    vidsSceneClipMode: Boolean(report.vidsSceneClipMode),
    vidsSceneClips: report.vidsSceneClips || [],
    vidsSceneUrls: report.vidsSceneUrls || [],
    driveSyncStatus: report.driveSyncStatus || "",
    driveSyncError: report.driveSyncError || "",
    driveFolderPath: report.driveFolderPath || "",
    driveVideoPath: report.driveVideoPath || "",
    driveManifestPath: report.driveManifestPath || "",
    vidsUrl: report.vidsUrl || "",
    vidsClipCacheFolder: report.vidsClipCacheFolder || "",
    freeVideoProviderPackFolder: report.freeVideoProviderPackFolder || "",
    freeVideoProviderPrompts: report.freeVideoProviderPrompts || "",
    cachedVidsClips: report.cachedVidsClips || [],
    generatedFolder: report.generatedFolder || "",
    generatedFiles: report.generatedFiles || [],
    preparedWorkbook: report.preparedWorkbook || "",
    sourceWorkbookUpdate: report.sourceWorkbookUpdate || null,
    toolName: report.selectedRow?.tool_name || "",
    error: report.error || report.googleVidsError || "",
    quotaHit: quotaHitFromReport(report),
    startedAt: run.startedAt,
    endedAt: run.endedAt
  };
}

const queueStepTemplates = [
  { key: "assets", label: "Assets" },
  { key: "script", label: "Script" },
  { key: "avatar", label: "Avatar" },
  { key: "voiceover", label: "Voiceover" },
  { key: "render", label: "Render" },
  { key: "save", label: "Save" }
];

const queueStepMatchers = [
  ["save", /\b(saved|complete|completed|final|mp4|workbook|drive|quality report)\b/i],
  ["render", /\b(render|remotion|ffmpeg|merge|merged|caption|subtitles|final reel|local reel)\b/i],
  ["voiceover", /\b(voiceover|voice over|tts|audio|edge-tts|elevenlabs|openai tts|transcrib)\b/i],
  ["avatar", /\b(avatar|google vids|vids|hook video|cta video|scene clip|character)\b/i],
  ["script", /\b(script|scene plan|reel script|caption|hashtag|hook|body|cta)\b/i],
  ["assets", /\b(asset|capture|screenshot|screen record|screen-record|website|browser|playwright|tool url|ui footage)\b/i]
];

function latestRunLog(run) {
  const logs = Array.isArray(run?.logs) ? run.logs : [];
  return [...logs].reverse().find((entry) => String(entry?.text || "").trim()) || null;
}

function inferQueueActiveStep(run) {
  const logs = Array.isArray(run?.logs) ? run.logs.slice(-80) : [];
  for (const entry of [...logs].reverse()) {
    const text = String(entry?.text || "");
    for (const [key, matcher] of queueStepMatchers) {
      if (matcher.test(text)) {
        return { key, detail: text.trim().slice(0, 260) };
      }
    }
  }
  if (run?.status === "running") {
    return { key: "assets", detail: "Run started, preparing tool assets." };
  }
  return { key: "save", detail: "" };
}

function queueItemSteps(item) {
  const status = item?.status || "pending";
  const run = item?.runId ? runs.get(item.runId) : null;
  const report = item?.report || {};

  if (status === "complete") {
    return queueStepTemplates.map((step) => ({
      ...step,
      status: "complete",
      detail: step.key === "save" ? (report.mp4Path || report.outputDir || "Completed") : ""
    }));
  }

  if (["failed", "paused", "canceled"].includes(status)) {
    const active = run ? inferQueueActiveStep(run).key : "save";
    const activeIndex = queueStepTemplates.findIndex((step) => step.key === active);
    return queueStepTemplates.map((step, index) => ({
      ...step,
      status: index < activeIndex ? "complete" : index === activeIndex ? status : "pending",
      detail: index === activeIndex ? (report.error || report.driveSyncError || item?.error || "") : ""
    }));
  }

  if (status !== "running" || !run) {
    const stepStatus = status === "paused" ? "paused" : "pending";
    return queueStepTemplates.map((step) => ({ ...step, status: stepStatus, detail: "" }));
  }

  const active = inferQueueActiveStep(run);
  const activeIndex = Math.max(0, queueStepTemplates.findIndex((step) => step.key === active.key));
  return queueStepTemplates.map((step, index) => ({
    ...step,
    status: index < activeIndex ? "complete" : index === activeIndex ? "running" : "pending",
    detail: index === activeIndex ? active.detail : ""
  }));
}

function addQueueOutput(outputs, label, value, kind = "folder") {
  const text = String(value || "").trim();
  if (!text) return;
  if (/^https?:\/\//i.test(text)) {
    outputs.push({ label, url: text, kind: "url" });
    return;
  }
  outputs.push({ label, path: text, kind });
}

function queueItemOutputs(item) {
  const report = item?.report || {};
  const run = item?.runId ? runs.get(item.runId) : null;
  const outputs = [];
  addQueueOutput(outputs, "Final MP4", report.mp4Path, "video");
  addQueueOutput(outputs, "Run Folder", report.outputDir || run?.outputDir, "folder");
  addQueueOutput(outputs, "Google Vids", report.vidsUrl, "url");
  addQueueOutput(outputs, "Vids Cache", report.vidsClipCacheFolder, "folder");
  addQueueOutput(outputs, "Generated", report.generatedFolder, "folder");
  addQueueOutput(outputs, "Drive Video", report.driveVideoPath, "video");
  addQueueOutput(outputs, "Drive Folder", report.driveFolderPath, "folder");
  addQueueOutput(outputs, "Workbook", report.preparedWorkbook, "file");
  addQueueOutput(outputs, "Provider Pack", report.freeVideoProviderPackFolder, "folder");
  return outputs;
}

function publicQueueItem(item) {
  const run = item?.runId ? runs.get(item.runId) : null;
  const latestLog = latestRunLog(run);
  const steps = queueItemSteps(item);
  return {
    ...item,
    steps,
    activeStep: steps.find((step) => step.status === "running") || null,
    outputs: queueItemOutputs(item),
    latestLog: latestLog
      ? {
          at: latestLog.at || "",
          stream: latestLog.stream || "",
          text: String(latestLog.text || "").trim().slice(0, 320)
        }
      : null
  };
}

function normalizeProgressHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

function tableWithoutQueueProgressColumns(table) {
  const progressHeaderSet = new Set(queueProgressHeaders.map(normalizeProgressHeader));
  const keepIndexes = table.headers
    .map((header, index) => ({ header, index }))
    .filter((item) => !progressHeaderSet.has(normalizeProgressHeader(item.header)));

  return {
    headers: keepIndexes.map((item) => item.header),
    dataRows: table.dataRows.map((row) => keepIndexes.map((item) => row[item.index] ?? ""))
  };
}

function queueProgressValues(item) {
  if (!item) {
    return queueProgressHeaders.map(() => "");
  }

  const report = item.report || {};
  return [
    item.status || "",
    item.runId || "",
    report.toolName || "",
    report.mp4Path ? fileHyperlink(report.mp4Path, "Open video") : "",
    report.mp4Path || "",
    report.driveVideoPath ? fileHyperlink(report.driveVideoPath, "Open Drive video") : "",
    report.driveVideoPath || "",
    report.driveFolderPath ? folderHyperlink(report.driveFolderPath, "Open Drive folder") : "",
    report.driveFolderPath || "",
    report.generatedFolder ? folderHyperlink(report.generatedFolder, "Open generated") : "",
    report.generatedFolder || "",
    report.vidsClipCacheFolder ? folderHyperlink(report.vidsClipCacheFolder, "Open cache") : "",
    report.vidsClipCacheFolder || "",
    report.freeVideoProviderPackFolder ? folderHyperlink(report.freeVideoProviderPackFolder, "Open providers") : "",
    report.freeVideoProviderPackFolder || "",
    report.vidsUrl ? hyperlinkFormula(report.vidsUrl, "Open Google Vids") : "",
    report.vidsUrl || "",
    report.vidsPrimaryProfile || report.vidsConfiguredProfiles?.[0] || "",
    Array.isArray(report.vidsFallbackProfiles)
      ? report.vidsFallbackProfiles.join("\n")
      : report.vidsFallbackProfiles || "",
    report.vidsProfile || "",
    Array.isArray(report.vidsProfilesTried)
      ? report.vidsProfilesTried.join("\n")
      : report.vidsProfilesTried || "",
    report.preparedWorkbook ? fileHyperlink(report.preparedWorkbook, "Open workbook") : "",
    report.outputDir ? folderHyperlink(report.outputDir, "Open run") : "",
    report.error || report.driveSyncError || "",
    item.endedAt || item.startedAt || ""
  ];
}

async function writeQueueProgressWorkbook(queue) {
  if (!queue?.progressWorkbook) {
    return "";
  }

  const table = tableWithoutQueueProgressColumns(await readWorkbookTable(queue.input));
  const itemByRow = new Map(queue.items.map((item) => [item.row, item]));
  const rows = [
    [...table.headers, ...queueProgressHeaders],
    ...table.dataRows.map((row, index) => {
      const sourceRow = index + 2;
      return [...row, ...queueProgressValues(itemByRow.get(sourceRow))];
    })
  ];

  await writeSimpleXlsx(queue.progressWorkbook, rows, "Queue Progress");
  return queue.progressWorkbook;
}

async function recordQueueProgress(queue) {
  try {
    await writeQueueProgressWorkbook(queue);
    queue.progressWorkbookError = "";
  } catch (error) {
    queue.progressWorkbookError = error.message;
    queue.note = queue.note || `Progress workbook update failed: ${error.message}`;
  }
}

function publicQueue(queue) {
  const counts = queue.items.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {});
  return {
    id: queue.id,
    status: queue.status,
    input: queue.input,
    options: queue.options,
    progressWorkbook: queue.progressWorkbook || "",
    progressWorkbookError: queue.progressWorkbookError || "",
    startedAt: queue.startedAt,
    endedAt: queue.endedAt,
    activeRunId: queue.activeRunId,
    note: queue.note || "",
    total: queue.items.length,
    counts,
    quotaEstimate: quotaEstimateFor(queue.options, queue.items.length),
    items: queue.items.map(publicQueueItem)
  };
}

function finishQueueIfDone(queue) {
  if (queue.items.some((item) => item.status === "running" || item.status === "pending")) {
    return false;
  }
  queue.status = queue.items.some((item) => item.status === "failed") ? "complete_with_failures" : "complete";
  queue.endedAt = new Date().toISOString();
  queue.activeRunId = "";
  return true;
}

async function pumpQueue(queue) {
  if (!queue || queue.status === "canceled" || queue.status === "complete" || queue.status === "complete_with_failures") {
    return;
  }
  if (queue.stopRequested) {
    queue.status = "canceled";
    queue.endedAt = new Date().toISOString();
    queue.activeRunId = "";
    for (const item of queue.items) {
      if (item.status === "pending") {
        item.status = "canceled";
      }
    }
    await recordQueueProgress(queue);
    return;
  }
  if (queue.activeRunId) {
    return;
  }
  if (finishQueueIfDone(queue)) {
    await recordQueueProgress(queue);
    return;
  }

  const next = queue.items.find((item) => item.status === "pending");
  if (!next) {
    finishQueueIfDone(queue);
    await recordQueueProgress(queue);
    return;
  }

  queue.status = "running";
  next.status = "running";
  next.startedAt = new Date().toISOString();
  const runBody = {
    ...queue.options,
    input: queue.input,
    row: next.row
  };
  const runId = `${queue.id}-row-${next.row}-${timestampSlug()}`;
  const run = await startRun(runBody, {
    id: runId,
    outputDir: path.resolve(projectRoot, "outputs", "runs", runId),
    queueId: queue.id,
    queueItemId: next.id,
    onFinish: async (finishedRun) => {
      next.status = finishedRun.status;
      next.endedAt = finishedRun.endedAt;
      next.runId = finishedRun.id;
      next.report = runSummary(finishedRun);
      queue.activeRunId = "";

      if (next.report.quotaHit && queue.options.mode !== "local" && queue.options.mode !== "prep") {
        queue.status = "paused_quota";
        queue.note = "Google Vids quota/limit hit. Pending rows were paused so quota is not wasted.";
        queue.endedAt = new Date().toISOString();
        for (const item of queue.items) {
          if (item.status === "pending") {
            item.status = "paused";
          }
        }
        await recordQueueProgress(queue);
        return;
      }

      await recordQueueProgress(queue);
      await pumpQueue(queue);
    }
  });
  next.runId = run.id;
  queue.activeRunId = run.id;
  await recordQueueProgress(queue);
}

async function startQueue(body) {
  const rows = await rowsForQueue(body);
  if (!rows.length) {
    throw new Error("No matching Excel rows found for this queue.");
  }
  const options = normalizeRunBody(body);
  const id = `queue-${timestampSlug()}`;
  const progressWorkbook = path.resolve(projectRoot, "outputs", "runs", id, "queue-progress.xlsx");
  const queue = {
    id,
    status: "queued",
    input: options.input,
    options,
    progressWorkbook,
    progressWorkbookError: "",
    startedAt: new Date().toISOString(),
    endedAt: null,
    activeRunId: "",
    stopRequested: false,
    note: "",
    items: rows.map((row, index) => ({
      id: `${id}-item-${index + 1}`,
      row,
      status: "pending",
      runId: "",
      report: null,
      startedAt: "",
      endedAt: ""
    }))
  };
  queues.set(id, queue);
  await recordQueueProgress(queue);
  setTimeout(() => {
    pumpQueue(queue).catch((error) => {
      queue.status = "failed";
      queue.note = error.message;
      queue.endedAt = new Date().toISOString();
      recordQueueProgress(queue).catch(() => {});
    });
  }, 0);
  return queue;
}

async function stopQueue(id) {
  const queue = queues.get(id);
  if (!queue) {
    return null;
  }
  queue.stopRequested = true;
  if (queue.activeRunId) {
    await stopRun(queue.activeRunId);
    queue.status = "canceling";
  } else {
    queue.status = "canceled";
    queue.endedAt = new Date().toISOString();
    for (const item of queue.items) {
      if (item.status === "pending") {
        item.status = "canceled";
      }
    }
  }
  await recordQueueProgress(queue);
  return queue;
}

async function openPath(body) {
  const target = path.resolve(String(body.path || ""));
  if (!target || !allowedOutputPath(target)) {
    throw new Error("Only project output files/folders can be opened.");
  }
  await fs.access(target);
  const opener =
    process.platform === "win32"
      ? spawn("cmd.exe", ["/c", "start", "", target], {
          cwd: projectRoot,
          stdio: "ignore",
          detached: true,
          windowsHide: true
        })
      : process.platform === "darwin"
        ? spawn("open", [target], {
            cwd: projectRoot,
            stdio: "ignore",
            detached: true
          })
        : spawn("xdg-open", [target], {
            cwd: projectRoot,
            stdio: "ignore",
            detached: true
          });
  opener.unref();
  return { ok: true, path: target };
}

function runTrackerExport() {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(projectRoot, "src", "export-work-tracker.mjs")], {
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
      if (code === 0) {
        resolve({ stdout: stdout.trim(), stderr: stderr.trim() });
        return;
      }
      reject(new Error(stderr.trim() || stdout.trim() || `Tracker export failed with exit code ${code}.`));
    });
  });
}

async function openWorkTracker() {
  return openPath({ path: await ensureWorkTracker() });
}

async function ensureWorkTracker() {
  try {
    await fs.access(trackerWorkbookPath);
  } catch {
    await runTrackerExport();
  }
  return trackerWorkbookPath;
}

async function downloadWorkTracker(res) {
  const target = await ensureWorkTracker();
  const stat = await fs.stat(target);
  res.writeHead(200, {
    "content-type": mimeType(target),
    "content-disposition": `attachment; filename="${path.basename(target)}"`,
    "cache-control": "no-store",
    "content-length": stat.size
  });
  fsSync.createReadStream(target).pipe(res);
}

async function serveFile(req, res, searchParams) {
  const target = path.resolve(String(searchParams.get("path") || ""));
  if (!allowedOutputPath(target)) {
    json(res, 403, { ok: false, error: "Forbidden." });
    return;
  }
  try {
    const stat = await fs.stat(target);
    if (!stat.isFile()) {
      json(res, 400, { ok: false, error: "Path is not a file." });
      return;
    }
    const range = req.headers.range;
    if (range) {
      const match = range.match(/bytes=(\d+)-(\d*)/);
      if (match) {
        const start = Number(match[1]);
        const end = match[2] ? Number(match[2]) : stat.size - 1;
        if (start < stat.size && end < stat.size && start <= end) {
          res.writeHead(206, {
            "content-type": mimeType(target),
            "content-range": `bytes ${start}-${end}/${stat.size}`,
            "accept-ranges": "bytes",
            "content-length": end - start + 1
          });
          fsSync.createReadStream(target, { start, end }).pipe(res);
          return;
        }
      }
    }
    res.writeHead(200, {
      "content-type": mimeType(target),
      "accept-ranges": "bytes",
      "content-length": stat.size
    });
    fsSync.createReadStream(target).pipe(res);
  } catch (error) {
    json(res, 404, safeError(error));
  }
}

async function publicQuotaState() {
  const state = await loadUiState();
  const profiles = await listProfiles();
  return {
    profiles: profiles.map((profile) => publicProfileWithQuota(profile, state)),
    raw: state.quotas
  };
}

function publicProfileWithQuota(profile, state) {
  const quota = profileQuota(state, profile.path);
  const limitUsed = quota.quotaExhausted || quota.limitStatus === "limit_used";
  const status = limitUsed
    ? "limit_used"
    : !profile.exists
      ? "missing"
      : profile.loggedIn
        ? "available"
        : "login_needed";
  const statusLabel = status === "limit_used"
    ? "Limit used"
    : status === "available"
      ? "Available"
      : status === "missing"
        ? "Folder missing"
        : "Login needed";
  return {
    ...profile,
    status,
    statusLabel,
    quota
  };
}

async function saveQuotaState(body) {
  const profile = String(body.profile || "").trim();
  if (!profile) {
    throw new Error("Profile path is required.");
  }
  const saved = await updateUiState((state) => {
    const current = profileQuota(state, profile);
    const aiVideoMonthlyLimit = clamp(asFiniteNumber(body.aiVideoMonthlyLimit, current.aiVideoMonthlyLimit), 0, 5000);
    const avatarMonthlyLimit = clamp(asFiniteNumber(body.avatarMonthlyLimit, current.avatarMonthlyLimit), 0, 5000);
    const aiVideoUsed = clamp(asFiniteNumber(body.aiVideoUsed, current.aiVideoUsed), 0, 5000);
    const avatarUsed = clamp(asFiniteNumber(body.avatarUsed, current.avatarUsed), 0, 5000);
    const manuallyExhausted = Boolean(body.quotaExhausted);
    const countExhausted = (aiVideoMonthlyLimit > 0 && aiVideoUsed >= aiVideoMonthlyLimit) ||
      (avatarMonthlyLimit > 0 && avatarUsed >= avatarMonthlyLimit);
    const quotaExhausted = manuallyExhausted || countExhausted;
    const now = new Date().toISOString();
    state.quotas[profile] = {
      ...current,
      plan: String(body.plan || current.plan || defaultQuotaTemplate.plan),
      aiVideoMonthlyLimit,
      avatarMonthlyLimit,
      aiVideoUsed,
      avatarUsed,
      quotaExhausted,
      quotaExhaustedAt: quotaExhausted
        ? String(body.quotaExhaustedAt || current.quotaExhaustedAt || now)
        : "",
      limitStatus: quotaExhausted ? "limit_used" : "",
      resetNote: String(body.resetNote || current.resetNote || defaultQuotaTemplate.resetNote),
      quotaNote: quotaExhausted ? String(body.quotaNote || current.quotaNote || "") : String(body.quotaNote || ""),
      lastQuotaHitAt: quotaExhausted ? String(body.lastQuotaHitAt || current.lastQuotaHitAt || "") : "",
      updatedAt: now
    };
    return state.quotas[profile];
  });
  return saved;
}

async function saveSettingsState(body) {
  const allowed = [
    "inputPath",
    "row",
    "basicWorkflowMode",
    "hookAvatarStyle",
    "hookAvatarCharacter",
    "hookVideoSize",
    "avatarHostImage",
    "hookPrimaryProfile",
    "hookFallbackProfile",
    "hookFallbackEnabled",
    "scriptVideoPrimaryProfile",
    "scriptVideoFallbackProfile",
    "scriptVideoFallbackEnabled",
    "scriptVideoSize",
    "globalPrimaryProfile",
    "globalFallbackProfile",
    "globalFallbackEnabled",
    "sceneCount",
    "driveSyncDir",
    "updateSourceWorkbook",
    "featureTab",
    "workspaceTab"
  ];
  const saved = await updateUiState((state) => {
    const current = state.settings && typeof state.settings === "object" ? state.settings : {};
    const next = { ...current };
    for (const key of allowed) {
      if (!(key in body)) {
        continue;
      }
      if (key === "row") {
        next.row = clamp(asFiniteNumber(body.row, current.row || 2), 2, 100000);
      } else if (key === "sceneCount") {
        next.sceneCount = clamp(asFiniteNumber(body.sceneCount, current.sceneCount || 6), 3, 6);
      } else if (key === "updateSourceWorkbook") {
        next.updateSourceWorkbook = Boolean(body.updateSourceWorkbook);
      } else if (["hookFallbackEnabled", "scriptVideoFallbackEnabled", "globalFallbackEnabled"].includes(key)) {
        next[key] = Boolean(body[key]);
      } else if (key === "basicWorkflowMode") {
        const mode = String(body.basicWorkflowMode || "").trim();
        next.basicWorkflowMode = ["google-hook", "local", "prep", "free-providers"].includes(mode) ? mode : (current.basicWorkflowMode || "google-hook");
      } else if (key === "hookAvatarStyle") {
        const style = String(body.hookAvatarStyle || "").trim();
        next.hookAvatarStyle = ["female", "male", "auto"].includes(style) ? style : (current.hookAvatarStyle || defaultHookAvatarStyle);
      } else if (key === "hookAvatarCharacter") {
        const character = String(body.hookAvatarCharacter || "").trim();
        next.hookAvatarCharacter = character || (current.hookAvatarCharacter || "auto_by_reel");
      } else if (["hookVideoSize", "scriptVideoSize"].includes(key)) {
        next[key] = normalizeVidsVideoSize(body[key] || current[key] || "portrait");
      } else if (key === "featureTab") {
        next.featureTab = body.featureTab === "advanced" ? "advanced" : "basic";
      } else if (key === "workspaceTab") {
        const workspaceTab = String(body.workspaceTab || "").trim();
        next.workspaceTab = ["tool-promo", "script-video", "profiles"].includes(workspaceTab) ? workspaceTab : (current.workspaceTab || "tool-promo");
      } else {
        next[key] = String(body[key] || "").trim().slice(0, 2000);
      }
    }
    next.updatedAt = new Date().toISOString();
    state.settings = next;
    return next;
  });
  return saved;
}

async function handleApi(req, res, pathname, searchParams) {
  try {
    if (req.method === "GET" && pathname === "/api/defaults") {
      const uiState = await loadUiState();
      const quota = await publicQuotaState();
      const savedSettings = uiState.settings || {};
      const savedInput = savedSettings.inputPath || defaultInput;
      json(res, 200, {
        ok: true,
        input: savedInput,
        defaultInput,
        settings: {
          ...savedSettings,
          inputPath: savedInput,
          row: savedSettings.row || 2,
          basicWorkflowMode: savedSettings.basicWorkflowMode || "google-hook",
          hookAvatarStyle: savedSettings.hookAvatarStyle || defaultHookAvatarStyle,
          hookAvatarCharacter: savedSettings.hookAvatarCharacter || "auto_by_reel",
          hookVideoSize: normalizeVidsVideoSize(savedSettings.hookVideoSize || "portrait"),
          avatarHostImage: savedSettings.avatarHostImage || "",
          hookPrimaryProfile: savedSettings.hookPrimaryProfile || savedSettings.globalPrimaryProfile || defaultProfiles[0] || "",
          hookFallbackProfile: savedSettings.hookFallbackProfile || savedSettings.globalFallbackProfile || defaultProfiles[1] || "",
          hookFallbackEnabled: typeof savedSettings.hookFallbackEnabled === "boolean" ? savedSettings.hookFallbackEnabled : true,
          scriptVideoPrimaryProfile: savedSettings.scriptVideoPrimaryProfile || savedSettings.hookPrimaryProfile || savedSettings.globalPrimaryProfile || defaultProfiles[0] || "",
          scriptVideoFallbackProfile: savedSettings.scriptVideoFallbackProfile || savedSettings.hookFallbackProfile || savedSettings.globalFallbackProfile || defaultProfiles[1] || "",
          scriptVideoFallbackEnabled: typeof savedSettings.scriptVideoFallbackEnabled === "boolean"
            ? savedSettings.scriptVideoFallbackEnabled
            : (typeof savedSettings.hookFallbackEnabled === "boolean" ? savedSettings.hookFallbackEnabled : true),
          scriptVideoSize: normalizeVidsVideoSize(savedSettings.scriptVideoSize || savedSettings.hookVideoSize || "portrait"),
          sceneCount: savedSettings.sceneCount || 6,
          featureTab: savedSettings.featureTab || "basic",
          workspaceTab: savedSettings.workspaceTab || "tool-promo"
        },
        profiles: quota.profiles,
        quota,
        googleVids: {
          defaultAvatar,
          defaultAvatarScenes,
          defaultIngredientScenes,
          avatarOptions
        },
        freeVideoProviders: {
          defaultProviders: defaultFreeVideoProviders,
          options: availableFreeVideoProviders
        },
        ai: {
          defaultEnabled: Boolean(appConfig.ai?.enabled),
          defaultProvider: defaultAiProvider,
          defaultModel: defaultAiModel,
          defaultGeminiModel,
          hasOpenAiKey: Boolean(process.env.OPENAI_API_KEY),
          hasGeminiKey: Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY)
        },
        voiceover: {
          defaultProvider: defaultVoiceoverProvider,
          openaiModel: defaultOpenAiTtsModel,
          openaiVoice: defaultOpenAiTtsVoice,
          elevenLabsModel: defaultElevenLabsModel,
          edgeVoice: defaultEdgeTtsVoice,
          edgeRate: defaultEdgeTtsRate,
          hookAvatarStyle: defaultHookAvatarStyle,
          hasOpenAiKey: Boolean(process.env.OPENAI_API_KEY),
          hasElevenLabsKey: Boolean(process.env.ELEVENLABS_API_KEY)
        },
        avatarGeneration: {
          defaultProvider: defaultAvatarGenerationProvider,
          providers: defaultAvatarGenerationProviders,
          referenceImages: defaultAvatarReferenceImages,
          scenes: appConfig.avatarGeneration?.scenes || defaultAvatarScenes,
          heygenVoiceId: defaultHeygenVoiceId,
          hasHeyGenKey: Boolean(process.env.HEYGEN_API_KEY),
          hasHeyGenVoiceId: Boolean(process.env.HEYGEN_VOICE_ID || defaultHeygenVoiceId)
        },
        driveSync: {
          rootDir: process.env.TRF_DRIVE_SYNC_DIR || appConfig.driveSync?.rootDir || ""
        }
      });
      return;
    }

    if (req.method === "GET" && pathname === "/api/history") {
      const state = await loadUiState();
      const limit = clamp(asFiniteNumber(searchParams.get("limit"), 25), 1, 200);
      json(res, 200, { ok: true, history: state.history.slice(0, limit) });
      return;
    }

    if (req.method === "GET" && pathname === "/api/quota") {
      json(res, 200, { ok: true, quota: await publicQuotaState() });
      return;
    }

    if (req.method === "GET" && pathname === "/api/settings") {
      const state = await loadUiState();
      json(res, 200, { ok: true, settings: state.settings || {} });
      return;
    }

    if (req.method === "POST" && pathname === "/api/settings") {
      const settings = await saveSettingsState(await readBody(req));
      json(res, 200, { ok: true, settings });
      return;
    }

    if (req.method === "POST" && pathname === "/api/quota") {
      const saved = await saveQuotaState(await readBody(req));
      json(res, 200, { ok: true, quota: saved });
      return;
    }

    if (req.method === "GET" && pathname === "/api/profiles") {
      const quota = await publicQuotaState();
      json(res, 200, { ok: true, profiles: quota.profiles });
      return;
    }

    if (req.method === "POST" && pathname === "/api/profiles") {
      const added = await addProfile(await readBody(req));
      const state = await loadUiState();
      const profiles = added.profiles.map((profile) => publicProfileWithQuota(profile, state));
      json(res, 201, { ok: true, profile: profiles.find((item) => item.path === added.profile.path), profiles });
      return;
    }

    if (req.method === "POST" && pathname === "/api/profiles/remove") {
      const removed = await removeProfile(await readBody(req));
      const state = await loadUiState();
      const profiles = removed.profiles.map((profile) => publicProfileWithQuota(profile, state));
      json(res, 200, { ok: true, profile: removed.profile, deletedFolder: removed.deletedFolder, profiles });
      return;
    }

    if (req.method === "POST" && pathname === "/api/profiles/rename") {
      const renamed = await renameProfile(await readBody(req));
      const state = await loadUiState();
      const profiles = renamed.profiles.map((profile) => publicProfileWithQuota(profile, state));
      json(res, 200, { ok: true, fromProfile: renamed.fromProfile, profile: renamed.profile, renamed: renamed.renamed, profiles });
      return;
    }

    if (req.method === "GET" && pathname === "/api/tools") {
      json(res, 200, {
        ok: true,
        tools: await listTools(searchParams.get("input") || defaultInput, {
          limit: asFiniteNumber(searchParams.get("limit"), 0)
        })
      });
      return;
    }

    if (req.method === "GET" && pathname === "/api/tool-ideas") {
      const ideas = await listToolIdeas(searchParams.get("input") || defaultInput);
      json(res, 200, { ok: true, ...ideas });
      return;
    }

    if (req.method === "GET" && pathname === "/api/tool-artifacts") {
      json(res, 200, {
        ok: true,
        artifacts: await findToolArtifacts({
          input: searchParams.get("input") || defaultInput,
          row: searchParams.get("row") || 2,
          toolName: searchParams.get("toolName") || "",
          toolUrl: searchParams.get("toolUrl") || ""
        })
      });
      return;
    }

    if (req.method === "GET" && pathname === "/api/tool-video-status") {
      json(res, 200, {
        ok: true,
        ...(await listToolVideoStatus({
          input: searchParams.get("input") || defaultInput
        }))
      });
      return;
    }

    if (req.method === "GET" && pathname === "/api/input-analysis") {
      const includeToolOptions = ["1", "true", "names", "all"].includes(String(searchParams.get("includeTools") || "").toLowerCase());
      const analyzed = await analyzeInputWorkbookPackage(searchParams.get("input") || defaultInput, { includeToolOptions });
      json(res, 200, { ok: true, ...analyzed });
      return;
    }

    if (req.method === "POST" && pathname === "/api/input-upload") {
      const saveOnly = ["1", "true", "save-only"].includes(String(searchParams.get("saveOnly") || searchParams.get("mode") || "").toLowerCase());
      json(res, 201, { ok: true, upload: await saveUploadedInput(req, { analyze: !saveOnly }) });
      return;
    }

    if (req.method === "POST" && pathname === "/api/avatar-upload") {
      json(res, 201, { ok: true, upload: await saveUploadedAvatarReference(req) });
      return;
    }

    if (req.method === "POST" && pathname === "/api/assets/build") {
      json(res, 201, { ok: true, assetBuild: await buildToolAssets(await readBody(req)) });
      return;
    }

    if (req.method === "POST" && pathname === "/api/assets/build-run") {
      const run = await startAssetBuildRun(await readBody(req));
      json(res, 201, { ok: true, run: publicAssetRun(run) });
      return;
    }

    if (req.method === "GET" && pathname === "/api/assets/runs") {
      json(res, 200, {
        ok: true,
        runs: Array.from(assetRuns.values()).map(publicAssetRun).reverse()
      });
      return;
    }

    if (req.method === "POST" && pathname === "/api/scripts/generate") {
      json(res, 201, { ok: true, scriptBuild: await generateReelScript(await readBody(req)) });
      return;
    }

    if (req.method === "POST" && pathname === "/api/scripts/update") {
      json(res, 200, { ok: true, scriptBuild: await updateReelScript(await readBody(req)) });
      return;
    }

    if (req.method === "POST" && pathname === "/api/script-video/optimize") {
      json(res, 201, { ok: true, scriptVideo: await prepareCustomScriptVideo(await readBody(req)) });
      return;
    }

    if (req.method === "POST" && pathname === "/api/script-video/runs") {
      const run = await startCustomScriptVideoRun(await readBody(req));
      json(res, 201, { ok: true, run: publicScriptVideoRun(run) });
      return;
    }

    if (req.method === "GET" && pathname === "/api/script-video/runs") {
      json(res, 200, {
        ok: true,
        runs: Array.from(scriptVideoRuns.values()).map(publicScriptVideoRun).reverse()
      });
      return;
    }

    if (req.method === "POST" && pathname === "/api/hook-avatar/prepare") {
      json(res, 201, { ok: true, hookAvatar: await prepareHookAvatar(await readBody(req)) });
      return;
    }

    if (req.method === "POST" && pathname === "/api/hook-avatar/runs") {
      const run = await startHookAvatarRun(await readBody(req));
      json(res, 201, { ok: true, run: publicHookAvatarRun(run) });
      return;
    }

    if (req.method === "GET" && pathname === "/api/hook-avatar/runs") {
      json(res, 200, {
        ok: true,
        runs: Array.from(hookAvatarRuns.values()).map(publicHookAvatarRun).reverse()
      });
      return;
    }

    if (req.method === "POST" && pathname === "/api/final-reel/runs") {
      const run = await startFinalReelRun(await readBody(req));
      json(res, 201, { ok: true, run: publicFinalReelRun(run) });
      return;
    }

    if (req.method === "POST" && pathname === "/api/final-reel/remaining-vids/runs") {
      const run = await startRemainingVidsRun(await readBody(req));
      json(res, 201, { ok: true, run: publicFinalReelRun(run) });
      return;
    }

    if (req.method === "POST" && pathname === "/api/final-reel/vids-voiceover/runs") {
      const run = await startVidsVoiceoverRun(await readBody(req));
      json(res, 201, { ok: true, run: publicFinalReelRun(run) });
      return;
    }

    if (req.method === "GET" && pathname === "/api/final-reel/runs") {
      json(res, 200, {
        ok: true,
        runs: Array.from(finalReelRuns.values()).map(publicFinalReelRun).reverse()
      });
      return;
    }

    const assetRunMatch = pathname.match(/^\/api\/assets\/runs\/([^/]+)$/);
    if (req.method === "GET" && assetRunMatch) {
      const run = assetRuns.get(assetRunMatch[1]);
      if (!run) {
        json(res, 404, { ok: false, error: "Asset run not found." });
        return;
      }
      json(res, 200, { ok: true, run: publicAssetRun(run) });
      return;
    }

    const assetEventsMatch = pathname.match(/^\/api\/assets\/runs\/([^/]+)\/events$/);
    if (req.method === "GET" && assetEventsMatch) {
      const run = assetRuns.get(assetEventsMatch[1]);
      if (!run) {
        json(res, 404, { ok: false, error: "Asset run not found." });
        return;
      }
      res.writeHead(200, {
        "content-type": "text/event-stream",
        "cache-control": "no-cache",
        connection: "keep-alive"
      });
      run.clients.add(res);
      sendSse(res, "status", publicAssetRun(run));
      for (const entry of run.logs.slice(-300)) {
        sendSse(res, "log", entry);
      }
      req.on("close", () => run.clients.delete(res));
      return;
    }

    const hookAvatarRunMatch = pathname.match(/^\/api\/hook-avatar\/runs\/([^/]+)$/);
    if (req.method === "GET" && hookAvatarRunMatch) {
      const run = hookAvatarRuns.get(hookAvatarRunMatch[1]);
      if (!run) {
        json(res, 404, { ok: false, error: "Hook avatar run not found." });
        return;
      }
      json(res, 200, { ok: true, run: publicHookAvatarRun(run) });
      return;
    }

    const hookAvatarEventsMatch = pathname.match(/^\/api\/hook-avatar\/runs\/([^/]+)\/events$/);
    if (req.method === "GET" && hookAvatarEventsMatch) {
      const run = hookAvatarRuns.get(hookAvatarEventsMatch[1]);
      if (!run) {
        json(res, 404, { ok: false, error: "Hook avatar run not found." });
        return;
      }
      res.writeHead(200, {
        "content-type": "text/event-stream",
        "cache-control": "no-cache",
        connection: "keep-alive"
      });
      run.clients.add(res);
      sendSse(res, "status", publicHookAvatarRun(run));
      for (const entry of run.logs.slice(-300)) {
        sendSse(res, "log", entry);
      }
      req.on("close", () => run.clients.delete(res));
      return;
    }

    const scriptVideoRunMatch = pathname.match(/^\/api\/script-video\/runs\/([^/]+)$/);
    if (req.method === "GET" && scriptVideoRunMatch) {
      const run = scriptVideoRuns.get(scriptVideoRunMatch[1]);
      if (!run) {
        json(res, 404, { ok: false, error: "Script video run not found." });
        return;
      }
      json(res, 200, { ok: true, run: publicScriptVideoRun(run) });
      return;
    }

    const scriptVideoEventsMatch = pathname.match(/^\/api\/script-video\/runs\/([^/]+)\/events$/);
    if (req.method === "GET" && scriptVideoEventsMatch) {
      const run = scriptVideoRuns.get(scriptVideoEventsMatch[1]);
      if (!run) {
        json(res, 404, { ok: false, error: "Script video run not found." });
        return;
      }
      res.writeHead(200, {
        "content-type": "text/event-stream",
        "cache-control": "no-cache",
        connection: "keep-alive"
      });
      run.clients.add(res);
      sendSse(res, "status", publicScriptVideoRun(run));
      sendSse(res, "progress", { steps: run.steps || [], active: run.steps?.at(-1) || null });
      for (const entry of run.logs.slice(-300)) {
        sendSse(res, "log", entry);
      }
      req.on("close", () => run.clients.delete(res));
      return;
    }

    const finalReelRunMatch = pathname.match(/^\/api\/final-reel\/runs\/([^/]+)$/);
    if (req.method === "GET" && finalReelRunMatch) {
      const run = finalReelRuns.get(finalReelRunMatch[1]);
      if (!run) {
        json(res, 404, { ok: false, error: "Final reel run not found." });
        return;
      }
      json(res, 200, { ok: true, run: publicFinalReelRun(run) });
      return;
    }

    const finalReelEventsMatch = pathname.match(/^\/api\/final-reel\/runs\/([^/]+)\/events$/);
    if (req.method === "GET" && finalReelEventsMatch) {
      const run = finalReelRuns.get(finalReelEventsMatch[1]);
      if (!run) {
        json(res, 404, { ok: false, error: "Final reel run not found." });
        return;
      }
      res.writeHead(200, {
        "content-type": "text/event-stream",
        "cache-control": "no-cache",
        connection: "keep-alive"
      });
      run.clients.add(res);
      sendSse(res, "status", publicFinalReelRun(run));
      sendSse(res, "progress", { steps: run.steps || [], active: run.steps?.at(-1) || null });
      for (const entry of run.logs.slice(-300)) {
        sendSse(res, "log", entry);
      }
      req.on("close", () => run.clients.delete(res));
      return;
    }

    if (req.method === "GET" && pathname === "/api/docs") {
      json(res, 200, { ok: true, docs: await listDocs() });
      return;
    }

    if (req.method === "GET" && pathname === "/api/docs/read") {
      json(res, 200, { ok: true, doc: await readDoc(searchParams.get("path") || "README.md") });
      return;
    }

    if (req.method === "POST" && pathname === "/api/runs") {
      const body = await readBody(req);
      const run = await startRun(body);
      json(res, 201, { ok: true, run: publicRun(run) });
      return;
    }

    if (req.method === "GET" && pathname === "/api/queues") {
      json(res, 200, { ok: true, queues: Array.from(queues.values()).map(publicQueue).reverse() });
      return;
    }

    if (req.method === "POST" && pathname === "/api/queues") {
      const queue = await startQueue(await readBody(req));
      json(res, 201, { ok: true, queue: publicQueue(queue) });
      return;
    }

    const queueMatch = pathname.match(/^\/api\/queues\/([^/]+)$/);
    if (req.method === "GET" && queueMatch) {
      const queue = queues.get(queueMatch[1]);
      if (!queue) {
        json(res, 404, { ok: false, error: "Queue not found." });
        return;
      }
      json(res, 200, { ok: true, queue: publicQueue(queue) });
      return;
    }

    const stopQueueMatch = pathname.match(/^\/api\/queues\/([^/]+)\/stop$/);
    if (req.method === "POST" && stopQueueMatch) {
      const queue = await stopQueue(stopQueueMatch[1]);
      if (!queue) {
        json(res, 404, { ok: false, error: "Queue not found." });
        return;
      }
      json(res, 200, { ok: true, queue: publicQueue(queue) });
      return;
    }

    if (req.method === "POST" && pathname === "/api/profile-login") {
      const body = await readBody(req);
      const run = await startProfileLogin(body);
      json(res, 201, { ok: true, run: publicRun(run) });
      return;
    }

    const runMatch = pathname.match(/^\/api\/runs\/([^/]+)$/);
    if (req.method === "GET" && runMatch) {
      const run = runs.get(runMatch[1]);
      if (!run) {
        json(res, 404, { ok: false, error: "Run not found." });
        return;
      }
      await readRunReport(run);
      json(res, 200, { ok: true, run: publicRun(run) });
      return;
    }

    const eventsMatch = pathname.match(/^\/api\/runs\/([^/]+)\/events$/);
    if (req.method === "GET" && eventsMatch) {
      const run = runs.get(eventsMatch[1]);
      if (!run) {
        json(res, 404, { ok: false, error: "Run not found." });
        return;
      }
      res.writeHead(200, {
        "content-type": "text/event-stream",
        "cache-control": "no-cache",
        connection: "keep-alive"
      });
      run.clients.add(res);
      sendSse(res, "status", publicRun(run));
      for (const entry of run.logs.slice(-300)) {
        sendSse(res, "log", entry);
      }
      req.on("close", () => run.clients.delete(res));
      return;
    }

    const stopMatch = pathname.match(/^\/api\/runs\/([^/]+)\/stop$/);
    if (req.method === "POST" && stopMatch) {
      const run = await stopRun(stopMatch[1]);
      if (!run) {
        json(res, 404, { ok: false, error: "Run not found." });
        return;
      }
      json(res, 200, { ok: true, run: publicRun(run) });
      return;
    }

    if (req.method === "POST" && pathname === "/api/open") {
      json(res, 200, await openPath(await readBody(req)));
      return;
    }

    if (req.method === "POST" && pathname === "/api/work-tracker/open") {
      json(res, 200, await openWorkTracker());
      return;
    }

    if (req.method === "GET" && pathname === "/api/work-tracker/download") {
      await downloadWorkTracker(res);
      return;
    }

    if (req.method === "GET" && pathname === "/file") {
      await serveFile(req, res, searchParams);
      return;
    }

    json(res, 404, { ok: false, error: "API route not found." });
  } catch (error) {
    json(res, 500, safeError(error));
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  if (url.pathname.startsWith("/api/") || url.pathname === "/file") {
    await handleApi(req, res, url.pathname, url.searchParams);
    return;
  }
  await serveStatic(req, res, url.pathname);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`AI Reel Creator by Prathak UI running at http://127.0.0.1:${port}`);
});
