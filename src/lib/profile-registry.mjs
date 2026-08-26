import fs from "node:fs/promises";
import path from "node:path";
import { unzipSync, strFromU8 } from "fflate";
import { writeSimpleXlsx } from "./simple-xlsx-writer.mjs";

export const PROFILE_REGISTRY_HEADERS = [
  "Profile Name",
  "Expected Email/Login ID",
  "Detected Google Email",
  "Browser Profile Path",
  "Enabled",
  "Priority",
  "Status",
  "Limit Status",
  "AI Video Used",
  "AI Video Monthly Limit",
  "Avatar Used",
  "Avatar Monthly Limit",
  "Last Used",
  "Last Login Check",
  "Last Quota Hit At",
  "Notes",
  "Updated At"
];

const FIELD_ALIASES = {
  profileName: ["profile name", "name", "label", "account name"],
  expectedEmail: ["expected email/login id", "expected email", "login id", "login email", "email", "google email"],
  detectedEmail: ["detected google email", "detected email", "current email"],
  path: ["browser profile path", "profile path", "path", "folder", "profile folder"],
  enabled: ["enabled", "active", "use", "use profile"],
  priority: ["priority", "fallback priority", "order"],
  status: ["status", "profile status"],
  limitStatus: ["limit status", "quota status", "credits status"],
  aiVideoUsed: ["ai video used", "video used", "vids used"],
  aiVideoMonthlyLimit: ["ai video monthly limit", "video limit", "vids limit"],
  avatarUsed: ["avatar used", "avatar clips used"],
  avatarMonthlyLimit: ["avatar monthly limit", "avatar limit"],
  lastUsed: ["last used", "last run"],
  lastLoginCheck: ["last login check", "last checked"],
  lastQuotaHitAt: ["last quota hit at", "last limit hit at", "quota hit"],
  notes: ["notes", "note", "quota note", "remarks"],
  updatedAt: ["updated at", "updated"]
};

function normalizeHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

function readField(row, field) {
  const aliases = FIELD_ALIASES[field] || [];
  const entries = Object.entries(row || {});
  for (const alias of aliases) {
    const normalizedAlias = normalizeHeader(alias);
    const match = entries.find(([key]) => normalizeHeader(key) === normalizedAlias);
    if (match && match[1] !== undefined && match[1] !== null) {
      return String(match[1]).trim();
    }
  }
  return "";
}

function parseBoolean(value, fallback = true) {
  const raw = String(value ?? "").trim().toLowerCase();
  if (!raw) return fallback;
  if (["yes", "y", "true", "1", "active", "enabled", "on"].includes(raw)) return true;
  if (["no", "n", "false", "0", "inactive", "disabled", "off"].includes(raw)) return false;
  return fallback;
}

function parseNumber(value, fallback = 0) {
  const number = Number(String(value ?? "").trim());
  return Number.isFinite(number) ? number : fallback;
}

function cleanEmail(value) {
  return String(value || "").trim().slice(0, 180);
}

function cleanProfileName(value, fallback = "") {
  return String(value || fallback || "").trim().slice(0, 120);
}

function pathBasename(profilePath = "") {
  return String(profilePath || "").replace(/[\\]+/g, "/").split("/").filter(Boolean).pop() || "";
}

function quotaValue(quota = {}, key, fallback = "") {
  const value = quota?.[key];
  return value === undefined || value === null ? fallback : String(value);
}

function decodeXml(value) {
  return String(value || "").replace(/&(amp|lt|gt|quot|apos);/g, (match, entity) => ({
    amp: "&",
    lt: "<",
    gt: ">",
    quot: "\"",
    apos: "'"
  })[entity] || match);
}

function collectTextTags(xml) {
  return [...String(xml || "").matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)]
    .map((match) => decodeXml(match[1]))
    .join("");
}

function parseSharedStrings(zipEntries) {
  const entry = zipEntries["xl/sharedStrings.xml"];
  if (!entry) return [];
  const xml = strFromU8(entry);
  return [...xml.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)]
    .map((match) => collectTextTags(match[1]));
}

function columnIndexFromRef(cellRef) {
  const letters = String(cellRef || "").match(/[A-Z]+/i)?.[0] || "A";
  let index = 0;
  for (const letter of letters.toUpperCase()) {
    index = index * 26 + (letter.charCodeAt(0) - 64);
  }
  return Math.max(0, index - 1);
}

function cellValueFromXml(cellXml, sharedStrings) {
  const type = cellXml.match(/\bt="([^"]+)"/)?.[1] || "";
  if (type === "inlineStr") {
    return collectTextTags(cellXml);
  }
  const rawValue = decodeXml(cellXml.match(/<v>([\s\S]*?)<\/v>/)?.[1] || "");
  if (type === "s") {
    return sharedStrings[Number(rawValue)] || "";
  }
  if (type === "b") {
    return rawValue === "1" ? "TRUE" : "FALSE";
  }
  return rawValue;
}

function rowsToObjects(rows) {
  const [headers = [], ...dataRows] = rows;
  const uniqueHeaders = headers.map((header, index) => String(header || `column_${index + 1}`).trim() || `column_${index + 1}`);
  return dataRows.map((items) => {
    const object = {};
    uniqueHeaders.forEach((header, index) => {
      object[header] = items[index] ?? "";
    });
    return object;
  });
}

async function readProfileRegistryRows(registryPath) {
  const raw = await fs.readFile(registryPath);
  const zipEntries = unzipSync(raw);
  const sharedStrings = parseSharedStrings(zipEntries);
  const sheetPath = zipEntries["xl/worksheets/sheet1.xml"]
    ? "xl/worksheets/sheet1.xml"
    : Object.keys(zipEntries).find((entry) => /^xl\/worksheets\/sheet\d+\.xml$/.test(entry));
  if (!sheetPath) return [];

  const sheetXml = strFromU8(zipEntries[sheetPath]);
  return [...sheetXml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)].map((rowMatch) => {
    const row = [];
    for (const cellMatch of rowMatch[1].matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)) {
      const cellRef = cellMatch[1].match(/\br="([^"]+)"/)?.[1] || "";
      row[columnIndexFromRef(cellRef)] = cellValueFromXml(cellMatch[0], sharedStrings);
    }
    return row.map((value) => value ?? "");
  });
}

export function registryPathFromConfig(projectRoot, config = {}) {
  const configured = process.env.TRF_PROFILE_REGISTRY || config.googleVids?.profileRegistry || "work/google-vids-profiles.xlsx";
  return path.isAbsolute(configured) ? configured : path.resolve(projectRoot, configured);
}

export async function readProfileRegistry(registryPath, options = {}) {
  try {
    await fs.access(registryPath);
  } catch {
    return [];
  }

  const rows = await readProfileRegistryRows(registryPath);
  return rowsToObjects(rows).map((row, index) => {
    const rawPath = readField(row, "path");
    const fallbackName = readField(row, "profileName") || `google-vids-profile-${index + 1}`;
    const normalizedPath = options.normalizeProfilePath
      ? options.normalizeProfilePath(rawPath || fallbackName)
      : rawPath;
    const expectedEmail = cleanEmail(readField(row, "expectedEmail"));
    const detectedEmail = cleanEmail(readField(row, "detectedEmail"));
    const limitStatus = readField(row, "limitStatus");
    const status = readField(row, "status");
    const quotaExhausted = /limit|quota|credit/i.test(`${status} ${limitStatus}`);

    return {
      profileName: cleanProfileName(readField(row, "profileName"), fallbackName),
      expectedEmail,
      detectedEmail,
      path: normalizedPath,
      enabled: parseBoolean(readField(row, "enabled"), true),
      priority: parseNumber(readField(row, "priority"), index + 1),
      status,
      limitStatus,
      quota: {
        aiVideoUsed: parseNumber(readField(row, "aiVideoUsed"), 0),
        aiVideoMonthlyLimit: parseNumber(readField(row, "aiVideoMonthlyLimit"), 10),
        avatarUsed: parseNumber(readField(row, "avatarUsed"), 0),
        avatarMonthlyLimit: parseNumber(readField(row, "avatarMonthlyLimit"), 10),
        quotaExhausted,
        limitStatus: quotaExhausted ? "limit_used" : "",
        lastQuotaHitAt: readField(row, "lastQuotaHitAt")
      },
      lastUsed: readField(row, "lastUsed"),
      lastLoginCheck: readField(row, "lastLoginCheck"),
      lastQuotaHitAt: readField(row, "lastQuotaHitAt"),
      notes: readField(row, "notes"),
      updatedAt: readField(row, "updatedAt"),
      sourceRowNumber: index + 2
    };
  }).filter((entry) => entry.path);
}

export function mergeRegistryMetadata(base = {}, registry = {}) {
  const expectedEmail = cleanEmail(registry.expectedEmail || registry.email || base.expectedEmail || base.email || registry.detectedEmail || "");
  const incomingPriority = Number(registry.priority);
  const basePriority = Number(base.priority);
  return {
    ...base,
    registryProfileName: cleanProfileName(
      registry.profileName || registry.registryProfileName || registry.name || registry.displayName ||
      base.registryProfileName || base.name || base.displayName || ""
    ),
    expectedEmail,
    registryExpectedEmail: expectedEmail,
    enabled: typeof registry.enabled === "boolean"
      ? registry.enabled
      : (typeof base.enabled === "boolean" ? base.enabled : true),
    priority: Number.isFinite(incomingPriority)
      ? incomingPriority
      : (Number.isFinite(basePriority) ? basePriority : 999),
    registryStatus: registry.status || base.registryStatus || "",
    registryLimitStatus: registry.limitStatus || base.registryLimitStatus || "",
    registryNotes: registry.notes || base.registryNotes || "",
    registryLastUsed: registry.lastUsed || base.registryLastUsed || "",
    registryLastLoginCheck: registry.lastLoginCheck || base.registryLastLoginCheck || "",
    registryUpdatedAt: registry.updatedAt || base.registryUpdatedAt || ""
  };
}

export async function writeProfileRegistryXlsx(registryPath, profiles, options = {}) {
  const registryByPath = new Map(
    (options.registryEntries || []).map((entry) => [entry.path, entry])
  );
  const quotaForProfile = typeof options.quotaForProfile === "function"
    ? options.quotaForProfile
    : () => ({});
  const now = new Date().toISOString();

  const rows = [PROFILE_REGISTRY_HEADERS];
  for (let index = 0; index < profiles.length; index += 1) {
    const profile = profiles[index] || {};
    const existing = registryByPath.get(profile.path) || {};
    const quota = profile.quota || quotaForProfile(profile.path) || existing.quota || {};
    const limitUsed = Boolean(
      quota.quotaExhausted ||
      quota.limitStatus === "limit_used" ||
      profile.status === "limit_used" ||
      existing.limitStatus === "limit_used"
    );
    rows.push([
      cleanProfileName(profile.registryProfileName || profile.displayName || existing.profileName, pathBasename(profile.path)),
      cleanEmail(profile.expectedEmail || existing.expectedEmail || profile.email || ""),
      cleanEmail(profile.email || existing.detectedEmail || ""),
      profile.path || "",
      profile.enabled === false ? "No" : "Yes",
      String(Number.isFinite(Number(profile.priority)) ? Number(profile.priority) : index + 1),
      profile.statusLabel || profile.status || existing.status || "",
      limitUsed ? "limit_used" : (quota.limitStatus || existing.limitStatus || ""),
      quotaValue(quota, "aiVideoUsed", "0"),
      quotaValue(quota, "aiVideoMonthlyLimit", "10"),
      quotaValue(quota, "avatarUsed", "0"),
      quotaValue(quota, "avatarMonthlyLimit", "10"),
      profile.lastUsed || existing.lastUsed || profile.registryLastUsed || "",
      profile.lastLoginCheck || existing.lastLoginCheck || profile.registryLastLoginCheck || "",
      quota.lastQuotaHitAt || existing.lastQuotaHitAt || profile.registryLastQuotaHitAt || "",
      profile.registryNotes || existing.notes || quota.quotaNote || "",
      now
    ]);
  }

  await writeSimpleXlsx(registryPath, rows, "Vids Profiles");
  return registryPath;
}
