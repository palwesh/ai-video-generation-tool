import path from "node:path";
import dotenv from "dotenv";
import { parseArgs } from "./lib/args.mjs";
import { ensureDir, writeJson } from "./lib/fsx.mjs";
import { applyChromeLaunchOptions, launchWithBundledFallback } from "./lib/browser-paths.mjs";

dotenv.config({ quiet: true });

const args = parseArgs(process.argv.slice(2));
const profileDir = args.profile || "work/google-vids-profile";
const targetUrl = args.url;
const outputDir = path.resolve(args.output || path.join(
  "outputs",
  "runs",
  `google-vids-export-${new Date().toISOString().replace(/[:.]/g, "-")}`
));
const timeoutMs = Number(args.timeout || 600000);

if (!targetUrl) {
  console.error("Missing --url for the Google Vids file.");
  console.error("Example: npm run vids:export -- --url \"https://docs.google.com/videos/d/FILE_ID/edit\"");
  process.exit(1);
}

function redactText(value) {
  return String(value || "")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]")
    .replace(/Google Account:\s*[^()]+ \(\[email\]\)/gi, "Google Account: [signed-in user] ([email])");
}

function redactJson(value) {
  if (typeof value === "string") {
    return redactText(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => redactJson(item));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, redactJson(item)]));
  }
  return value;
}

function safeFileName(name) {
  const cleaned = String(name || "google-vids-export.mp4")
    .replace(/[/:*?"<>|]+/g, "-")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || "google-vids-export.mp4";
}

async function screenshot(page, name) {
  const filePath = path.join(outputDir, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: false }).catch(() => null);
  return filePath;
}

async function pageState(page, name) {
  const info = await page.evaluate(() => {
    const clean = (value) => String(value || "").replace(/\s+/g, " ").trim();
    const controls = Array.from(document.querySelectorAll(
      "button, [role='button'], [role='menuitem'], a, input, textarea, [contenteditable='true'], [aria-label]"
    )).map((element, index) => ({
      index,
      tag: element.tagName.toLowerCase(),
      role: element.getAttribute("role") || "",
      text: clean(element.innerText || element.textContent).slice(0, 200),
      ariaLabel: clean(element.getAttribute("aria-label")).slice(0, 200),
      x: element.getBoundingClientRect().x,
      y: element.getBoundingClientRect().y,
      width: element.getBoundingClientRect().width,
      height: element.getBoundingClientRect().height,
      visible: Boolean(element.offsetWidth || element.offsetHeight || element.getClientRects().length)
    })).filter((control) => (
      control.visible && (control.text || control.ariaLabel)
    )).slice(0, 260);

    return {
      url: location.href,
      title: document.title,
      bodyTextSample: clean(document.body?.innerText).slice(0, 3000),
      controls
    };
  });
  const redacted = redactJson(info);
  await writeJson(path.join(outputDir, `${name}.json`), redacted);
  return redacted;
}

async function waitForSavingComplete(page, waitMs = 90000) {
  const startedAt = Date.now();
  let lastText = "";
  while (Date.now() - startedAt < waitMs) {
    lastText = await page.locator("body").innerText({ timeout: 5000 }).catch(() => "");
    if (!/Saving/i.test(lastText)) {
      return { completed: true, waitedMs: Date.now() - startedAt };
    }
    await page.waitForTimeout(3000);
  }
  return {
    completed: false,
    waitedMs: Date.now() - startedAt,
    reason: "Page still showed Saving after timeout.",
    textSample: redactText(lastText.replace(/\s+/g, " ").slice(0, 500))
  };
}

async function clickFileDownloadMp4(page) {
  const steps = [];

  const fileMenu = page.getByText("File", { exact: true }).first();
  await fileMenu.click({ timeout: 10000 });
  await page.waitForTimeout(1000);
  steps.push({ name: "click_file_menu", clicked: true });

  const downloadMenu = page.getByText("Download", { exact: true }).last();
  await downloadMenu.hover({ timeout: 10000 }).catch(async () => {
    await downloadMenu.click({ timeout: 10000 });
  });
  await page.waitForTimeout(1500);
  steps.push({ name: "open_download_submenu", clicked: true });

  const mp4Item = page.getByText("MP4 video (.mp4)", { exact: true }).last();
  await mp4Item.waitFor({ state: "visible", timeout: 15000 });

  if (args["dry-run"]) {
    steps.push({ name: "mp4_menu_item", clicked: false, dryRun: true });
    return { steps, download: null };
  }

  const downloadPromise = page.waitForEvent("download", { timeout: timeoutMs }).catch((error) => ({
    error: error.message
  }));
  await mp4Item.click({ timeout: 15000 });
  steps.push({ name: "click_mp4_download", clicked: true });

  return { steps, download: await downloadPromise };
}

await ensureDir(outputDir);

const { chromium } = await import("playwright");
const launchOptions = {
  headless: false,
  acceptDownloads: true,
  viewport: { width: 1365, height: 768 }
};
await applyChromeLaunchOptions(launchOptions, { channelFallback: false });

const context = await launchWithBundledFallback(
  chromium,
  launchOptions,
  (options) => chromium.launchPersistentContext(profileDir, options)
);
const page = await context.newPage();
const steps = [];

try {
  await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(7000);
  steps.push({ name: "opened", screenshot: await screenshot(page, "01-opened"), state: await pageState(page, "01-opened") });

  const saving = await waitForSavingComplete(page);
  steps.push({ name: "wait_for_saved", ...saving, screenshot: await screenshot(page, "02-saved"), state: await pageState(page, "02-saved") });

  const result = await clickFileDownloadMp4(page);
  steps.push(...result.steps);
  steps.push({ name: "download_menu", screenshot: await screenshot(page, "03-download-menu"), state: await pageState(page, "03-download-menu") });

  let savedPath = null;
  let suggestedFilename = null;
  let failure = null;

  if (result.download && !result.download.error) {
    suggestedFilename = await result.download.suggestedFilename();
    savedPath = path.join(outputDir, safeFileName(args.filename || suggestedFilename));
    await result.download.saveAs(savedPath);
    steps.push({ name: "save_download", savedPath, suggestedFilename });
  } else if (result.download?.error) {
    failure = result.download.error;
    steps.push({ name: "download_event", error: failure });
  }

  await writeJson(path.join(outputDir, "google-vids-export-report.json"), {
    ok: Boolean(args["dry-run"] || savedPath),
    mode: args["dry-run"] ? "dry_run" : "download",
    targetUrl,
    currentUrl: page.url(),
    title: await page.title(),
    outputDir,
    savedPath,
    suggestedFilename,
    failure,
    steps
  });

  console.log(`Report: ${path.join(outputDir, "google-vids-export-report.json")}`);
  if (savedPath) {
    console.log(`Downloaded: ${savedPath}`);
  } else if (args["dry-run"]) {
    console.log("Dry-run passed: MP4 menu item was found.");
  } else {
    console.log("Download did not complete before timeout. Check the report and screenshots.");
  }
} catch (error) {
  const errorScreenshot = await screenshot(page, "error").catch(() => null);
  const errorState = await pageState(page, "error").catch((stateError) => ({
    error: stateError.message
  }));
  await writeJson(path.join(outputDir, "google-vids-export-report.json"), {
    ok: false,
    mode: args["dry-run"] ? "dry_run" : "download",
    targetUrl,
    currentUrl: page.url(),
    title: await page.title().catch(() => ""),
    error: error.message,
    stack: error.stack,
    errorScreenshot,
    errorState,
    steps
  });
  console.error(`Google Vids export failed: ${error.message}`);
  console.error(`Report: ${path.join(outputDir, "google-vids-export-report.json")}`);
  process.exitCode = 1;
} finally {
  await context.close();
}
