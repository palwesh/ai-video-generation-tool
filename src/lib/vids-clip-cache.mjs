import fs from "node:fs/promises";
import path from "node:path";
import { ensureDir, readJson, writeJson, writeText } from "./fsx.mjs";

export const VIDS_CLIP_CACHE_FOLDER = "vids-clips";
export const VIDS_CLIP_CACHE_MANIFEST = "cache-manifest.json";

const videoExtensions = new Set([".mp4", ".webm", ".mov"]);

function isVideoFile(filePath) {
  return videoExtensions.has(path.extname(filePath).toLowerCase());
}

function sceneToken(sceneNumber) {
  return String(sceneNumber).padStart(2, "0");
}

function safeCacheFileName(value, fallback = "google-vids-export.mp4") {
  return String(value || fallback)
    .replace(/[/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase() || fallback;
}

function clipReadme() {
  return [
    "# Google Vids Clip Cache",
    "",
    "Save reusable Google Vids/avatar clips for this tool here.",
    "",
    "Accepted scene-level names:",
    "",
    "- scene-01.mp4",
    "- scene-1.webm",
    "- avatar-scene-01.mp4",
    "- google-vids-scene-01.mp4",
    "",
    "Accepted timeline export names:",
    "",
    "- full-google-vids-export.mp4",
    "- partial-google-vids-export-scenes-01-03.mp4",
    "",
    "The local Remotion renderer checks this folder first. Scene-specific clips win over full/partial timeline exports. If no clip is available for a scene, it uses the normal tool screenshots and demo recordings.",
    ""
  ].join("\n");
}

export function vidsClipCacheDir(toolDir) {
  return path.join(toolDir, VIDS_CLIP_CACHE_FOLDER);
}

export async function ensureVidsClipCache(toolDir) {
  const cacheDir = vidsClipCacheDir(toolDir);
  await ensureDir(cacheDir);
  const readmePath = path.join(cacheDir, "README.md");
  try {
    await fs.access(readmePath);
  } catch {
    await writeText(readmePath, clipReadme());
  }
  return cacheDir;
}

async function readCacheManifest(cacheDir) {
  try {
    return await readJson(path.join(cacheDir, VIDS_CLIP_CACHE_MANIFEST));
  } catch {
    return {
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: "",
      timelineExports: [],
      notes: []
    };
  }
}

async function writeCacheManifest(cacheDir, manifest) {
  const next = {
    version: 1,
    ...manifest,
    updatedAt: new Date().toISOString()
  };
  await writeJson(path.join(cacheDir, VIDS_CLIP_CACHE_MANIFEST), next);
  return next;
}

function normalizeScenes(scenes, fallbackCount = 7) {
  const parsed = Array.isArray(scenes)
    ? scenes.map((scene) => Number(scene)).filter(Number.isFinite)
    : [];
  if (parsed.length) {
    return parsed;
  }
  return Array.from({ length: fallbackCount }, (_, index) => index + 1);
}

export async function cacheVidsExport({
  toolDir,
  sourcePath,
  kind = "full_export",
  profile = "",
  scenes = [],
  note = "",
  renderEligible = true,
  qualityStatus = "unreviewed"
}) {
  if (!toolDir || !sourcePath) {
    return null;
  }
  try {
    await fs.access(sourcePath);
  } catch {
    return null;
  }

  const cacheDir = await ensureVidsClipCache(toolDir);
  const coveredScenes = normalizeScenes(scenes, kind === "partial_export" ? scenes.length : 7);
  const ext = path.extname(sourcePath) || ".mp4";
  const sceneRange = coveredScenes.length
    ? `scenes-${sceneToken(coveredScenes[0])}-${sceneToken(coveredScenes.at(-1))}`
    : "scenes-unknown";
  const destinationName = kind === "partial_export"
    ? safeCacheFileName(`partial-google-vids-export-${sceneRange}${ext}`)
    : safeCacheFileName(`full-google-vids-export${ext}`);
  const destinationPath = path.join(cacheDir, destinationName);
  await fs.copyFile(sourcePath, destinationPath);

  const manifest = await readCacheManifest(cacheDir);
  const entry = {
    kind,
    file: destinationName,
    absolutePath: destinationPath,
    sourcePath,
    profile,
    coveredScenes,
    note,
    renderEligible,
    qualityStatus,
    savedAt: new Date().toISOString()
  };
  manifest.timelineExports = [
    entry,
    ...(manifest.timelineExports || []).filter((item) => item.file !== destinationName)
  ];
  if (note) {
    manifest.notes = [note, ...(manifest.notes || [])].slice(0, 20);
  }
  await writeCacheManifest(cacheDir, manifest);

  return {
    cacheDir,
    manifestPath: path.join(cacheDir, VIDS_CLIP_CACHE_MANIFEST),
    cachedPath: destinationPath,
    entry
  };
}

function isRejectedCacheEntry(item) {
  const note = String(item?.note || "");
  const qualityStatus = String(item?.qualityStatus || "");
  return item?.renderEligible === false
    || item?.approvedForRender === false
    || item?.rejected === true
    || /reject|fake ui|hallucinat|do not use/i.test(`${note} ${qualityStatus}`);
}

function scoreSceneClip(fileName, sceneNumber) {
  const base = path.basename(fileName).toLowerCase();
  const n = String(sceneNumber);
  const nn = sceneToken(sceneNumber);
  const patterns = [
    new RegExp(`^scene[-_ ]?${nn}\\.`),
    new RegExp(`^scene[-_ ]?${n}\\.`),
    new RegExp(`^(avatar|vids|google-vids)[-_ ]?scene[-_ ]?${nn}\\.`),
    new RegExp(`^(avatar|vids|google-vids)[-_ ]?scene[-_ ]?${n}\\.`),
    new RegExp(`scene[-_ ]?${nn}\\.`),
    new RegExp(`scene[-_ ]?${n}\\.`)
  ];
  const index = patterns.findIndex((pattern) => pattern.test(base));
  return index === -1 ? -1 : patterns.length - index;
}

export async function findCachedVidsAssets(toolDir) {
  const cacheDir = vidsClipCacheDir(toolDir);
  const result = {
    cacheDir,
    manifestPath: path.join(cacheDir, VIDS_CLIP_CACHE_MANIFEST),
    sceneClips: Array.from({ length: 7 }, () => null),
    timelineExports: [],
    files: []
  };

  let entries = [];
  try {
    entries = await fs.readdir(cacheDir, { withFileTypes: true });
  } catch {
    return result;
  }

  const files = entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter(isVideoFile)
    .sort();

  result.files = files.map((file) => path.join(cacheDir, file));

  for (let sceneNumber = 1; sceneNumber <= 7; sceneNumber += 1) {
    const chosen = files
      .map((file) => ({ file, score: scoreSceneClip(file, sceneNumber) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || a.file.localeCompare(b.file))[0];
    if (chosen) {
      result.sceneClips[sceneNumber - 1] = {
        sceneNumber,
        file: chosen.file,
        absolutePath: path.join(cacheDir, chosen.file),
        source: "scene_clip"
      };
    }
  }

  const manifest = await readCacheManifest(cacheDir);
  const manifestTimelines = Array.isArray(manifest.timelineExports) ? manifest.timelineExports : [];
  for (const item of manifestTimelines) {
    if (isRejectedCacheEntry(item)) {
      continue;
    }
    const filePath = path.resolve(cacheDir, item.file || "");
    if (!item.file || !isVideoFile(filePath)) {
      continue;
    }
    try {
      await fs.access(filePath);
    } catch {
      continue;
    }
    result.timelineExports.push({
      ...item,
      absolutePath: filePath,
      coveredScenes: normalizeScenes(item.coveredScenes)
    });
  }

  if (!result.timelineExports.length) {
    const fullExport = files.find((file) => /^full-google-vids-export\.(mp4|webm|mov)$/i.test(file));
    if (fullExport) {
      result.timelineExports.push({
        kind: "full_export",
        file: fullExport,
        absolutePath: path.join(cacheDir, fullExport),
        coveredScenes: [1, 2, 3, 4, 5, 6, 7],
        note: "Discovered from default file name."
      });
    }
  }

  return result;
}
