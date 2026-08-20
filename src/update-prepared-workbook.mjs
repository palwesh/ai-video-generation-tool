import path from "node:path";
import { parseArgs } from "./lib/args.mjs";
import { readWorkbookTable } from "./lib/input.mjs";
import { writeJson } from "./lib/fsx.mjs";
import { writeSimpleXlsx } from "./lib/simple-xlsx-writer.mjs";
import { fileHyperlink, folderHyperlink, hyperlinkFormula } from "./lib/link-cells.mjs";

const args = parseArgs(process.argv.slice(2));

if (!args.workbook) {
  console.error("Missing --workbook.");
  console.error("Example: npm run workbook:update -- --workbook outputs/runs/prepared-.../prepared-tool-reel-workbook.xlsx --tool-dir outputs/runs/prepared-.../tool-folder --vids-url https://docs.google.com/videos/d/.../edit --mp4 outputs/runs/.../final.mp4");
  process.exit(1);
}

const workbookPath = path.resolve(args.workbook);
const toolDir = args["tool-dir"] ? path.resolve(args["tool-dir"]) : "";
const outputPath = path.resolve(args.out || workbookPath.replace(/\.xlsx$/i, "-updated.xlsx"));

const statusHeaders = [
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

function normalize(value) {
  return String(value || "").trim();
}

function ensureHeaders(headers, names) {
  const nextHeaders = [...headers];
  for (const name of names) {
    if (!nextHeaders.includes(name)) {
      nextHeaders.push(name);
    }
  }
  return nextHeaders;
}

function indexOfHeader(headers, name) {
  return headers.findIndex((header) => normalize(header).toLowerCase() === name.toLowerCase());
}

function findTargetRowIndex(headers, rows) {
  if (args.row) {
    const sourceRowNumber = Number(args.row);
    const dataIndex = sourceRowNumber - 2;
    if (Number.isInteger(dataIndex) && dataIndex >= 0 && dataIndex < rows.length) {
      return dataIndex;
    }
  }

  const assetIndex = indexOfHeader(headers, "TRF Asset Folder");
  if (assetIndex >= 0 && toolDir) {
    const match = rows.findIndex((row) => path.resolve(normalize(row[assetIndex])) === toolDir);
    if (match >= 0) {
      return match;
    }
  }

  const nameIndex = indexOfHeader(headers, "Idea Name");
  if (nameIndex >= 0 && args["tool-name"]) {
    const desiredName = normalize(args["tool-name"]).toLowerCase();
    const match = rows.findIndex((row) => normalize(row[nameIndex]).toLowerCase() === desiredName);
    if (match >= 0) {
      return match;
    }
  }

  return -1;
}

const table = await readWorkbookTable(workbookPath);
const headers = ensureHeaders(table.headers, statusHeaders);
const rows = table.dataRows.map((row) => {
  const next = [...row];
  while (next.length < headers.length) {
    next.push("");
  }
  return next;
});

const targetRowIndex = findTargetRowIndex(headers, rows);
if (targetRowIndex < 0) {
  console.error("Could not find a workbook row to update. Pass --row 2, --tool-dir, or --tool-name.");
  process.exit(1);
}

const updates = {
  "TRF Google Vids Status": args.status || "Generated/exported",
  "TRF Google Vids Link": args["vids-url"] || "",
  "TRF Vids Clip Cache Folder": args["vids-cache"] || (toolDir ? path.join(toolDir, "vids-clips") : ""),
  "TRF Vids Cached Clips": args["cached-vids-clips"] || args["cached-clips"] || "",
  "TRF Generated Folder": args.generated || (toolDir ? path.join(toolDir, "generated") : ""),
  "TRF Generated Files": args["generated-files"] || "",
  "TRF Final MP4 Path": args.mp4 ? path.resolve(args.mp4) : "",
  "TRF QA Status": args.qa || "Needs human review",
  "TRF Last Automation Run": new Date().toISOString(),
  "TRF Final Video Link": args["video-link"]
    ? hyperlinkFormula(args["video-link"], "Open video")
    : args.mp4
      ? fileHyperlink(args.mp4, "Open video")
      : args["vids-url"]
        ? hyperlinkFormula(args["vids-url"], "Open Google Vids")
        : "",
  "TRF Final Video Folder Link": args["video-folder-link"]
    ? hyperlinkFormula(args["video-folder-link"], "Open video folder")
    : args.mp4
      ? folderHyperlink(path.dirname(path.resolve(args.mp4)), "Open video folder")
      : args["folder-link"]
        ? hyperlinkFormula(args["folder-link"], "Open video folder")
        : "",
  "TRF Run Folder Link": args["run-folder-link"]
    ? hyperlinkFormula(args["run-folder-link"], "Open run folder")
    : toolDir
      ? folderHyperlink(toolDir, "Open run folder")
      : ""
};

for (const [header, value] of Object.entries(updates)) {
  if (!value) {
    continue;
  }
  const index = indexOfHeader(headers, header);
  rows[targetRowIndex][index] = value;
}

await writeSimpleXlsx(outputPath, [headers, ...rows], "Tool Reel Prep");

const report = {
  ok: true,
  workbook: workbookPath,
  output: outputPath,
  updatedSourceRowNumber: targetRowIndex + 2,
  updates
};
const reportPath = outputPath.replace(/\.xlsx$/i, "-report.json");
await writeJson(reportPath, report);

console.log(`Updated workbook: ${outputPath}`);
console.log(`Report: ${reportPath}`);
