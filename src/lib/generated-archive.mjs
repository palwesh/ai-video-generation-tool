import fs from "node:fs/promises";
import path from "node:path";
import { ensureDir, readJson, writeJson, writeText } from "./fsx.mjs";

export const GENERATED_ARCHIVE_FOLDER = "generated";
export const GENERATED_ARCHIVE_MANIFEST = "generated-manifest.json";

function archiveReadme() {
  return [
    "# Generated Outputs",
    "",
    "This folder keeps a tool-centric copy of generated automation outputs.",
    "",
    "Typical structure:",
    "",
    "- agent/ for one-video reports and prepared workbook copies",
    "- local-render/ for final local MP4, Remotion props, render report, and render assets",
    "- google-vids/ for Google Vids browser run screenshots, prompts, and reports",
    "- google-vids-export/ for Google Vids export reports and exported MP4s",
    "",
    "Reusable Google Vids/avatar source clips still belong in ../vids-clips/ because the local renderer reads that folder first.",
    ""
  ].join("\n");
}

function safeSegment(value, fallback = "misc") {
  return String(value || fallback)
    .trim()
    .replace(/[/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase() || fallback;
}

function safeFileName(value, fallback = "generated-file") {
  const ext = path.extname(String(value || ""));
  const base = path.basename(String(value || fallback), ext);
  const safeBase = safeSegment(base, fallback);
  return `${safeBase}${ext || ""}`;
}

async function pathKind(targetPath) {
  try {
    const stat = await fs.stat(targetPath);
    return stat.isDirectory() ? "directory" : stat.isFile() ? "file" : "";
  } catch {
    return "";
  }
}

async function sameRealPath(a, b) {
  try {
    const [realA, realB] = await Promise.all([fs.realpath(a), fs.realpath(b)]);
    return realA === realB;
  } catch {
    return false;
  }
}

async function readArchiveManifest(archiveDir) {
  try {
    return await readJson(path.join(archiveDir, GENERATED_ARCHIVE_MANIFEST));
  } catch {
    return {
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: "",
      entries: [],
      notes: []
    };
  }
}

async function recordArchiveEntry(toolDir, entry) {
  const archiveDir = await ensureGeneratedArchive(toolDir);
  const manifest = await readArchiveManifest(archiveDir);
  const nextEntry = {
    ...entry,
    savedAt: new Date().toISOString()
  };
  const destinationKey = path.resolve(nextEntry.destinationPath || "");
  manifest.entries = [
    nextEntry,
    ...(manifest.entries || []).filter((item) => path.resolve(item.destinationPath || "") !== destinationKey)
  ].slice(0, 500);
  manifest.updatedAt = new Date().toISOString();
  await writeJson(path.join(archiveDir, GENERATED_ARCHIVE_MANIFEST), manifest);
  return nextEntry;
}

export function generatedArchiveDir(toolDir) {
  return path.join(toolDir, GENERATED_ARCHIVE_FOLDER);
}

export async function ensureGeneratedArchive(toolDir) {
  const archiveDir = generatedArchiveDir(toolDir);
  await ensureDir(archiveDir);
  const readmePath = path.join(archiveDir, "README.md");
  try {
    await fs.access(readmePath);
  } catch {
    await writeText(readmePath, archiveReadme());
  }
  return archiveDir;
}

export async function mirrorGeneratedFile({ toolDir, sourcePath, category = "misc", fileName = "", note = "", label = "" }) {
  if (!toolDir || !sourcePath) {
    return null;
  }
  const kind = await pathKind(sourcePath);
  if (kind !== "file") {
    return null;
  }

  const archiveDir = await ensureGeneratedArchive(toolDir);
  const categoryDir = path.join(archiveDir, safeSegment(category));
  await ensureDir(categoryDir);
  const destinationPath = path.join(categoryDir, safeFileName(fileName || path.basename(sourcePath)));

  if (!await sameRealPath(sourcePath, destinationPath)) {
    await fs.copyFile(sourcePath, destinationPath);
  }

  return await recordArchiveEntry(toolDir, {
    type: "file",
    category: safeSegment(category),
    label,
    note,
    sourcePath: path.resolve(sourcePath),
    destinationPath
  });
}

export async function mirrorGeneratedDirectory({ toolDir, sourceDir, category = "misc", folderName = "", note = "", label = "" }) {
  if (!toolDir || !sourceDir) {
    return null;
  }
  const kind = await pathKind(sourceDir);
  if (kind !== "directory") {
    return null;
  }

  const archiveDir = await ensureGeneratedArchive(toolDir);
  const categoryDir = path.join(archiveDir, safeSegment(category));
  await ensureDir(categoryDir);
  const destinationPath = path.join(categoryDir, safeSegment(folderName || path.basename(sourceDir)));

  if (!await sameRealPath(sourceDir, destinationPath)) {
    await fs.cp(sourceDir, destinationPath, { recursive: true, force: true });
  }

  return await recordArchiveEntry(toolDir, {
    type: "directory",
    category: safeSegment(category),
    label,
    note,
    sourcePath: path.resolve(sourceDir),
    destinationPath
  });
}
