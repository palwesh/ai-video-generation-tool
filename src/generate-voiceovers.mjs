import path from "node:path";
import fs from "node:fs/promises";
import { spawn } from "node:child_process";
import dotenv from "dotenv";
import { parseArgs } from "./lib/args.mjs";
import { ensureDir, readJson, writeJson } from "./lib/fsx.mjs";

dotenv.config({ quiet: true });

const args = parseArgs(process.argv.slice(2));
const toolDir = args["tool-dir"] ? path.resolve(args["tool-dir"]) : null;
const provider = String(args.provider || args["tts-provider"] || process.env.TRF_TTS_PROVIDER || "openai").trim().toLowerCase();
const spokenField = args["spoken-field"] || process.env.TRF_SPOKEN_FIELD || "voiceover_audio";
const voiceoverDir = args["voiceover-dir"]
  ? path.resolve(args["voiceover-dir"])
  : path.join(toolDir || process.cwd(), "voiceovers");
const overwrite = Boolean(args.overwrite);

if (!toolDir) {
  console.error("Missing --tool-dir.");
  console.error("Example: npm run voiceover:generate -- --tool-dir outputs/runs/.../tool-folder --provider openai");
  process.exit(1);
}

function normalizeLine(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/\s+([।.!?,])/g, "$1")
    .trim();
}

function sceneToken(index) {
  return String(index + 1).padStart(2, "0");
}

async function existingAudio(sceneNumber) {
  const token = String(sceneNumber).padStart(2, "0");
  const candidates = [
    path.join(voiceoverDir, `scene-${token}.mp3`),
    path.join(voiceoverDir, `scene-${token}.wav`),
    path.join(voiceoverDir, `scene-${token}.m4a`),
    path.join(voiceoverDir, `voiceover-scene-${sceneNumber}.mp3`),
    path.join(voiceoverDir, `voiceover-scene-${sceneNumber}.wav`),
    path.join(voiceoverDir, `voiceover-scene-${sceneNumber}.m4a`)
  ];
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

async function writeAudioResponse(response, outputPath, label) {
  if (!response.ok) {
    let message = response.statusText;
    try {
      const json = await response.json();
      message = json?.error?.message || json?.detail?.message || json?.message || message;
    } catch {
      message = await response.text().catch(() => message);
    }
    throw new Error(`${label} TTS failed: ${message}`);
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(outputPath, bytes);
  return {
    outputPath,
    sizeBytes: bytes.length
  };
}

function commandUnavailableMessage(command) {
  if (command === "edge-tts") {
    return "edge-tts command is not installed. Install free Edge TTS with: python3 -m pip install edge-tts";
  }
  return `${command} command is not available.`;
}

function runCommand(label, command, commandArgs) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, commandArgs, {
      cwd: process.cwd(),
      shell: process.platform === "win32",
      windowsHide: true
    });
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr?.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => {
      if (error.code === "ENOENT") {
        reject(new Error(commandUnavailableMessage(command)));
        return;
      }
      reject(error);
    });
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }
      reject(new Error(`${label} failed with code ${code}: ${(stderr || stdout || "").trim()}`));
    });
  });
}

async function runFirstAvailable(label, candidates, installHint) {
  const errors = [];
  for (const candidate of candidates) {
    try {
      return await runCommand(label, candidate.command, candidate.args);
    } catch (error) {
      errors.push(error.message);
    }
  }
  throw new Error(`${errors.at(-1) || `${label} command failed.`} ${installHint}`);
}

async function generateOpenAiVoice(text, outputPath) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is missing.");
  }
  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: args.model || process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts",
      voice: args.voice || process.env.OPENAI_TTS_VOICE || "verse",
      input: text,
      response_format: "mp3",
      speed: Number(args.speed || process.env.OPENAI_TTS_SPEED || 1),
      instructions: args.instructions || process.env.OPENAI_TTS_INSTRUCTIONS || "Natural Indian Hinglish/Hindi Instagram Reel voiceover. Sound warm, confident, human, conversational, not robotic. Use natural pauses and clear pronunciation."
    })
  });
  return await writeAudioResponse(response, outputPath, "OpenAI");
}

async function generateElevenLabsVoice(text, outputPath) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = args.voice || process.env.ELEVENLABS_VOICE_ID;
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY is missing.");
  }
  if (!voiceId) {
    throw new Error("ELEVENLABS_VOICE_ID or --voice is required.");
  }
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "accept": "audio/mpeg",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      text,
      model_id: args.model || process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2",
      voice_settings: {
        stability: Number(args.stability || process.env.ELEVENLABS_STABILITY || 0.42),
        similarity_boost: Number(args["similarity-boost"] || process.env.ELEVENLABS_SIMILARITY_BOOST || 0.78),
        style: Number(args.style || process.env.ELEVENLABS_STYLE || 0.35),
        use_speaker_boost: String(args["speaker-boost"] || process.env.ELEVENLABS_SPEAKER_BOOST || "true") !== "false"
      }
    })
  });
  return await writeAudioResponse(response, outputPath, "ElevenLabs");
}

async function generateEdgeVoice(text, outputPath) {
  const voice = args.voice || process.env.EDGE_TTS_VOICE || "hi-IN-SwaraNeural";
  const rate = args.rate || process.env.EDGE_TTS_RATE || "+6%";
  const pitch = args.pitch || process.env.EDGE_TTS_PITCH || "+0Hz";
  const volume = args.volume || process.env.EDGE_TTS_VOLUME || "+0%";
  const commandArgs = [
    "--voice", voice,
    "--rate", rate,
    "--pitch", pitch,
    "--volume", volume,
    "--text", text,
    "--write-media", outputPath
  ];
  const localVenvPython = path.resolve(
    process.cwd(),
    "work",
    "edge-tts-venv",
    process.platform === "win32" ? path.join("Scripts", "python.exe") : path.join("bin", "python")
  );
  const configuredPython = process.env.EDGE_TTS_PYTHON || "";
  const pythonCandidates = process.platform === "win32"
    ? [
      ...(configuredPython ? [{ command: configuredPython, args: ["-m", "edge_tts", ...commandArgs] }] : []),
      { command: localVenvPython, args: ["-m", "edge_tts", ...commandArgs] },
      { command: "py", args: ["-m", "edge_tts", ...commandArgs] },
      { command: "python", args: ["-m", "edge_tts", ...commandArgs] }
    ]
    : [
      ...(configuredPython ? [{ command: configuredPython, args: ["-m", "edge_tts", ...commandArgs] }] : []),
      { command: localVenvPython, args: ["-m", "edge_tts", ...commandArgs] },
      { command: "python3", args: ["-m", "edge_tts", ...commandArgs] },
      { command: "python", args: ["-m", "edge_tts", ...commandArgs] }
    ];
  await runFirstAvailable(
    "Edge TTS",
    [{ command: "edge-tts", args: commandArgs }, ...pythonCandidates],
    process.platform === "win32"
      ? "Install free Edge TTS with: py -m pip install edge-tts"
      : "Install free Edge TTS with: python3 -m pip install edge-tts"
  );
  const stat = await fs.stat(outputPath);
  return {
    outputPath,
    sizeBytes: stat.size,
    voice,
    rate,
    pitch,
    volume
  };
}

async function generateVoice(text, outputPath) {
  if (provider === "elevenlabs" || provider === "eleven") {
    return await generateElevenLabsVoice(text, outputPath);
  }
  if (provider === "openai") {
    return await generateOpenAiVoice(text, outputPath);
  }
  if (provider === "edge" || provider === "edge-tts" || provider === "free") {
    return await generateEdgeVoice(text, outputPath);
  }
  throw new Error(`Unsupported TTS provider "${provider}". Use openai, elevenlabs, or edge.`);
}

await ensureDir(voiceoverDir);
const scenePlan = await readJson(path.join(toolDir, "scene-plan.json"));
const scenes = Array.isArray(scenePlan.scenes) ? scenePlan.scenes : [];
const report = {
  ok: false,
  provider,
  toolDir,
  voiceoverDir,
  spokenField,
  generatedAt: new Date().toISOString(),
  scenes: [],
  warnings: []
};

try {
  for (const [index, scene] of scenes.entries()) {
    const sceneNumber = index + 1;
    const already = await existingAudio(sceneNumber);
    if (already && !overwrite) {
      report.scenes.push({
        sceneNumber,
        status: "skipped_existing",
        outputPath: already
      });
      continue;
    }

    const text = normalizeLine(scene?.[spokenField] || scene?.spoken_voiceover || scene?.voiceover);
    if (!text) {
      report.scenes.push({
        sceneNumber,
        status: "skipped_empty_text",
        outputPath: ""
      });
      continue;
    }

    const outputPath = path.join(voiceoverDir, `scene-${sceneToken(index)}.mp3`);
    try {
      const generated = await generateVoice(text, outputPath);
      report.scenes.push({
        sceneNumber,
        status: "generated",
        outputPath: generated.outputPath,
        sizeBytes: generated.sizeBytes,
        voice: generated.voice || args.voice || "",
        rate: generated.rate || args.rate || "",
        text
      });
      console.log(`Generated voiceover scene ${sceneNumber}: ${outputPath}`);
    } catch (error) {
      report.scenes.push({
        sceneNumber,
        status: "failed",
        outputPath: "",
        error: error.message
      });
      report.warnings.push(`Scene ${sceneNumber}: ${error.message}`);
      console.warn(`Scene ${sceneNumber} voiceover failed: ${error.message}`);
    }
  }

  report.ok = report.scenes.some((scene) => scene.status === "generated" || scene.status === "skipped_existing");
  report.generatedCount = report.scenes.filter((scene) => scene.status === "generated").length;
  report.existingCount = report.scenes.filter((scene) => scene.status === "skipped_existing").length;
} catch (error) {
  report.error = error.message;
}

const reportPath = path.join(voiceoverDir, "voiceover-generation-report.json");
await writeJson(reportPath, report);
console.log(`Voiceover generation report: ${reportPath}`);
if (!report.ok) {
  process.exitCode = 1;
}
