import path from "node:path";
import fs from "node:fs/promises";
import readXlsxFile from "read-excel-file/node";

const FIELD_ALIASES = {
  tool_name: ["tool_name", "tool name", "name", "tool", "product", "product_name", "idea name", "idea_name"],
  tool_url: ["tool_url", "tool url", "url", "link", "tool_link", "tool link", "website", "routes", "route", "path"],
  topic: ["topic", "title", "reel_topic", "video_topic", "idea name", "idea_name"],
  description: ["description", "about", "tool_description", "tool description", "details", "short description", "short_description"],
  script: ["script", "video_script", "existing_script", "reel_script", "view script", "view_script"],
  target_user: ["target_user", "target user", "audience", "user", "ideal_user", "target market", "target_market"],
  main_benefit: ["main_benefit", "main benefit", "benefit", "value", "outcome", "demand signal", "demand_signal"],
  language: ["language", "lang"],
  category: ["category", "cluster"],
  priority: ["priority"],
  status: ["status"]
};

function normalizeHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

function findField(row, canonicalField) {
  const aliases = FIELD_ALIASES[canonicalField];
  const entries = Object.entries(row);

  for (const alias of aliases) {
    const normalizedAlias = normalizeHeader(alias);
    const match = entries.find(([key]) => normalizeHeader(key) === normalizedAlias);
    if (match && match[1] !== undefined && match[1] !== null) {
      return String(match[1]).trim();
    }
  }

  return "";
}

function resolveUrl(value, baseUrl = "") {
  const raw = String(value || "").trim();

  if (!raw) {
    return "";
  }

  try {
    return new URL(raw).href;
  } catch {
    if (!baseUrl) {
      return raw;
    }
  }

  try {
    return new URL(raw, baseUrl).href;
  } catch {
    return raw;
  }
}

function parseCsv(raw) {
  const rows = [];
  let current = "";
  let row = [];
  let inQuotes = false;

  for (let index = 0; index < raw.length; index += 1) {
    const char = raw[index];
    const next = raw[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(current);
      current = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(current);
      rows.push(row);
      row = [];
      current = "";
      continue;
    }

    current += char;
  }

  if (current || row.length) {
    row.push(current);
    rows.push(row);
  }

  return rows.filter((items) => items.some((item) => String(item).trim() !== ""));
}

function makeUniqueHeaders(headers) {
  const seen = new Map();

  return headers.map((header, index) => {
    const base = String(header || `column_${index + 1}`).trim() || `column_${index + 1}`;
    const normalized = normalizeHeader(base);
    const count = seen.get(normalized) || 0;
    seen.set(normalized, count + 1);
    return count === 0 ? base : `${base}__${count + 1}`;
  });
}

export function rowsToObjects(rows) {
  const [headers = [], ...dataRows] = rows;
  const uniqueHeaders = makeUniqueHeaders(headers);

  return dataRows.map((items) => {
    const object = {};
    uniqueHeaders.forEach((header, index) => {
      object[header] = items[index] ?? "";
    });
    return object;
  });
}

async function readCsvRows(inputPath) {
  const raw = await fs.readFile(inputPath, "utf8");
  return rowsToObjects(parseCsv(raw));
}

async function readXlsxRows(inputPath) {
  const rows = await readXlsxFile(inputPath);

  if (!rows.length) {
    throw new Error(`No sheet found in ${inputPath}`);
  }

  return rowsToObjects(rows);
}

async function readRawRows(inputPath) {
  const extension = path.extname(inputPath).toLowerCase();

  if (extension === ".csv") {
    return parseCsv(await fs.readFile(inputPath, "utf8"));
  }

  return readXlsxFile(inputPath);
}

export async function readWorkbookTable(inputPath) {
  const rows = await readRawRows(inputPath);
  const [headers = [], ...dataRows] = rows;
  const objects = rowsToObjects(rows);

  return {
    headers: headers.map((header) => String(header ?? "")),
    dataRows,
    objects
  };
}

export async function readToolRows(inputPath, options = {}) {
  const extension = path.extname(inputPath).toLowerCase();
  const rawRows = extension === ".csv"
    ? await readCsvRows(inputPath)
    : await readXlsxRows(inputPath);

  return rawRows
    .map((row, index) => normalizeToolRow(row, index + 2, options))
    .filter((row) => row.tool_name || row.tool_url || row.topic || row.description || row.script);
}

export function normalizeWorkbookObjects(objects, options = {}) {
  return objects
    .map((row, index) => normalizeToolRow(row, index + 2, options))
    .filter((row) => row.tool_name || row.tool_url || row.topic || row.description || row.script);
}

export function normalizeToolRow(row, sourceRowNumber = null, options = {}) {
  const toolName = findField(row, "tool_name");
  const topic = findField(row, "topic") || toolName;
  const rawToolUrl = findField(row, "tool_url");

  return {
    source_row_number: sourceRowNumber,
    tool_name: toolName || topic || `Tool Row ${sourceRowNumber || 1}`,
    tool_url: resolveUrl(rawToolUrl, options.toolBaseUrl),
    tool_route: rawToolUrl,
    topic,
    description: findField(row, "description"),
    script: findField(row, "script"),
    target_user: findField(row, "target_user"),
    main_benefit: findField(row, "main_benefit"),
    language: findField(row, "language"),
    category: findField(row, "category"),
    priority: findField(row, "priority"),
    status: findField(row, "status"),
    source_file: path.basename(String(row.__source_file || ""))
  };
}
