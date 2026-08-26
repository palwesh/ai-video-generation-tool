import fs from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "./lib/args.mjs";
import { ensureDir, writeJson } from "./lib/fsx.mjs";
import { readWorkbookTable } from "./lib/input.mjs";
import { fileHyperlink, folderHyperlink, hyperlinkFormula } from "./lib/link-cells.mjs";
import { writeSimpleXlsx } from "./lib/simple-xlsx-writer.mjs";

const args = parseArgs(process.argv.slice(2));

const DEFAULT_WORKBOOK = "/Users/palsahu/Documents/Codex/excel/altf400.xlsx";
const META_HEADERS = [
  "Improved Instagram Caption",
  "Improved Hashtags",
  "TRF Instagram Caption",
  "TRF Hashtags",
  "TRF Final MP4 Path",
  "TRF Final Video Link",
  "TRF Assets Folder Path",
  "TRF Assets Folder Link",
  "TRF Script Path",
  "TRF Script Link",
  "TRF Reel Quality Score",
  "TRF Reel Meta Updated At"
];

function usage() {
  console.error([
    "Missing caption/hashtags input.",
    "Example:",
    "npm run workbook:meta -- --workbooks /path/tools.xlsx --tool-name \"Universal PII & AI Input Redactor\" --caption \"...\" --hashtags \"#AltFTool #AITools\"",
    "Optional: --post-copy outputs/.../post-copy.md --row 2 --final-mp4 outputs/.../final.mp4 --assets-folder outputs/.../tool --script-path outputs/.../reel-script.json"
  ].join("\n"));
}

function normalize(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function compareKey(value) {
  return normalize(value)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function splitList(value) {
  return normalize(value)
    .split(/[,|]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function sectionFromMarkdown(markdown, title) {
  const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`##\\s+${escaped}\\s*\\n([\\s\\S]*?)(?=\\n##\\s+|$)`, "i");
  const match = markdown.match(pattern);
  return match ? match[1].trim() : "";
}

async function readPostCopy(filePath) {
  if (!filePath) {
    return {};
  }

  const raw = await fs.readFile(path.resolve(filePath), "utf8");
  return {
    caption: sectionFromMarkdown(raw, "Caption"),
    hashtags: sectionFromMarkdown(raw, "Hashtags")
      .replace(/\n+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  };
}

function ensureHeaders(headers, requiredHeaders) {
  const nextHeaders = [...headers];
  const normalized = new Set(nextHeaders.map((header) => normalize(header).toLowerCase()));

  for (const header of requiredHeaders) {
    const key = header.toLowerCase();
    if (!normalized.has(key)) {
      nextHeaders.push(header);
      normalized.add(key);
    }
  }

  return nextHeaders;
}

function headerIndex(headers, name) {
  return headers.findIndex((header) => normalize(header).toLowerCase() === name.toLowerCase());
}

function firstHeaderIndex(headers, names) {
  for (const name of names) {
    const index = headerIndex(headers, name);
    if (index >= 0) {
      return index;
    }
  }
  return -1;
}

function findTargetRowIndex(headers, rows) {
  if (args.row) {
    const dataIndex = Number(args.row) - 2;
    if (Number.isInteger(dataIndex) && dataIndex >= 0 && dataIndex < rows.length) {
      return dataIndex;
    }
  }

  const targetName = compareKey(args["tool-name"] || args.tool || args.name);
  if (!targetName) {
    return -1;
  }

  const nameIndex = firstHeaderIndex(headers, [
    "Idea Name",
    "Tool_Name",
    "Tool Name",
    "Tool",
    "Topic",
    "Name"
  ]);

  if (nameIndex < 0) {
    return -1;
  }

  return rows.findIndex((row) => compareKey(row[nameIndex]) === targetName);
}

function setCell(headers, row, header, value) {
  if (value === undefined || value === null || value === "") {
    return;
  }

  const index = headerIndex(headers, header);
  if (index >= 0) {
    row[index] = value;
  }
}

function makeOutputPath(workbookPath, index) {
  if (!args.out) {
    return workbookPath;
  }

  const resolved = path.resolve(args.out);
  if (workbookPaths.length === 1) {
    return resolved;
  }

  const extension = path.extname(resolved) || ".xlsx";
  const base = path.basename(resolved, extension);
  return path.join(path.dirname(resolved), `${base}-${index + 1}${extension}`);
}

async function backupWorkbook(workbookPath) {
  if (args["no-backup"]) {
    return "";
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = args["backup-dir"]
    ? path.resolve(args["backup-dir"])
    : path.join(path.dirname(workbookPath), "backups");
  const backupPath = path.join(
    backupDir,
    `${path.basename(workbookPath, path.extname(workbookPath))}-before-reel-meta-${timestamp}.xlsx`
  );

  await ensureDir(backupDir);
  await fs.copyFile(workbookPath, backupPath);
  return backupPath;
}

const postCopy = await readPostCopy(args["post-copy"]);
const caption = normalize(args.caption || postCopy.caption);
const hashtags = normalize(args.hashtags || postCopy.hashtags);
const workbookPaths = splitList(args.workbooks || args.workbook || DEFAULT_WORKBOOK).map((item) => path.resolve(item));

if (!caption && !hashtags) {
  usage();
  process.exit(1);
}

const reports = [];

for (const [index, workbookPath] of workbookPaths.entries()) {
  const outputPath = makeOutputPath(workbookPath, index);
  const table = await readWorkbookTable(workbookPath);
  const headers = ensureHeaders(table.headers, META_HEADERS);
  const rows = table.dataRows.map((row) => {
    const next = [...row];
    while (next.length < headers.length) {
      next.push("");
    }
    return next;
  });
  const targetRowIndex = findTargetRowIndex(headers, rows);

  if (targetRowIndex < 0) {
    throw new Error(`Target row not found in ${workbookPath}. Pass --row or --tool-name.`);
  }

  const row = rows[targetRowIndex];
  const finalMp4 = args["final-mp4"] || args.mp4 || "";
  const assetsFolder = args["assets-folder"] || args.assets || "";
  const scriptPath = args["script-path"] || args.script || "";

  setCell(headers, row, "Improved Instagram Caption", caption);
  setCell(headers, row, "Improved Hashtags", hashtags);
  setCell(headers, row, "TRF Instagram Caption", caption);
  setCell(headers, row, "TRF Hashtags", hashtags);
  setCell(headers, row, "TRF Final MP4 Path", finalMp4 ? path.resolve(finalMp4) : "");
  setCell(headers, row, "TRF Final Video Link", finalMp4 ? fileHyperlink(finalMp4, "Open final reel") : "");
  setCell(headers, row, "TRF Assets Folder Path", assetsFolder ? path.resolve(assetsFolder) : "");
  setCell(headers, row, "TRF Assets Folder Link", assetsFolder ? folderHyperlink(assetsFolder, "Open assets folder") : "");
  setCell(headers, row, "TRF Script Path", scriptPath ? path.resolve(scriptPath) : "");
  setCell(headers, row, "TRF Script Link", scriptPath ? fileHyperlink(scriptPath, "Open script") : "");
  setCell(headers, row, "TRF Reel Quality Score", args["quality-score"] || args.score || "");
  setCell(headers, row, "TRF Reel Meta Updated At", new Date().toISOString());

  if (args["video-url"]) {
    setCell(headers, row, "Video link altftool", hyperlinkFormula(args["video-url"], "Open video"));
  }

  const backupPath = outputPath === workbookPath ? await backupWorkbook(workbookPath) : "";
  await writeSimpleXlsx(outputPath, [headers, ...rows], "Tool Reel Meta");

  reports.push({
    workbook: workbookPath,
    output: outputPath,
    backup: backupPath,
    updatedSourceRowNumber: targetRowIndex + 2,
    caption,
    hashtags
  });
}

const reportPath = path.resolve(
  args.report || "outputs/work-tracker/last-workbook-meta-update-report.json"
);
await writeJson(reportPath, {
  ok: true,
  updatedAt: new Date().toISOString(),
  reports
});

console.log(JSON.stringify({
  ok: true,
  updatedWorkbooks: reports.map((report) => report.output),
  backups: reports.map((report) => report.backup).filter(Boolean),
  reportPath
}, null, 2));
