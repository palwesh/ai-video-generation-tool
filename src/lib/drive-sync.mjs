import fs from "node:fs/promises";
import path from "node:path";
import { ensureDir, writeJson } from "./fsx.mjs";

function cleanSegment(value, fallback = "tool") {
  return String(value || fallback)
    .trim()
    .replace(/[/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase() || fallback;
}

function pathInside(parent, child) {
  const relative = path.relative(path.resolve(parent), path.resolve(child));
  return relative && !relative.startsWith("..") && !path.isAbsolute(relative);
}

async function copyIfFile(sourcePath, destinationPath) {
  if (!sourcePath) {
    return "";
  }
  try {
    const stat = await fs.stat(sourcePath);
    if (!stat.isFile()) {
      return "";
    }
  } catch {
    return "";
  }
  await ensureDir(path.dirname(destinationPath));
  await fs.copyFile(sourcePath, destinationPath);
  return destinationPath;
}

export function resolveDriveSyncDir(config = {}, args = {}) {
  if (args["no-drive-sync"]) {
    return "";
  }

  const raw = args["drive-sync-dir"]
    || process.env.TRF_DRIVE_SYNC_DIR
    || config.driveSync?.rootDir
    || "";
  const enabled = Boolean(args["drive-sync"] || raw || config.driveSync?.enabled);
  if (!enabled || !raw) {
    return "";
  }
  return path.resolve(String(raw));
}

export async function syncToolOutputToDrive({ rootDir, result, mp4Path, preparedWorkbookPath, reportPath, generatedFiles = [] }) {
  if (!rootDir || !result?.runDir) {
    return null;
  }

  const sourceToolDir = path.resolve(result.runDir);
  const driveRoot = path.resolve(rootDir);
  const driveToolDir = path.join(driveRoot, cleanSegment(result.slug || result.scenePlan?.metadata?.tool_name || "tool"));

  if (pathInside(sourceToolDir, driveToolDir)) {
    throw new Error("Drive sync folder cannot be inside the active tool run folder.");
  }

  await ensureDir(driveToolDir);
  await fs.cp(sourceToolDir, driveToolDir, { recursive: true, force: true });

  const mp4Ext = path.extname(String(mp4Path || "")) || ".mp4";
  const driveVideoPath = mp4Path
    ? await copyIfFile(path.resolve(mp4Path), path.join(driveToolDir, `final-video${mp4Ext}`))
    : "";
  const driveWorkbookPath = await copyIfFile(preparedWorkbookPath, path.join(driveToolDir, "prepared-tool-reel-workbook.xlsx"));
  const driveReportPath = await copyIfFile(reportPath, path.join(driveToolDir, "one-video-agent-report.json"));
  const driveManifestPath = path.join(driveToolDir, "drive-sync-report.json");

  const report = {
    ok: true,
    status: "Synced to Google Drive desktop folder",
    syncedAt: new Date().toISOString(),
    driveRoot,
    driveFolderPath: driveToolDir,
    driveVideoPath,
    driveWorkbookPath,
    driveReportPath,
    sourceToolDir,
    sourceMp4Path: mp4Path ? path.resolve(mp4Path) : "",
    generatedFiles
  };
  await writeJson(driveManifestPath, report);

  return {
    ...report,
    driveManifestPath
  };
}
