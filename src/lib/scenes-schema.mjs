import { clampSceneCount, SCENE_DURATION_SECONDS } from "./reel-planner.mjs";

export function buildScenesJsonSchema(sceneCount = 6) {
  const count = clampSceneCount(sceneCount);
  return {
    type: "object",
    additionalProperties: false,
    required: ["scenes"],
    properties: {
      scenes: {
        type: "array",
        minItems: count,
        maxItems: count,
        items: {
          type: "object",
          additionalProperties: false,
          required: [
            "scene_number",
            "duration",
            "voiceover",
            "visual",
            "onscreen_text",
            "video_prompt"
          ],
          properties: {
            scene_number: { type: "integer", minimum: 1, maximum: count },
            duration: { type: "integer", const: SCENE_DURATION_SECONDS },
            voiceover: { type: "string" },
            visual: { type: "string" },
            onscreen_text: { type: "string" },
            video_prompt: { type: "string" }
          }
        }
      }
    }
  };
}

export const scenesJsonSchema = buildScenesJsonSchema(6);

export function validateScenePlan(plan, options = {}) {
  const expectedSceneCount = clampSceneCount(options.sceneCount || plan?.metadata?.scene_count || 6);
  if (!plan || !Array.isArray(plan.scenes)) {
    throw new Error("Scene plan must contain a scenes array.");
  }

  if (plan.scenes.length !== expectedSceneCount) {
    throw new Error(`Scene plan must contain exactly ${expectedSceneCount} scenes. Found ${plan.scenes.length}.`);
  }

  for (const [index, scene] of plan.scenes.entries()) {
    const expectedNumber = index + 1;
    if (scene.scene_number !== expectedNumber) {
      throw new Error(`Scene ${expectedNumber} has invalid scene_number.`);
    }

    if (scene.duration !== SCENE_DURATION_SECONDS) {
      throw new Error(`Scene ${expectedNumber} must be ${SCENE_DURATION_SECONDS} seconds.`);
    }

    for (const key of ["voiceover", "visual", "onscreen_text", "video_prompt"]) {
      if (typeof scene[key] !== "string" || scene[key].trim() === "") {
        throw new Error(`Scene ${expectedNumber} is missing ${key}.`);
      }
    }

    if (!/^Create a 10-second (9:16 vertical|16:9 landscape|1:1 square) video/.test(scene.video_prompt)) {
      throw new Error(`Scene ${expectedNumber} video_prompt has an invalid opening.`);
    }
  }
}
