import path from "node:path";
import dotenv from "dotenv";
import { parseArgs } from "./lib/args.mjs";
import { readJson, writeJson, ensureDir } from "./lib/fsx.mjs";
import { readToolRows } from "./lib/input.mjs";
import { processToolRow } from "./lib/tool-processor.mjs";

dotenv.config({ quiet: true });

const args = parseArgs(process.argv.slice(2));
const config = await readJson("config/default.json");

if (!args.input) {
  console.error("Missing --input. Example: npm run batch -- --input inputs/tools.xlsx --capture");
  process.exit(1);
}

const inputPath = path.resolve(args.input);
const toolBaseUrl = args["base-url"] || config.toolBaseUrl || "";
const rows = await readToolRows(inputPath, { toolBaseUrl });
const limit = args.limit ? Number(args.limit) : rows.length;
const useAi = !args["no-ai"] && Boolean(process.env.OPENAI_API_KEY);
const shouldCapture = Boolean(args.capture) || (config.capture?.enabled && !args["no-capture"]);
const batchStamp = new Date().toISOString().replace(/[:.]/g, "-");
const batchDir = path.resolve(args.out || config.output?.rootDir || "outputs/runs", batchStamp);
await ensureDir(batchDir);

const processed = [];

console.log(`Loaded ${rows.length} row(s) from ${inputPath}`);
console.log(`AI generation: ${useAi ? "enabled" : "fallback/local"}`);
console.log(`Website capture: ${shouldCapture ? "enabled" : "disabled"}`);
console.log(`Tool base URL: ${toolBaseUrl || "not configured"}`);
console.log(`Output: ${batchDir}`);

for (const row of rows.slice(0, limit)) {
  console.log(`\nProcessing: ${row.tool_name}`);
  const result = await processToolRow(row, batchDir, config, {
    capture: shouldCapture,
    useAi
  });

  console.log(`Captured ${result.capture.files.length} reference file(s).`);
  console.log(`Generated scene plan with ${useAi ? "AI/fallback" : "local fallback"}.`);

  processed.push({
    tool_name: row.tool_name,
    run_dir: result.runDir,
    manifest: result.manifestPath
  });
}

await writeJson(path.join(batchDir, "batch-summary.json"), {
  input: inputPath,
  generated_at: new Date().toISOString(),
  count: processed.length,
  processed
});

console.log(`\nDone. Created ${processed.length} run folder(s).`);
for (const item of processed) {
  console.log(`- ${item.tool_name}: ${item.run_dir}`);
}
