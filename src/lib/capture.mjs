import path from "node:path";
import fs from "node:fs/promises";
import { ensureDir } from "./fsx.mjs";
import { applyChromeLaunchOptions, launchWithBundledFallback } from "./browser-paths.mjs";

function validUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

async function pageTitle(page) {
  try {
    return await page.title();
  } catch {
    return "";
  }
}

async function visibleText(page) {
  try {
    return await page.locator("body").innerText({ timeout: 5000 });
  } catch {
    return "";
  }
}

function demoTextFor(row) {
  const toolName = row.tool_name || "AltF Tool";
  return [
    `Demo task for ${toolName}`,
    "Name: Riya Demo",
    "Email: riya.demo@example.com",
    "Phone: +1 555 010 2345",
    "Address: 42 Demo Street, Sample City",
    "Goal: create a clean, privacy-safe result for review.",
    "Note: this is fictional demo data only."
  ].join("\n");
}

function escapePdfText(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/\r?\n/g, " ");
}

function buildSimplePdf(text) {
  const lines = String(text || "").split(/\r?\n/).slice(0, 8);
  const stream = [
    "BT",
    "/F1 14 Tf",
    "72 742 Td",
    ...lines.map((line, index) => `${index === 0 ? "" : "0 -22 Td"}(${escapePdfText(line)}) Tj`),
    "ET"
  ].join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (let index = 0; index < objects.length; index += 1) {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${objects[index]}\nendobj\n`;
  }
  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (const offset of offsets.slice(1)) {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return pdf;
}

async function createDemoImage(browser, demoDir, row) {
  const filePath = path.join(demoDir, "demo-image.png");
  const page = await browser.newPage({ viewport: { width: 900, height: 900 } });
  try {
    await page.setContent(`
      <html>
        <body style="margin:0;background:#f8fafc;font-family:Arial,sans-serif;color:#17202a;">
          <div style="width:900px;height:900px;padding:72px;box-sizing:border-box;background:linear-gradient(180deg,#fff,#edf3f8);">
            <div style="font-size:28px;font-weight:700;color:#2563eb;margin-bottom:24px;">FICTIONAL DEMO IMAGE</div>
            <div style="font-size:52px;font-weight:850;line-height:1.05;margin-bottom:34px;">${String(row.tool_name || "AltF Tool").replace(/[<>&]/g, "")}</div>
            <div style="font-size:30px;line-height:1.35;margin-bottom:34px;">School badge, location board, and name tag are intentionally included as demo privacy review markers.</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;">
              <div style="background:#fff;border:3px solid #d9e1ea;border-radius:24px;padding:28px;font-size:28px;">Name tag: Riya Demo</div>
              <div style="background:#fff7ed;border:3px solid #f59e0b;border-radius:24px;padding:28px;font-size:28px;">Location: Sample City</div>
              <div style="background:#ecfdf5;border:3px solid #16a34a;border-radius:24px;padding:28px;font-size:28px;">Consent: demo only</div>
              <div style="background:#eff6ff;border:3px solid #2563eb;border-radius:24px;padding:28px;font-size:28px;">Review before sharing</div>
            </div>
          </div>
        </body>
      </html>
    `);
    await page.screenshot({ path: filePath, fullPage: false });
  } finally {
    await page.close();
  }
  return filePath;
}

async function createDemoUploadFiles(browser, demoDir, row) {
  await ensureDir(demoDir);
  const text = demoTextFor(row);
  const textPath = path.join(demoDir, "demo-input.txt");
  const csvPath = path.join(demoDir, "demo-data.csv");
  const pdfPath = path.join(demoDir, "demo-document.pdf");
  await fs.writeFile(textPath, text);
  await fs.writeFile(csvPath, "name,email,phone\nRiya Demo,riya.demo@example.com,+1 555 010 2345\n");
  await fs.writeFile(pdfPath, buildSimplePdf(text));
  return {
    text: textPath,
    csv: csvPath,
    pdf: pdfPath,
    image: await createDemoImage(browser, demoDir, row)
  };
}

function chooseUploadFile(accept, row, demoFiles) {
  const haystack = `${accept || ""} ${row.tool_name || ""} ${row.description || ""}`.toLowerCase();
  if (/image|photo|png|jpe?g|webp/.test(haystack)) return demoFiles.image;
  if (/pdf/.test(haystack)) return demoFiles.pdf;
  if (/csv|sheet|excel/.test(haystack)) return demoFiles.csv;
  return demoFiles.text;
}

async function acceptSafeCheckboxes(page) {
  const ids = await page.evaluate(() => {
    document.querySelectorAll("[data-trf-consent-target]").forEach((element) => {
      element.removeAttribute("data-trf-consent-target");
    });

    const clean = (value) => String(value || "").replace(/\s+/g, " ").trim();
    const positive = /authori[sz]ation|permission|consent|confirm|agree|i am|i have|terms|privacy/i;
    const elements = Array.from(document.querySelectorAll("input[type='checkbox'], [role='checkbox']"));
    return elements.map((element, index) => {
      const rect = element.getBoundingClientRect();
      const label = element.closest("label") || document.querySelector(`label[for="${element.id}"]`);
      const text = clean(`${label?.innerText || ""} ${element.getAttribute("aria-label") || ""}`);
      const visible = Boolean(rect.width && rect.height && element.getClientRects().length);
      if (!visible || !positive.test(text)) {
        return null;
      }
      element.setAttribute("data-trf-consent-target", String(index));
      return index;
    }).filter((value) => value !== null).slice(0, 3);
  });

  for (const id of ids) {
    const locator = page.locator(`[data-trf-consent-target="${id}"]`).first();
    await locator.check({ timeout: 2500, force: true }).catch(async () => {
      await locator.click({ timeout: 2500, force: true }).catch(() => {});
    });
  }
  return { clicked: ids.length, ids };
}

async function fillDemoFields(page, row) {
  const demoText = demoTextFor(row);
  return await page.evaluate((sample) => {
    const deny = /search|newsletter|subscribe|login|sign in|password|menu|filter|coupon|promo|captcha/i;
    const skipTypes = /^(button|submit|reset|checkbox|radio|file|hidden|image|color|range|date|time|datetime-local)$/i;
    const fields = Array.from(document.querySelectorAll("textarea, input, [contenteditable='true'], [role='textbox']"));
    const filled = [];
    const setValue = (element, value) => {
      const tagName = element.tagName.toLowerCase();
      if (element.isContentEditable || element.getAttribute("role") === "textbox") {
        element.focus();
        element.textContent = value;
      } else if (tagName === "input" || tagName === "textarea") {
        element.focus();
        element.value = value;
      }
      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
    };

    for (const element of fields) {
      const rect = element.getBoundingClientRect();
      const type = element.getAttribute("type") || "";
      const label = `${element.getAttribute("aria-label") || ""} ${element.getAttribute("placeholder") || ""} ${element.closest("label")?.innerText || ""}`;
      if (!rect.width || !rect.height || skipTypes.test(type) || deny.test(label)) {
        continue;
      }

      const lowerLabel = label.toLowerCase();
      const value = type === "number"
        ? "42"
        : type === "url" || /url|link|website/.test(lowerLabel)
          ? "https://example.com/demo"
          : type === "email" || /email/.test(lowerLabel)
            ? "riya.demo@example.com"
            : /name/.test(lowerLabel)
              ? "Riya Demo"
              : sample;
      setValue(element, value);
      filled.push({ tagName: element.tagName.toLowerCase(), type, label: label.replace(/\s+/g, " ").trim().slice(0, 120) });
      if (filled.length >= 4) {
        break;
      }
    }

    return filled;
  }, demoText);
}

async function uploadDemoFiles(page, row, demoFiles) {
  const uploads = [];
  const inputs = page.locator("input[type='file']");
  const count = await inputs.count().catch(() => 0);
  for (let index = 0; index < Math.min(count, 3); index += 1) {
    const input = inputs.nth(index);
    const accept = await input.getAttribute("accept").catch(() => "");
    const filePath = chooseUploadFile(accept, row, demoFiles);
    const uploaded = await input.setInputFiles(filePath, { timeout: 5000 })
      .then(() => true)
      .catch(() => false);
    uploads.push({ index, accept, filePath, uploaded });
    if (uploaded) {
      await page.waitForTimeout(2200);
    }
  }
  return uploads;
}

async function clickPrimaryToolAction(page) {
  const candidate = await page.evaluate(() => {
    document.querySelectorAll("[data-trf-primary-action]").forEach((element) => {
      element.removeAttribute("data-trf-primary-action");
    });

    const clean = (value) => String(value || "").replace(/\s+/g, " ").trim();
    const prefer = /redact|mask|check|analy[sz]e|scan|generate|convert|process|run|submit|create|review|inspect|clean|summari[sz]e|extract|remove/i;
    const deny = /share|download|copy|reset|clear|back|menu|login|sign in|pricing|learn|products|tools|upload|choose|browse|open|subscribe|close|cancel/i;
    const elements = Array.from(document.querySelectorAll("button, [role='button'], input[type='submit']"));
    const scored = elements.map((element, index) => {
      const rect = element.getBoundingClientRect();
      const text = clean(element.innerText || element.textContent || element.value);
      const ariaLabel = clean(element.getAttribute("aria-label"));
      const name = `${text} ${ariaLabel}`.trim();
      const style = window.getComputedStyle(element);
      const visible = Boolean(rect.width && rect.height && element.getClientRects().length);
      let score = 0;
      if (!visible || !name || deny.test(name)) {
        score = -1000;
      } else {
        if (prefer.test(name)) score += 120;
        if (/rgb\((37, 99, 235|29, 78, 216|22, 163, 74|18, 161, 80)\)/.test(style.backgroundColor)) score += 30;
        if (rect.y > 180) score += 15;
      }
      return {
        index,
        score,
        text,
        ariaLabel,
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        centerX: rect.x + rect.width / 2,
        centerY: rect.y + rect.height / 2
      };
    }).filter((item) => item.score > 0).sort((a, b) => b.score - a.score)[0];

    if (!scored) {
      return null;
    }
    elements[scored.index].setAttribute("data-trf-primary-action", "true");
    return scored;
  });

  if (!candidate) {
    return { clicked: false, reason: "No safe primary action button was found." };
  }

  const locator = page.locator("[data-trf-primary-action='true']").first();
  let clicked = await locator.click({ timeout: 5000, force: true }).then(() => true).catch(() => false);
  if (!clicked) {
    await page.mouse.click(candidate.centerX, candidate.centerY).then(() => {
      clicked = true;
    }).catch(() => {});
  }
  await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(3000);
  return clicked
    ? { clicked: true, candidate }
    : { clicked: false, candidate, reason: "Primary action could not be clicked." };
}

async function interactWithTool(page, row, demoFiles) {
  const consent = await acceptSafeCheckboxes(page);
  const filledFields = await fillDemoFields(page, row);
  const uploadedFiles = await uploadDemoFiles(page, row, demoFiles);
  const action = await clickPrimaryToolAction(page);
  const resultText = (await visibleText(page)).replace(/\s+/g, " ").slice(0, 1400);
  return {
    consent,
    filledFields,
    uploadedFiles,
    action,
    resultText
  };
}

export async function captureToolWebsite(row, runDir, config) {
  if (!row.tool_url || !validUrl(row.tool_url)) {
    return {
      enabled: false,
      summary: "No valid Tool URL was provided.",
      files: []
    };
  }

  const captureConfig = config.capture || {};
  const screenshotDir = path.join(runDir, "screenshots");
  const videoDir = path.join(runDir, "recordings");
  const demoDir = path.join(runDir, "demo-assets");
  await ensureDir(screenshotDir);
  await ensureDir(videoDir);
  await ensureDir(demoDir);

  const { chromium } = await import("playwright");
  const launchOptions = {
    headless: true
  };
  await applyChromeLaunchOptions(launchOptions, { channelFallback: false });

  let browser;
  browser = await launchWithBundledFallback(chromium, launchOptions, (options) => chromium.launch(options));
  const files = [];

  try {
    const desktop = await browser.newPage({
      viewport: captureConfig.desktopViewport || { width: 1365, height: 768 }
    });
    await desktop.goto(row.tool_url, {
      waitUntil: "domcontentloaded",
      timeout: captureConfig.timeoutMs || 45000
    });
    await desktop.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});

    const title = await pageTitle(desktop);
    const text = (await visibleText(desktop)).replace(/\s+/g, " ").slice(0, 1200);

    const desktopShot = path.join(screenshotDir, "desktop-top.png");
    await desktop.screenshot({ path: desktopShot, fullPage: false });
    files.push(desktopShot);

    const fullPageShot = path.join(screenshotDir, "desktop-full-page.png");
    await desktop.screenshot({ path: fullPageShot, fullPage: true });
    files.push(fullPageShot);
    await desktop.close();

    const demoFiles = await createDemoUploadFiles(browser, demoDir, row);
    const demoContext = await browser.newContext({
      viewport: captureConfig.desktopViewport || { width: 1365, height: 768 },
      recordVideo: captureConfig.recordWebm === false ? undefined : {
        dir: videoDir,
        size: captureConfig.desktopViewport || { width: 1365, height: 768 }
      }
    });
    const demoPage = await demoContext.newPage();
    await demoPage.goto(row.tool_url, {
      waitUntil: "domcontentloaded",
      timeout: captureConfig.timeoutMs || 45000
    });
    await demoPage.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});

    const demoBeforeShot = path.join(screenshotDir, "desktop-demo-before.png");
    await demoPage.screenshot({ path: demoBeforeShot, fullPage: false });
    files.push(demoBeforeShot);

    const demoInteraction = await interactWithTool(demoPage, row, demoFiles).catch((error) => ({
      error: error.message
    }));

    const demoAfterShot = path.join(screenshotDir, "desktop-demo-after.png");
    await demoPage.screenshot({ path: demoAfterShot, fullPage: false });
    files.push(demoAfterShot);

    const demoVideo = demoPage.video();
    await demoPage.close();
    await demoContext.close();

    if (demoVideo) {
      const webmPath = await demoVideo.path().catch(() => null);
      if (webmPath) {
        const targetPath = path.join(videoDir, "desktop-demo.webm");
        await fs.rename(webmPath, targetPath).catch(async () => {
          await fs.copyFile(webmPath, targetPath);
        });
        files.push(targetPath);
      }
    }

    const context = await browser.newContext({
      viewport: captureConfig.mobileViewport || { width: 390, height: 844 },
      recordVideo: captureConfig.recordWebm === false ? undefined : {
        dir: videoDir,
        size: captureConfig.mobileViewport || { width: 390, height: 844 }
      }
    });

    const mobile = await context.newPage();
    await mobile.goto(row.tool_url, {
      waitUntil: "domcontentloaded",
      timeout: captureConfig.timeoutMs || 45000
    });
    await mobile.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});

    const mobileShot = path.join(screenshotDir, "mobile-top.png");
    await mobile.screenshot({ path: mobileShot, fullPage: false });
    files.push(mobileShot);

    const steps = captureConfig.scrollSteps || 4;
    for (let step = 0; step < steps; step += 1) {
      await mobile.mouse.wheel(0, 700);
      await mobile.waitForTimeout(900);
    }

    const video = mobile.video();
    await mobile.close();
    await context.close();

    if (video) {
      const webmPath = await video.path().catch(() => null);
      if (webmPath) {
        const targetPath = path.join(videoDir, "mobile-scroll.webm");
        await fs.rename(webmPath, targetPath).catch(async () => {
          await fs.copyFile(webmPath, targetPath);
        });
        files.push(targetPath);
      }
    }

    return {
      enabled: true,
      summary: [
        `Opened actual Tool URL: ${row.tool_url}`,
        title ? `Page title: ${title}` : null,
        text ? `Visible page text sample: ${text}` : null,
        demoInteraction?.error ? `Demo interaction warning: ${demoInteraction.error}` : null,
        demoInteraction && !demoInteraction.error ? `Demo interaction: accepted ${demoInteraction.consent.clicked} consent checkbox(es), filled ${demoInteraction.filledFields.length} field(s), uploaded ${demoInteraction.uploadedFiles.filter((item) => item.uploaded).length} file(s), primary action clicked: ${demoInteraction.action.clicked ? "yes" : "no"}.` : null,
        demoInteraction?.resultText ? `Post-demo page text sample: ${demoInteraction.resultText}` : null,
        `Captured ${files.length} file(s) for reference.`
      ].filter(Boolean).join("\n"),
      files
    };
  } finally {
    await browser.close();
  }
}
