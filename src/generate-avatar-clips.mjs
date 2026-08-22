import path from "node:path";
import fs from "node:fs/promises";
import dotenv from "dotenv";
import { parseArgs } from "./lib/args.mjs";
import { ensureDir, readJson, writeJson } from "./lib/fsx.mjs";
import { cacheVidsSceneClip, ensureVidsClipCache } from "./lib/vids-clip-cache.mjs";

dotenv.config({ quiet: true });

const args = parseArgs(process.argv.slice(2));
const toolDir = args["tool-dir"] ? path.resolve(args["tool-dir"]) : null;
const provider = String(args.provider || args["avatar-provider"] || "heygen").trim().toLowerCase();
const scenesArg = String(args.scenes || args["avatar-scenes"] || "1,2,6");

if (!toolDir) {
  console.error("Missing --tool-dir.");
  console.error("Example: npm run avatar:generate -- --tool-dir outputs/runs/.../tool-folder --provider heygen --scenes 1,2,6");
  process.exit(1);
}

function splitList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseScenes(value) {
  return splitList(value)
    .flatMap((part) => {
      const range = part.match(/^(\d+)\s*-\s*(\d+)$/);
      if (!range) return [Number(part)];
      const start = Number(range[1]);
      const end = Number(range[2]);
      const low = Math.min(start, end);
      const high = Math.max(start, end);
      return Array.from({ length: high - low + 1 }, (_, index) => low + index);
    })
    .filter((number, index, list) => Number.isFinite(number) && number >= 1 && list.indexOf(number) === index);
}

function mimeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  return "image/png";
}

async function firstReferenceImage() {
  const explicit = splitList(args.images || args["reference-images"] || args.image)[0];
  if (explicit) {
    return path.resolve(explicit);
  }
  const manifest = await readJson(path.join(toolDir, "avatar-generation", "avatar-generation-manifest.json")).catch(() => null);
  const fromManifest = manifest?.referenceImages?.[0]?.destinationPath;
  if (fromManifest) {
    return fromManifest;
  }
  const candidates = ["avatar-host.png", "avatar-host.jpg", "avatar-host.jpeg", "avatar-host.webp"].map((file) => path.join(toolDir, file));
  for (const filePath of candidates) {
    try {
      await fs.access(filePath);
      return filePath;
    } catch {
      // keep checking
    }
  }
  return "";
}

async function heygenRequest(endpoint, options = {}) {
  const apiKey = process.env.HEYGEN_API_KEY;
  if (!apiKey) {
    throw new Error("HEYGEN_API_KEY is missing.");
  }
  const headers = {
    "x-api-key": apiKey,
    ...(options.headers || {})
  };
  const response = await fetch(`https://api.heygen.com${endpoint}`, {
    ...options,
    headers
  });
  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();
  if (!response.ok) {
    const message = data?.error?.message || data?.message || data?.data?.message || response.statusText;
    throw new Error(`HeyGen request failed: ${message}`);
  }
  return data;
}

async function uploadHeyGenAsset(imagePath) {
  const bytes = await fs.readFile(imagePath);
  const form = new FormData();
  form.append("file", new Blob([bytes], { type: mimeFor(imagePath) }), path.basename(imagePath));
  const data = await heygenRequest("/v3/assets", {
    method: "POST",
    body: form
  });
  const assetId = data?.data?.asset_id || data?.data?.id || data?.asset_id || data?.id;
  if (!assetId) {
    throw new Error("HeyGen asset upload did not return an asset_id.");
  }
  return assetId;
}

async function createHeyGenPhotoAvatar(assetId) {
  const data = await heygenRequest("/v3/avatars", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "photo",
      name: args.name || `AI Reel Avatar ${new Date().toISOString()}`,
      file: {
        type: "asset_id",
        asset_id: assetId
      }
    })
  });
  const avatarId = data?.data?.avatar_item?.id || data?.data?.id || data?.avatar_id || data?.id;
  if (!avatarId) {
    throw new Error("HeyGen photo avatar creation did not return an avatar id.");
  }
  return avatarId;
}

async function createHeyGenVideo(avatarId, scene, voiceId) {
  const script = String(scene?.voiceover_audio || scene?.spoken_voiceover || scene?.voiceover || "").replace(/\s+/g, " ").trim();
  if (!script) {
    throw new Error(`Scene ${scene.scene_number} has no voiceover script.`);
  }
  const data = await heygenRequest("/v3/videos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "avatar",
      avatar_id: avatarId,
      script,
      voice_id: voiceId,
      title: `${args.title || "AI Reel"} - Scene ${scene.scene_number}`,
      resolution: args.resolution || "1080p",
      aspect_ratio: "9:16",
      remove_background: args["remove-background"] === "true",
      motion_prompt: args["motion-prompt"] || "natural presenter gestures, subtle hand movement, friendly eye contact",
      expressiveness: args.expressiveness || "medium"
    })
  });
  const videoId = data?.data?.video_id || data?.video_id || data?.data?.id || data?.id;
  if (!videoId) {
    throw new Error(`HeyGen scene ${scene.scene_number} did not return a video_id.`);
  }
  return videoId;
}

async function pollHeyGenVideo(videoId) {
  const intervalMs = Math.max(2000, Number(args["poll-ms"] || 10000));
  const maxPolls = Math.max(1, Number(args["max-polls"] || 60));
  for (let attempt = 0; attempt < maxPolls; attempt += 1) {
    const data = await heygenRequest(`/v3/videos/${encodeURIComponent(videoId)}`, {
      method: "GET"
    });
    const item = data?.data || data;
    const status = String(item?.status || "").toLowerCase();
    if (status === "completed" || status === "complete" || item?.video_url) {
      const videoUrl = item.video_url || item.url || item.download_url;
      if (!videoUrl) {
        throw new Error(`HeyGen video ${videoId} completed without video_url.`);
      }
      return { status, videoUrl };
    }
    if (status === "failed" || status === "error") {
      throw new Error(item?.failure_message || item?.error || `HeyGen video ${videoId} failed.`);
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new Error(`HeyGen video ${videoId} did not finish before timeout.`);
}

async function downloadFile(url, outputPath) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Download failed: ${response.statusText}`);
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(outputPath, bytes);
  return bytes.length;
}

async function generateHeyGenClips() {
  const voiceId = args.voice || args["voice-id"] || process.env.HEYGEN_VOICE_ID;
  if (!voiceId) {
    throw new Error("HEYGEN_VOICE_ID or --voice-id is required.");
  }
  const imagePath = await firstReferenceImage();
  if (!imagePath) {
    throw new Error("No avatar reference image found. Add --images or create an avatar-reference pack first.");
  }
  await fs.access(imagePath);
  const scenePlan = await readJson(path.join(toolDir, "scene-plan.json"));
  const wantedScenes = parseScenes(scenesArg);
  const selectedScenes = (scenePlan.scenes || []).filter((scene) => wantedScenes.includes(Number(scene.scene_number)));
  const outputDir = path.join(toolDir, "avatar-generation", "heygen", "downloads");
  await ensureDir(outputDir);
  await ensureVidsClipCache(toolDir);

  const assetId = await uploadHeyGenAsset(imagePath);
  const avatarId = await createHeyGenPhotoAvatar(assetId);
  const generated = [];

  for (const scene of selectedScenes) {
    const token = String(scene.scene_number).padStart(2, "0");
    const videoId = await createHeyGenVideo(avatarId, scene, voiceId);
    console.log(`HeyGen scene ${scene.scene_number} queued: ${videoId}`);
    const complete = await pollHeyGenVideo(videoId);
    const outputPath = path.join(outputDir, `heygen-avatar-scene-${token}.mp4`);
    const sizeBytes = await downloadFile(complete.videoUrl, outputPath);
    const cached = await cacheVidsSceneClip({
      toolDir,
      sourcePath: outputPath,
      sceneNumber: Number(scene.scene_number),
      profile: "heygen-api",
      note: "Generated via HeyGen Photo Avatar API.",
      qualityStatus: "needs_human_review"
    });
    generated.push({
      sceneNumber: Number(scene.scene_number),
      videoId,
      outputPath,
      cachedPath: cached?.cachedPath || "",
      sizeBytes
    });
    console.log(`HeyGen scene ${scene.scene_number} saved: ${cached?.cachedPath || outputPath}`);
  }

  return {
    assetId,
    avatarId,
    generated
  };
}

const report = {
  ok: false,
  provider,
  toolDir,
  scenes: parseScenes(scenesArg),
  generatedAt: new Date().toISOString()
};

try {
  if (provider !== "heygen") {
    throw new Error(`Provider "${provider}" is not automated yet. Use avatar-generation provider prompts manually, or choose heygen.`);
  }
  Object.assign(report, await generateHeyGenClips());
  report.ok = report.generated?.length > 0;
} catch (error) {
  report.error = error.message;
  console.error(error.message);
}

const reportPath = path.join(toolDir, "avatar-generation", `${provider}-generation-report.json`);
await writeJson(reportPath, report);
console.log(`Avatar generation report: ${reportPath}`);
if (!report.ok) {
  process.exitCode = 1;
}
