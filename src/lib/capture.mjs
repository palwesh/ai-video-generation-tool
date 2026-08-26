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

function siteRootUrl(value) {
  try {
    const url = new URL(value);
    return `${url.protocol}//${url.host}/`;
  } catch {
    return value;
  }
}

async function settleVisualPage(page) {
  await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
  await page.evaluate(() => document.fonts?.ready).catch(() => {});
  await page.waitForTimeout(700);
}

async function focusCaptureArea(page, mode = "tool") {
  await page.evaluate((captureMode) => {
    const clean = (value) => String(value || "").replace(/\s+/g, " ").trim();
    const isVisible = (element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return Boolean(rect.width > 30 && rect.height > 20 && element.getClientRects().length && style.visibility !== "hidden" && style.display !== "none");
    };
    const textFor = (element) => clean(`${element.innerText || element.textContent || ""} ${element.getAttribute?.("aria-label") || ""}`);
    const nodes = Array.from(document.querySelectorAll([
      "main",
      "section",
      "form",
      "textarea",
      "input",
      "button",
      "[role='button']",
      "[role='textbox']",
      "[contenteditable='true']",
      "[class*='tool' i]",
      "[class*='result' i]",
      "[class*='output' i]"
    ].join(","))).filter(isVisible);

    const mode = String(captureMode || "tool");
    const actionMatch = /generate|convert|process|run|create|check|scan|review|summari[sz]e|extract|remove|submit|upload|choose/i;
    const resultMatch = /result|output|summary|download|copy|warning|success|completed|ready|generated|after|next step/i;
    const toolMatch = /tool|generator|converter|checker|analy[sz]er|input|textarea|upload|file|demo/i;

    let best = null;
    let bestScore = -Infinity;
    for (const element of nodes) {
      const rect = element.getBoundingClientRect();
      const text = textFor(element);
      const tag = element.tagName.toLowerCase();
      let score = 0;
      if (mode === "landing") {
        if (tag === "main") score += 75;
        if (tag === "section") score += 55;
        if (element.querySelector?.("h1")) score += 80;
        if (/alt\s*f|altftool|tool/i.test(text)) score += 35;
        score -= Math.max(0, rect.top) * 0.02;
      } else if (mode === "result") {
        if (resultMatch.test(text)) score += 105;
        if (element.querySelector?.("pre,code,table,textarea,[class*='result' i],[class*='output' i]")) score += 35;
        if (tag === "main" || tag === "section") score += 20;
      } else {
        if (toolMatch.test(text)) score += 80;
        if (element.querySelector?.("textarea,input,button,[role='button'],[contenteditable='true']")) score += 75;
        if (actionMatch.test(text)) score += 35;
        if (tag === "form") score += 80;
      }
      score += Math.min(90, rect.height * 0.045);
      score += Math.min(70, rect.width * 0.025);
      if (rect.top < 120) score += 12;
      if (score > bestScore) {
        bestScore = score;
        best = element;
      }
    }

    if (best) {
      best.scrollIntoView({ block: mode === "landing" ? "start" : "center", inline: "center" });
      window.scrollBy(0, mode === "landing" ? -24 : -84);
    } else {
      window.scrollTo({ top: 0, left: 0 });
    }
  }, mode).catch(() => {});
  await page.waitForTimeout(700);
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

function demoFieldSummary(fields = []) {
  return fields
    .map((field) => {
      const name = field.label || field.name || field.type || field.tagName || "field";
      const value = field.value || "";
      return value ? `${name}: ${value}` : name;
    })
    .slice(0, 6)
    .join("; ");
}

function compactText(value, maxLength = 180) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength - 3).replace(/\s+\S*$/, "").trim()}...`;
}

function actionLabel(action = {}) {
  const candidate = action?.candidate || {};
  return compactText(candidate.text || candidate.ariaLabel || candidate.value || "", 64);
}

function recommendedShotFiles(files = []) {
  const names = [
    "desktop-landing.png",
    "tool-readable.png",
    "desktop-demo-before.png",
    "desktop-demo-inputs.png",
    "desktop-demo.webm",
    "desktop-demo-after.png",
    "mobile-top.png",
    "mobile-scroll.webm"
  ];
  return names
    .map((name) => files.find((file) => path.basename(file) === name))
    .filter(Boolean);
}

function buildToolUseGuide(row, page = {}, demoInteraction = {}, files = []) {
  const fields = Array.isArray(demoInteraction?.filledFields) ? demoInteraction.filledFields : [];
  const uploads = Array.isArray(demoInteraction?.uploadedFiles)
    ? demoInteraction.uploadedFiles.filter((item) => item.uploaded)
    : [];
  const action = actionLabel(demoInteraction?.action);
  const inputSummary = demoFieldSummary(fields)
    || (uploads.length ? `${uploads.length} demo upload file(s) selected` : "visible input or upload area with fictional demo data");
  const resultPreview = compactText(demoInteraction?.resultText, 260);
  const title = compactText(page.title || row.tool_name || row.topic || "AltFTool micro tool", 120);
  const pageFocus = compactText(page.text, 260);
  const toolUrl = row.tool_url || "";
  const primaryAction = action || (demoInteraction?.action?.clicked ? "the visible primary action" : "main run/generate/convert action if visible");

  const demoSteps = [
    toolUrl ? `Open the real tool link: ${toolUrl}` : "Open the real tool page.",
    `Show what the page is for: ${title}.`,
    `Fill or upload fictional demo data: ${inputSummary}.`,
    `Click ${primaryAction}.`,
    resultPreview ? `Hold the result/output screen and review: ${resultPreview}` : "Hold the result/output screen and review before using or sharing."
  ];

  return {
    toolName: row.tool_name || row.topic || "AltFTool micro tool",
    toolUrl,
    pageTitle: title,
    pageFocus,
    primaryUseCase: compactText(row.description || row.main_benefit || pageFocus || title, 220),
    inputsShown: fields,
    uploadsShown: uploads,
    primaryAction,
    actionClicked: Boolean(demoInteraction?.action?.clicked),
    outputPreview: resultPreview,
    demoSteps,
    recommendedShots: recommendedShotFiles(files),
    visualPriority: [
      "Show the real tool page first so viewers understand what the tool is.",
      "Zoom into the input/upload area and keep labels readable.",
      "Show the cursor clicking the real visible action.",
      "Hold the result/output screen long enough to understand the value.",
      "Use fictional/demo data only and avoid fake UI."
    ]
  };
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
    const deny = /search|newsletter|subscribe|login|sign in|menu|filter|coupon|promo|captcha/i;
    const skipTypes = /^(button|submit|reset|checkbox|radio|file|hidden|image|color|range|password)$/i;
    const shortSample = String(sample || "").split(/\r?\n/).slice(0, 3).join("\n");
    const fields = Array.from(document.querySelectorAll("textarea, input, [contenteditable='true'], [role='textbox']"));
    const filled = [];
    const clean = (value) => String(value || "").replace(/\s+/g, " ").trim();
    const associatedLabel = (element) => {
      const id = element.getAttribute("id");
      const label = element.closest("label") || (id ? document.querySelector(`label[for="${CSS.escape(id)}"]`) : null);
      const labelText = clean(label?.innerText || "");
      return clean([
        element.getAttribute("aria-label"),
        element.getAttribute("placeholder"),
        element.getAttribute("name"),
        element.getAttribute("id"),
        labelText.length <= 220 ? labelText : ""
      ].filter(Boolean).join(" "));
    };
    const isVisibleOnPage = (element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return Boolean(
        rect.width > 48 &&
        rect.height > 18 &&
        element.getClientRects().length &&
        style.visibility !== "hidden" &&
        style.display !== "none"
      );
    };
    const setNativeValue = (element, value) => {
      const valueSetter = Object.getOwnPropertyDescriptor(element, "value")?.set;
      const prototype = Object.getPrototypeOf(element);
      const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
      if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
        prototypeValueSetter.call(element, value);
      } else if (valueSetter) {
        valueSetter.call(element, value);
      } else {
        element.value = value;
      }
    };
    const setValue = (element, value) => {
      const tagName = element.tagName.toLowerCase();
      if (element.isContentEditable || element.getAttribute("role") === "textbox") {
        element.focus();
        element.textContent = value;
      } else if (tagName === "input" || tagName === "textarea") {
        element.focus();
        setNativeValue(element, value);
      }
      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
      element.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, key: " " }));
      element.setAttribute("data-trf-demo-filled", "true");
    };
    const valueForField = (element, label) => {
      const type = String(element.getAttribute("type") || "").toLowerCase();
      const lowerLabel = label.toLowerCase();
      if (type === "number" || /salary|amount|price|rate|total|income|ctc|cost|fee|age|year|days?|hours?|minutes?|count|quantity|qty/.test(lowerLabel)) return /age/.test(lowerLabel) ? "28" : "75000";
      if (type === "url" || /url|link|website|domain/.test(lowerLabel)) return "https://www.altftool.com/demo";
      if (type === "email" || /email|mail/.test(lowerLabel)) return "riya.demo@example.com";
      if (type === "tel" || /phone|mobile|contact|whatsapp/.test(lowerLabel)) return "+1 555 010 2345";
      if (type === "date" || /date|dob/.test(lowerLabel)) return "2026-08-01";
      if (type === "month") return "2026-08";
      if (/company|business|organization|employer/.test(lowerLabel)) return "Demo Labs Pvt Ltd";
      if (/name|employee|client|customer|student|person/.test(lowerLabel)) return "Riya Demo";
      if (/city|location|address/.test(lowerLabel)) return /city|location/.test(lowerLabel) ? "Sample City" : "42 Demo Street, Sample City";
      if (element.tagName.toLowerCase() === "textarea" || element.isContentEditable || element.getAttribute("role") === "textbox") return shortSample;
      return "Demo input";
    };
    const scoreField = (element, label) => {
      const rect = element.getBoundingClientRect();
      const tagName = element.tagName.toLowerCase();
      const type = String(element.getAttribute("type") || "").toLowerCase();
      const lowerLabel = label.toLowerCase();
      let score = 0;
      if (tagName === "textarea") score += 120;
      if (element.isContentEditable || element.getAttribute("role") === "textbox") score += 85;
      if (tagName === "input" && /^(text|email|tel|url|number|date|month|)$/i.test(type)) score += 45;
      if (/source|input|paste|text|prompt|content|data|details|description|message|query/.test(lowerLabel)) score += 60;
      if (/output|result|redacted|download|copy/.test(lowerLabel)) score -= 120;
      if (deny.test(label) && tagName !== "textarea" && !element.isContentEditable && element.getAttribute("role") !== "textbox") score -= 180;
      if (rect.top >= 0 && rect.top < window.innerHeight) score += 35;
      score += Math.min(80, rect.width * 0.025);
      score += Math.min(80, rect.height * 0.06);
      return score;
    };

    const candidates = fields
      .map((element) => {
        const type = element.getAttribute("type") || "";
        const label = associatedLabel(element);
        return { element, type, label, score: scoreField(element, label) };
      })
      .filter(({ element, type, label, score }) => (
        isVisibleOnPage(element) &&
        !element.disabled &&
        !element.readOnly &&
        !skipTypes.test(type) &&
        score > 0 &&
        !(deny.test(label) && score < 100)
      ))
      .sort((a, b) => b.score - a.score);

    for (const { element, type, label } of candidates) {
      if (element.getAttribute("data-trf-demo-filled") === "true") {
        continue;
      }
      const value = valueForField(element, label);
      setValue(element, value);
      filled.push({
        tagName: element.tagName.toLowerCase(),
        type,
        label: label.replace(/\s+/g, " ").trim().slice(0, 120),
        name: element.getAttribute("name") || "",
        value: String(value).replace(/\s+/g, " ").slice(0, 120)
      });
      if (filled.length >= 6) {
        break;
      }
    }

    if (filled.length) {
      const style = document.createElement("style");
      style.setAttribute("data-trf-demo-style", "true");
      style.textContent = `
        [data-trf-demo-filled="true"] {
          outline: 4px solid #facc15 !important;
          box-shadow: 0 0 0 8px rgba(250, 204, 21, 0.26), 0 12px 34px rgba(15, 23, 42, 0.16) !important;
          background-color: #fffdf3 !important;
        }
      `;
      document.head.appendChild(style);
      document.querySelector("[data-trf-demo-filled='true']")?.scrollIntoView({ block: "center", inline: "center" });
      window.scrollBy(0, -80);
    }

    return filled;
  }, demoText);
}

async function clickSafeDemoButton(page) {
  const candidate = await page.evaluate(() => {
    document.querySelectorAll("[data-trf-demo-action]").forEach((element) => {
      element.removeAttribute("data-trf-demo-action");
    });

    const clean = (value) => String(value || "").replace(/\s+/g, " ").trim();
    const prefer = /\b(load|try|use|insert|fill)\b.*\b(safe\s+demo|demo|sample|example)\b|\b(safe\s+demo|sample\s+data|example\s+data|demo\s+data)\b/i;
    const deny = /download|copy|share|reset|clear|delete|remove|menu|login|sign in|pricing|subscribe|close|cancel/i;
    const elements = Array.from(document.querySelectorAll("button, [role='button'], a"));
    const scored = elements.map((element, index) => {
      const rect = element.getBoundingClientRect();
      const text = clean(element.innerText || element.textContent || element.getAttribute("aria-label") || "");
      const visible = Boolean(rect.width && rect.height && element.getClientRects().length);
      let score = -1000;
      if (visible && text && prefer.test(text) && !deny.test(text)) {
        score = 100;
        if (/safe\s+demo/i.test(text)) score += 80;
        if (rect.top >= 0 && rect.top < window.innerHeight) score += 35;
      }
      return {
        index,
        score,
        text,
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
    elements[scored.index].setAttribute("data-trf-demo-action", "true");
    elements[scored.index].scrollIntoView({ block: "center", inline: "center" });
    window.scrollBy(0, -80);
    return scored;
  });

  if (!candidate) {
    return { clicked: false, reason: "No safe demo/sample button was found." };
  }

  const locator = page.locator("[data-trf-demo-action='true']").first();
  let clicked = await locator.click({ timeout: 5000, force: true }).then(() => true).catch(() => false);
  if (!clicked) {
    await page.mouse.click(candidate.centerX, candidate.centerY).then(() => {
      clicked = true;
    }).catch(() => {});
  }
  await page.waitForTimeout(1200);
  return clicked
    ? { clicked: true, candidate }
    : { clicked: false, candidate, reason: "Safe demo/sample button could not be clicked." };
}

async function detectPopulatedFields(page) {
  return await page.evaluate(() => {
    const clean = (value) => String(value || "").replace(/\s+/g, " ").trim();
    const fields = Array.from(document.querySelectorAll("textarea, input, [contenteditable='true'], [role='textbox']"));
    const visible = (element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return Boolean(rect.width > 48 && rect.height > 18 && element.getClientRects().length && style.visibility !== "hidden" && style.display !== "none");
    };
    const valueOf = (element) => {
      if (element.isContentEditable || element.getAttribute("role") === "textbox") {
        return clean(element.innerText || element.textContent || "");
      }
      return clean(element.value || "");
    };
    const labelFor = (element) => {
      const id = element.getAttribute("id");
      const label = element.closest("label") || (id ? document.querySelector(`label[for="${CSS.escape(id)}"]`) : null);
      return clean([
        element.getAttribute("aria-label"),
        element.getAttribute("placeholder"),
        element.getAttribute("name"),
        element.getAttribute("id"),
        label?.innerText?.length <= 220 ? label.innerText : ""
      ].filter(Boolean).join(" "));
    };
    const populated = fields
      .filter((element) => visible(element) && valueOf(element))
      .map((element) => {
        element.setAttribute("data-trf-demo-filled", "true");
        return {
          tagName: element.tagName.toLowerCase(),
          type: element.getAttribute("type") || "",
          label: labelFor(element).slice(0, 120),
          name: element.getAttribute("name") || "",
          value: valueOf(element).slice(0, 120)
        };
      })
      .slice(0, 6);

    if (populated.length && !document.querySelector("[data-trf-demo-style='true']")) {
      const style = document.createElement("style");
      style.setAttribute("data-trf-demo-style", "true");
      style.textContent = `
        [data-trf-demo-filled="true"] {
          outline: 4px solid #facc15 !important;
          box-shadow: 0 0 0 8px rgba(250, 204, 21, 0.26), 0 12px 34px rgba(15, 23, 42, 0.16) !important;
          background-color: #fffdf3 !important;
        }
      `;
      document.head.appendChild(style);
    }
    document.querySelector("[data-trf-demo-filled='true']")?.scrollIntoView({ block: "center", inline: "center" });
    window.scrollBy(0, -80);
    return populated;
  });
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

async function interactWithTool(page, row, demoFiles, options = {}) {
  const consent = await acceptSafeCheckboxes(page);
  let filledFields = await fillDemoFields(page, row);
  let demoButton = { clicked: false, reason: "" };
  if (!filledFields.length) {
    demoButton = await clickSafeDemoButton(page);
    if (demoButton.clicked) {
      filledFields = await detectPopulatedFields(page);
    }
  }
  const uploadedFiles = await uploadDemoFiles(page, row, demoFiles);
  if (options.inputScreenshotPath) {
    await page.waitForTimeout(900);
    await page.screenshot({ path: options.inputScreenshotPath, fullPage: false }).catch(() => {});
  }
  const action = await clickPrimaryToolAction(page);
  const resultText = (await visibleText(page)).replace(/\s+/g, " ").slice(0, 1400);
  return {
    consent,
    filledFields,
    filledFieldSummary: demoFieldSummary(filledFields),
    demoButton,
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
  const desktopViewport = captureConfig.desktopViewport || { width: 1365, height: 768 };
  const readableViewport = captureConfig.readableViewport || { width: 1080, height: 1920 };
  const demoViewport = captureConfig.demoViewport || readableViewport;

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
      viewport: desktopViewport
    });
    await desktop.goto(row.tool_url, {
      waitUntil: "domcontentloaded",
      timeout: captureConfig.timeoutMs || 45000
    });
    await settleVisualPage(desktop);

    const title = await pageTitle(desktop);
    const text = (await visibleText(desktop)).replace(/\s+/g, " ").slice(0, 1200);

    const desktopShot = path.join(screenshotDir, "desktop-top.png");
    await desktop.screenshot({ path: desktopShot, fullPage: false });
    files.push(desktopShot);

    const fullPageShot = path.join(screenshotDir, "desktop-full-page.png");
    await desktop.screenshot({ path: fullPageShot, fullPage: true });
    files.push(fullPageShot);

    await desktop.setViewportSize(readableViewport).catch(() => {});
    await focusCaptureArea(desktop, "tool");
    const readableToolShot = path.join(screenshotDir, "tool-readable.png");
    await desktop.screenshot({ path: readableToolShot, fullPage: false });
    files.push(readableToolShot);
    await desktop.close();

    const landing = await browser.newPage({ viewport: readableViewport });
    await landing.goto(siteRootUrl(row.tool_url), {
      waitUntil: "domcontentloaded",
      timeout: captureConfig.timeoutMs || 45000
    }).catch(async () => {
      await landing.goto(row.tool_url, {
        waitUntil: "domcontentloaded",
        timeout: captureConfig.timeoutMs || 45000
      });
    });
    await settleVisualPage(landing);
    await focusCaptureArea(landing, "landing");
    const landingShot = path.join(screenshotDir, "desktop-landing.png");
    await landing.screenshot({ path: landingShot, fullPage: false });
    files.push(landingShot);
    await landing.close();

    const demoFiles = await createDemoUploadFiles(browser, demoDir, row);
    const demoContext = await browser.newContext({
      viewport: demoViewport,
      recordVideo: captureConfig.recordWebm === false ? undefined : {
        dir: videoDir,
        size: demoViewport
      }
    });
    const demoPage = await demoContext.newPage();
    await demoPage.goto(row.tool_url, {
      waitUntil: "domcontentloaded",
      timeout: captureConfig.timeoutMs || 45000
    });
    await settleVisualPage(demoPage);
    await focusCaptureArea(demoPage, "tool");

    const demoBeforeShot = path.join(screenshotDir, "desktop-demo-before.png");
    await demoPage.screenshot({ path: demoBeforeShot, fullPage: false });
    files.push(demoBeforeShot);

    const demoInputShot = path.join(screenshotDir, "desktop-demo-inputs.png");
    const demoInteraction = await interactWithTool(demoPage, row, demoFiles, {
      inputScreenshotPath: demoInputShot
    }).catch((error) => ({
      error: error.message
    }));
    await fs.access(demoInputShot).then(() => files.push(demoInputShot)).catch(() => {});

    const demoAfterShot = path.join(screenshotDir, "desktop-demo-after.png");
    await focusCaptureArea(demoPage, "result");
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

    const toolUseGuide = buildToolUseGuide(row, { title, text }, demoInteraction, files);

    return {
      enabled: true,
      summary: [
        `Opened actual Tool URL: ${row.tool_url}`,
        title ? `Page title: ${title}` : null,
        text ? `Visible page text sample: ${text}` : null,
        toolUseGuide?.primaryUseCase ? `Tool use focus: ${toolUseGuide.primaryUseCase}` : null,
        toolUseGuide?.demoSteps?.length ? `How to use flow: ${toolUseGuide.demoSteps.join(" -> ")}` : null,
        demoInteraction?.error ? `Demo interaction warning: ${demoInteraction.error}` : null,
        demoInteraction && !demoInteraction.error ? `Demo interaction: accepted ${demoInteraction.consent.clicked} consent checkbox(es), filled ${demoInteraction.filledFields.length} field(s), safe demo clicked: ${demoInteraction.demoButton?.clicked ? "yes" : "no"}, uploaded ${demoInteraction.uploadedFiles.filter((item) => item.uploaded).length} file(s), primary action clicked: ${demoInteraction.action.clicked ? "yes" : "no"}.` : null,
        demoInteraction?.filledFieldSummary ? `Demo input values shown: ${demoInteraction.filledFieldSummary}` : null,
        demoInteraction?.resultText ? `Post-demo page text sample: ${demoInteraction.resultText}` : null,
        `Captured ${files.length} file(s) for reference.`
      ].filter(Boolean).join("\n"),
      files,
      toolUseGuide
    };
  } finally {
    await browser.close();
  }
}
