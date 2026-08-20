import fs from "node:fs/promises";
import path from "node:path";
import { zipSync, strToU8 } from "fflate";

const outputPath = process.argv[2] || "work/full-test-tools.xlsx";

function xmlEscape(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function columnName(index) {
  let name = "";
  let number = index + 1;

  while (number > 0) {
    const remainder = (number - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    number = Math.floor((number - 1) / 26);
  }

  return name;
}

const rows = [
  ["tool_name", "tool_url", "topic", "description", "script", "target_user", "main_benefit", "language"],
  [
    "Full Test Tool",
    "https://example.com",
    "Quick Tool Demo",
    "A simple micro tool used to verify the Excel automation path.",
    "Manual workflows slow teams down. This tool makes the repeat task easier to review.",
    "founders and creators",
    "save time and reduce manual checking",
    "Hinglish"
  ]
];

const sheetData = rows.map((row, rowIndex) => {
  const cells = row.map((value, columnIndex) => {
    const cellRef = `${columnName(columnIndex)}${rowIndex + 1}`;
    return `<c r="${cellRef}" t="inlineStr"><is><t>${xmlEscape(value)}</t></is></c>`;
  }).join("");

  return `<row r="${rowIndex + 1}">${cells}</row>`;
}).join("");

const files = {
  "[Content_Types].xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`,
  "_rels/.rels": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`,
  "xl/workbook.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Tools" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`,
  "xl/_rels/workbook.xml.rels": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`,
  "xl/worksheets/sheet1.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>${sheetData}</sheetData>
</worksheet>`
};

const zipped = zipSync(Object.fromEntries(
  Object.entries(files).map(([filePath, content]) => [filePath, strToU8(content)])
));

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, zipped);
console.log(outputPath);
