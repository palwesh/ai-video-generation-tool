import path from "node:path";
import fs from "node:fs/promises";
import dotenv from "dotenv";
import { parseArgs } from "./lib/args.mjs";
import { ensureDir, writeJson } from "./lib/fsx.mjs";

dotenv.config({ quiet: true });

const args = parseArgs(process.argv.slice(2));
const profileDir = args.profile || "work/google-vids-profile";
const targetUrl = args.url || "https://vids.new";
const outputDir = args.output || path.join(
  "outputs",
  "runs",
  `google-vids-check-${new Date().toISOString().replace(/[:.]/g, "-")}`
);
const macChromeExecutable = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

async function existingChromeExecutable() {
  if (process.env.PLAYWRIGHT_EXECUTABLE_PATH) {
    return process.env.PLAYWRIGHT_EXECUTABLE_PATH;
  }

  const hasMacChrome = await fs.access(macChromeExecutable).then(() => true).catch(() => false);
  return hasMacChrome ? macChromeExecutable : null;
}

const { chromium } = await import("playwright");
const launchOptions = {
  headless: Boolean(args.headless),
  viewport: { width: 1365, height: 768 }
};

const executablePath = await existingChromeExecutable();
if (executablePath) {
  launchOptions.executablePath = executablePath;
} else {
  launchOptions.channel = process.env.PLAYWRIGHT_CHANNEL || "chrome";
}

await ensureDir(outputDir);

console.log(`Opening ${targetUrl} with profile: ${profileDir}`);
let context;
try {
  context = await chromium.launchPersistentContext(profileDir, launchOptions);
} catch (error) {
  if (launchOptions.executablePath && !process.env.PLAYWRIGHT_EXECUTABLE_PATH) {
    delete launchOptions.executablePath;
    delete launchOptions.channel;
    console.warn("System Chrome launch failed. Retrying with bundled Playwright Chromium.");
    context = await chromium.launchPersistentContext(profileDir, launchOptions);
  } else {
    throw error;
  }
}
const page = await context.newPage();

try {
  await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(Number(args.wait || 5000));

  const screenshotPath = path.resolve(outputDir, "google-vids-page.png");
  await page.screenshot({ path: screenshotPath, fullPage: false });

  const info = await page.evaluate(() => {
    const clean = (value) => String(value || "").replace(/\s+/g, " ").trim();
    const controls = Array.from(document.querySelectorAll(
      "button, [role='button'], a, input, textarea, [contenteditable='true'], [aria-label]"
    )).slice(0, 120).map((element, index) => ({
      index,
      tag: element.tagName.toLowerCase(),
      role: element.getAttribute("role") || "",
      text: clean(element.innerText || element.textContent).slice(0, 160),
      ariaLabel: clean(element.getAttribute("aria-label")).slice(0, 160),
      placeholder: clean(element.getAttribute("placeholder")).slice(0, 160),
      href: element.href || ""
    })).filter((control) => (
      control.text || control.ariaLabel || control.placeholder || control.href
    ));

    return {
      url: location.href,
      title: document.title,
      bodyTextSample: clean(document.body?.innerText).slice(0, 2500),
      controls
    };
  });

  const reportPath = path.resolve(outputDir, "google-vids-page-check.json");
  await writeJson(reportPath, {
    checkedAt: new Date().toISOString(),
    targetUrl,
    profileDir,
    screenshotPath,
    ...info
  });

  console.log(`Current URL: ${info.url}`);
  console.log(`Title: ${info.title || "(no title)"}`);
  console.log(`Screenshot: ${screenshotPath}`);
  console.log(`Report: ${reportPath}`);
  console.log(`Text sample: ${normalizeText(info.bodyTextSample).slice(0, 400) || "(no visible text)"}`);
} finally {
  await context.close();
}
