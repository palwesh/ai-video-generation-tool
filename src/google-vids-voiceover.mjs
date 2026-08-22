import path from "node:path";
import fs from "node:fs/promises";
import dotenv from "dotenv";
import { parseArgs } from "./lib/args.mjs";
import { ensureDir, writeJson, writeText } from "./lib/fsx.mjs";
import { applyChromeLaunchOptions, launchWithBundledFallback } from "./lib/browser-paths.mjs";
import {
  ensureGoogleVidsSafe,
  saveGoogleVidsSafetySnapshot,
  safetyFieldsFromError
} from "./lib/google-vids-safety.mjs";

dotenv.config({ quiet: true });

const args = parseArgs(process.argv.slice(2));
const profileDir = args.profile || "work/google-vids-profile";
const targetUrl = args.url || "https://vids.new";
const outputDir = path.resolve(args.output || path.join(
  "outputs",
  "runs",
  `google-vids-voiceover-${new Date().toISOString().replace(/[:.]/g, "-")}`
));
const manualRecoveryWaitMs = Number(args["manual-recovery-wait"] || process.env.TRF_MANUAL_RECOVERY_WAIT_MS || 0);
const requestedVoiceGender = normalizeVoiceGender(args["voice-gender"] || args.gender || args.presenter || "auto");
const requestedVoiceLabel = String(args["voice-label"] || args.voice || "").trim();

function logProgress(message) {
  console.log(`[voiceover] ${message}`);
}

function normalizeVoiceGender(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (/(female|woman|girl|feminine)/i.test(raw)) {
    return "female";
  }
  if (/(male|man|boy|masculine)/i.test(raw)) {
    return "male";
  }
  return "auto";
}

async function readVoiceoverScript() {
  if (args.script) {
    return String(await fs.readFile(path.resolve(args.script), "utf8")).trim();
  }
  if (args.text) {
    return String(args.text).trim();
  }
  throw new Error("Missing --script or --text for Google Vids voiceover generation.");
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

async function screenshot(page, name) {
  const filePath = path.join(outputDir, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: false }).catch(() => null);
  return filePath;
}

async function pageState(page, name) {
  const info = await page.evaluate(() => {
    const clean = (value) => String(value || "").replace(/\s+/g, " ").trim();
    const controls = Array.from(document.querySelectorAll(
      "button, [role='button'], [role='tab'], [role='menuitem'], a, input, textarea, [contenteditable='true'], [aria-label]"
    )).map((element, index) => ({
      index,
      tag: element.tagName.toLowerCase(),
      role: element.getAttribute("role") || "",
      text: clean(element.innerText || element.textContent).slice(0, 220),
      ariaLabel: clean(element.getAttribute("aria-label")).slice(0, 220),
      placeholder: clean(element.getAttribute("placeholder")).slice(0, 220),
      x: element.getBoundingClientRect().x,
      y: element.getBoundingClientRect().y,
      width: element.getBoundingClientRect().width,
      height: element.getBoundingClientRect().height,
      visible: Boolean(element.offsetWidth || element.offsetHeight || element.getClientRects().length)
    })).filter((control) => (
      control.visible && (control.text || control.ariaLabel || control.placeholder)
    )).slice(0, 260);

    return {
      url: location.href,
      title: document.title,
      bodyTextSample: clean(document.body?.innerText).slice(0, 3500),
      controls
    };
  });
  const redacted = redactJson(info);
  await writeJson(path.join(outputDir, `${name}.json`), redacted);
  return redacted;
}

async function clickByText(page, labels, timeout = 7000) {
  let disabledMatch = null;
  for (const label of labels) {
    const escaped = String(label).replace(/"/g, '\\"');
    const patterns = [
      `button:has-text("${escaped}")`,
      `[role="button"]:has-text("${escaped}")`,
      `[role="tab"]:has-text("${escaped}")`,
      `[aria-label*="${escaped}" i]`,
      `text="${escaped}"`
    ];
    for (const selector of patterns) {
      const locator = page.locator(selector).first();
      const count = await locator.count().catch(() => 0);
      if (!count) {
        continue;
      }
      const disabled = await locator.evaluate((element) => {
        const className = typeof element.className === "string" ? element.className : "";
        const ariaLabel = String(element.getAttribute("aria-label") || "");
        return Boolean(element.disabled) ||
          element.getAttribute("aria-disabled") === "true" ||
          Boolean(element.closest("[aria-disabled='true']")) ||
          /\bdisabled\b/i.test(className) ||
          /add at least \d+ words/i.test(ariaLabel);
      }).catch(() => false);
      if (disabled) {
        disabledMatch = { label, selector };
        continue;
      }
      const clicked = await locator.click({ timeout, force: true }).then(() => true).catch(() => false);
      if (!clicked) {
        continue;
      }
      await page.waitForTimeout(1200);
      return { clicked: true, label, selector };
    }
  }
  return { clicked: false, disabledMatch };
}

async function clickRankedRightPanelButton(page, labels, timeout = 7000) {
  for (const label of labels) {
    const selector = await page.evaluate((needle) => {
      document.querySelectorAll("[data-trf-ranked-click]").forEach((element) => {
        element.removeAttribute("data-trf-ranked-click");
      });
      const clean = (value) => String(value || "").replace(/\s+/g, " ").trim();
      const pattern = new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      const viewport = { width: window.innerWidth, height: window.innerHeight };
      const elements = Array.from(document.querySelectorAll("button, [role='button'], [role='menuitem'], [role='option'], [role='tab']"));
      const ranked = elements.map((element, index) => {
        const rect = element.getBoundingClientRect();
        const text = clean(element.innerText || element.textContent);
        const ariaLabel = clean(element.getAttribute("aria-label"));
        const name = `${ariaLabel} ${text}`;
        const className = typeof element.className === "string" ? element.className : "";
        const disabled = Boolean(element.disabled) ||
          element.getAttribute("aria-disabled") === "true" ||
          Boolean(element.closest("[aria-disabled='true']")) ||
          /\bdisabled\b/i.test(className) ||
          /add at least \d+ words/i.test(ariaLabel);
        let score = 0;
        if (!rect.width || !rect.height || !element.getClientRects().length || disabled || !pattern.test(name)) {
          score = -1000;
        } else {
          score += 100;
          if (rect.x > viewport.width * 0.48) score += 80;
          if (rect.y > 90 && rect.y < viewport.height - 70) score += 25;
          if (/voice|audio|speaker|narration|tag|update|apply|change/i.test(name)) score += 35;
          if (/zoom|timeline zoom|selected\.|select \(esc\)|list\./i.test(name)) score -= 300;
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
          disabled
        };
      }).filter((item) => item.score > 0).sort((a, b) => b.score - a.score);
      const chosen = ranked[0];
      if (!chosen) {
        return null;
      }
      elements[chosen.index].setAttribute("data-trf-ranked-click", "true");
      return { selector: "[data-trf-ranked-click='true']", target: chosen };
    }, label).catch(() => null);

    if (!selector?.selector) {
      continue;
    }
    const clicked = await page.locator(selector.selector).first().click({ timeout, force: true }).then(() => true).catch(() => false);
    if (!clicked) {
      continue;
    }
    await page.waitForTimeout(1200);
    return { clicked: true, label, selector: selector.selector, target: selector.target, method: "right_panel_ranked" };
  }

  return await clickByText(page, labels, timeout);
}

async function editorVoiceoverAvailable(page) {
  const bodyText = await page.locator("body").innerText({ timeout: 3000 }).catch(() => "");
  return /voiceover|voice over|timeline|file|share/i.test(bodyText);
}

async function startDialogVisible(page) {
  const bodyText = await page.locator("body").innerText({ timeout: 3000 }).catch(() => "");
  return /let'?s start creating|getting started|blank vid|create ai videos|personal avatar|slides to video/i.test(bodyText);
}

async function selectBlankStartOption(page) {
  const attempts = [];
  const hasStartDialog = await startDialogVisible(page);
  if (!hasStartDialog && await editorVoiceoverAvailable(page)) {
    return {
      selected: false,
      skipped: true,
      reason: "Editor already appears ready; blank start screen was not required.",
      attempts
    };
  }

  const directBlank = await clickByText(page, [
    "Blank vid",
    "Blank",
    "Blank video",
    "Blank Video",
    "Create blank",
    "Create blank video",
    "New blank video",
    "Start with blank",
    "Start from scratch",
    "No template"
  ], 9000);
  attempts.push({ name: "direct_blank_option", ...directBlank });
  if (directBlank.clicked) {
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(5000);
    return { selected: true, strategy: "direct_blank_option", attempts };
  }

  const newVideo = await clickByText(page, [
    "New video",
    "Create new",
    "Create",
    "Start"
  ], 6000);
  attempts.push({ name: "open_new_video_options", ...newVideo });
  if (newVideo.clicked) {
    const retryBlank = await clickByText(page, [
      "Blank vid",
      "Blank",
      "Blank video",
      "Blank Video",
      "Create blank",
      "Create blank video",
      "Start with blank",
      "Start from scratch"
    ], 9000);
    attempts.push({ name: "retry_blank_option", ...retryBlank });
    if (retryBlank.clicked) {
      await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(5000);
      return { selected: true, strategy: "new_video_then_blank", attempts };
    }
  }

  if (await editorVoiceoverAvailable(page)) {
    return {
      selected: false,
      skipped: true,
      reason: "Voiceover/editor controls became visible after start-option attempts.",
      attempts
    };
  }

  return {
    selected: false,
    skipped: false,
    reason: "Blank/start-from-scratch option was not found.",
    attempts
  };
}

function voiceLabelsForGender(gender) {
  const explicit = requestedVoiceLabel ? [requestedVoiceLabel] : [];
  if (gender === "male") {
    return [
      ...explicit,
      "Elio",
      "Knox",
      "Jett",
      "Zeno",
      "Holt",
      "Cale",
      "Neo",
      "Yori",
      "Narrator",
      "Persuader",
      "Explainer",
      "Motivator",
      "Male",
      "Male voice",
      "Man",
      "Masculine"
    ];
  }
  if (gender === "female") {
    return [
      ...explicit,
      "Nyla",
      "Tyra",
      "Lora",
      "Fira",
      "Kaci",
      "Lani",
      "Orla",
      "Sani",
      "Tova",
      "Vira",
      "Fola",
      "Peli",
      "Female",
      "Female voice",
      "Woman",
      "Feminine"
    ];
  }
  return explicit.length ? explicit : ["Natural", "Default", "Voice"];
}

async function clickVoiceOptionInDialog(page, labels, timeout = 9000) {
  for (const label of labels) {
    const target = await page.evaluate((needle) => {
      document.querySelectorAll("[data-trf-voice-option]").forEach((element) => {
        element.removeAttribute("data-trf-voice-option");
      });
      const clean = (value) => String(value || "").replace(/\s+/g, " ").trim();
      const pattern = new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      const dialog = Array.from(document.querySelectorAll("[role='dialog'], dialog"))
        .find((element) => /select a voice|conversational voices|classic voices/i.test(clean(`${element.getAttribute("aria-label") || ""} ${element.innerText || element.textContent || ""}`)));
      const root = dialog || document;
      const elements = Array.from(root.querySelectorAll("[role='menuitem'], button, [role='option'], [role='button']"));
      const ranked = elements.map((element, index) => {
        const rect = element.getBoundingClientRect();
        const text = clean(element.innerText || element.textContent);
        const ariaLabel = clean(element.getAttribute("aria-label"));
        const name = `${text} ${ariaLabel}`;
        let score = 0;
        if (!rect.width || !rect.height || !element.getClientRects().length || !pattern.test(name)) {
          score = -1000;
        } else {
          score += 120;
          if (element.getAttribute("role") === "menuitem") score += 100;
          if (dialog && dialog.contains(element)) score += 120;
          if (/press enter to play|voice that is|pitch/i.test(name)) score += 80;
          if (/ai voiceover|current scene|edit script|change the voice|insert voiceover/i.test(name)) score -= 300;
        }
        return {
          index,
          score,
          text,
          ariaLabel,
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height
        };
      }).filter((item) => item.score > 0).sort((a, b) => b.score - a.score);
      const chosen = ranked[0];
      if (!chosen) {
        return null;
      }
      elements[chosen.index].setAttribute("data-trf-voice-option", "true");
      return { selector: "[data-trf-voice-option='true']", target: chosen };
    }, label).catch(() => null);

    if (!target?.selector) {
      continue;
    }
    const clicked = await page.locator(target.selector).first().click({ timeout, force: true }).then(() => true).catch(() => false);
    if (!clicked) {
      continue;
    }
    await page.waitForTimeout(1000);
    return { clicked: true, label, selector: target.selector, target: target.target, method: "voice_dialog" };
  }
  return { clicked: false };
}

async function clickVoiceDialogSelect(page, timeout = 9000) {
  const target = await page.evaluate(() => {
    document.querySelectorAll("[data-trf-voice-select]").forEach((element) => {
      element.removeAttribute("data-trf-voice-select");
    });
    const clean = (value) => String(value || "").replace(/\s+/g, " ").trim();
    const dialog = Array.from(document.querySelectorAll("[role='dialog'], dialog"))
      .find((element) => /select a voice|conversational voices|classic voices/i.test(clean(`${element.getAttribute("aria-label") || ""} ${element.innerText || element.textContent || ""}`)));
    if (!dialog) {
      return null;
    }
    const dialogRect = dialog.getBoundingClientRect();
    const elements = Array.from(dialog.querySelectorAll("button, [role='button']"));
    const ranked = elements.map((element, index) => {
      const rect = element.getBoundingClientRect();
      const text = clean(element.innerText || element.textContent);
      const ariaLabel = clean(element.getAttribute("aria-label"));
      const name = `${text} ${ariaLabel}`;
      let score = 0;
      if (!rect.width || !rect.height || !element.getClientRects().length || !/^select\b/i.test(name)) {
        score = -1000;
      } else {
        score += 200;
        if (rect.y > dialogRect.bottom - 110) score += 160;
        if (rect.x > dialogRect.right - 180) score += 120;
        if (/select \(esc\)|zoom|list/i.test(name)) score -= 400;
      }
      return {
        index,
        score,
        text,
        ariaLabel,
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height
      };
    }).filter((item) => item.score > 0).sort((a, b) => b.score - a.score);
    const chosen = ranked[0];
    if (!chosen) {
      return null;
    }
    elements[chosen.index].setAttribute("data-trf-voice-select", "true");
    return { selector: "[data-trf-voice-select='true']", target: chosen };
  }).catch(() => null);

  if (!target?.selector) {
    return { clicked: false, reason: "Voice dialog Select button was not found." };
  }
  const clicked = await page.locator(target.selector).first().click({ timeout, force: true }).then(() => true).catch(() => false);
  if (!clicked) {
    return { clicked: false, reason: "Voice dialog Select button could not be clicked.", target: target.target };
  }
  await page.waitForTimeout(1800);
  const closed = await page.evaluate(() => !Array.from(document.querySelectorAll("[role='dialog'], dialog"))
    .some((element) => /select a voice|conversational voices|classic voices/i.test(String(`${element.getAttribute("aria-label") || ""} ${element.innerText || element.textContent || ""}`)))).catch(() => false);
  return { clicked: true, closed, selector: target.selector, target: target.target, method: "voice_dialog_select" };
}

async function selectVoiceForGender(page, gender) {
  if (gender === "auto" && !requestedVoiceLabel) {
    return {
      configured: false,
      skipped: true,
      gender,
      reason: "Voice gender is auto and no explicit voice label was provided."
    };
  }

  const attempts = [];
  const change = await clickRankedRightPanelButton(page, [
    "Change voice",
    "Change Voice",
    "Voice Change",
    "Change"
  ], 9000);
  attempts.push({ name: "click_change_voice", ...change });
  if (!change.clicked) {
    return {
      configured: false,
      gender,
      attempts,
      reason: "Voice Change button was not found."
    };
  }

  const voiceOption = await clickVoiceOptionInDialog(page, voiceLabelsForGender(gender), 9000);
  attempts.push({ name: "select_voice_option", ...voiceOption });
  if (!voiceOption.clicked) {
    return {
      configured: false,
      gender,
      attempts,
      reason: `${gender} voice option was not found after clicking Change.`
    };
  }

  const confirm = await clickVoiceDialogSelect(page, 9000);
  attempts.push({ name: "confirm_voice", ...confirm });
  if (!confirm.clicked || !confirm.closed) {
    return {
      configured: false,
      gender,
      attempts,
      confirm,
      reason: confirm.reason || "Voice selection dialog did not close after Select."
    };
  }
  return {
    configured: true,
    gender,
    voiceLabel: voiceOption.label,
    attempts,
    confirm
  };
}

async function openVoiceoverPanel(page) {
  const attempts = [];
  const primary = await clickByText(page, ["Voiceover", "Voice over", "Generate a voiceover", "AI voiceover"], 9000);
  attempts.push({ name: "primary_voiceover_click", ...primary });
  if (primary.clicked) {
    return { opened: true, attempts };
  }

  const create = await clickByText(page, ["Create", "Audio", "Insert"], 5000);
  attempts.push({ name: "open_create_or_audio_menu", ...create });
  if (create.clicked) {
    const retry = await clickByText(page, ["Voiceover", "Voice over", "Generate a voiceover", "AI voiceover"], 9000);
    attempts.push({ name: "retry_voiceover_click", ...retry });
    if (retry.clicked) {
      return { opened: true, attempts };
    }
  }

  return { opened: false, attempts, reason: "Voiceover tab/control was not found." };
}

async function findVoiceoverTextbox(page) {
  const target = await page.evaluate(() => {
    document.querySelectorAll("[data-trf-voiceover-target]").forEach((element) => {
      element.removeAttribute("data-trf-voiceover-target");
    });

    const clean = (value) => String(value || "").replace(/\s+/g, " ").trim();
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    const elements = Array.from(document.querySelectorAll("textarea, input[type='text'], [role='textbox'], [contenteditable='true']"));
    const ranked = elements.map((element, index) => {
      const rect = element.getBoundingClientRect();
      const tagName = element.tagName.toLowerCase();
      const role = element.getAttribute("role") || "";
      const ariaLabel = clean(element.getAttribute("aria-label"));
      const placeholder = clean(element.getAttribute("placeholder"));
      const text = clean(element.innerText || element.textContent);
      const name = `${ariaLabel} ${placeholder} ${text}`;
      const editable = tagName === "textarea" || tagName === "input" || role === "textbox" || element.isContentEditable;
      let score = 0;
      if (!rect.width || !rect.height || !element.getClientRects().length || !editable) {
        score = -1000;
      } else {
        if (/voiceover|voice over|script|text to speech|narration|paste/i.test(name)) score += 180;
        if (rect.x > viewport.width * 0.52) score += 70;
        if (rect.y > 130) score += 30;
        if (rect.height > 70) score += 35;
        if (role === "textbox") score += 35;
        if (tagName === "textarea") score += 45;
        if (/search|rename|title|comments|notes/i.test(name)) score -= 180;
        if (/zoom|timeline zoom|list\.|selected\.|percentage|percent/i.test(name)) score -= 500;
        if (rect.x < viewport.width * 0.65) score -= 80;
      }
      return {
        index,
        score,
        tagName,
        role,
        ariaLabel,
        placeholder,
        text: text.slice(0, 120),
        isContentEditable: element.isContentEditable,
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height
      };
    }).filter((item) => item.score > 0).sort((a, b) => b.score - a.score);

    const chosen = ranked[0];
    if (!chosen) {
      return null;
    }
    elements[chosen.index].setAttribute("data-trf-voiceover-target", "true");
    return chosen;
  });

  if (!target) {
    return null;
  }
  return {
    selector: "[data-trf-voiceover-target='true']",
    target,
    locator: page.locator("[data-trf-voiceover-target='true']").first()
  };
}

function textProbe(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 8)
    .join(" ");
}

async function voiceoverScriptVisible(page, scriptText) {
  const probe = textProbe(scriptText);
  if (!probe) return false;
  return await page.evaluate((needle) => {
    const clean = (value) => String(value || "").replace(/\s+/g, " ").trim();
    const body = clean(document.body?.innerText || "");
    return body.includes(needle);
  }, probe).catch(() => false);
}

async function clickEditScript(page) {
  const edit = await clickRankedRightPanelButton(page, ["Edit script"], 5000);
  if (edit.clicked) {
    await page.waitForTimeout(800);
  }
  return edit;
}

async function pasteIntoScriptsForm(page, scriptText) {
  const target = await page.evaluate(() => {
    document.querySelectorAll("[data-trf-scripts-form]").forEach((element) => {
      element.removeAttribute("data-trf-scripts-form");
    });
    const clean = (value) => String(value || "").replace(/\s+/g, " ").trim();
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    const elements = Array.from(document.querySelectorAll("[role='form'], [aria-label='Scripts'], [aria-label*='Scripts' i]"));
    const ranked = elements.map((element, index) => {
      const rect = element.getBoundingClientRect();
      const text = clean(element.innerText || element.textContent);
      const ariaLabel = clean(element.getAttribute("aria-label"));
      const name = `${ariaLabel} ${text}`;
      let score = 0;
      if (!rect.width || !rect.height || !element.getClientRects().length || !/scripts|enter a script|script for this scene/i.test(name)) {
        score = -1000;
      } else {
        score += 160;
        if (rect.x > viewport.width * 0.62) score += 120;
        if (rect.y > 180 && rect.y < viewport.height - 200) score += 90;
        if (rect.height > 120) score += 60;
      }
      return {
        index,
        score,
        text: text.slice(0, 160),
        ariaLabel,
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height
      };
    }).filter((item) => item.score > 0).sort((a, b) => b.score - a.score);
    const chosen = ranked[0];
    if (!chosen) {
      return null;
    }
    elements[chosen.index].setAttribute("data-trf-scripts-form", "true");
    return chosen;
  }).catch(() => null);

  if (!target) {
    return { filled: false, reason: "Scripts form was not found." };
  }
  const locator = page.locator("[data-trf-scripts-form='true']").first();
  await locator.scrollIntoViewIfNeeded().catch(() => {});
  await locator.click({
    timeout: 6000,
    force: true,
    position: {
      x: Math.max(12, Math.min(target.width - 12, 24)),
      y: Math.max(24, Math.min(target.height - 24, 46))
    }
  });
  await page.waitForTimeout(500);
  await page.keyboard.press("Meta+A").catch(() => {});
  await page.keyboard.press("Control+A").catch(() => {});
  await page.keyboard.press("Backspace").catch(() => {});
  await page.waitForTimeout(250);
  await page.keyboard.insertText(scriptText);
  await page.waitForTimeout(1200);
  const verified = await voiceoverScriptVisible(page, scriptText);
  return {
    filled: verified,
    selector: "[data-trf-scripts-form='true']",
    target,
    method: "scripts_form_keyboard",
    verified,
    reason: verified ? "" : "Script text was typed, but it was not visible in the Voiceover script form."
  };
}

async function fillVoiceoverScript(page, scriptText) {
  const edit = await clickEditScript(page);
  let target = await findVoiceoverTextbox(page);
  if (!target) {
    const formFill = await pasteIntoScriptsForm(page, scriptText);
    if (formFill.filled) {
      return { ...formFill, recovery: edit };
    }
    const generate = await clickByText(page, ["Generate voiceover", "AI voiceover", "Text to speech", "Create voiceover"], 6000);
    target = await findVoiceoverTextbox(page);
    if (!target) {
      return { filled: false, reason: formFill.reason || "Voiceover script textbox was not found.", recovery: { edit, generate, formFill } };
    }
  }

  const clicked = await target.locator.click({ timeout: 6000, force: true }).then(() => true).catch(() => false);
  if (!clicked) {
    await target.locator.evaluate((element) => element.focus()).catch(() => {});
  }
  const tagName = await target.locator.evaluate((element) => element.tagName.toLowerCase()).catch(() => "");
  const role = await target.locator.evaluate((element) => element.getAttribute("role") || "").catch(() => "");
  const isEditable = await target.locator.evaluate((element) => element.isContentEditable).catch(() => false);
  if (tagName === "textarea" || tagName === "input") {
    await target.locator.fill(scriptText, { timeout: 20000 });
  } else if (isEditable || role === "textbox") {
    await page.keyboard.press("Meta+A").catch(() => {});
    await page.keyboard.press("Control+A").catch(() => {});
    await page.keyboard.press("Backspace").catch(() => {});
    await page.keyboard.insertText(scriptText);
  } else {
    return { filled: false, reason: `Voiceover target was not editable: ${tagName || "unknown"} role=${role || "none"}`, target: target.target };
  }
  await page.waitForTimeout(1000);
  const verified = await voiceoverScriptVisible(page, scriptText);
  if (!verified) {
    const formFill = await pasteIntoScriptsForm(page, scriptText);
    return {
      filled: formFill.filled,
      selector: formFill.selector || target.selector,
      target: formFill.target || target.target,
      originalTarget: target.target,
      method: formFill.method || "textbox_then_form_fallback",
      verified: formFill.verified || false,
      recovery: { edit, formFill },
      reason: formFill.filled ? "" : formFill.reason || "Script text was not visible after textbox fill."
    };
  }
  return { filled: true, selector: target.selector, target: target.target, method: "textbox_fill", verified };
}

async function clickGenerateVoiceover(page) {
  const labels = [
    "Update voiceover",
    "Update voice over",
    "Insert voiceover",
    "Insert voice over",
    "Add voiceover",
    "Add voice over",
    "Generate voiceover",
    "Generate voice over",
    "Create voiceover",
    "Create voice over",
    "Add to timeline"
  ];
  const clicked = await clickRankedRightPanelButton(page, labels, 12000);
  if (clicked.clicked) {
    return clicked;
  }
  return {
    clicked: false,
    reason: clicked.disabledMatch
      ? `Voiceover submit button looked disabled: ${clicked.disabledMatch.label}.`
      : "No enabled Generate/Create/Insert button was found in the Voiceover panel.",
    disabledMatch: clicked.disabledMatch
  };
}

async function clickApplyAudioTag(page) {
  const labels = [
    "Apply audio tag",
    "Apply audio tags",
    "Apply audio",
    "Add audio tag",
    "Add audio tags",
    "Audio tag",
    "Apply tag",
    "Apply"
  ];
  const clicked = await clickRankedRightPanelButton(page, labels, 10000);
  if (clicked.clicked) {
    return clicked;
  }
  return { clicked: false, reason: "Apply audio tag option was not found." };
}

async function voiceoverWaitSignals(page) {
  const status = await page.evaluate(() => {
    const clean = (value) => String(value || "").replace(/\s+/g, " ").trim();
    const bodyText = clean(document.body?.innerText || "");
    const controls = Array.from(document.querySelectorAll("button, [role='button'], [role='menuitem'], [aria-label]"))
      .map((element) => {
        const rect = element.getBoundingClientRect();
        const text = clean(element.innerText || element.textContent);
        const ariaLabel = clean(element.getAttribute("aria-label"));
        const className = typeof element.className === "string" ? element.className : "";
        const disabled = Boolean(element.disabled) ||
          element.getAttribute("aria-disabled") === "true" ||
          Boolean(element.closest("[aria-disabled='true']")) ||
          /\bdisabled\b/i.test(className) ||
          /add at least \d+ words/i.test(ariaLabel);
        return {
          text,
          ariaLabel,
          disabled,
          visible: Boolean(rect.width && rect.height && element.getClientRects().length)
        };
      })
      .filter((control) => control.visible && (control.text || control.ariaLabel));
    const names = controls.map((control) => `${control.ariaLabel} ${control.text}`).join(" ");
    const combined = `${bodyText} ${names}`;
    const submitControls = controls.filter((control) => /insert voiceover|update voiceover|generate voiceover|create voiceover|add voiceover/i.test(`${control.ariaLabel} ${control.text}`));
    return {
      bodyTextSample: bodyText.slice(0, 1200),
      quotaHit: /hit your limits|quota|limit reached|credits|credit exhausted|limit used/i.test(combined),
      busy: /generating|creating|processing|saving|loading|preparing|in progress|please wait|working/i.test(combined),
      saved: /saved to drive|all changes saved/i.test(combined),
      hasVoiceoverPanel: /ai voiceover|voiceover|voice over/i.test(combined),
      hasSubmitControl: submitControls.length > 0,
      submitEnabled: submitControls.some((control) => !control.disabled),
      submitDisabled: submitControls.some((control) => control.disabled),
      submitLabels: submitControls.slice(0, 6).map((control) => ({
        text: control.text,
        ariaLabel: control.ariaLabel,
        disabled: control.disabled
      }))
    };
  }).catch((error) => ({
    bodyTextSample: "",
    quotaHit: false,
    busy: false,
    saved: false,
    hasVoiceoverPanel: false,
    hasSubmitControl: false,
    submitEnabled: false,
    submitDisabled: false,
    submitLabels: [],
    error: error.message
  }));
  return redactJson(status);
}

async function waitForVoiceoverComplete(page, waitMs = 480000, minWaitMs = 120000) {
  const startedAt = Date.now();
  let lastStatus = null;
  let stableNotBusyCount = 0;
  let sawBusy = false;
  let lastProgressLogAt = 0;
  while (Date.now() - startedAt < waitMs) {
    lastStatus = await voiceoverWaitSignals(page);
    const waitedMs = Date.now() - startedAt;
    if (lastStatus.quotaHit) {
      return {
        completed: false,
        quotaHit: true,
        waitedMs,
        reason: lastStatus.bodyTextSample
      };
    }
    if (lastStatus.busy) {
      sawBusy = true;
      stableNotBusyCount = 0;
    } else if (waitedMs >= minWaitMs) {
      stableNotBusyCount += 1;
    }
    if (waitedMs - lastProgressLogAt >= 30000) {
      lastProgressLogAt = waitedMs;
      logProgress(`waiting ${Math.round(waitedMs / 1000)}s/${Math.round(waitMs / 1000)}s; busy=${lastStatus.busy}; saved=${lastStatus.saved}; submit=${lastStatus.submitEnabled ? "enabled" : lastStatus.submitDisabled ? "disabled" : "missing"}`);
      await writeJson(path.join(outputDir, "voiceover-wait-status.json"), {
        waitedMs,
        minWaitMs,
        waitMs,
        stableNotBusyCount,
        sawBusy,
        status: lastStatus,
        updatedAt: new Date().toISOString()
      }).catch(() => {});
    }
    if (stableNotBusyCount >= 2) {
      return {
        completed: true,
        waitedMs,
        minWaitMs,
        sawBusy,
        stableNotBusyCount,
        status: lastStatus,
        reason: "Voiceover generation waited for the minimum duration and the page was stable."
      };
    }
    await page.waitForTimeout(5000);
  }
  return {
    completed: false,
    waitedMs: Date.now() - startedAt,
    minWaitMs,
    reason: "Google Vids voiceover did not look stable before timeout.",
    status: lastStatus
  };
}

await ensureDir(outputDir);
const scriptText = await readVoiceoverScript();
await writeText(path.join(outputDir, "voiceover-script.txt"), `${scriptText}\n`);

const { chromium } = await import("playwright");
const launchOptions = {
  headless: false,
  viewport: { width: 1365, height: 768 }
};
await applyChromeLaunchOptions(launchOptions, { channelFallback: false });

const context = await launchWithBundledFallback(
  chromium,
  launchOptions,
  (options) => chromium.launchPersistentContext(profileDir, options)
);
const steps = [];
let page = await context.newPage();

context.on("page", async (newPage) => {
  page = newPage;
  await page.bringToFront().catch(() => {});
  steps.push({
    name: "new_page_or_popup_detected",
    currentUrl: page.url(),
    note: "Automation switched to the newest browser tab/page."
  });
});

try {
  logProgress(`opening ${targetUrl} with profile ${profileDir}`);
  await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(7000);
  steps.push({ name: "opened", screenshot: await screenshot(page, "01-opened"), state: await pageState(page, "01-opened") });
  await ensureGoogleVidsSafe(page, outputDir, "voiceover-opened", { manualRecoveryWaitMs });

  const blankStart = await selectBlankStartOption(page);
  logProgress(blankStart.selected ? "blank start selected" : `blank start skipped: ${blankStart.reason || "not required"}`);
  steps.push({ name: "select_blank_start", ...blankStart, screenshot: await screenshot(page, "02-blank-start"), state: await pageState(page, "02-blank-start") });
  if (args["require-blank-start"] && !blankStart.selected && !blankStart.skipped) {
    throw new Error(blankStart.reason || "Required blank/start option was not selected.");
  }
  await ensureGoogleVidsSafe(page, outputDir, "voiceover-blank-start", { manualRecoveryWaitMs });

  const panel = await openVoiceoverPanel(page);
  logProgress(panel.opened ? "voiceover panel opened" : "voiceover panel not found");
  steps.push({ name: "open_voiceover_panel", ...panel, screenshot: await screenshot(page, "03-voiceover-panel"), state: await pageState(page, "03-voiceover-panel") });
  if (!panel.opened) {
    throw new Error(panel.reason || "Voiceover panel did not open.");
  }
  await ensureGoogleVidsSafe(page, outputDir, "voiceover-panel", { manualRecoveryWaitMs });

  const voiceConfig = await selectVoiceForGender(page, requestedVoiceGender);
  logProgress(voiceConfig.configured ? `voice configured: ${voiceConfig.voiceLabel || requestedVoiceGender}` : `voice config skipped/failed: ${voiceConfig.reason || requestedVoiceGender}`);
  steps.push({ name: "configure_voice", ...voiceConfig, screenshot: await screenshot(page, "04-configure-voice"), state: await pageState(page, "04-configure-voice") });
  if (args["require-voice-config"] && !voiceConfig.configured) {
    throw new Error(voiceConfig.reason || `Required ${requestedVoiceGender} voice selection failed.`);
  }

  const fill = await fillVoiceoverScript(page, scriptText);
  logProgress(fill.filled ? `script pasted (${scriptText.split(/\s+/).filter(Boolean).length} words)` : "script paste failed");
  steps.push({ name: "fill_voiceover_script", ...fill, screenshot: await screenshot(page, "05-fill-script"), state: await pageState(page, "05-fill-script") });
  if (!fill.filled) {
    throw new Error(fill.reason || "Voiceover script was not filled.");
  }

  const audioTag = await clickApplyAudioTag(page);
  logProgress(audioTag.clicked ? "audio tags applied" : `audio tags not applied: ${audioTag.reason || "not found"}`);
  steps.push({ name: "apply_audio_tag", ...audioTag, screenshot: await screenshot(page, "06-apply-audio-tag"), state: await pageState(page, "06-apply-audio-tag") });
  if (args["require-audio-tag"] && !audioTag.clicked) {
    throw new Error(audioTag.reason || "Required Apply audio tag click failed.");
  }

  const generate = args["prepare-only"] ? { skipped: true, prepareOnly: true } : await clickGenerateVoiceover(page);
  logProgress(args["prepare-only"] ? "prepare-only: generate skipped" : generate.clicked ? `voiceover submit clicked: ${generate.label || "button"}` : `voiceover submit failed: ${generate.reason || "not found"}`);
  steps.push({ name: "update_voiceover", ...generate, screenshot: await screenshot(page, "07-update-voiceover"), state: await pageState(page, "07-update-voiceover") });
  if (!args["prepare-only"] && !generate.clicked) {
    throw new Error(generate.reason || "Update voiceover button was not clicked.");
  }

  const completion = args["prepare-only"]
    ? { skipped: true, prepareOnly: true }
    : await waitForVoiceoverComplete(
      page,
      Number(args["after-submit-wait"] || 480000),
      Number(args["min-after-submit-wait"] || 120000)
    );
  steps.push({ name: "wait_for_voiceover", ...completion, screenshot: await screenshot(page, "08-after-voiceover"), state: await pageState(page, "08-after-voiceover") });
  if (completion.quotaHit) {
    throw new Error(`Google Vids voiceover limit hit: ${completion.reason || "quota/limit message detected"}`);
  }
  if (!args["prepare-only"] && !completion.completed) {
    throw new Error(completion.reason || "Google Vids voiceover generation did not complete before timeout.");
  }
  await ensureGoogleVidsSafe(page, outputDir, "voiceover-after-generate", { manualRecoveryWaitMs });

  await writeJson(path.join(outputDir, "google-vids-voiceover-report.json"), {
    ok: true,
    mode: args["prepare-only"] ? "prepared_voiceover_script" : "generated_voiceover",
    targetUrl,
    currentUrl: page.url(),
    title: await page.title(),
    outputDir,
    scriptPath: path.join(outputDir, "voiceover-script.txt"),
    scriptCharacters: scriptText.length,
    requestedVoiceGender,
    requestedVoiceLabel,
    blankStart,
    voiceConfig,
    audioTag,
    manualRecoveryWaitMs,
    steps
  });

  console.log(`Report: ${path.join(outputDir, "google-vids-voiceover-report.json")}`);
  console.log(args["prepare-only"] ? "Voiceover script was prepared. Generate was skipped." : "Voiceover generation step completed if the matching button was available.");
  if (args["keep-open"]) {
    console.log("Press Enter after your review to close the browser.");
    process.stdin.resume();
    await new Promise((resolve) => process.stdin.once("data", resolve));
  }
} catch (error) {
  const errorScreenshot = await screenshot(page, "error").catch(() => null);
  const errorState = await pageState(page, "error").catch((stateError) => ({
    error: stateError.message
  }));
  const safetySnapshot = await saveGoogleVidsSafetySnapshot(page, outputDir, "error-final", {
    event: "voiceover_failed",
    error: error.message
  }).catch(() => null);
  const safetyFields = safetyFieldsFromError(error, safetySnapshot?.classification || null);
  await writeJson(path.join(outputDir, "google-vids-voiceover-report.json"), {
    ok: false,
    mode: args["prepare-only"] ? "prepared_voiceover_script" : "generated_voiceover",
    targetUrl,
    currentUrl: page.url(),
    title: await page.title().catch(() => ""),
    outputDir,
    scriptPath: path.join(outputDir, "voiceover-script.txt"),
    scriptCharacters: scriptText.length,
    requestedVoiceGender,
    requestedVoiceLabel,
    manualRecoveryWaitMs,
    error: error.message,
    stack: error.stack,
    ...safetyFields,
    safetySnapshot,
    errorScreenshot,
    errorState,
    steps
  });
  console.error(`Google Vids voiceover failed: ${error.message}`);
  if (safetyFields.manualAction) {
    console.error(`Manual action: ${safetyFields.manualAction}`);
  }
  console.error(`Report: ${path.join(outputDir, "google-vids-voiceover-report.json")}`);
  process.exitCode = 1;
} finally {
  await context.close();
}
