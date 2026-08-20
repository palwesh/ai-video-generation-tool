import path from "node:path";
import { parseArgs } from "./lib/args.mjs";
import { readJson } from "./lib/fsx.mjs";
import { writeGoogleVidsPrompts } from "./lib/output-writers.mjs";

const args = parseArgs(process.argv.slice(2));

if (!args.scenes) {
  console.error("Missing --scenes. Example: npm run vids:queue -- --scenes outputs/runs/.../scene-plan.json");
  process.exit(1);
}

const scenesPath = path.resolve(args.scenes);
const scenePlan = await readJson(scenesPath);
const outputPath = await writeGoogleVidsPrompts(path.dirname(scenesPath), scenePlan);

console.log(`Google Vids prompt queue written to ${outputPath}`);
