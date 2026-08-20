import path from "node:path";
import { writeJson, ensureDir } from "./fsx.mjs";
import { slugify } from "./slug.mjs";
import { captureToolWebsite } from "./capture.mjs";
import { generateScenePlanWithAi } from "./ai.mjs";
import { generateFallbackScenePlan } from "./fallback.mjs";
import { optimizeScenePlan } from "./scene-optimizer.mjs";
import { validateScenePlan } from "./scenes-schema.mjs";
import {
  writeAssetBrief,
  writeGoogleVidsPrompts,
  writePostCopy,
  writeReelScriptPackage,
  writeRunManifest,
  writeVidsGeneratedSceneFolders
} from "./output-writers.mjs";
import { ensureVidsClipCache } from "./vids-clip-cache.mjs";
import { ensureGeneratedArchive } from "./generated-archive.mjs";
import { writeFreeVideoProviderPack } from "./free-video-providers.mjs";

export async function processToolRow(row, batchDir, config, options = {}) {
  const sceneConfig = {
    ...config,
    sceneCount: options.sceneCount || config.sceneCount
  };
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
      scenePlan = await generateScenePlanWithAi(row, capture.summary, sceneConfig);
      generator = "ai";
    } catch (error) {
      scenePlan = null;
      capture.summary = `${capture.summary}\nAI generation failed, used fallback: ${error.message}`;
    }
  }

  if (!scenePlan) {
    scenePlan = generateFallbackScenePlan(row, capture.summary, sceneConfig);
  }

  scenePlan = optimizeScenePlan(scenePlan, row, capture, sceneConfig);
  validateScenePlan(scenePlan, { sceneCount: sceneConfig.sceneCount });

  const scenePlanPath = path.join(runDir, "scene-plan.json");
  await writeJson(scenePlanPath, scenePlan);
  const assetBriefPath = await writeAssetBrief(runDir, row, capture);
  const reelScriptPaths = await writeReelScriptPackage(runDir, scenePlan.metadata?.script_package || {});
  const vidsPromptsPath = await writeGoogleVidsPrompts(runDir, scenePlan);
  const postCopyPath = await writePostCopy(runDir, row, scenePlan);
  const vidsClipCachePath = await ensureVidsClipCache(runDir);
  const vidsGeneratedScenesPath = await writeVidsGeneratedSceneFolders(runDir, scenePlan);
  const freeVideoProviderPack = await writeFreeVideoProviderPack(runDir, scenePlan, { tool: row, capture }, {
    providers: options.freeVideoProviders || config.freeVideoProviders?.defaultProviders || "all"
  });
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
    vids_generated_scenes: {
      folder: vidsGeneratedScenesPath,
      note: "Scene-level Google Vids prompts and manually saved generated scene clips belong here."
    },
    free_video_providers: {
      folder: freeVideoProviderPack.folder,
      prompt_csv: freeVideoProviderPack.promptCsv,
      providers: freeVideoProviderPack.providers,
      note: "Free/free-trial provider prompts for CapCut, Pika, Runway, Canva, D-ID, and Shotstack. Downloaded clips can be copied into vids-clips for local merge."
    },
    generated_archive: {
      folder: generatedArchivePath,
      note: "Final videos, render reports, export logs, and generated support files are mirrored here."
    },
    files: {
      scene_plan: scenePlanPath,
      asset_brief: assetBriefPath,
      reel_script_md: reelScriptPaths.mdPath,
      reel_script_json: reelScriptPaths.jsonPath,
      google_vids_prompts: vidsPromptsPath,
      post_copy: postCopyPath,
      vids_clip_cache: vidsClipCachePath,
      vids_generated_scenes: vidsGeneratedScenesPath,
      free_video_provider_pack: freeVideoProviderPack.folder,
      free_video_provider_prompts: freeVideoProviderPack.promptCsv,
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
      assetBriefPath,
      reelScriptMdPath: reelScriptPaths.mdPath,
      reelScriptJsonPath: reelScriptPaths.jsonPath,
      vidsPromptsPath,
      postCopyPath,
      vidsClipCachePath,
      vidsGeneratedScenesPath,
      freeVideoProviderPackPath: freeVideoProviderPack.folder,
      freeVideoProviderPromptsPath: freeVideoProviderPack.promptCsv,
      generatedArchivePath
    }
  };
}
