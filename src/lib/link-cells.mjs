import path from "node:path";
import { pathToFileURL } from "node:url";

function escapeFormulaString(value) {
  return String(value || "").replace(/"/g, "\"\"");
}

export function fileUrl(filePath) {
  if (!filePath) {
    return "";
  }
  return pathToFileURL(path.resolve(filePath)).href;
}

export function folderUrl(folderPath) {
  if (!folderPath) {
    return "";
  }
  const resolved = path.resolve(folderPath);
  return pathToFileURL(resolved.endsWith(path.sep) ? resolved : `${resolved}${path.sep}`).href;
}

export function hyperlinkFormula(url, label = "Open link") {
  if (!url) {
    return "";
  }
  return {
    formula: `HYPERLINK("${escapeFormulaString(url)}","${escapeFormulaString(label)}")`,
    fallback: label
  };
}

export function fileHyperlink(filePath, label = "Open file") {
  return hyperlinkFormula(fileUrl(filePath), label);
}

export function folderHyperlink(folderPath, label = "Open folder") {
  return hyperlinkFormula(folderUrl(folderPath), label);
}
