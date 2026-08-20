import path from "node:path";
import { writeJson, ensureDir } from "./fsx.mjs";
import { slugify } from "./slug.mjs";
import { captureToolWebsite } from "./capture.mjs";
import { generateScenePlanWithAi } from "./ai.mjs";
import { generateFallbackScenePlan } from "./fallback.mjs";
import { optimizeScenePlan } from "./scene-optimizer.mjs";
import { validateScenePlan } from "./scenes-schema.mjs";
import { writeGoogleVidsPrompts, writePostCopy, writeRunManifest } from "./output-writers.mjs";
import { ensureVidsClipCache } from "./vids-clip-cache.mjs";
import { ensureGeneratedArchive } from "./generated-archive.mjs";

export async function processToolRow(row, batchDir, config, options = {}) {
  const slug = slugify(row.tool_name || row.topic || row.tool_url);
  const runDir = path.join(batchDir, slug);
  await ensureDir(runDir);

  let capture = {
    enabled: false,
    summary: "Capture was disabled for this run.",
    files: []
  };

  if (options.capture) {
    try {
      capture = await captureToolWebsite(row, runDir, config);
    } catch (error) {
      capture = {
        enabled: false,
        summary: `Capture failed: ${error.message}`,
        files: []
      };
    }
  }

  let scenePlan = null;
  let generator = "local_fallback";

  if (options.useAi) {
    try {
      scenePlan = await generateScenePlanWithAi(row, capture.summary, config);
      generator = "ai";
    } catch (error) {
      scenePlan = null;
      capture.summary = `${capture.summary}\nAI generation failed, used fallback: ${error.message}`;
    }
  }

  if (!scenePlan) {
    scenePlan = generateFallbackScenePlan(row, capture.summary, config);
  }

  scenePlan = optimizeScenePlan(scenePlan, row, capture);
  validateScenePlan(scenePlan);

  const scenePlanPath = path.join(runDir, "scene-plan.json");
  await writeJson(scenePlanPath, scenePlan);
  const vidsPromptsPath = await writeGoogleVidsPrompts(runDir, scenePlan);
  const postCopyPath = await writePostCopy(runDir, row, scenePlan);
  const vidsClipCachePath = await ensureVidsClipCache(runDir);
  const generatedArchivePath = await ensureGeneratedArchive(runDir);

  const manifest = {
    tool: row,
    generated_at: new Date().toISOString(),
    generator,
    capture,
    vids_clip_cache: {
      folder: vidsClipCachePath,
      note: "Place reusable Google Vids/avatar clips here. Local MP4 render uses this cache before normal screenshots."
    },
    generated_archive: {
      folder: generatedArchivePath,
      note: "Final videos, render reports, export logs, and generated support files are mirrored here."
    },
    files: {
      scene_plan: scenePlanPath,
      google_vids_prompts: vidsPromptsPath,
      post_copy: postCopyPath,
      vids_clip_cache: vidsClipCachePath,
      generated_archive: generatedArchivePath
    }
  };

  const manifestPath = await writeRunManifest(runDir, manifest);

  return {
    slug,
    runDir,
    capture,
    scenePlan,
    manifestPath,
    files: {
      scenePlanPath,
      vidsPromptsPath,
      postCopyPath,
      vidsClipCachePath,
      generatedArchivePath
    }
  };
}
