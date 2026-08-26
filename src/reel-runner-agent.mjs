import fs from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { parseArgs } from "./lib/args.mjs";
import { ensureDir, readJson, writeJson } from "./lib/fsx.mjs";
import { readProfileRegistry, registryPathFromConfig } from "./lib/profile-registry.mjs";

dotenv.config({ quiet: true });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const args = parseArgs(process.argv.slice(2));
const port = Number(args.port || process.env.TRF_UI_PORT || 4317);
const dashboardUrl = `http://127.0.0.1:${port}`;
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

async function readJsonOrNull(filePath) {
  try {
    return await readJson(filePath);
  } catch {
    return null;
  }
}

const config = await readJsonOrNull(path.join(projectRoot, "config", "default.json")) || {};
const uiState = await readJsonOrNull(path.join(projectRoot, "work", "ui-state.json")) || {};
const profileRegistryPath = registryPathFromConfig(projectRoot, config);

function printHelp() {
  console.log([
    "AI Reel Creator Runner Agent",
    "",
    "Start dashboard:",
    "  npm run agent -- --dashboard",
    "",
    "Create one local/free reel from one Excel row:",
    "  npm run agent -- --one --row 2 --mode local",
    "",
    "Run multiple rows one by one:",
    "  npm run agent -- --queue --rows 2,3,4 --mode local",
    "",
    "Google Vids hook/avatar mode:",
    "  npm run agent -- --one --row 2 --mode google-hook --profiles work/shejal.sahu-anslation.com-profile",
    "",
    "Useful options:",
    "  --input /path/to/file.xlsx",
    "  --row 2",
    "  --rows 2,3,5-7",
    "  --start-row 2 --limit 3",
    "  --mode prep|local|google-hook|google",
    "  --scenes 3|4|5|6",
    "  --avatar female|male|auto",
    "  --video-size portrait|landscape|square",
    "  --profiles work/profile-a,work/profile-b",
    "  --profile-registry work/google-vids-profiles.xlsx",
    "  --drive-sync-dir /path/to/GoogleDriveFolder",
    "  --update-source-workbook",
    "  --dry-run",
    ""
  ].join("\n"));
}

function cleanString(value) {
  return String(value || "").trim();
}

function resolveProjectFile(value) {
  const raw = cleanString(value);
  if (!raw) {
    return "";
  }
  return path.isAbsolute(raw) ? path.resolve(raw) : path.resolve(projectRoot, raw);
}

function normalizeProfilePath(value) {
  const raw = cleanString(value);
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
  return path.relative(projectRoot, resolved).replace(/[\\]+/g, "/");
}

async function readProfileRegistryEntries() {
  const registry = resolveProjectFile(args["profile-registry"] || profileRegistryPath);
  try {
    return await readProfileRegistry(registry, { normalizeProfilePath });
  } catch (error) {
    console.warn(`Profile registry skipped: ${error.message}`);
    return [];
  }
}

const profileRegistryEntries = await readProfileRegistryEntries();

function profileLimitUsed(entry = {}) {
  return entry.limitStatus === "limit_used" ||
    entry.status === "limit_used" ||
    entry.quota?.quotaExhausted ||
    entry.quota?.limitStatus === "limit_used";
}

function normalizeProfileList(value) {
  return cleanString(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map(normalizeProfilePath);
}

function defaultVidsProfilesForCli() {
  const explicit = args.profiles || args["vids-profiles"] || "";
  if (explicit) {
    return normalizeProfileList(explicit);
  }
  const blockedProfiles = new Set(
    profileRegistryEntries
      .filter((entry) => entry.enabled === false || profileLimitUsed(entry))
      .map((entry) => entry.path)
      .filter(Boolean)
  );
  const savedSelection = [
    uiState.settings?.globalPrimaryProfile || uiState.settings?.hookPrimaryProfile || "",
    uiState.settings?.globalFallbackEnabled === false || uiState.settings?.hookFallbackEnabled === false
      ? ""
      : (uiState.settings?.globalFallbackProfile || uiState.settings?.hookFallbackProfile || "")
  ].filter(Boolean).map(normalizeProfilePath).filter((profile) => !blockedProfiles.has(profile));
  const registrySelection = profileRegistryEntries
    .filter((entry) => entry.enabled !== false && !profileLimitUsed(entry))
    .sort((left, right) => Number(left.priority || 999) - Number(right.priority || 999))
    .map((entry) => entry.path);
  const configSelection = Array.isArray(config.googleVids?.defaultProfiles)
    ? config.googleVids.defaultProfiles.map(normalizeProfilePath).filter((profile) => !blockedProfiles.has(profile))
    : [];
  return [...savedSelection, ...registrySelection, ...configSelection]
    .filter((profile, index, list) => profile && list.indexOf(profile) === index);
}

function defaultInputPath() {
  return resolveProjectFile(
    args.input
    || uiState.settings?.inputPath
    || config.defaultInput
    || ""
  );
}

function parseRowList(value) {
  return cleanString(value)
    .split(",")
    .flatMap((part) => {
      const trimmed = part.trim();
      const range = trimmed.match(/^(\d+)\s*-\s*(\d+)$/);
      if (!range) {
        return [Number(trimmed)];
      }
      const start = Number(range[1]);
      const end = Number(range[2]);
      const low = Math.min(start, end);
      const high = Math.max(start, end);
      return Array.from({ length: high - low + 1 }, (_, index) => low + index);
    })
    .filter((row, index, list) => Number.isFinite(row) && row >= 2 && list.indexOf(row) === index);
}

function rowsToRun() {
  const explicitRows = parseRowList(args.rows || args["specific-rows"] || "");
  if (explicitRows.length) {
    return explicitRows;
  }
  const startRow = Number(args.row || args["start-row"] || uiState.settings?.row || 2);
  const limit = Math.max(1, Math.min(50, Number(args.limit || 1)));
  return Array.from({ length: limit }, (_, index) => startRow + index).filter((row) => row >= 2);
}

function normalizeMode(value) {
  const mode = cleanString(value || args.workflow || (args.google ? "google-hook" : args.local ? "local" : args.prep ? "prep" : "local")).toLowerCase();
  if (["prep", "prepare", "assets"].includes(mode)) return "prep";
  if (["local", "free", "mp4"].includes(mode)) return "local";
  if (["google-hook", "hook", "vids-hook", "avatar"].includes(mode)) return "google-hook";
  if (["google", "vids", "google-full"].includes(mode)) return "google";
  throw new Error(`Unknown mode: ${mode}. Use prep, local, google-hook, or google.`);
}

function commonAgentArgs(input, row, rowOutputDir) {
  const sceneCount = String(Number(args.scenes || args["scene-count"] || args["max-scenes"] || uiState.settings?.sceneCount || config.sceneCount || 6) || 6);
  const runArgs = [
    "src/run-one-video-agent.mjs",
    "--input", input,
    "--row", String(row),
    "--limit", "1",
    "--scene-count", sceneCount,
    "--max-scenes", sceneCount,
    "--out", rowOutputDir
  ];

  const avatar = args.avatar || args["hook-avatar"] || args["hook-avatar-style"] || uiState.settings?.hookAvatarStyle || config.voiceover?.hookAvatarStyle || "";
  if (avatar) {
    runArgs.push("--hook-avatar", String(avatar));
  }
  const videoSize = args["video-size"] || args.size || uiState.settings?.hookVideoSize || "portrait";
  if (videoSize) {
    runArgs.push("--video-size", String(videoSize));
  }
  const profiles = defaultVidsProfilesForCli();
  if (profiles.length) {
    runArgs.push("--vids-profiles", profiles.join(","));
  }
  const driveSyncDir = args["drive-sync-dir"] || "";
  if (driveSyncDir) {
    runArgs.push("--drive-sync-dir", String(driveSyncDir));
  }
  const creatorImages = args["creator-images"] || args["avatar-images"] || args["reference-images"] || "";
  if (creatorImages) {
    runArgs.push("--creator-images", String(creatorImages));
  }
  const ttsProvider = args["tts-provider"] || args["voice-provider"] || "";
  if (ttsProvider) {
    runArgs.push("--tts-provider", String(ttsProvider));
  }
  const ttsVoice = args["tts-voice"] || args["voice-id"] || "";
  if (ttsVoice) {
    runArgs.push("--tts-voice", String(ttsVoice));
  }
  if (args.ai) {
    runArgs.push("--ai");
  }
  if (args["ai-provider"]) {
    runArgs.push("--ai-provider", String(args["ai-provider"]));
  }
  if (args["ai-model"]) {
    runArgs.push("--ai-model", String(args["ai-model"]));
  }
  if (args["update-source-workbook"]) {
    runArgs.push("--update-source-workbook");
  }
  if (args["no-capture"]) {
    runArgs.push("--no-capture");
  }
  if (args["no-local-fallback"]) {
    runArgs.push("--no-local-fallback");
  }

  return runArgs;
}

function buildRunArgs(input, row, rowOutputDir, mode) {
  const runArgs = commonAgentArgs(input, row, rowOutputDir);
  if (mode === "prep") {
    runArgs.push("--prep-only");
  } else if (mode === "local") {
    runArgs.push("--local-only");
  } else if (mode === "google-hook") {
    runArgs.push("--generate", "--hook-vids-first", "--vids-scenes", "1");
  } else if (mode === "google") {
    runArgs.push("--generate");
  }
  return runArgs;
}

function runNodeScript(label, runArgs) {
  return new Promise((resolve, reject) => {
    console.log(`\n[${label}] node ${runArgs.join(" ")}`);
    if (args["dry-run"]) {
      resolve({ code: 0, skipped: true });
      return;
    }
    const child = spawn(process.execPath, runArgs, {
      cwd: projectRoot,
      env: process.env,
      stdio: "inherit"
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve({ code });
      } else {
        reject(new Error(`${label} failed with exit code ${code}`));
      }
    });
  });
}

async function ensureInputExists(input) {
  if (!input) {
    throw new Error("Excel input missing. Pass --input /path/to/file.xlsx or load Excel once in dashboard.");
  }
  await fs.access(input);
}

async function summarizeRow(rowOutputDir) {
  const reportPath = path.join(rowOutputDir, "one-video-agent-report.json");
  const report = await readJsonOrNull(reportPath);
  return {
    reportPath,
    ok: Boolean(report?.ok),
    status: report?.qaStatus || report?.qualityStatus || report?.googleVidsStatus || "",
    mp4Path: report?.mp4Path || "",
    toolDir: report?.toolDir || "",
    error: report?.googleVidsError || report?.error || ""
  };
}

async function runRows() {
  const input = defaultInputPath();
  await ensureInputExists(input);
  const mode = normalizeMode(args.mode);
  const rows = rowsToRun();
  const outputRoot = resolveProjectFile(args.out || path.join("outputs", "agent-runs", `runner-${timestamp}`));
  await ensureDir(outputRoot);

  console.log(`AI Reel runner agent`);
  console.log(`Input: ${input}`);
  console.log(`Mode: ${mode}`);
  console.log(`Rows: ${rows.join(", ")}`);
  console.log(`Output: ${outputRoot}`);
  console.log(`Profile registry: ${args["profile-registry"] || profileRegistryPath}`);
  console.log(`Vids profiles: ${defaultVidsProfilesForCli().join(" -> ") || "none"}`);

  const results = [];
  for (const row of rows) {
    const rowOutputDir = path.join(outputRoot, `row-${String(row).padStart(3, "0")}`);
    await ensureDir(rowOutputDir);
    const runArgs = buildRunArgs(input, row, rowOutputDir, mode);
    try {
      await runNodeScript(`row-${row}`, runArgs);
      const summary = await summarizeRow(rowOutputDir);
      results.push({ row, ...summary });
      console.log(`[row-${row}] done ${summary.mp4Path || summary.toolDir || summary.reportPath}`);
    } catch (error) {
      results.push({
        row,
        ok: false,
        reportPath: path.join(rowOutputDir, "one-video-agent-report.json"),
        mp4Path: "",
        toolDir: rowOutputDir,
        error: error.message
      });
      console.error(`[row-${row}] failed: ${error.message}`);
      if (!args["continue-on-error"]) {
        break;
      }
    }
  }

  const summaryPath = path.join(outputRoot, "runner-agent-summary.json");
  await writeJson(summaryPath, {
    ok: results.every((item) => item.ok || item.mp4Path || item.toolDir),
    generatedAt: new Date().toISOString(),
    input,
    mode,
    rows,
    outputRoot,
    results
  });
  console.log(`\nSummary: ${summaryPath}`);
  for (const item of results) {
    console.log(`Row ${item.row}: ${item.mp4Path || item.toolDir || item.error}`);
  }
}

async function healthCheck() {
  try {
    const response = await fetch(`${dashboardUrl}/api/defaults`);
    return response.ok;
  } catch {
    return await tcpPortOpen("127.0.0.1", port);
  }
}

function tcpPortOpen(host, targetPort) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port: targetPort });
    const finish = (value) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(value);
    };
    socket.setTimeout(900);
    socket.once("connect", () => finish(true));
    socket.once("timeout", () => finish(false));
    socket.once("error", () => finish(false));
  });
}

async function waitForDashboard(timeoutMs = 12000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await healthCheck()) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return false;
}

async function startDashboard() {
  if (await healthCheck()) {
    console.log(`Dashboard already running: ${dashboardUrl}`);
    return;
  }

  console.log(`Starting dashboard at ${dashboardUrl}`);
  const child = spawn(process.execPath, ["src/ui-server.mjs", "--port", String(port)], {
    cwd: projectRoot,
    env: {
      ...process.env,
      TRF_UI_PORT: String(port)
    },
    stdio: "inherit"
  });

  const ready = await waitForDashboard(15000);
  if (!ready) {
    child.kill();
    throw new Error(`Dashboard did not become ready at ${dashboardUrl}`);
  }
  console.log(`Dashboard ready: ${dashboardUrl}`);
  console.log("Press Ctrl+C to stop the dashboard.");
  await new Promise((resolve, reject) => {
    child.on("exit", resolve);
    child.on("error", reject);
  });
}

if (args.help || args.h) {
  printHelp();
} else if (args.dashboard || args.serve || args.ui) {
  await startDashboard();
} else if (args.one || args.queue || args.run || args.row || args.rows || args["start-row"]) {
  await runRows();
} else {
  printHelp();
  console.log(`Tip: run "npm run agent -- --dashboard" and open ${dashboardUrl}`);
}
