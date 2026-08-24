import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const rootDir = process.cwd();
const outputDir = path.join(rootDir, "outputs", "instagram", "altftools_review_profile");
const logoPath = path.join(rootDir, "public", "brand", "altf-logo.png");
const homeDir = process.env.HOME || "";

function dpHtml(logoDataUrl) {
  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0;
            width: 1080px;
            height: 1080px;
            overflow: hidden;
            background: #020617;
            font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          }
          .dp {
            position: relative;
            width: 1080px;
            height: 1080px;
            display: grid;
            place-items: center;
            overflow: hidden;
            background:
              radial-gradient(circle at 50% 45%, rgba(34, 211, 238, 0.22) 0, transparent 310px),
              radial-gradient(circle at 72% 18%, rgba(45, 212, 191, 0.22) 0, transparent 260px),
              linear-gradient(145deg, #020617 0%, #07111f 52%, #0f172a 100%);
          }
          .dp::before {
            content: "";
            position: absolute;
            inset: 78px;
            border-radius: 999px;
            border: 5px solid rgba(34, 211, 238, 0.42);
            box-shadow:
              inset 0 0 0 2px rgba(255,255,255,0.08),
              0 0 110px rgba(34, 211, 238, 0.20);
          }
          .dp::after {
            content: "";
            position: absolute;
            inset: 158px;
            border-radius: 999px;
            border: 2px solid rgba(255,255,255,0.12);
          }
          .logo-wrap {
            position: relative;
            z-index: 2;
            width: 740px;
            height: 740px;
            border-radius: 999px;
            display: grid;
            place-items: center;
            background: rgba(2, 6, 23, 0.58);
            box-shadow: 0 34px 140px rgba(0,0,0,0.34);
          }
          .logo-wrap img {
            width: 660px;
            height: auto;
            object-fit: contain;
            filter: drop-shadow(0 24px 48px rgba(0,0,0,0.34));
          }
          .spark {
            position: absolute;
            border-radius: 999px;
            background: #22d3ee;
            box-shadow: 0 0 36px rgba(34, 211, 238, 0.8);
          }
          .spark.one { width: 24px; height: 24px; left: 242px; top: 230px; }
          .spark.two { width: 15px; height: 15px; right: 258px; top: 284px; opacity: 0.75; }
          .spark.three { width: 18px; height: 18px; right: 286px; bottom: 256px; opacity: 0.8; }
        </style>
      </head>
      <body>
        <main class="dp">
          <span class="spark one"></span>
          <span class="spark two"></span>
          <span class="spark three"></span>
          <div class="logo-wrap">
            <img src="${logoDataUrl}" alt="AltF" />
          </div>
        </main>
      </body>
    </html>
  `;
}

function previewHtml(logoDataUrl) {
  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body {
            margin: 0;
            width: 1080px;
            height: 1080px;
            display: grid;
            place-items: center;
            background: #e5e7eb;
          }
          .circle {
            width: 900px;
            height: 900px;
            border-radius: 999px;
            overflow: hidden;
            box-shadow: 0 40px 120px rgba(15, 23, 42, 0.28);
          }
          iframe {
            width: 1080px;
            height: 1080px;
            border: 0;
            transform: scale(0.833333);
            transform-origin: top left;
          }
        </style>
      </head>
      <body>
        <div class="circle">
          <iframe srcdoc="${dpHtml(logoDataUrl).replace(/"/g, "&quot;")}"></iframe>
        </div>
      </body>
    </html>
  `;
}

async function findBrowserExecutable() {
  const candidates = [
    process.env.PLAYWRIGHT_CHROMIUM_PATH,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    path.join(homeDir, "Library", "Caches", "ms-playwright", "chromium_headless_shell-1234", "chrome-headless-shell-mac-arm64", "chrome-headless-shell"),
    path.join(homeDir, "Library", "Caches", "ms-playwright", "chromium_headless_shell-1217", "chrome-headless-shell-mac-arm64", "chrome-headless-shell"),
    path.join(homeDir, "Library", "Caches", "ms-playwright", "chromium-1217", "chrome-mac-arm64", "Google Chrome for Testing.app", "Contents", "MacOS", "Google Chrome for Testing"),
    path.join(homeDir, "Library", "Caches", "ms-playwright", "chromium_headless_shell-1187", "chrome-mac", "headless_shell"),
    path.join(homeDir, "Library", "Caches", "ms-playwright", "chromium-1187", "chrome-mac", "Chromium.app", "Contents", "MacOS", "Chromium")
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // Keep checking local browser fallbacks.
    }
  }

  return "";
}

async function main() {
  await fs.mkdir(outputDir, { recursive: true });
  const logoBase64 = await fs.readFile(logoPath, "base64");
  const logoDataUrl = `data:image/png;base64,${logoBase64}`;
  const executablePath = await findBrowserExecutable();
  const browser = await chromium.launch({
    headless: true,
    ...(executablePath ? { executablePath } : {})
  });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1080 }, deviceScaleFactor: 1 });

  await page.setContent(dpHtml(logoDataUrl), { waitUntil: "networkidle" });
  await page.screenshot({ path: path.join(outputDir, "altftools-review-dp.png"), type: "png" });

  await page.setContent(previewHtml(logoDataUrl), { waitUntil: "networkidle" });
  await page.screenshot({ path: path.join(outputDir, "altftools-review-dp-circle-preview.png"), type: "png" });

  await browser.close();
  console.log(path.join(outputDir, "altftools-review-dp.png"));
  console.log(path.join(outputDir, "altftools-review-dp-circle-preview.png"));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
