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

dotenv.config({ quiet: true });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const args = parseArgs(process.argv.slice(2));
const port = Number(args.port || process.env.TRF_UI_PORT || 4317);
const defaultInput = "/Users/palsahu/workplace/projects/n learn/Book1.xlsx";
const defaultProfiles = ["work/google-vids-profile", "work/google-vids-profile-2"];
const configPath = path.join(projectRoot, "config/default.json");
const appConfig = JSON.parse(fsSync.readFileSync(configPath, "utf8"));
const googleVidsConfig = appConfig.googleVids || {};
const defaultAvatar = googleVidsConfig.defaultAvatar || "auto";
const defaultAvatarScenes = googleVidsConfig.defaultAvatarScenes || "1,2,6";
const defaultIngredientScenes = googleVidsConfig.defaultIngredientScenes || "3,4,5";
const avatarOptions = Array.isArray(googleVidsConfig.avatarOptions) && googleVidsConfig.avatarOptions.length
  ? googleVidsConfig.avatarOptions
  : [{ label: "Auto Realistic", value: "auto" }];
const runs = new Map();
const queues = new Map();
const uiStatePath = path.join(projectRoot, "work", "ui-state.json");
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
  "README.md",
  "docs/master-automation-doc.md",
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
  "TRF Queue Google Vids",
  "TRF Queue Google Vids URL",
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

function sendSse(res, event, data) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function timestampSlug() {
  return new Date().toISOString().replace(/[:.]/g, "-");
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

function safeProfileName(value) {
  return String(value || "")
    .trim()
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function asFiniteNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clamp(number, min, max) {
  return Math.max(min, Math.min(max, number));
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

function normalizeRunBody(body = {}) {
  const mode = String(body.mode || "local").trim() || "local";
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

  if ((mode === "google" || mode === "dry") && normalized.useAvatar !== false && !String(normalized.avatarScenes || "").trim()) {
    normalized.avatarScenes = defaultAvatarScenes;
  }

  if ((mode === "google" || mode === "google-full" || mode === "dry") && !String(normalized.ingredientScenes || "").trim()) {
    normalized.ingredientScenes = defaultIngredientScenes;
  }

  return normalized;
}

function quotaEstimateFor(body, rowCount = 1) {
  const normalized = normalizeRunBody(body);
  const maxScenes = normalized.maxScenes;
  const generating = normalized.mode === "google" || normalized.mode === "google-full";
  if (!generating) {
    return {
      aiVideoClips: 0,
      avatarClips: 0,
      totalSceneJobs: 0,
      rowCount,
      note: normalized.mode === "dry" ? "Prompt fill only; no Vids generation submit." : "No Google Vids quota used."
    };
  }

  const avatarScenes = normalized.useAvatar === false
    ? []
    : parseSceneList(normalized.avatarScenes || defaultAvatarScenes, maxScenes);
  const avatarClips = avatarScenes.length * rowCount;
  const aiVideoClips = Math.max(0, maxScenes - avatarScenes.length) * rowCount;

  return {
    aiVideoClips,
    avatarClips,
    totalSceneJobs: maxScenes * rowCount,
    rowCount,
    note: "Estimate only. Failed generations can still consume Google quota."
  };
}

async function loadUiState() {
  try {
    const loaded = await readJson(uiStatePath);
    return {
      version: 1,
      history: Array.isArray(loaded.history) ? loaded.history : [],
      quotas: loaded.quotas && typeof loaded.quotas === "object" ? loaded.quotas : {},
      profiles: Array.isArray(loaded.profiles) ? loaded.profiles : []
    };
  } catch {
    return { version: 1, history: [], quotas: {}, profiles: [] };
  }
}

async function saveUiState(state) {
  const trimmed = {
    version: 1,
    history: (state.history || []).slice(0, 200),
    quotas: state.quotas || {},
    profiles: (state.profiles || []).slice(0, 50)
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
  return /hit your limits|quota|limit reached|generation limit/i.test(text);
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
    driveSyncStatus: report.driveSyncStatus || "",
    driveSyncError: report.driveSyncError || "",
    driveFolderPath: report.driveFolderPath || "",
    driveVideoPath: report.driveVideoPath || "",
    driveManifestPath: report.driveManifestPath || "",
    vidsUrl: report.vidsUrl || "",
    vidsClipCacheFolder: report.vidsClipCacheFolder || "",
    cachedVidsClips: report.cachedVidsClips || [],
    generatedFolder: report.generatedFolder || "",
    generatedFiles: report.generatedFiles || [],
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
    } else if (entry.status === "complete" && (entry.mode === "generate_export" || entry.mode === "google" || entry.mode === "google-full")) {
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
  const prefix = `Profile ${index + 1}`;
  const identity = profile.email || profile.googleName || profile.profileName || "";
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
  return relative === "README.md" || relative.startsWith("docs/") || relative.startsWith("outputs/");
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
  const workDir = path.join(projectRoot, "work");
  const found = [];
  try {
    const entries = await fs.readdir(workDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory() || !entry.name.startsWith("google-vids-profile")) {
        continue;
      }
      found.push(path.join("work", entry.name));
    }
  } catch {
    // The work directory is optional; defaults below keep the UI usable.
  }

  for (const saved of state.profiles || []) {
    try {
      const profile = normalizeProfilePath(saved.path || saved);
      if (!found.includes(profile)) {
        found.push(profile);
      }
    } catch {
      // Ignore invalid profile paths from older local state edits.
    }
  }

  for (const profile of defaultProfiles) {
    if (!found.includes(profile)) {
      found.push(profile);
    }
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

async function listTools(inputPath) {
  const config = await readJson(path.join(projectRoot, "config/default.json"));
  const resolvedInput = path.resolve(inputPath || defaultInput);
  const table = await readWorkbookTable(resolvedInput);
  const rows = normalizeWorkbookObjects(table.objects, {
    toolBaseUrl: config.toolBaseUrl || ""
  });
  const state = await loadUiState();
  const latestByRow = latestHistoryByInputAndRow(state.history, resolvedInput);

  return rows.map((row) => {
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
      lastError: latest?.error || "",
      lastEndedAt: latest?.endedAt || ""
    };
  });
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

  if (mode === "prep") {
    runArgs.push("--prep-only");
  } else if (mode === "local") {
    runArgs.push("--local-only");
  } else {
    runArgs.push("--max-scenes", String(Number.isFinite(maxScenes) ? maxScenes : 6));
    if (mode === "google" || mode === "google-full") {
      runArgs.push("--generate");
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
    driveSyncStatus: report.driveSyncStatus || "",
    driveSyncError: report.driveSyncError || "",
    driveFolderPath: report.driveFolderPath || "",
    driveVideoPath: report.driveVideoPath || "",
    driveManifestPath: report.driveManifestPath || "",
    vidsUrl: report.vidsUrl || "",
    vidsClipCacheFolder: report.vidsClipCacheFolder || "",
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
    report.vidsUrl ? hyperlinkFormula(report.vidsUrl, "Open Google Vids") : "",
    report.vidsUrl || "",
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
    items: queue.items
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
  const opener = spawn("open", [target], {
    cwd: projectRoot,
    stdio: "ignore",
    detached: true
  });
  opener.unref();
  return { ok: true, path: target };
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
    profiles: profiles.map((profile) => ({
      ...profile,
      quota: profileQuota(state, profile.path)
    })),
    raw: state.quotas
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

async function handleApi(req, res, pathname, searchParams) {
  try {
    if (req.method === "GET" && pathname === "/api/defaults") {
      const quota = await publicQuotaState();
      json(res, 200, {
        ok: true,
        input: defaultInput,
        profiles: quota.profiles,
        quota,
        googleVids: {
          defaultAvatar,
          defaultAvatarScenes,
          defaultIngredientScenes,
          avatarOptions
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
      const profiles = added.profiles.map((profile) => ({
        ...profile,
        quota: profileQuota(state, profile.path)
      }));
      json(res, 201, { ok: true, profile: profiles.find((item) => item.path === added.profile.path), profiles });
      return;
    }

    if (req.method === "GET" && pathname === "/api/tools") {
      json(res, 200, { ok: true, tools: await listTools(searchParams.get("input") || defaultInput) });
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
  console.log(`Tool Reel Factory UI running at http://127.0.0.1:${port}`);
});
