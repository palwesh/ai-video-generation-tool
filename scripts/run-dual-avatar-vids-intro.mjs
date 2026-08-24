import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { parseArgs } from "../src/lib/args.mjs";
import { ensureDir, readJson, writeJson, writeText } from "../src/lib/fsx.mjs";
import { buildGoogleVidsClipPrompt } from "../src/lib/vids-master-prompt.mjs";

const args = parseArgs(process.argv.slice(2));
const projectRoot = process.cwd();
const outputRoot = path.resolve(args.output || "outputs/instagram/altftool_dual_avatar_vids_intro");
const runName = String(args["run-name"] || new Date().toISOString().replace(/[:.]/g, "-")).trim();
const runDir = path.join(outputRoot, "runs", runName);
const assetsDir = path.join(runDir, "assets");
const referenceDir = path.join(runDir, "avatar-references");
const googleVidsDir = path.join(runDir, "google-vids");
const exportDir = path.join(runDir, "google-vids-export");
const profileList = String(
  args.profiles || "work/hr-anslation.com,work/shejal.sahu-anslation.com-profile,work/google-vids-profile,work/google-vids-profile-2"
)
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);
const manualRecoveryWaitMs = Number(args["manual-recovery-wait"] || 600000);
const afterSubmitWaitMs = Number(args["after-submit-wait"] || 150000);
const exportTimeoutMs = Number(args["export-timeout"] || 900000);

const femaleSource = path.resolve(args.female || "public/avatar/altftool-female-host-young-main.png");
const maleSource = path.resolve(args.male || "public/avatar/altftool-male-host-main.png");

function runNode(label, scriptPath, scriptArgs) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath, ...scriptArgs], {
      cwd: projectRoot,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"]
    });
    let stdout = "";
    let stderr = "";
    console.log(`[${label}] ${process.execPath} ${scriptPath} ${scriptArgs.join(" ")}`);
    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      stdout += text;
      process.stdout.write(`[${label}] ${text}`);
    });
    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      stderr += text;
      process.stderr.write(`[${label}] ${text}`);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ code, stdout, stderr });
        return;
      }
      reject(new Error(`${label} failed with exit code ${code}. ${stderr || stdout}`.trim()));
    });
  });
}

function publicAssetFile(filePath) {
  return {
    path: filePath,
    name: path.basename(filePath),
    kind: path.extname(filePath).replace(".", "") || "file"
  };
}

async function copyIfExists(source, destination) {
  await fs.access(source);
  await fs.copyFile(source, destination);
  return destination;
}

const scenes = [
  {
    scene_number: 1,
    duration: 10,
    avatar: "Mia",
    voiceover: "Stop scrolling. Agar useful online tools dhundte dhundte time waste ho raha hai, AltFTool ko abhi save kar lo.",
    onscreen_text: "Stop scrolling. Save AltFTool.",
    visual: "Female AI avatar intro, direct eye contact, punchy hook, clean SaaS desk setup, laptop beside presenter with AltFTool.com visible.",
    video_prompt: "Create a 10-second 9:16 vertical portrait AI avatar hook clip. Use/select a realistic young Indian female Google Vids avatar like Mia if available. She speaks the exact hook line naturally in Hinglish. Show clean office lighting, a laptop beside her with AltFTool.com visible as context, confident hand gesture, no fake UI, no personal information."
  },
  {
    scene_number: 2,
    duration: 10,
    avatar: "William",
    voiceover: "AltFTool par PDF, privacy, salary slip, AI text, editing aur productivity ke micro tools ek jagah milte hain.",
    onscreen_text: "Micro tools. One place.",
    visual: "Male AI avatar explains the value clearly, modern laptop setup, quick proof-focused intro to the tool library.",
    video_prompt: "Create a 10-second 9:16 vertical portrait AI avatar explainer clip. Use/select a realistic Indian male Google Vids avatar like William if available. He speaks the exact line naturally in Hinglish. Keep the frame full-screen avatar-led with a laptop/phone showing AltFTool.com as context, professional daylight, no fake UI, no personal information."
  },
  {
    scene_number: 3,
    duration: 10,
    avatar: "Mia",
    voiceover: "AltFTool.com try karo, link caption me hai. Follow altftools review for daily real tool demos, aur reel save kar lo.",
    onscreen_text: "Try AltFTool.com",
    visual: "Female AI avatar CTA, upbeat close, phone with generic Instagram caption draft, AltFTool logo/link visible.",
    video_prompt: "Create a 10-second 9:16 vertical portrait AI avatar CTA clip. Use/select the same realistic young Indian female Google Vids avatar like Mia if available. She speaks the exact CTA naturally in Hinglish. Show a phone with a generic caption draft, AltFTool.com visible, friendly save/follow gesture, no real account details, no fake UI."
  }
];

async function preparePack() {
  await ensureDir(runDir);
  await ensureDir(assetsDir);
  await ensureDir(referenceDir);
  await ensureDir(googleVidsDir);
  await ensureDir(exportDir);

  const femaleReference = await copyIfExists(femaleSource, path.join(referenceDir, "female-avatar-reference.png"));
  const maleReference = await copyIfExists(maleSource, path.join(referenceDir, "male-avatar-reference.png"));

  const scenePlan = {
    scenes,
    metadata: {
      generated_at: new Date().toISOString(),
      language: "Hinglish",
      script_type: "Hinglish",
      scene_count: scenes.length,
      scene_duration_seconds: 10,
      total_duration_seconds: 30,
      video_size: "portrait_9_16",
      purpose: "AltFTool dual-avatar Instagram intro generated with Google Vids."
    }
  };

  const manifest = {
    version: 1,
    generatedAt: new Date().toISOString(),
    tool: {
      tool_name: "AltFTool",
      tool_url: "https://www.altftool.com/",
      description: "AltFTool is a library of practical micro tools for daily digital work."
    },
    runDir,
    assetsDir,
    capture: {
      files: [femaleReference, maleReference]
    },
    avatarReferences: {
      female: femaleReference,
      male: maleReference
    },
    googleVids: {
      avatarMap: Object.fromEntries(scenes.map((scene) => [scene.scene_number, scene.avatar])),
      note: "Google Vids built-in avatars are selected by name when available; reference images are saved for visual guidance."
    }
  };

  const scenePlanPath = path.join(runDir, "scene-plan.json");
  const manifestPath = path.join(runDir, "manifest.json");
  await writeJson(scenePlanPath, scenePlan);
  await writeJson(manifestPath, manifest);

  for (const scene of scenes) {
    const prompt = buildGoogleVidsClipPrompt(scenePlan, scene.scene_number, manifest, {
      referenceFiles: scene.scene_number === 2 ? [maleReference] : [femaleReference]
    });
    await writeText(path.join(runDir, `google-vids-scene-${String(scene.scene_number).padStart(2, "0")}-prompt.txt`), `${prompt}\n`);
    await writeText(path.join(runDir, `scene-${String(scene.scene_number).padStart(2, "0")}-script.txt`), `${scene.voiceover}\n`);
  }

  await writeText(path.join(runDir, "README.md"), [
    "# AltFTool Dual Avatar Vids Intro",
    "",
    "Goal: create a 30-second intro from three 10-second Google Vids avatar clips.",
    "",
    "Scene avatar map:",
    ...scenes.map((scene) => `- Scene ${scene.scene_number}: ${scene.avatar} - ${scene.onscreen_text}`),
    "",
    "Reference images:",
    `- Female: ${femaleReference}`,
    `- Male: ${maleReference}`,
    "",
    "Final output is exported from Google Vids when generation succeeds."
  ].join("\n"));

  return { scenePlanPath, manifestPath, femaleReference, maleReference };
}

async function generateAndExport(pack) {
  const attempts = [];
  const ingredients = [pack.femaleReference, pack.maleReference].join(",");
  const avatarMap = scenes.map((scene) => `${scene.scene_number}:${scene.avatar}`).join(",");

  for (const profile of profileList) {
    const profileSlug = path.basename(profile).replace(/[^\w.-]+/g, "-");
    const profileOperateDir = path.join(googleVidsDir, profileSlug);
    const profileExportDir = path.join(exportDir, profileSlug);
    await ensureDir(profileOperateDir);
    await ensureDir(profileExportDir);
    const attempt = { profile, operateDir: profileOperateDir, exportDir: profileExportDir, ok: false };
    attempts.push(attempt);

    try {
      await runNode(`operate:${profileSlug}`, "src/google-vids-operate.mjs", [
        "--scenes", pack.scenePlanPath,
        "--manifest", pack.manifestPath,
        "--all-scenes",
        "--max-scenes", "3",
        "--output", profileOperateDir,
        "--profile", profile,
        "--video-size", "portrait",
        "--require-portrait",
        "--avatar", "auto",
        "--avatar-map", avatarMap,
        "--avatar-scenes", "1,2,3",
        "--ingredients", ingredients,
        "--ingredients-scenes", "1,2,3",
        "--submit",
        "--insert",
        "--after-submit-wait", String(afterSubmitWaitMs),
        "--manual-recovery-wait", String(manualRecoveryWaitMs)
      ]);

      const operateReportPath = path.join(profileOperateDir, "vids-operator-report.json");
      const operateReport = await readJson(operateReportPath);
      attempt.operateReportPath = operateReportPath;
      attempt.vidsUrl = operateReport.currentUrl || "";
      if (!operateReport.ok || !attempt.vidsUrl) {
        throw new Error(operateReport.error || "Google Vids operate report did not include a Vids URL.");
      }

      await runNode(`export:${profileSlug}`, "src/google-vids-export.mjs", [
        "--url", attempt.vidsUrl,
        "--output", profileExportDir,
        "--filename", "altftool-dual-avatar-vids-intro.mp4",
        "--profile", profile,
        "--timeout", String(exportTimeoutMs),
        "--manual-recovery-wait", String(manualRecoveryWaitMs)
      ]);

      const exportReportPath = path.join(profileExportDir, "google-vids-export-report.json");
      const exportReport = await readJson(exportReportPath);
      attempt.exportReportPath = exportReportPath;
      attempt.exportedPath = exportReport.savedPath || "";
      if (!exportReport.ok || !attempt.exportedPath) {
        throw new Error(exportReport.error || exportReport.failure || "Google Vids export did not save an MP4.");
      }

      const finalPath = path.join(outputRoot, "altftool-dual-avatar-vids-intro.mp4");
      await fs.copyFile(attempt.exportedPath, finalPath);
      attempt.ok = true;
      attempt.finalPath = finalPath;
      return attempt;
    } catch (error) {
      attempt.error = error.message;
      console.error(`[profile failed] ${profile}: ${error.message}`);
    }
  }

  throw new Error(`All Google Vids profiles failed. Last error: ${attempts.at(-1)?.error || "unknown"}`);
}

async function main() {
  const pack = await preparePack();
  const report = {
    ok: false,
    runDir,
    outputRoot,
    scenePlanPath: pack.scenePlanPath,
    manifestPath: pack.manifestPath,
    profiles: profileList,
    generatedAt: new Date().toISOString(),
    files: [
      publicAssetFile(pack.scenePlanPath),
      publicAssetFile(pack.manifestPath),
      publicAssetFile(path.join(runDir, "README.md"))
    ]
  };

  if (args["prepare-only"]) {
    report.ok = true;
    report.mode = "prepare_only";
    await writeJson(path.join(runDir, "dual-avatar-vids-intro-report.json"), report);
    console.log(`Prepared intro pack: ${runDir}`);
    return;
  }

  const result = await generateAndExport(pack);
  report.ok = true;
  report.mode = "generated_exported";
  report.result = result;
  report.finalPath = result.finalPath;
  report.vidsUrl = result.vidsUrl;
  report.files.push(publicAssetFile(result.finalPath));
  await writeJson(path.join(runDir, "dual-avatar-vids-intro-report.json"), report);
  await writeJson(path.join(outputRoot, "latest-report.json"), report);
  console.log(`Final Vids intro: ${result.finalPath}`);
}

main().catch(async (error) => {
  const reportPath = path.join(runDir, "dual-avatar-vids-intro-report.json");
  await ensureDir(runDir).catch(() => {});
  await writeJson(reportPath, {
    ok: false,
    error: error.message,
    runDir,
    outputRoot,
    profiles: profileList,
    generatedAt: new Date().toISOString()
  }).catch(() => {});
  console.error(error.message);
  console.error(`Report: ${reportPath}`);
  process.exit(1);
});
