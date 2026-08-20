import path from "node:path";
import dotenv from "dotenv";
import { parseArgs } from "./lib/args.mjs";
import { readJson, writeJson, ensureDir } from "./lib/fsx.mjs";
import { readWorkbookTable, normalizeWorkbookObjects, normalizeToolRow } from "./lib/input.mjs";
import { processToolRow } from "./lib/tool-processor.mjs";
import { writeSimpleXlsx } from "./lib/simple-xlsx-writer.mjs";
import { folderHyperlink } from "./lib/link-cells.mjs";

dotenv.config({ quiet: true });

const args = parseArgs(process.argv.slice(2));
const config = await readJson("config/default.json");

if (!args.input) {
  console.error("Missing --input. Example: npm run prepare:free:capture -- --input /path/to/Book1.xlsx --limit 1");
  process.exit(1);
}

const inputPath = path.resolve(args.input);
const toolBaseUrl = args["base-url"] || config.toolBaseUrl || "";
const useAi = !args["no-ai"] && Boolean(process.env.OPENAI_API_KEY);
const shouldCapture = Boolean(args.capture) || (config.capture?.enabled && !args["no-capture"]);
const batchStamp = new Date().toISOString().replace(/[:.]/g, "-");
const batchDir = path.resolve(args.out || config.output?.rootDir || "outputs/runs", `prepared-${batchStamp}`);
await ensureDir(batchDir);

const table = await readWorkbookTable(inputPath);
const normalizedRows = normalizeWorkbookObjects(table.objects, { toolBaseUrl });
const normalizedBySourceRow = new Map(normalizedRows.map((row) => [row.source_row_number, row]));
const limit = args.limit ? Number(args.limit) : normalizedRows.length;
const selectedRows = normalizedRows.slice(0, limit);
const resultsBySourceRow = new Map();

console.log(`Loaded ${normalizedRows.length} tool row(s) from ${inputPath}`);
console.log(`Preparing ${selectedRows.length} row(s)`);
console.log(`AI generation: ${useAi ? "enabled" : "fallback/local"}`);
console.log(`Website capture: ${shouldCapture ? "enabled" : "disabled"}`);
console.log(`Tool base URL: ${toolBaseUrl || "not configured"}`);
console.log(`Output: ${batchDir}`);

for (const row of selectedRows) {
  console.log(`\nPreparing: ${row.tool_name}`);
  const result = await processToolRow(row, batchDir, config, {
    capture: shouldCapture,
    useAi
  });
  resultsBySourceRow.set(row.source_row_number, result);
  console.log(`Captured ${result.capture.files.length} reference file(s).`);
  console.log(`Run folder: ${result.runDir}`);
}

const extraHeaders = [
  "TRF Full Tool URL",
  "TRF Tool Route",
  "TRF Asset Folder",
  "TRF Scene Plan JSON",
  "TRF Google Vids Prompts CSV",
  "TRF Post Copy",
  "TRF Desktop Screenshot",
  "TRF Mobile Screenshot",
  "TRF Full Page Screenshot",
  "TRF Scroll Recording",
  "TRF Drive Upload Status",
  "TRF Drive Folder Link",
  "TRF Final Reel Voiceover",
  "TRF Scene 1 Voiceover",
  "TRF Scene 2 Voiceover",
  "TRF Scene 3 Voiceover",
  "TRF Scene 4 Voiceover",
  "TRF Scene 5 Voiceover",
  "TRF Scene 6 Voiceover",
  "TRF Scene 7 Voiceover",
  "TRF Scene 1 Vids Prompt",
  "TRF Scene 2 Vids Prompt",
  "TRF Scene 3 Vids Prompt",
  "TRF Scene 4 Vids Prompt",
  "TRF Scene 5 Vids Prompt",
  "TRF Scene 6 Vids Prompt",
  "TRF Scene 7 Vids Prompt",
  "TRF Data Prep Status",
  "TRF Data Prep Note",
  "TRF Google Vids Status",
  "TRF Google Vids Link",
  "TRF Vids Clip Cache Folder",
  "TRF Vids Cached Clips",
  "TRF Final MP4 Path",
  "TRF QA Status",
  "TRF Last Automation Run",
  "TRF Final Video Link",
  "TRF Final Video Folder Link",
  "TRF Run Folder Link",
  "TRF Generated Folder",
  "TRF Generated Files"
];

function firstFile(files, name) {
  return files.find((filePath) => filePath.endsWith(name)) || "";
}

function valuesFromMap(values) {
  return extraHeaders.map((header) => values[header] || "");
}

function enrichmentFor(sourceRowNumber) {
  const normalized = normalizedBySourceRow.get(sourceRowNumber);

  if (!normalized) {
    return extraHeaders.map(() => "");
  }

  const result = resultsBySourceRow.get(sourceRowNumber);

  if (!result) {
    return valuesFromMap({
      "TRF Full Tool URL": normalized.tool_url,
      "TRF Tool Route": normalized.tool_route,
      "TRF Drive Upload Status": "Not uploaded",
      "TRF Data Prep Status": "Pending",
      "TRF Data Prep Note": "Not processed in this run.",
      "TRF Google Vids Status": "Not started"
    });
  }

  const scenes = result.scenePlan.scenes;
  const captureFiles = result.capture.files || [];
  const finalVoiceover = scenes.map((scene) => scene.voiceover).join(" ");
  const sceneVoiceovers = scenes.map((scene) => scene.voiceover);
  const scenePrompts = scenes.map((scene) => scene.video_prompt);
  const values = {
    "TRF Full Tool URL": normalized.tool_url,
    "TRF Tool Route": normalized.tool_route,
    "TRF Asset Folder": result.runDir,
    "TRF Scene Plan JSON": result.files.scenePlanPath,
    "TRF Google Vids Prompts CSV": result.files.vidsPromptsPath,
    "TRF Post Copy": result.files.postCopyPath,
    "TRF Desktop Screenshot": firstFile(captureFiles, "desktop-top.png"),
    "TRF Mobile Screenshot": firstFile(captureFiles, "mobile-top.png"),
    "TRF Full Page Screenshot": firstFile(captureFiles, "desktop-full-page.png"),
    "TRF Scroll Recording": firstFile(captureFiles, "mobile-scroll.webm"),
    "TRF Drive Upload Status": "Not uploaded",
    "TRF Drive Folder Link": "",
    "TRF Final Reel Voiceover": finalVoiceover,
    "TRF Data Prep Status": result.capture.enabled ? "Prepared with capture" : "Prepared without capture",
    "TRF Data Prep Note": result.capture.summary,
    "TRF Google Vids Status": "Prompt CSV ready",
    "TRF Google Vids Link": "",
    "TRF Vids Clip Cache Folder": result.files.vidsClipCachePath || path.join(result.runDir, "vids-clips"),
    "TRF Vids Cached Clips": "",
    "TRF Generated Folder": result.files.generatedArchivePath || path.join(result.runDir, "generated"),
    "TRF Generated Files": "",
    "TRF Final MP4 Path": "",
    "TRF QA Status": "Needs human review",
    "TRF Last Automation Run": new Date().toISOString(),
    "TRF Final Video Link": "",
    "TRF Final Video Folder Link": "",
    "TRF Run Folder Link": folderHyperlink(result.runDir, "Open run folder")
  };

  sceneVoiceovers.forEach((voiceover, index) => {
    values[`TRF Scene ${index + 1} Voiceover`] = voiceover;
  });
  scenePrompts.forEach((prompt, index) => {
    values[`TRF Scene ${index + 1} Vids Prompt`] = prompt;
  });

  return valuesFromMap(values);
}

const outputRows = [
  [...table.headers, ...extraHeaders],
  ...table.dataRows.map((row, index) => {
    const sourceRowNumber = index + 2;
    return [...row, ...enrichmentFor(sourceRowNumber)];
  })
];

const preparedWorkbookPath = path.join(batchDir, "prepared-tool-reel-workbook.xlsx");
await writeSimpleXlsx(preparedWorkbookPath, outputRows, "Tool Reel Prep");

const summary = {
  input: inputPath,
  generated_at: new Date().toISOString(),
  output_workbook: preparedWorkbookPath,
  total_tool_rows: normalizedRows.length,
  processed_count: selectedRows.length,
  capture_enabled: shouldCapture,
  ai_enabled: useAi,
  tool_base_url: toolBaseUrl,
  processed: selectedRows.map((row) => {
    const result = resultsBySourceRow.get(row.source_row_number);
    return {
      source_row_number: row.source_row_number,
      tool_name: row.tool_name,
      tool_url: row.tool_url,
      run_dir: result?.runDir || "",
      vids_clip_cache_folder: result?.files.vidsClipCachePath || "",
      generated_folder: result?.files.generatedArchivePath || "",
      captured_files: result?.capture.files?.length || 0
    };
  })
};

await writeJson(path.join(batchDir, "prep-summary.json"), summary);

console.log(`\nPrepared workbook: ${preparedWorkbookPath}`);
console.log(`Summary: ${path.join(batchDir, "prep-summary.json")}`);
