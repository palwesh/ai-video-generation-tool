import path from "node:path";
import fs from "node:fs/promises";
import dotenv from "dotenv";
import { ensureDir } from "./lib/fsx.mjs";

dotenv.config({ quiet: true });

const accessToken = process.env.GOOGLE_ACCESS_TOKEN;
const fileId = process.env.GOOGLE_VIDS_FILE_ID;

if (!accessToken || !fileId) {
  console.error("Missing GOOGLE_ACCESS_TOKEN or GOOGLE_VIDS_FILE_ID.");
  process.exit(1);
}

const startUrl = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}/download?mimeType=video/mp4`;
const startResponse = await fetch(startUrl, {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${accessToken}`,
    "Content-Length": "0",
    "Accept": "application/json"
  }
});

const operation = await startResponse.json();

if (!startResponse.ok) {
  throw new Error(operation?.error?.message || "Drive download request failed.");
}

let downloadUri = operation?.response?.downloadUri;
let operationName = operation?.name;

for (let attempt = 0; !downloadUri && operationName && attempt < 30; attempt += 1) {
  await new Promise((resolve) => setTimeout(resolve, 3000));

  const pollResponse = await fetch(`https://www.googleapis.com/drive/v3/operations/${encodeURIComponent(operationName)}`, {
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Accept": "application/json"
    }
  });
  const pollJson = await pollResponse.json();

  if (!pollResponse.ok) {
    throw new Error(pollJson?.error?.message || "Drive operation polling failed.");
  }

  downloadUri = pollJson?.response?.downloadUri;
}

if (!downloadUri) {
  throw new Error("Download URI was not ready. Try again later.");
}

const videoResponse = await fetch(downloadUri, {
  headers: {
    "Authorization": `Bearer ${accessToken}`
  }
});

if (!videoResponse.ok) {
  throw new Error(`Final MP4 download failed: ${videoResponse.statusText}`);
}

const outputDir = path.resolve("outputs/runs/downloads");
await ensureDir(outputDir);
const outputPath = path.join(outputDir, `${fileId}.mp4`);
const buffer = Buffer.from(await videoResponse.arrayBuffer());
await fs.writeFile(outputPath, buffer);

console.log(`Downloaded Google Vids MP4 to ${outputPath}`);
