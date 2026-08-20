import path from "node:path";
import fs from "node:fs/promises";
import { ensureDir, writeJson, writeText } from "./fsx.mjs";

export const AVATAR_REFERENCE_FOLDER = "avatar-references";
export const AVATAR_GENERATION_FOLDER = "avatar-generation";

const imageExtensions = new Set([".png", ".jpg", ".jpeg", ".webp"]);

function splitList(value) {
  return Array.isArray(value)
    ? value.map((item) => String(item || "").trim()).filter(Boolean)
    : String(value || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
}

function sceneToken(sceneNumber) {
  return String(Number(sceneNumber)).padStart(2, "0");
}

function parseScenes(value, fallback = "1,2,6") {
  const numbers = splitList(value || fallback)
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
  return numbers.length ? numbers : [1, 2, 6];
}

function safeName(value, fallback = "avatar-reference") {
  const ext = path.extname(String(value || "")).toLowerCase();
  const base = path.basename(String(value || fallback), ext);
  return `${base
    .replace(/[/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase() || fallback}${ext || ".png"}`;
}

async function accessOrNull(filePath) {
  return fs.access(filePath).then(() => filePath).catch(() => null);
}

async function copyReferenceImages(toolDir, imageInputs = []) {
  const referenceDir = path.join(toolDir, AVATAR_REFERENCE_FOLDER);
  await ensureDir(referenceDir);
  const copied = [];

  for (const [index, input] of imageInputs.entries()) {
    const absolute = path.resolve(input);
    const existing = await accessOrNull(absolute);
    if (!existing || !imageExtensions.has(path.extname(existing).toLowerCase())) {
      continue;
    }
    const token = String(index + 1).padStart(2, "0");
    const destination = path.join(referenceDir, `${token}-${safeName(existing)}`);
    await fs.copyFile(existing, destination);
    copied.push({
      sourcePath: existing,
      destinationPath: destination,
      file: path.basename(destination)
    });
  }

  if (copied[0]) {
    const hostExt = path.extname(copied[0].destinationPath).toLowerCase() || ".png";
    const hostPath = path.join(toolDir, `avatar-host${hostExt === ".jpeg" ? ".jpg" : hostExt}`);
    await fs.copyFile(copied[0].destinationPath, hostPath);
  }

  return {
    referenceDir,
    copied
  };
}

function providerPrompt(provider, scene, references) {
  const voiceover = String(scene.voiceover || "").replace(/\s+/g, " ").trim();
  const caption = String(scene.onscreen_text || "").replace(/\s+/g, " ").trim();
  const referenceList = references.map((item) => `- ${item.destinationPath}`).join("\n") || "- Add a clear front-facing portrait image first.";
  const common = [
    `Create a 10-second 9:16 vertical avatar/talking-head clip for Scene ${scene.scene_number}.`,
    "Use the provided creator reference image(s) to keep the same human presenter look.",
    "Style: realistic professional UGC, clean desk or neutral SaaS background, soft daylight, confident natural Indian/Hinglish delivery.",
    `Voiceover/script: ${voiceover}`,
    `Caption idea: ${caption}`,
    "Avoid fake app UI inside avatar-only clips. The final editor will combine this with real tool screenshots where needed.",
    `Export as MP4 and save/copy it to ../../../vids-clips/avatar-scene-${sceneToken(scene.scene_number)}.mp4 or ../../../vids-clips/scene-${sceneToken(scene.scene_number)}.mp4.`
  ].join("\n");

  const tips = {
    heygen: "HeyGen: create a Photo Avatar from the first portrait image, choose 9:16, paste the voiceover, use a natural Hindi/Hinglish voice, then download MP4.",
    did: "D-ID: use Photo Avatar/Talking Photo with the portrait image and pasted script. Best for hook/CTA talking-head clips.",
    runway: "Runway: use image-to-video or UGC-style character workflow. Keep motion subtle: small hand gestures, nodding, direct eye contact.",
    veo: "Veo 3.1: use up to three reference images when available. Generate an 8-second 9:16 presenter shot, then local editor will fit it into the scene.",
    pika: "Pika: use image-to-video with portrait as first frame; prompt subtle presenter motion, not exaggerated transformation."
  };

  return [
    common,
    "",
    `Provider tip: ${tips[provider] || ""}`,
    "",
    "Reference images:",
    referenceList,
    ""
  ].join("\n");
}

function rootReadme(providers, references, scenes) {
  return [
    "# Avatar Generation Pack",
    "",
    "This folder prepares avatar/talking-head clips from your own image references.",
    "",
    "Recommended use:",
    "",
    "1. Put 1-3 clear, front-facing images in the dashboard Avatar images field.",
    "2. Use HeyGen or D-ID for lip-synced talking avatar hook/CTA clips.",
    "3. Use Runway, Pika, or Veo for non-lip-synced UGC-style motion clips.",
    "4. Save final MP4 clips into `../vids-clips/` with `avatar-scene-01.mp4` or `scene-01.mp4` names.",
    "5. Run Local MP4 again; it will use cached avatar clips where available.",
    "",
    "Avatar scenes:",
    scenes.map((scene) => `- Scene ${scene}`).join("\n"),
    "",
    "Reference images copied:",
    references.length ? references.map((item) => `- ${item.destinationPath}`).join("\n") : "- None yet",
    "",
    "Providers:",
    providers.map((provider) => `- ${provider}`).join("\n"),
    "",
    "Use only your own image/voice or content where you have clear permission.",
    ""
  ].join("\n");
}

export async function writeAvatarReferencePack(toolDir, scenePlan, options = {}) {
  const imageInputs = splitList(options.images);
  const providers = splitList(options.providers || "heygen,did,runway,veo,pika").map((item) => item.toLowerCase());
  const sceneNumbers = parseScenes(options.scenes || "1,2,6");
  const scenes = Array.isArray(scenePlan?.scenes) ? scenePlan.scenes : [];
  const selectedScenes = scenes.filter((scene) => sceneNumbers.includes(Number(scene.scene_number)));
  const references = await copyReferenceImages(toolDir, imageInputs);
  const generationDir = path.join(toolDir, AVATAR_GENERATION_FOLDER);
  await ensureDir(generationDir);
  await writeText(path.join(generationDir, "README.md"), rootReadme(providers, references.copied, sceneNumbers));

  for (const provider of providers) {
    const providerDir = path.join(generationDir, provider);
    await ensureDir(providerDir);
    await writeText(path.join(providerDir, "README.md"), [
      `# ${provider.toUpperCase()} Avatar Clips`,
      "",
      "Use each scene folder prompt with the copied avatar reference images.",
      "Download MP4 clips and place them in `../../vids-clips/`.",
      ""
    ].join("\n"));
    for (const scene of selectedScenes) {
      const token = sceneToken(scene.scene_number);
      const sceneDir = path.join(providerDir, `scene-${token}`);
      await ensureDir(sceneDir);
      await writeText(path.join(sceneDir, "prompt.txt"), providerPrompt(provider, scene, references.copied));
      await writeText(path.join(sceneDir, "voiceover.txt"), `${scene.voiceover || ""}\n`);
      await writeText(path.join(sceneDir, "save-as.txt"), `../../../vids-clips/avatar-scene-${token}.mp4\n`);
    }
  }

  const manifestPath = path.join(generationDir, "avatar-generation-manifest.json");
  await writeJson(manifestPath, {
    version: 1,
    generatedAt: new Date().toISOString(),
    folder: generationDir,
    referenceDir: references.referenceDir,
    referenceImages: references.copied,
    providers,
    scenes: sceneNumbers,
    selectedSceneCount: selectedScenes.length
  });

  return {
    folder: generationDir,
    manifestPath,
    referenceDir: references.referenceDir,
    referenceImages: references.copied,
    providers,
    scenes: sceneNumbers
  };
}
