export const scenesJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["scenes"],
  properties: {
    scenes: {
      type: "array",
      minItems: 7,
      maxItems: 7,
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
          scene_number: { type: "integer", minimum: 1, maximum: 7 },
          duration: { type: "integer", const: 10 },
          voiceover: { type: "string" },
          visual: { type: "string" },
          onscreen_text: { type: "string" },
          video_prompt: { type: "string" }
        }
      }
    }
  }
};

export function validateScenePlan(plan) {
  if (!plan || !Array.isArray(plan.scenes)) {
    throw new Error("Scene plan must contain a scenes array.");
  }

  if (plan.scenes.length !== 7) {
    throw new Error(`Scene plan must contain exactly 7 scenes. Found ${plan.scenes.length}.`);
  }

  for (const [index, scene] of plan.scenes.entries()) {
    const expectedNumber = index + 1;
    if (scene.scene_number !== expectedNumber) {
      throw new Error(`Scene ${expectedNumber} has invalid scene_number.`);
    }

    if (scene.duration !== 10) {
      throw new Error(`Scene ${expectedNumber} must be 10 seconds.`);
    }

    for (const key of ["voiceover", "visual", "onscreen_text", "video_prompt"]) {
      if (typeof scene[key] !== "string" || scene[key].trim() === "") {
        throw new Error(`Scene ${expectedNumber} is missing ${key}.`);
      }
    }

    if (!scene.video_prompt.startsWith("Create a 10-second 9:16 vertical video")) {
      throw new Error(`Scene ${expectedNumber} video_prompt has an invalid opening.`);
    }
  }
}
