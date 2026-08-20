import path from "node:path";
import { ensureDir, writeJson, writeText } from "./fsx.mjs";

export const FREE_VIDEO_PROVIDER_FOLDER = "free-video-providers";

export const freeVideoProviders = [
  {
    id: "capcut",
    label: "CapCut Text to Video",
    url: "https://www.capcut.com/tools/text-to-video-ai",
    access: "Free/manual account flow",
    bestFor: "script-to-video drafts, captions, voiceover, effects"
  },
  {
    id: "pika",
    label: "Pika",
    url: "https://pika.art/",
    access: "Free monthly credits/manual account flow",
    bestFor: "short AI B-roll and creative 5-10 second scene clips"
  },
  {
    id: "runway",
    label: "Runway",
    url: "https://runwayml.com/",
    access: "Free starter credits/manual account flow",
    bestFor: "higher quality AI B-roll and image-to-video clips"
  },
  {
    id: "canva",
    label: "Canva AI Video",
    url: "https://www.canva.com/features/ai-video-generator/",
    access: "Limited account credits when available",
    bestFor: "simple social video clips and design-first scenes"
  },
  {
    id: "did",
    label: "D-ID Trial Avatar",
    url: "https://www.d-id.com/pricing/api",
    access: "Trial credits/manual or API account flow",
    bestFor: "talking avatar hook or CTA clips"
  },
  {
    id: "shotstack",
    label: "Shotstack Sandbox",
    url: "https://shotstack.io/",
    access: "Free developer sandbox",
    bestFor: "cloud render/edit tests when local render is not enough"
  }
];

const providerById = new Map(freeVideoProviders.map((provider) => [provider.id, provider]));

function csvEscape(value) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function sceneToken(sceneNumber) {
  return String(Number(sceneNumber)).padStart(2, "0");
}

export function normalizeFreeVideoProviders(value) {
  const raw = Array.isArray(value)
    ? value
    : String(value || "all")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

  const wanted = raw.some((item) => /^all|free|default$/i.test(item))
    ? freeVideoProviders.map((provider) => provider.id)
    : raw.map((item) => item.toLowerCase());

  const seen = new Set();
  return wanted
    .map((id) => providerById.get(id))
    .filter(Boolean)
    .filter((provider) => {
      if (seen.has(provider.id)) {
        return false;
      }
      seen.add(provider.id);
      return true;
    });
}

function compact(value, max = 900) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 3)}...` : text;
}

function providerPrompt(provider, scene, manifest = {}) {
  const tool = manifest.tool || {};
  const toolName = tool.tool_name || tool.topic || manifest.topic || "this micro tool";
  const toolUrl = tool.tool_url || "";
  const sceneNumber = sceneToken(scene.scene_number);
  const base = [
    `Create one 10-second vertical 9:16 Instagram Reel scene for ${toolName}.`,
    `Scene ${scene.scene_number}: ${scene.visual || scene.onscreen_text || ""}`,
    `Voiceover: ${scene.voiceover || ""}`,
    `On-screen caption: ${scene.onscreen_text || ""}`,
    toolUrl ? `Actual tool URL to reference: ${toolUrl}` : "",
    "Use realistic SaaS/UGC style, clean captions, fast cuts, cursor highlights, and fictional/demo data only.",
    "Do not invent a fake UI. If the provider supports image/video references, upload the real captured screenshots or demo recording from this tool folder.",
    `Export or download the finished clip as MP4, then save it in this scene folder and also copy it to ../../vids-clips/scene-${sceneNumber}.mp4 for final local merge.`
  ].filter(Boolean).join(" ");

  const providerTips = {
    capcut: "CapCut tip: use Script to Video, paste the voiceover, then replace unrelated visuals with captured tool screenshots/screen recordings where possible.",
    pika: "Pika tip: use image-to-video with the real tool screenshot for demo/proof scenes; keep motion subtle and UI readable.",
    runway: "Runway tip: prefer image-to-video using the real screenshot as the first frame for tool scenes; use text-to-video only for hook/CTA human shots.",
    canva: "Canva tip: generate one short clip, add it to a vertical design, then export MP4.",
    did: "D-ID tip: use only hook/CTA scenes for avatar talking-head clips; paste the voiceover exactly.",
    shotstack: "Shotstack tip: use this prompt as edit direction with local screenshots/recordings; it is more useful for render automation than AI footage."
  };

  return compact(`${base} ${providerTips[provider.id] || ""}`, 1200);
}

function rootReadme(providers) {
  return [
    "# Free Video Provider Pack",
    "",
    "This folder keeps prompts for free or free-trial video tools outside Google Vids.",
    "",
    "Workflow:",
    "",
    "1. Open a provider folder such as `capcut/`, `pika/`, or `runway/`.",
    "2. Open the provider URL from that folder's README.",
    "3. Use the scene prompt and real screenshots/recordings from this tool folder.",
    "4. Download/export each scene as MP4.",
    "5. Save the final scene clip as `scene-01.mp4`, `scene-02.mp4`, etc. inside `../vids-clips/`.",
    "6. Run Local MP4 mode again; the final editor uses cached clips first.",
    "",
    "Providers in this pack:",
    "",
    ...providers.map((provider) => `- ${provider.label}: ${provider.url} (${provider.access})`),
    "",
    "Use only accounts you control and follow each provider's limits/terms.",
    ""
  ].join("\n");
}

function providerReadme(provider) {
  return [
    `# ${provider.label}`,
    "",
    `URL: ${provider.url}`,
    `Access: ${provider.access}`,
    `Best for: ${provider.bestFor}`,
    "",
    "Scene folders contain `prompt.txt`, `voiceover.txt`, `caption.txt`, and `notes.md`.",
    "",
    "After downloading a clip, copy it to:",
    "",
    "```text",
    "../../vids-clips/scene-XX.mp4",
    "```",
    "",
    "The local final renderer checks `vids-clips/` first.",
    ""
  ].join("\n");
}

export async function writeFreeVideoProviderPack(runDir, scenePlan, manifest = {}, options = {}) {
  const providers = normalizeFreeVideoProviders(options.providers || "all");
  const root = path.join(runDir, FREE_VIDEO_PROVIDER_FOLDER);
  await ensureDir(root);
  const scenes = Array.isArray(scenePlan?.scenes) ? scenePlan.scenes : [];

  await writeText(path.join(root, "README.md"), rootReadme(providers));

  const rows = [
    ["provider", "provider_url", "scene_number", "duration", "voiceover", "onscreen_text", "prompt", "save_as"]
  ];
  const manifestProviders = [];

  for (const provider of providers) {
    const providerDir = path.join(root, provider.id);
    await ensureDir(providerDir);
    await writeText(path.join(providerDir, "README.md"), providerReadme(provider));

    const providerRows = [
      ["scene_number", "duration", "voiceover", "onscreen_text", "prompt", "save_as"]
    ];

    for (const scene of scenes) {
      const sceneNumber = sceneToken(scene.scene_number);
      const sceneDir = path.join(providerDir, `scene-${sceneNumber}`);
      const prompt = providerPrompt(provider, scene, manifest);
      const saveAs = `../../vids-clips/scene-${sceneNumber}.mp4`;
      await ensureDir(sceneDir);
      await writeText(path.join(sceneDir, "prompt.txt"), `${prompt}\n`);
      await writeText(path.join(sceneDir, "voiceover.txt"), `${scene.voiceover || ""}\n`);
      await writeText(path.join(sceneDir, "caption.txt"), `${scene.onscreen_text || ""}\n`);
      await writeText(path.join(sceneDir, "notes.md"), [
        `# ${provider.label} - Scene ${sceneNumber}`,
        "",
        `Open: ${provider.url}`,
        "",
        "## Save Downloaded Clip",
        "",
        `Copy the approved MP4 to \`${saveAs}\` for final render reuse.`,
        "",
        "## Prompt",
        "",
        prompt,
        ""
      ].join("\n"));
      rows.push([provider.id, provider.url, scene.scene_number, scene.duration, scene.voiceover, scene.onscreen_text, prompt, saveAs]);
      providerRows.push([scene.scene_number, scene.duration, scene.voiceover, scene.onscreen_text, prompt, saveAs]);
    }

    await writeText(
      path.join(providerDir, `${provider.id}-scene-prompts.csv`),
      `${providerRows.map((row) => row.map(csvEscape).join(",")).join("\n")}\n`
    );
    manifestProviders.push(provider);
  }

  const csvPath = path.join(root, "all-free-provider-prompts.csv");
  await writeText(csvPath, `${rows.map((row) => row.map(csvEscape).join(",")).join("\n")}\n`);
  const manifestPath = path.join(root, "free-video-provider-manifest.json");
  await writeJson(manifestPath, {
    version: 1,
    generatedAt: new Date().toISOString(),
    folder: root,
    providers: manifestProviders,
    promptCsv: csvPath,
    sceneCount: scenes.length
  });

  return {
    folder: root,
    manifestPath,
    promptCsv: csvPath,
    providers: manifestProviders
  };
}
