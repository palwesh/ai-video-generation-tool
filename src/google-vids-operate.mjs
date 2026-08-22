import path from "node:path";
import fs from "node:fs/promises";
import dotenv from "dotenv";
import { parseArgs } from "./lib/args.mjs";
import { ensureDir, readJson, writeJson, writeText } from "./lib/fsx.mjs";
import { buildGoogleVidsClipPrompt, buildGoogleVidsMasterPrompt } from "./lib/vids-master-prompt.mjs";
import { applyChromeLaunchOptions, launchWithBundledFallback } from "./lib/browser-paths.mjs";
import {
  ensureGoogleVidsSafe,
  saveGoogleVidsSafetySnapshot,
  safetyFieldsFromError
} from "./lib/google-vids-safety.mjs";

dotenv.config({ quiet: true });

const args = parseArgs(process.argv.slice(2));
const profileDir = args.profile || "work/google-vids-profile";
const toolDir = args["tool-dir"] ? path.resolve(args["tool-dir"]) : null;
const scenesPath = args.scenes ? path.resolve(args.scenes) : toolDir ? path.join(toolDir, "scene-plan.json") : null;
const manifestPath = args.manifest ? path.resolve(args.manifest) : toolDir ? path.join(toolDir, "manifest.json") : null;
const outputRoot = args.output || path.join(
  "outputs",
  "runs",
  `google-vids-operate-${new Date().toISOString().replace(/[:.]/g, "-")}`
);
const targetUrl = args.url || "https://vids.new";
const requestedVideoSize = String(args["video-size"] || args.size || "portrait").trim().toLowerCase();
const manualRecoveryWaitMs = Number(args["manual-recovery-wait"] || process.env.TRF_MANUAL_RECOVERY_WAIT_MS || 0);
const portraitRequested = /^(portrait|vertical|9:16|reel|short|shorts)$/i.test(requestedVideoSize);

if (!scenesPath) {
  console.error("Missing --tool-dir or --scenes.");
  console.error("Example: npm run vids:operate -- --tool-dir outputs/runs/.../universal-pii-ai-input-redactor");
  process.exit(1);
}

async function accessOrNull(filePath) {
  return fs.access(filePath).then(() => filePath).catch(() => null);
}

async function screenshot(page, outputDir, name) {
  const filePath = path.join(outputDir, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: false }).catch(() => null);
  return filePath;
}

async function pageState(page, outputDir, name) {
  const info = await page.evaluate(() => {
    const clean = (value) => String(value || "")
      .replace(/\s+/g, " ")
      .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]")
      .replace(/Google Account:\s*[^()]+ \(\[email\]\)/gi, "Google Account: [signed-in user] ([email])")
      .trim();
    const controls = Array.from(document.querySelectorAll(
      "button, [role='button'], a, input, textarea, [contenteditable='true'], [aria-label]"
    )).map((element, index) => ({
      index,
      tag: element.tagName.toLowerCase(),
      role: element.getAttribute("role") || "",
      text: clean(element.innerText || element.textContent).slice(0, 200),
      ariaLabel: clean(element.getAttribute("aria-label")).slice(0, 200),
      placeholder: clean(element.getAttribute("placeholder")).slice(0, 200),
      type: element.getAttribute("type") || "",
      x: element.getBoundingClientRect().x,
      y: element.getBoundingClientRect().y,
      width: element.getBoundingClientRect().width,
      height: element.getBoundingClientRect().height,
      visible: Boolean(element.offsetWidth || element.offsetHeight || element.getClientRects().length)
    })).filter((control) => (
      control.visible && (control.text || control.ariaLabel || control.placeholder || control.type)
    )).slice(0, 240);

    return {
      url: location.href,
      title: document.title,
      bodyTextSample: clean(document.body?.innerText).slice(0, 3000),
      controls
    };
  });
  const filePath = path.join(outputDir, `${name}.json`);
  await writeJson(filePath, info);
  return info;
}

async function googleSignInBlocker(page) {
  const currentUrl = page.url();
  const bodyText = await page.locator("body").innerText({ timeout: 5000 }).catch(() => "");
  const normalized = bodyText.replace(/\s+/g, " ").trim();
  if (/accounts\.google\.com|ServiceLogin|signin|challenge\/pwd/i.test(currentUrl)) {
    if (/Enter your password/i.test(normalized)) {
      return "Google password page is open for this Vids profile.";
    }
    if (/Choose an account/i.test(normalized) && /Signed out/i.test(normalized)) {
      return "Google account chooser shows this Vids profile as signed out.";
    }
    return "Google sign-in page is open instead of the Vids editor.";
  }
  if (/Choose an account/i.test(normalized) && /Signed out/i.test(normalized)) {
    return "Google account chooser shows this Vids profile as signed out.";
  }
  if (/Enter your password/i.test(normalized)) {
    return "Google password page is open for this Vids profile.";
  }
  return "";
}

async function assertGoogleVidsReady(page, stage) {
  return ensureGoogleVidsSafe(page, outputDir, stage, {
    manualRecoveryWaitMs
  });
}

async function clickByText(page, labels, timeout = 7000) {
  for (const label of labels) {
    const patterns = [
      `button:has-text("${label}")`,
      `[role="button"]:has-text("${label}")`,
      `text="${label}"`
    ];

    for (const selector of patterns) {
      const locator = page.locator(selector).first();
      const count = await locator.count().catch(() => 0);
      if (!count) {
        continue;
      }
      const clicked = await locator.click({ timeout }).then(() => true).catch(() => false);
      if (!clicked) {
        continue;
      }
      await page.waitForTimeout(1500);
      return { clicked: true, label, selector };
    }
  }

  return { clicked: false };
}

async function maybeAcceptWorkspaceImagesConsent(page) {
  if (args["no-auto-agree-workspace-images"]) {
    return { skipped: true, disabled: true };
  }

  const bodyText = await page.locator("body").innerText({ timeout: 3000 }).catch(() => "");
  const normalized = bodyText.replace(/\s+/g, " ").trim();
  const hasConsent = /Create content from images in Workspace/i.test(normalized)
    && /necessary rights/i.test(normalized)
    && /prohibited use policy/i.test(normalized);
  if (!hasConsent) {
    return { skipped: true, reason: "Workspace image consent modal was not visible." };
  }

  const agree = await clickByText(page, ["Agree"], 5000);
  return {
    detected: true,
    clicked: agree.clicked,
    label: agree.label,
    selector: agree.selector,
    reason: agree.clicked ? undefined : "Agree button was not found for Workspace image consent modal."
  };
}

async function clickByLabel(page, labels, timeout = 7000) {
  for (const label of labels) {
    const exact = page.locator(`[aria-label="${label.replace(/"/g, '\\"')}"]`).first();
    if (await exact.count().catch(() => 0)) {
      const clicked = await exact.click({ timeout }).then(() => true).catch(() => false);
      if (clicked) {
        await page.waitForTimeout(1000);
        return { clicked: true, label, selector: `[aria-label="${label}"]` };
      }
    }

    const contains = page.locator(`[aria-label*="${label.replace(/"/g, '\\"')}" i]`).first();
    if (await contains.count().catch(() => 0)) {
      const clicked = await contains.click({ timeout }).then(() => true).catch(() => false);
      if (clicked) {
        await page.waitForTimeout(1000);
        return { clicked: true, label, selector: `[aria-label*="${label}" i]` };
      }
    }
  }

  return { clicked: false };
}

async function clickControlByLabelOrText(page, labels, timeout = 7000) {
  const byLabel = await clickByLabel(page, labels, timeout);
  if (byLabel.clicked) {
    return { ...byLabel, method: "aria_label" };
  }

  const byText = await clickByText(page, labels, timeout);
  if (byText.clicked) {
    return { ...byText, method: "text" };
  }

  for (const label of labels) {
    const selector = await page.evaluate((needle) => {
      document.querySelectorAll("[data-trf-click-target]").forEach((element) => {
        element.removeAttribute("data-trf-click-target");
      });
      const clean = (value) => String(value || "").replace(/\s+/g, " ").trim();
      const pattern = new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      const controls = Array.from(document.querySelectorAll("button, [role='button'], [aria-label], [aria-haspopup='menu']"));
      const match = controls.find((element) => {
        const rect = element.getBoundingClientRect();
        const labelText = clean(element.getAttribute("aria-label"));
        const text = clean(element.innerText || element.textContent);
        return rect.width && rect.height && element.getClientRects().length && pattern.test(`${labelText} ${text}`);
      });
      if (!match) {
        return "";
      }
      match.setAttribute("data-trf-click-target", "true");
      return "[data-trf-click-target='true']";
    }, label).catch(() => "");
    if (!selector) {
      continue;
    }
    const clicked = await page.locator(selector).first().click({ timeout, force: true }).then(() => true).catch(() => false);
    if (clicked) {
      await page.waitForTimeout(1000);
      return { clicked: true, label, selector, method: "dom_ranked_control" };
    }
  }

  return { clicked: false };
}

async function portraitSelectionEvidence(page) {
  return await page.evaluate(() => {
    const clean = (value) => String(value || "").replace(/\s+/g, " ").trim();
    const controls = Array.from(document.querySelectorAll("button, [role='button'], [role='menuitemradio'], [aria-label]"))
      .map((element) => {
        const rect = element.getBoundingClientRect();
        const text = clean(element.innerText || element.textContent);
        const ariaLabel = clean(element.getAttribute("aria-label"));
        const name = `${ariaLabel} ${text}`.trim();
        const selected = element.getAttribute("aria-checked") === "true"
          || element.getAttribute("aria-pressed") === "true"
          || element.getAttribute("aria-selected") === "true"
          || /selected|checked|active/i.test(String(element.getAttribute("class") || ""));
        return {
          text,
          ariaLabel,
          selected,
          visible: Boolean(rect.width && rect.height && element.getClientRects().length)
        };
      })
      .filter((control) => control.visible && /portrait|vertical|9:16/i.test(`${control.ariaLabel} ${control.text}`))
      .slice(0, 12);
    return {
      hasPortraitText: /portrait|vertical|9:16/i.test(clean(document.body?.innerText || "")),
      selected: controls.some((control) => control.selected),
      controls
    };
  }).catch((error) => ({
    hasPortraitText: false,
    selected: false,
    controls: [],
    error: error.message
  }));
}

async function ensurePortrait(page) {
  const attempts = [];
  const initialEvidence = await portraitSelectionEvidence(page);
  attempts.push({ name: "initial_evidence", evidence: initialEvidence });

  const welcomeChoice = await clickByText(page, ["Portrait", "Vertical", "9:16"], 2500);
  attempts.push({ name: "welcome_dialog", ...welcomeChoice });
  if (welcomeChoice.clicked) {
    const evidence = await portraitSelectionEvidence(page);
    return {
      strategy: "welcome_dialog",
      clicked: true,
      selected: true,
      evidence,
      attempts,
      ...welcomeChoice
    };
  }

  const videoSize = await clickControlByLabelOrText(page, ["Video size", "Video format", "Aspect ratio", "Size"], 3500);
  attempts.push({ name: "open_video_size_menu", ...videoSize });
  if (!videoSize.clicked) {
    return {
      strategy: "toolbar_video_size",
      clicked: false,
      selected: Boolean(initialEvidence.selected),
      evidence: initialEvidence,
      attempts,
      reason: initialEvidence.selected ? undefined : "Video size control was not found."
    };
  }

  const portraitOption = await clickControlByLabelOrText(page, ["Portrait", "Vertical", "9:16"], 5000);
  attempts.push({ name: "select_portrait_option", ...portraitOption });
  const finalEvidence = await portraitSelectionEvidence(page);
  return {
    strategy: "toolbar_video_size",
    clicked: portraitOption.clicked,
    selected: Boolean(portraitOption.clicked || finalEvidence.selected),
    menu: videoSize,
    option: portraitOption,
    evidence: finalEvidence,
    attempts,
    reason: portraitOption.clicked || finalEvidence.selected ? undefined : "Portrait option was not found after opening Video size."
  };
}

async function findPromptTarget(page) {
  const target = await page.evaluate(() => {
    document.querySelectorAll("[data-trf-prompt-target]").forEach((element) => {
      element.removeAttribute("data-trf-prompt-target");
    });

    const deny = /rename|menus|zoom|search|timeline|set timeline|account|share|resize|resizer|slider/i;
    const prefer = /describe your video|prompt|add ingredients|video/i;
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    const clean = (value) => String(value || "").replace(/\s+/g, " ").trim();
    const elements = Array.from(document.querySelectorAll(
      "textarea, [contenteditable='true'], input[type='text'], [role='textbox']"
    ));

    const ranked = elements.map((element, index) => {
      const rect = element.getBoundingClientRect();
      const tagName = element.tagName.toLowerCase();
      const role = element.getAttribute("role") || "";
      const ariaLabel = clean(element.getAttribute("aria-label"));
      const placeholder = clean(element.getAttribute("placeholder"));
      const text = clean(element.innerText || element.textContent);
      const name = `${ariaLabel} ${placeholder} ${text}`;
      const visible = Boolean(rect.width && rect.height && element.getClientRects().length);
      const editable = tagName === "textarea"
        || tagName === "input"
        || role === "textbox"
        || element.isContentEditable;
      let score = 0;

      if (!visible || !editable || role === "slider" || deny.test(name)) {
        score = -1000;
      } else {
        if (prefer.test(name)) score += 120;
        if (role === "textbox") score += 70;
        if (element.isContentEditable) score += 60;
        if (tagName === "textarea") score += 40;
        if (rect.x > viewport.width * 0.45) score += 40;
        if (rect.y > 250) score += 15;
        if (tagName === "input" && !prefer.test(name)) score -= 250;
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
    elements[chosen.index].setAttribute("data-trf-prompt-target", "true");
    return chosen;
  });

  if (!target) {
    return null;
  }

  return {
    selector: "[data-trf-prompt-target='true']",
    target,
    locator: page.locator("[data-trf-prompt-target='true']").first()
  };
}

async function isAiAvatarPanelActive(page) {
  const bodyText = await page.locator("body").innerText({ timeout: 3000 }).catch(() => "");
  return /AI avatar/i.test(bodyText) && /Enter a script for this scene|Edit script|Avatar Change|Preview/i.test(bodyText);
}

function shortAvatarScript(scene, fallbackPrompt) {
  const voiceover = String(scene?.voiceover || "").replace(/\s+/g, " ").trim();
  const onscreen = String(scene?.onscreen_text || "").replace(/\s+/g, " ").trim();
  const base = voiceover || fallbackPrompt;
  const words = String(base || "").split(/\s+/).filter(Boolean);
  if (words.length >= 15) {
    return base;
  }
  return [base, onscreen ? `Caption line: ${onscreen}.` : "", "Speak naturally in Hinglish with a clear creator tone."]
    .filter(Boolean)
    .join(" ");
}

async function findAvatarScriptBox(page) {
  const candidate = await page.evaluate(() => {
    document.querySelectorAll("[data-trf-avatar-script-box]").forEach((element) => {
      element.removeAttribute("data-trf-avatar-script-box");
    });

    const clean = (value) => String(value || "").replace(/\s+/g, " ").trim();
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    const elements = Array.from(document.querySelectorAll("[role='textbox'], textarea, [contenteditable='true'], [role='form'], div"));
    const matches = elements.map((element, index) => {
      const rect = element.getBoundingClientRect();
      const text = clean(element.innerText || element.textContent);
      const ariaLabel = clean(element.getAttribute("aria-label"));
      const placeholder = clean(element.getAttribute("placeholder"));
      const role = element.getAttribute("role") || "";
      const tagName = element.tagName.toLowerCase();
      const name = `${text} ${ariaLabel} ${placeholder}`;
      const insideAiAvatar = Boolean(element.closest("[aria-label='AI avatar']"))
        || /AI avatar/i.test(clean(element.closest("[role='complementary']")?.innerText || ""));
      let score = 0;

      if (
        rect.width &&
        rect.height &&
        element.getClientRects().length &&
        rect.x > viewport.width * 0.58 &&
        rect.x < viewport.width - 70 &&
        rect.y > 170 &&
        rect.y < viewport.height - 160 &&
        rect.width >= 180 &&
        rect.height >= 80 &&
        insideAiAvatar
      ) {
        if (/Enter a script for this scene/i.test(name)) score += 140;
        if (role === "textbox") score += 80;
        if (element.isContentEditable) score += 70;
        if (tagName === "textarea") score += 70;
        if (role === "form") score += 45;
        if (rect.height > 140) score += 20;
        if (/Preview|Avatar Change|Current scene|All scenes|Veo/i.test(name) && !/Enter a script for this scene/i.test(name)) {
          score -= 130;
        }
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
        height: rect.height,
        centerX: rect.x + rect.width / 2,
        centerY: rect.y + rect.height / 2
      };
    }).filter((item) => item.score > 0).sort((a, b) => b.score - a.score);

    const chosen = matches[0];
    if (!chosen) {
      return null;
    }
    elements[chosen.index].setAttribute("data-trf-avatar-script-box", "true");
    return chosen;
  });

  if (!candidate) {
    return null;
  }

  return {
    selector: "[data-trf-avatar-script-box='true']",
    target: candidate,
    locator: page.locator("[data-trf-avatar-script-box='true']").first()
  };
}

async function fillAvatarScriptBox(page, scriptText) {
  const target = await findAvatarScriptBox(page);
  if (!target) {
    return { filled: false, reason: "AI avatar script box was not found." };
  }

  const text = String(scriptText || "").replace(/\s+/g, " ").trim();
  const attempts = [];
  const clickPoints = [
    { x: target.target.x + 28, y: target.target.y + 70 },
    { x: target.target.x + target.target.width / 2, y: target.target.y + target.target.height / 2 },
    { x: target.target.x + 34, y: target.target.y + 112 }
  ];

  for (const point of clickPoints) {
    await page.mouse.click(point.x, point.y);
    await page.waitForTimeout(500);
    const active = await page.evaluate(() => {
      const element = document.activeElement;
      if (!element) {
        return null;
      }
      return {
        tagName: element.tagName.toLowerCase(),
        role: element.getAttribute("role") || "",
        ariaLabel: element.getAttribute("aria-label") || "",
        isContentEditable: element.isContentEditable,
        insideAiAvatar: Boolean(element.closest("[aria-label='AI avatar']"))
      };
    }).catch(() => null);
    attempts.push({ point, active });

    if (active?.isContentEditable || active?.role === "textbox" || active?.tagName === "textarea" || active?.tagName === "input") {
      await page.keyboard.press("Meta+A").catch(() => {});
      await page.keyboard.press("Backspace").catch(() => {});
    }
    await page.keyboard.insertText(text);
    await page.waitForTimeout(1200);

    const bodyText = (await page.locator("body").innerText({ timeout: 3000 }).catch(() => "")).replace(/\s+/g, " ");
    const needle = text.slice(0, 36);
    if (needle && bodyText.includes(needle)) {
      return { filled: true, promptType: "ai_avatar_script", selector: target.selector, target: target.target, attempts };
    }
  }

  return {
    filled: false,
    promptType: "ai_avatar_script",
    reason: "AI avatar script box did not accept typed text.",
    selector: target.selector,
    target: target.target,
    attempts
  };
}

async function fillPrompt(page, prompt, options = {}) {
  const avatarScript = options.avatarScript || prompt;
  const avatarPanelActive = await isAiAvatarPanelActive(page);
  if (avatarPanelActive) {
    const avatarFill = await fillAvatarScriptBox(page, avatarScript);
    if (avatarFill.filled) {
      return avatarFill;
    }
  }

  const target = await findPromptTarget(page);
  if (!target) {
    const recovered = await openAiVideoPanel(page);
    const retryTarget = await findPromptTarget(page);
    if (!retryTarget) {
      const avatarRetry = await isAiAvatarPanelActive(page)
        ? await fillAvatarScriptBox(page, avatarScript)
        : null;
      if (avatarRetry?.filled) {
        return { ...avatarRetry, recovery: recovered };
      }
      return { filled: false, reason: "No visible prompt textbox found.", recovery: recovered, avatarAttempt: avatarRetry };
    }
    return await fillPromptTarget(page, retryTarget, prompt, { recovery: recovered });
  }

  return await fillPromptTarget(page, target, prompt);
}

async function fillPromptTarget(page, target, prompt, extra = {}) {
  const clicked = await target.locator.click({ timeout: 5000, force: true }).then(() => true).catch(() => false);
  if (!clicked) {
    await target.locator.evaluate((element) => element.focus()).catch(() => {});
    const box = await target.locator.boundingBox().catch(() => null);
    if (box) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    }
  }
  const tagName = await target.locator.evaluate((element) => element.tagName.toLowerCase()).catch(() => "");
  const role = await target.locator.evaluate((element) => element.getAttribute("role") || "").catch(() => "");
  const isEditable = await target.locator.evaluate((element) => element.isContentEditable).catch(() => false);
  if (tagName === "textarea" || tagName === "input") {
    await target.locator.fill(prompt, { timeout: 10000 });
  } else if (isEditable) {
    await page.keyboard.press("Meta+A").catch(() => {});
    await page.keyboard.press("Backspace").catch(() => {});
    await page.keyboard.insertText(prompt);
  } else if (role === "textbox") {
    await page.keyboard.press("Meta+A").catch(() => {});
    await page.keyboard.press("Backspace").catch(() => {});
    await page.keyboard.insertText(prompt);
  } else {
    return {
      filled: false,
      reason: `Prompt target was not editable: ${tagName || "unknown"} role=${role || "none"}`,
      target: target.target
    };
  }

  return { filled: true, selector: target.selector, target: target.target, ...extra };
}

async function clickRailAiVideo(page) {
  const candidate = await page.evaluate(() => {
    document.querySelectorAll("[data-trf-ai-video-rail]").forEach((element) => {
      element.removeAttribute("data-trf-ai-video-rail");
    });

    const clean = (value) => String(value || "").replace(/\s+/g, " ").trim();
    const viewport = { width: window.innerWidth };
    const elements = Array.from(document.querySelectorAll("button, [role='button'], [aria-label]"));
    const matches = elements.map((element, index) => {
      const rect = element.getBoundingClientRect();
      const text = clean(element.innerText || element.textContent);
      const ariaLabel = clean(element.getAttribute("aria-label"));
      return {
        index,
        text,
        ariaLabel,
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        centerX: rect.x + rect.width / 2,
        centerY: rect.y + rect.height / 2,
        visible: Boolean(rect.width && rect.height && element.getClientRects().length)
      };
    }).filter((item) => (
      item.visible &&
      item.centerX > viewport.width - 140 &&
      item.centerY >= 55 &&
      item.centerY <= 130 &&
      (/^AI video$/i.test(item.text) || /Generate an AI video clip/i.test(item.ariaLabel))
    )).sort((a, b) => {
      const exactA = /^AI video$/i.test(a.text) ? 0 : 1;
      const exactB = /^AI video$/i.test(b.text) ? 0 : 1;
      return exactA - exactB || a.centerY - b.centerY;
    });

    const chosen = matches[0];
    if (!chosen) {
      return null;
    }
    elements[chosen.index].setAttribute("data-trf-ai-video-rail", "true");
    return chosen;
  });

  if (!candidate) {
    const viewport = page.viewportSize() || { width: 1365 };
    await page.mouse.click(viewport.width - 44, 92);
    await page.waitForTimeout(2200);
    return { clicked: true, strategy: "ai_video_rail_coordinate", candidate: null };
  }

  const locator = page.locator("[data-trf-ai-video-rail='true']").first();
  let clicked = await locator.click({ timeout: 5000, force: true }).then(() => true).catch(() => false);
  if (!clicked) {
    await page.mouse.click(candidate.centerX, candidate.centerY).then(() => {
      clicked = true;
    }).catch(() => {});
  }
  await page.waitForTimeout(2200);
  return { clicked, strategy: "ai_video_rail_button", candidate };
}

async function clickCreateTab(page) {
  const candidate = await page.evaluate(() => {
    document.querySelectorAll("[data-trf-ai-video-create-tab]").forEach((element) => {
      element.removeAttribute("data-trf-ai-video-create-tab");
    });

    const clean = (value) => String(value || "").replace(/\s+/g, " ").trim();
    const viewport = { width: window.innerWidth };
    const elements = Array.from(document.querySelectorAll("button, [role='button']"));
    const matches = elements.map((element, index) => {
      const rect = element.getBoundingClientRect();
      const text = clean(element.innerText || element.textContent);
      const ariaLabel = clean(element.getAttribute("aria-label"));
      return {
        index,
        text,
        ariaLabel,
        centerX: rect.x + rect.width / 2,
        centerY: rect.y + rect.height / 2,
        width: rect.width,
        height: rect.height,
        visible: Boolean(rect.width && rect.height && element.getClientRects().length)
      };
    }).filter((item) => (
      item.visible &&
      /^Create$/i.test(item.text || item.ariaLabel) &&
      item.centerX > viewport.width * 0.52 &&
      item.centerY > 250
    )).sort((a, b) => a.centerY - b.centerY)[0];

    if (!matches) {
      return null;
    }
    elements[matches.index].setAttribute("data-trf-ai-video-create-tab", "true");
    return matches;
  });

  if (!candidate) {
    return { clicked: false };
  }

  const clicked = await page.locator("[data-trf-ai-video-create-tab='true']").first()
    .click({ timeout: 2500, force: true })
    .then(() => true)
    .catch(() => false);
  await page.waitForTimeout(1000);
  return { clicked, candidate };
}

async function clickPromptExpand(page) {
  const candidate = await page.evaluate(() => {
    document.querySelectorAll("[data-trf-prompt-expand]").forEach((element) => {
      element.removeAttribute("data-trf-prompt-expand");
    });

    const clean = (value) => String(value || "").replace(/\s+/g, " ").trim();
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    const elements = Array.from(document.querySelectorAll("button, [role='button'], [aria-label]"));
    const matches = elements.map((element, index) => {
      const rect = element.getBoundingClientRect();
      const text = clean(element.innerText || element.textContent);
      const ariaLabel = clean(element.getAttribute("aria-label"));
      return {
        index,
        text,
        ariaLabel,
        centerX: rect.x + rect.width / 2,
        centerY: rect.y + rect.height / 2,
        width: rect.width,
        height: rect.height,
        visible: Boolean(rect.width && rect.height && element.getClientRects().length)
      };
    }).filter((item) => (
      item.visible &&
      /Expand|Describe your video|prompt/i.test(`${item.text} ${item.ariaLabel}`) &&
      item.centerX > viewport.width * 0.55 &&
      item.centerY > viewport.height * 0.55
    )).sort((a, b) => b.centerY - a.centerY)[0];

    if (!matches) {
      return null;
    }
    elements[matches.index].setAttribute("data-trf-prompt-expand", "true");
    return matches;
  });

  if (!candidate) {
    return { clicked: false };
  }

  const locator = page.locator("[data-trf-prompt-expand='true']").first();
  let clicked = await locator.click({ timeout: 2500, force: true }).then(() => true).catch(() => false);
  if (!clicked) {
    await page.mouse.click(candidate.centerX, candidate.centerY).then(() => {
      clicked = true;
    }).catch(() => {});
  }
  await page.waitForTimeout(1200);
  return { clicked, candidate };
}

async function clickInsertAiVideoMenu(page) {
  const attempts = [];
  const insertMenu = await clickByText(page, ["Insert"], 2500);
  attempts.push({ step: "insert_menu", ...insertMenu });
  if (!insertMenu.clicked) {
    return { clicked: false, attempts };
  }

  const aiVideo = await clickByText(page, ["AI video", "Generate an AI video clip", "Create AI videos"], 3500);
  attempts.push({ step: "ai_video_menu_item", ...aiVideo });
  return { clicked: aiVideo.clicked, attempts };
}

async function openAiVideoPanel(page) {
  const alreadyOpen = await findPromptTarget(page);
  if (alreadyOpen) {
    return { clicked: false, alreadyOpen: true, selector: alreadyOpen.selector };
  }

  const attempts = [];
  const confirmPrompt = async (attempt) => {
    const createTab = await clickCreateTab(page);
    if (createTab.clicked) {
      attempts.push({ type: "create_tab", result: createTab, after: attempt });
    }
    const expand = await clickPromptExpand(page);
    if (expand.clicked) {
      attempts.push({ type: "prompt_expand", result: expand, after: attempt });
    }
    const target = await findPromptTarget(page);
    return target ? { clicked: true, selector: target.selector } : null;
  };

  const labels = [
    ["Generate an AI video clip"],
    ["Create AI videos", "Create AI video", "AI video"]
  ];

  for (const labelGroup of labels) {
    const byLabel = await clickByLabel(page, labelGroup, 3500);
    attempts.push({ type: "label", labels: labelGroup, result: byLabel });
    await page.waitForTimeout(3000);
    const labelTarget = await confirmPrompt("label");
    if (labelTarget) {
      return { ...labelTarget, strategy: "label", attempts };
    }

    const byText = await clickByText(page, labelGroup, 3500);
    attempts.push({ type: "text", labels: labelGroup, result: byText });
    await page.waitForTimeout(3000);
    const textTarget = await confirmPrompt("text");
    if (textTarget) {
      return { ...textTarget, strategy: "text", attempts };
    }
  }

  for (let railAttempt = 0; railAttempt < 3; railAttempt += 1) {
    const rail = await clickRailAiVideo(page);
    attempts.push({ type: "ai_video_rail", attempt: railAttempt + 1, result: rail });
    const railTarget = await confirmPrompt("ai_video_rail");
    if (railTarget) {
      return { ...railTarget, strategy: "ai_video_rail", attempts };
    }
  }

  const menu = await clickInsertAiVideoMenu(page);
  attempts.push({ type: "insert_menu", result: menu });
  const menuTarget = await confirmPrompt("insert_menu");
  if (menuTarget) {
    return { ...menuTarget, strategy: "insert_menu", attempts };
  }

  const closed = await clickByLabel(page, ["Close side sheet"], 2000);
  attempts.push({ type: "close_side_sheet", result: closed });
  if (closed.clicked) {
    const rail = await clickRailAiVideo(page);
    attempts.push({ type: "ai_video_rail_after_close", result: rail });
    const reopenTarget = await confirmPrompt("ai_video_rail_after_close");
    if (reopenTarget) {
      return { ...reopenTarget, strategy: "ai_video_rail_after_close", attempts };
    }
  }

  const viewport = page.viewportSize() || { width: 1365, height: 768 };
  const railX = viewport.width - 45;
  for (const railY of [86, 96, 106, 126, 146]) {
    await page.mouse.click(railX, railY);
    attempts.push({ type: "coordinate", x: railX, y: railY });
    await page.waitForTimeout(3500);
    const coordinateTarget = await confirmPrompt("coordinate");
    if (coordinateTarget) {
      return { ...coordinateTarget, strategy: "right_rail_coordinate", attempts };
    }
  }

  return { clicked: false, attempts, reason: "AI video prompt panel did not open." };
}

async function clickAvatarPreview(page) {
  const candidate = await page.evaluate(() => {
    document.querySelectorAll("[data-trf-avatar-preview]").forEach((element) => {
      element.removeAttribute("data-trf-avatar-preview");
    });

    const clean = (value) => String(value || "").replace(/\s+/g, " ").trim();
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    const elements = Array.from(document.querySelectorAll("button, [role='button']"));
    const matches = elements.map((element, index) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      const text = clean(element.innerText || element.textContent);
      const ariaLabel = clean(element.getAttribute("aria-label"));
      return {
        index,
        text,
        ariaLabel,
        disabled: element.disabled || element.getAttribute("aria-disabled") === "true",
        opacity: Number(style.opacity || 1),
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        centerX: rect.x + rect.width / 2,
        centerY: rect.y + rect.height / 2,
        visible: Boolean(rect.width && rect.height && element.getClientRects().length)
      };
    }).filter((item) => (
      item.visible &&
      /^Preview$/i.test(item.text || item.ariaLabel) &&
      !/Type your script first/i.test(item.ariaLabel) &&
      !item.disabled &&
      item.opacity > 0.45 &&
      item.centerX > viewport.width * 0.62 &&
      item.centerY > viewport.height * 0.62
    )).sort((a, b) => b.centerY - a.centerY);

    const chosen = matches[0];
    if (!chosen) {
      return null;
    }
    elements[chosen.index].setAttribute("data-trf-avatar-preview", "true");
    return chosen;
  });

  if (!candidate) {
    return { clicked: false, reason: "AI avatar Preview button was not available." };
  }

  const locator = page.locator("[data-trf-avatar-preview='true']").first();
  let clicked = await locator.click({ timeout: 5000, force: true }).then(() => true).catch(() => false);
  if (!clicked) {
    await page.mouse.click(candidate.centerX, candidate.centerY).then(() => {
      clicked = true;
    }).catch(() => {});
  }
  await page.waitForTimeout(1500);
  return clicked
    ? { clicked: true, label: "AI avatar Preview", selector: "[data-trf-avatar-preview='true']", candidate }
    : { clicked: false, reason: "AI avatar Preview button could not be clicked.", candidate };
}

async function maybeSubmit(page) {
  if (await isAiAvatarPanelActive(page)) {
    const avatarPreview = await clickAvatarPreview(page);
    if (avatarPreview.clicked) {
      return avatarPreview;
    }
  }

  const accessibleLabels = ["Generate", "Submit", "Send", "Create video", "Create clip"];
  const byLabel = await clickByText(page, accessibleLabels, 5000);
  if (byLabel.clicked) {
    return byLabel;
  }

  const candidate = await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll("button, [role='button']"));
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    const clean = (value) => String(value || "").replace(/\s+/g, " ").trim();
    const isBlue = (value) => /rgb\((?:11, 87, 208|26, 115, 232|25, 103, 210|10, 102, 194)\)/.test(value);
    const matches = elements.map((element, index) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return {
        index,
        text: clean(element.innerText || element.textContent),
        ariaLabel: clean(element.getAttribute("aria-label")),
        backgroundColor: style.backgroundColor,
        color: style.color,
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        centerX: rect.x + rect.width / 2,
        centerY: rect.y + rect.height / 2,
        visible: Boolean(rect.width && rect.height)
      };
    });

    const exactGenerateMatch = matches
      .filter((item) => (
        item.visible &&
        /^(generate|submit|send|create clip|create video)$/i.test(`${item.text || item.ariaLabel}`.trim()) &&
        item.centerX > viewport.width * 0.45 &&
        item.centerX < viewport.width - 20 &&
        item.centerY < viewport.height - 20
      ))
      .sort((a, b) => b.centerY - a.centerY)[0];
    if (exactGenerateMatch) {
      return exactGenerateMatch;
    }

    const generateTextMatch = matches.find((item) => (
      item.visible &&
      /submit|send|create clip|create video/i.test(`${item.text} ${item.ariaLabel}`) &&
      !/generate an ai video clip|generate an avatar|generate a voiceover|generate music|generate an image/i.test(`${item.text} ${item.ariaLabel}`) &&
      item.centerX > viewport.width * 0.45 &&
      item.centerX < viewport.width - 20 &&
      item.centerY < viewport.height - 20
    ));
    if (generateTextMatch) {
      return generateTextMatch;
    }

    const bottomRightBlueMatch = matches.find((item) => (
      item.visible &&
      item.centerX > viewport.width - 260 &&
      item.centerX < viewport.width - 20 &&
      item.centerY > viewport.height - 140 &&
      item.centerY < viewport.height - 20 &&
      item.width >= 32 &&
      item.height >= 32 &&
      isBlue(item.backgroundColor)
    ));
    if (bottomRightBlueMatch) {
      return bottomRightBlueMatch;
    }

    const bottomRightRoundMatch = matches.find((item) => (
      item.visible &&
      item.centerX > viewport.width - 260 &&
      item.centerX < viewport.width - 20 &&
      item.centerY > viewport.height - 140 &&
      item.centerY < viewport.height - 20 &&
      item.width >= 38 &&
      item.width <= 70 &&
      item.height >= 38 &&
      item.height <= 70 &&
      !/shapes|templates|captions|stock|uploads|record|image|music|voiceover|avatar/i.test(`${item.text} ${item.ariaLabel}`)
    ));
    if (bottomRightRoundMatch) {
      return bottomRightRoundMatch;
    }

    return null;
  });

  if (candidate) {
    await page.mouse.click(candidate.centerX, candidate.centerY);
    await page.waitForTimeout(1500);
    return { clicked: true, label: "bottom-right submit icon", selector: "coordinate", candidate };
  }

  const viewport = page.viewportSize() || { width: 1365, height: 768 };
  await page.mouse.click(viewport.width - 140, viewport.height - 60);
  await page.waitForTimeout(1500);
  return { clicked: true, label: "bottom-right fallback", selector: "coordinate" };
}

async function detectGenerationLimit(page) {
  const bodyText = await page.locator("body").innerText({ timeout: 5000 }).catch(() => "");
  const normalized = bodyText.replace(/\s+/g, " ");
  if (/hit your limits for generating videos in Vids/i.test(normalized)) {
    return "You've hit your limits for generating videos in Vids.";
  }
  if (/limit(?:s)? .*generating videos/i.test(normalized)) {
    return normalized.match(/[^.?!]*limit[^.?!]*generating videos[^.?!]*[.?!]?/i)?.[0]?.trim()
      || "Google Vids video generation limit was reached.";
  }
  return "";
}

async function clickGeneratedInsert(page) {
  const limitMessage = await detectGenerationLimit(page);
  if (limitMessage) {
    return { clicked: false, limitHit: true, reason: limitMessage };
  }

  const candidate = await page.evaluate(() => {
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    const clean = (value) => String(value || "").replace(/\s+/g, " ").trim();
    const elements = Array.from(document.querySelectorAll("button, [role='button'], [aria-label]"));
    const matches = elements.map((element, index) => {
      const rect = element.getBoundingClientRect();
      const text = clean(element.innerText || element.textContent);
      const ariaLabel = clean(element.getAttribute("aria-label"));
      return {
        index,
        text,
        ariaLabel,
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        centerX: rect.x + rect.width / 2,
        centerY: rect.y + rect.height / 2,
        visible: Boolean(rect.width && rect.height && element.getClientRects().length)
      };
    }).filter((item) => (
      item.visible &&
      /(^|\s)insert(\s|$)/i.test(`${item.text} ${item.ariaLabel}`) &&
      item.centerX > viewport.width * 0.5 &&
      item.centerY > 260 &&
      item.centerY < viewport.height - 120
    ));

    const chosen = matches.sort((a, b) => a.centerY - b.centerY)[0];
    if (!chosen) {
      return null;
    }
    elements[chosen.index].setAttribute("data-trf-insert-target", "true");
    return chosen;
  });

  if (!candidate) {
    return { clicked: false, reason: "Generated clip Insert button was not found." };
  }

  await page.locator("[data-trf-insert-target='true']").first().click({ timeout: 7000 });
  await page.waitForTimeout(10000);
  return { clicked: true, label: "Insert generated clip", selector: "[data-trf-insert-target='true']", candidate };
}

async function clickNewScene(page) {
  const candidate = await page.evaluate(() => {
    document.querySelectorAll("[data-trf-new-scene-target]").forEach((element) => {
      element.removeAttribute("data-trf-new-scene-target");
    });

    const clean = (value) => String(value || "").replace(/\s+/g, " ").trim();
    const elements = Array.from(document.querySelectorAll("button, [role='button'], [aria-label]"));
    const matches = elements.map((element, index) => {
      const rect = element.getBoundingClientRect();
      const text = clean(element.innerText || element.textContent);
      const ariaLabel = clean(element.getAttribute("aria-label"));
      return {
        index,
        text,
        ariaLabel,
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        centerX: rect.x + rect.width / 2,
        centerY: rect.y + rect.height / 2,
        visible: Boolean(rect.width && rect.height && element.getClientRects().length)
      };
    }).filter((item) => (
      item.visible &&
      /new scene/i.test(`${item.text} ${item.ariaLabel}`)
    ));

    const chosen = matches.sort((a, b) => b.centerY - a.centerY)[0];
    if (!chosen) {
      return null;
    }
    elements[chosen.index].setAttribute("data-trf-new-scene-target", "true");
    return chosen;
  });

  if (candidate) {
    await page.locator("[data-trf-new-scene-target='true']").first().click({ timeout: 7000 });
    await page.waitForTimeout(3000);
    return { clicked: true, label: "New scene", selector: "[data-trf-new-scene-target='true']", candidate };
  }

  await page.keyboard.press("Control+M").catch(() => {});
  await page.waitForTimeout(3000);
  return { clicked: true, label: "New scene keyboard fallback", selector: "Control+M" };
}

async function ingredientFilesForScene(manifest, args, sceneNumber) {
  if (!args.ingredients) {
    return [];
  }

  if (args["ingredients-scenes"]) {
    const allowed = String(args["ingredients-scenes"]).split(",").map((item) => Number(item.trim()));
    if (!allowed.includes(Number(sceneNumber))) {
      return [];
    }
  }

  const autoIngredients = args.ingredients === true || args.ingredients === "auto";
  const source = autoIngredients
    ? manifest.capture?.files || []
    : String(args.ingredients).split(",").map((item) => item.trim()).filter(Boolean);

  const imageFiles = [];
  for (const file of source) {
    if (!/\.(png|jpe?g|webp)$/i.test(file)) {
      continue;
    }
    const found = await accessOrNull(path.resolve(file));
    if (found) {
      imageFiles.push(found);
    }
  }

  if (autoIngredients) {
    const desired = Number(sceneNumber) === 3
      ? ["desktop-demo-after", "desktop-demo-before", "desktop-top", "desktop-full-page", "mobile-top"]
      : Number(sceneNumber) === 4
        ? ["desktop-demo-after", "desktop-demo-before", "desktop-top", "desktop-full-page", "mobile-top"]
        : Number(sceneNumber) === 5
          ? ["desktop-demo-after", "desktop-full-page", "desktop-top", "desktop-demo-before", "mobile-top"]
          : Number(sceneNumber) === 6
            ? ["desktop-demo-before", "desktop-demo-after", "desktop-top", "desktop-full-page", "mobile-top"]
            : ["desktop-top", "desktop-full-page", "mobile-top", "desktop-demo-after", "desktop-demo-before"];
    const score = (file) => {
      const name = path.basename(file).toLowerCase();
      const index = desired.findIndex((item) => name.includes(item));
      return index === -1 ? desired.length : index;
    };
    imageFiles.sort((a, b) => score(a) - score(b));
  }

  return imageFiles.slice(0, 3);
}

async function addIngredients(page, files) {
  if (!files.length) {
    return { skipped: true, files: [] };
  }
  if (await isAiAvatarPanelActive(page)) {
    return {
      skipped: true,
      files,
      reason: "Skipped screenshot ingredients because the AI avatar panel is active."
    };
  }

  const attempts = [];

  async function openChooser(fileIndex) {
    let chooserPromise = page.waitForEvent("filechooser", { timeout: 7000 }).catch(() => null);
    const ingredientsButton = await clickByText(page, ["Ingredients"], 5000);
    attempts.push({ step: "click_ingredients", fileIndex, result: ingredientsButton });
    const consent = await maybeAcceptWorkspaceImagesConsent(page);
    attempts.push({ step: "workspace_images_consent", fileIndex, result: consent });
    if (consent.clicked) {
      chooserPromise = page.waitForEvent("filechooser", { timeout: 7000 }).catch(() => null);
      const retryIngredientsButton = await clickByText(page, ["Ingredients"], 5000);
      attempts.push({ step: "click_ingredients_after_consent", fileIndex, result: retryIngredientsButton });
    }
    let chooser = await chooserPromise;

    if (!chooser) {
      chooserPromise = page.waitForEvent("filechooser", { timeout: 7000 }).catch(() => null);
      const uploadButton = await clickByText(page, ["Upload from computer", "Upload", "Computer"], 5000);
      attempts.push({ step: "click_upload", fileIndex, result: uploadButton });
      const uploadConsent = await maybeAcceptWorkspaceImagesConsent(page);
      attempts.push({ step: "workspace_images_consent_after_upload", fileIndex, result: uploadConsent });
      if (uploadConsent.clicked) {
        chooserPromise = page.waitForEvent("filechooser", { timeout: 7000 }).catch(() => null);
        const retryUploadButton = await clickByText(page, ["Upload from computer", "Upload", "Computer", "Ingredients"], 5000);
        attempts.push({ step: "click_upload_after_consent", fileIndex, result: retryUploadButton });
      }
      chooser = await chooserPromise;
    }

    return chooser;
  }

  const chooser = await openChooser(0);
  if (!chooser) {
    return {
      uploaded: false,
      files,
      attempts,
      reason: "No file chooser opened for Ingredients."
    };
  }

  try {
    await chooser.setFiles(files);
    await page.waitForTimeout(8000);
    return { uploaded: true, files, attempts };
  } catch (error) {
    if (!/Non-multiple file input/i.test(error.message) || files.length === 1) {
      throw error;
    }
  }

  const uploadedFiles = [];
  for (let index = 0; index < files.length; index += 1) {
    const currentChooser = index === 0 ? chooser : await openChooser(index);
    if (!currentChooser) {
      attempts.push({ step: "missing_filechooser", fileIndex: index });
      break;
    }
    await currentChooser.setFiles(files[index]);
    uploadedFiles.push(files[index]);
    await page.waitForTimeout(5000);
  }

  return { uploaded: uploadedFiles.length > 0, files, uploadedFiles, attempts };
}

function ingredientReport(steps) {
  return steps
    .filter((step) => step.name === "add_ingredients")
    .map((step) => ({
      sceneNumber: step.sceneNumber,
      uploaded: Boolean(step.uploaded),
      skipped: Boolean(step.skipped),
      files: step.files || [],
      uploadedFiles: step.uploadedFiles || (step.uploaded ? step.files || [] : []),
      reason: step.reason || "",
      consentAccepted: step.attempts?.some((attempt) => (
        /workspace_images_consent/i.test(attempt.step) && attempt.result?.clicked
      )) || false
    }));
}

function avatarArgValue() {
  const value = args.avatar || args["select-avatar"];
  if (!value) {
    return "";
  }
  if (value === true) {
    return "auto";
  }
  return String(value).trim() || "auto";
}

function shouldSelectAvatarForScene(sceneNumber) {
  const avatar = avatarArgValue();
  if (!avatar) {
    return false;
  }

  if (!args["avatar-scenes"]) {
    return true;
  }

  const allowed = String(args["avatar-scenes"])
    .split(",")
    .map((item) => Number(item.trim()))
    .filter(Number.isFinite);
  return allowed.includes(Number(sceneNumber));
}

async function clickAvatarPicker(page) {
  const candidate = await page.evaluate(() => {
    document.querySelectorAll("[data-trf-avatar-picker]").forEach((element) => {
      element.removeAttribute("data-trf-avatar-picker");
    });

    const clean = (value) => String(value || "").replace(/\s+/g, " ").trim();
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    const elements = Array.from(document.querySelectorAll("button, [role='button'], [aria-label]"));
    const matches = elements.map((element, index) => {
      const rect = element.getBoundingClientRect();
      const text = clean(element.innerText || element.textContent);
      const ariaLabel = clean(element.getAttribute("aria-label"));
      return {
        index,
        text,
        ariaLabel,
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        centerX: rect.x + rect.width / 2,
        centerY: rect.y + rect.height / 2,
        visible: Boolean(rect.width && rect.height && element.getClientRects().length)
      };
    }).filter((item) => (
      item.visible &&
      /(^|\s)avatar(\s|$)/i.test(`${item.text} ${item.ariaLabel}`) &&
      item.centerX > viewport.width * 0.48 &&
      item.centerY > viewport.height * 0.42 &&
      item.centerY < viewport.height - 40
    ));

    const chosen = matches.sort((a, b) => {
      const textA = /^avatar$/i.test(a.text || a.ariaLabel) ? 0 : 1;
      const textB = /^avatar$/i.test(b.text || b.ariaLabel) ? 0 : 1;
      return textA - textB || b.centerY - a.centerY;
    })[0];
    if (!chosen) {
      return null;
    }

    elements[chosen.index].setAttribute("data-trf-avatar-picker", "true");
    return chosen;
  });

  if (!candidate) {
    return { clicked: false, reason: "Avatar picker button was not found." };
  }

  const locator = page.locator("[data-trf-avatar-picker='true']").first();
  let clicked = await locator.click({ timeout: 4000, force: true }).then(() => true).catch(() => false);
  if (!clicked) {
    await page.mouse.click(candidate.centerX, candidate.centerY).then(() => {
      clicked = true;
    }).catch(() => {});
  }
  if (!clicked) {
    await locator.focus({ timeout: 3000 }).catch(() => {});
    await page.keyboard.press("Enter").then(() => {
      clicked = true;
    }).catch(() => {});
  }
  await page.waitForTimeout(3500);
  return clicked
    ? { clicked: true, candidate }
    : { clicked: false, candidate, reason: "Avatar picker button could not be clicked." };
}

async function clickNamedAvatar(page, avatarName) {
  if (!avatarName || avatarName === "auto") {
    return { skipped: true };
  }

  const candidate = await page.evaluate((wantedName) => {
    document.querySelectorAll("[data-trf-avatar-named]").forEach((element) => {
      element.removeAttribute("data-trf-avatar-named");
    });

    const clean = (value) => String(value || "").replace(/\s+/g, " ").trim();
    const wanted = clean(wantedName).toLowerCase();
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    const elements = Array.from(document.querySelectorAll("button, [role='button'], [role='radio'], [aria-label], [tabindex]"));
    const matches = elements.map((element, index) => {
      const rect = element.getBoundingClientRect();
      const text = clean(element.innerText || element.textContent);
      const ariaLabel = clean(element.getAttribute("aria-label"));
      const style = window.getComputedStyle(element);
      const backgroundImage = style.backgroundImage || "";
      const hasImage = Boolean(element.querySelector("img, svg, picture")) || /url\(/i.test(backgroundImage);
      const role = element.getAttribute("role") || "";
      const className = String(element.className || "");
      const fields = [text, ariaLabel].map((value) => value.toLowerCase()).filter(Boolean);
      const matchedName = fields.some((field) => (
        field === wanted ||
        field.startsWith(`${wanted}:`) ||
        field.startsWith(`${wanted} `) ||
        field.includes(`@${wanted}`)
      ));
      return {
        index,
        text,
        ariaLabel,
        role,
        checked: element.getAttribute("aria-checked") === "true",
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        centerX: rect.x + rect.width / 2,
        centerY: rect.y + rect.height / 2,
        area: rect.width * rect.height,
        hasImage,
        isPresetCard: role === "radio" || /docs-thumbnailcontrol/i.test(className),
        visible: Boolean(rect.width && rect.height && element.getClientRects().length),
        matchedName
      };
    }).filter((item) => (
      item.visible &&
      item.matchedName &&
      item.centerX > 140 &&
      item.centerX < viewport.width - 140 &&
      item.centerY > 110 &&
      item.centerY < viewport.height - 80 &&
      item.width >= 32 &&
      item.height >= 24 &&
      (item.isPresetCard || item.hasImage || item.area >= 1800)
    )).sort((a, b) => {
      if (a.checked !== b.checked) {
        return a.checked ? -1 : 1;
      }
      if (a.isPresetCard !== b.isPresetCard) {
        return a.isPresetCard ? -1 : 1;
      }
      if (a.hasImage !== b.hasImage) {
        return a.hasImage ? -1 : 1;
      }
      return a.centerY - b.centerY || a.centerX - b.centerX;
    });

    const chosen = matches[0];
    if (!chosen) {
      return null;
    }
    elements[chosen.index].setAttribute("data-trf-avatar-named", "true");
    return chosen;
  }, avatarName);

  if (candidate) {
    if (candidate.checked) {
      return { clicked: true, strategy: "already_selected_named_preset", avatarName, candidate };
    }

    const locator = page.locator("[data-trf-avatar-named='true']").first();
    let clicked = await locator.click({ timeout: 5000, force: true }).then(() => true).catch(() => false);
    if (!clicked) {
      await page.mouse.click(candidate.centerX, candidate.centerY).then(() => {
        clicked = true;
      }).catch(() => {});
    }
    if (!clicked) {
      await locator.focus({ timeout: 3000 }).catch(() => {});
      await page.keyboard.press("Enter").then(() => {
        clicked = true;
      }).catch(() => {});
    }
    await page.waitForTimeout(2500);
    return clicked
      ? { clicked: true, strategy: "named_avatar_card", avatarName, candidate }
      : { clicked: false, strategy: "named_avatar_card", avatarName, candidate, reason: "Named avatar card could not be clicked." };
  }

  const named = await clickByText(page, [avatarName], 5000);
  if (named.clicked) {
    return { clicked: true, strategy: "text", avatarName, result: named };
  }

  const byLabel = await clickByLabel(page, [avatarName], 5000);
  if (byLabel.clicked) {
    return { clicked: true, strategy: "aria-label", avatarName, result: byLabel };
  }

  return { clicked: false, avatarName, reason: `Avatar named "${avatarName}" was not found.` };
}

async function clickFirstAvatarPreset(page) {
  const candidate = await page.evaluate(() => {
    document.querySelectorAll("[data-trf-avatar-preset]").forEach((element) => {
      element.removeAttribute("data-trf-avatar-preset");
    });

    const clean = (value) => String(value || "").replace(/\s+/g, " ").trim();
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    const deny = /create|edit|animate|ingredients|avatar|portrait|landscape|omni|clear|generate|close|expand|collapse|show gallery|try again|remove|ai video|voiceover|music|image|record|uploads|stock|captions|text|templates|shapes|play|share|menu|google account|screen reader|select a preset|character in your video/i;
    const elements = Array.from(document.querySelectorAll("button, [role='button'], [aria-label], [tabindex]"));
    const candidates = elements.map((element, index) => {
      const rect = element.getBoundingClientRect();
      const text = clean(element.innerText || element.textContent);
      const ariaLabel = clean(element.getAttribute("aria-label"));
      const name = `${text} ${ariaLabel}`.trim();
      const style = window.getComputedStyle(element);
      const backgroundImage = style.backgroundImage || "";
      const hasImage = Boolean(element.querySelector("img, svg, picture")) || /url\(/i.test(backgroundImage);
      return {
        index,
        text,
        ariaLabel,
        name,
        checked: element.getAttribute("aria-checked") === "true",
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        centerX: rect.x + rect.width / 2,
        centerY: rect.y + rect.height / 2,
        area: rect.width * rect.height,
        hasImage,
        visible: Boolean(rect.width && rect.height && element.getClientRects().length)
      };
    }).filter((item) => (
      item.visible &&
      item.centerX > viewport.width * 0.5 &&
      item.centerX < viewport.width - 55 &&
      item.centerY > 120 &&
      item.centerY < viewport.height - 160 &&
      item.width >= 44 &&
      item.height >= 44 &&
      item.area >= 2200 &&
      !deny.test(item.name) &&
      (item.hasImage || item.area >= 7000)
    )).sort((a, b) => {
      if (a.checked !== b.checked) {
        return a.checked ? -1 : 1;
      }
      if (a.hasImage !== b.hasImage) {
        return a.hasImage ? -1 : 1;
      }
      return a.centerY - b.centerY || a.centerX - b.centerX;
    });

    const chosen = candidates[0];
    if (!chosen) {
      return null;
    }

    elements[chosen.index].setAttribute("data-trf-avatar-preset", "true");
    return chosen;
  });

  if (!candidate) {
    return { clicked: false, reason: "No visible avatar preset card was found." };
  }

  if (candidate.checked) {
    return { clicked: true, strategy: "already_selected_preset", candidate };
  }

  const locator = page.locator("[data-trf-avatar-preset='true']").first();
  let clicked = await locator.click({ timeout: 5000, force: true }).then(() => true).catch(() => false);
  if (!clicked) {
    await page.mouse.click(candidate.centerX, candidate.centerY).then(() => {
      clicked = true;
    }).catch(() => {});
  }
  if (!clicked) {
    await locator.focus({ timeout: 3000 }).catch(() => {});
    await page.keyboard.press("Enter").then(() => {
      clicked = true;
    }).catch(() => {});
  }
  await page.waitForTimeout(2500);
  return clicked
    ? { clicked: true, strategy: "first_visible_preset", candidate }
    : { clicked: false, strategy: "first_visible_preset", candidate, reason: "Avatar preset could not be clicked." };
}

async function maybeConfirmAvatarSelection(page) {
  const confirm = await clickByText(page, ["Use avatar", "Select avatar", "Select", "Apply", "Done"], 2500);
  if (confirm.clicked) {
    return confirm;
  }
  return { clicked: false };
}

async function selectAvatar(page, avatarValue) {
  const picker = await clickAvatarPicker(page);
  if (!picker.clicked) {
    return { selected: false, picker };
  }

  const named = await clickNamedAvatar(page, avatarValue);
  const preset = named.clicked ? named : await clickFirstAvatarPreset(page);
  const confirm = preset.clicked ? await maybeConfirmAvatarSelection(page) : { skipped: true };

  return {
    selected: Boolean(preset.clicked),
    requested: avatarValue || "auto",
    picker,
    preset,
    confirm
  };
}

async function waitForSavingComplete(page, timeoutMs = 45000) {
  const startedAt = Date.now();
  let lastText = "";
  while (Date.now() - startedAt < timeoutMs) {
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
    textSample: lastText.replace(/\s+/g, " ").slice(0, 500)
  };
}

const scenePlan = await readJson(scenesPath);
const manifest = manifestPath && await accessOrNull(manifestPath) ? await readJson(manifestPath) : {};
const outputDir = path.resolve(outputRoot);
await ensureDir(outputDir);

const sceneNumber = Number(args.scene || 1);
let allSceneNumbers = args["all-scenes"]
  ? scenePlan.scenes.map((scene) => Number(scene.scene_number))
  : [sceneNumber];
if (args["from-scene"]) {
  const fromScene = Number(args["from-scene"]);
  allSceneNumbers = allSceneNumbers.filter((item) => item >= fromScene);
}
if (args["to-scene"]) {
  const toScene = Number(args["to-scene"]);
  allSceneNumbers = allSceneNumbers.filter((item) => item <= toScene);
}
const maxScenes = args["max-scenes"] ? Number(args["max-scenes"]) : allSceneNumbers.length;
const sceneNumbers = allSceneNumbers.slice(0, maxScenes);
const promptFiles = [];

if (args.master) {
  const masterPrompt = buildGoogleVidsMasterPrompt(scenePlan, manifest);
  const masterPromptPath = path.join(outputDir, "google-vids-master-prompt.txt");
  await writeText(masterPromptPath, `${masterPrompt}\n`);
  promptFiles.push({ type: "master", path: masterPromptPath });
} else {
  for (const currentSceneNumber of sceneNumbers) {
    const promptReferenceFiles = await ingredientFilesForScene(manifest, args, currentSceneNumber);
    const scenePrompt = buildGoogleVidsClipPrompt(scenePlan, currentSceneNumber, manifest, {
      referenceFiles: promptReferenceFiles
    });
    const scenePromptPath = path.join(outputDir, `google-vids-scene-${currentSceneNumber}-prompt.txt`);
    await writeText(scenePromptPath, `${scenePrompt}\n`);
    promptFiles.push({ type: "scene", sceneNumber: currentSceneNumber, path: scenePromptPath });
  }
}

const promptPath = promptFiles[0]?.path || null;

const { chromium } = await import("playwright");
const launchOptions = {
  headless: false,
  viewport: { width: 1365, height: 768 }
};
await applyChromeLaunchOptions(launchOptions, { channelFallback: false });

console.log(`Opening Google Vids with profile: ${profileDir}`);
console.log(`Prompt file: ${promptPath}`);

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
  await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(7000);
  steps.push({ name: "opened", screenshot: await screenshot(page, outputDir, "01-opened"), state: await pageState(page, outputDir, "01-opened") });
  await assertGoogleVidsReady(page, "opened");

  if (!args["insert-only"]) {
    if (!args["skip-portrait"] && portraitRequested) {
      const portrait = await ensurePortrait(page);
      steps.push({ name: "select_portrait", ...portrait, screenshot: await screenshot(page, outputDir, "03-portrait"), state: await pageState(page, outputDir, "03-portrait") });
      if (args["require-portrait"] && !portrait.clicked && !portrait.selected) {
        throw new Error(`Portrait video size was required but could not be selected. ${portrait.reason || ""}`.trim());
      }
      await assertGoogleVidsReady(page, "select_portrait");
    } else if (!args["skip-portrait"]) {
      steps.push({
        name: "select_video_size",
        skipped: true,
        requestedVideoSize,
        reason: "Portrait selection is only automated for portrait/vertical/9:16 requests."
      });
    }

    for (let index = 0; index < sceneNumbers.length; index += 1) {
      const currentSceneNumber = sceneNumbers[index];
      const prefix = args["all-scenes"] ? `scene-${String(currentSceneNumber).padStart(2, "0")}` : "";
      const shotName = (name) => prefix ? `${prefix}-${name}` : name;

      if (args["new-scene-first"] || index > 0) {
        const newScene = await clickNewScene(page);
        steps.push({ sceneNumber: currentSceneNumber, name: "new_scene", ...newScene, screenshot: await screenshot(page, outputDir, shotName("04-new-scene")), state: await pageState(page, outputDir, shotName("04-new-scene")) });
      }

      await assertGoogleVidsReady(page, `scene_${currentSceneNumber}_start`);
      const aiVideo = await openAiVideoPanel(page);
      steps.push({ sceneNumber: currentSceneNumber, name: "create_ai_video", ...aiVideo, screenshot: await screenshot(page, outputDir, shotName("05-create-ai-video")), state: await pageState(page, outputDir, shotName("05-create-ai-video")) });
      await assertGoogleVidsReady(page, `scene_${currentSceneNumber}_ai_video_panel`);

      const ingredientFiles = await ingredientFilesForScene(manifest, args, currentSceneNumber);
      const ingredients = await addIngredients(page, ingredientFiles);
      steps.push({ sceneNumber: currentSceneNumber, name: "add_ingredients", ...ingredients, screenshot: await screenshot(page, outputDir, shotName("06-ingredients")), state: await pageState(page, outputDir, shotName("06-ingredients")) });
      const promptReferenceFiles = ingredients.uploaded
        ? (ingredients.uploadedFiles?.length ? ingredients.uploadedFiles : ingredientFiles)
        : [];

      if (ingredientFiles.length) {
        const saveWait = await waitForSavingComplete(page);
        steps.push({ sceneNumber: currentSceneNumber, name: "wait_after_ingredients", ...saveWait, screenshot: await screenshot(page, outputDir, shotName("07-after-ingredients-save")), state: await pageState(page, outputDir, shotName("07-after-ingredients-save")) });

        const reopenAiVideo = await openAiVideoPanel(page);
        steps.push({ sceneNumber: currentSceneNumber, name: "reopen_ai_video_after_ingredients", ...reopenAiVideo, screenshot: await screenshot(page, outputDir, shotName("08-reopen-ai-video")), state: await pageState(page, outputDir, shotName("08-reopen-ai-video")) });
        await assertGoogleVidsReady(page, `scene_${currentSceneNumber}_after_ingredients`);
      }

      if (shouldSelectAvatarForScene(currentSceneNumber)) {
        const avatar = await selectAvatar(page, avatarArgValue());
        steps.push({ sceneNumber: currentSceneNumber, name: "select_avatar", ...avatar, screenshot: await screenshot(page, outputDir, shotName("08-avatar")), state: await pageState(page, outputDir, shotName("08-avatar")) });

        const reopenAiVideo = await openAiVideoPanel(page);
        steps.push({ sceneNumber: currentSceneNumber, name: "reopen_ai_video_after_avatar", ...reopenAiVideo, screenshot: await screenshot(page, outputDir, shotName("08-avatar-reopen")), state: await pageState(page, outputDir, shotName("08-avatar-reopen")) });
        await assertGoogleVidsReady(page, `scene_${currentSceneNumber}_after_avatar`);
      }

      const scenePrompt = args.master
        ? buildGoogleVidsMasterPrompt(scenePlan, manifest)
        : buildGoogleVidsClipPrompt(scenePlan, currentSceneNumber, manifest, {
          referenceFiles: promptReferenceFiles
        });
      const currentPromptFile = args.master
        ? promptFiles.find((file) => file.type === "master")
        : promptFiles.find((file) => Number(file.sceneNumber) === Number(currentSceneNumber));
      if (currentPromptFile?.path) {
        await writeText(currentPromptFile.path, `${scenePrompt}\n`);
      }
      const currentScene = scenePlan.scenes.find((scene) => Number(scene.scene_number) === Number(currentSceneNumber));
      const fill = await fillPrompt(page, scenePrompt, {
        avatarScript: shortAvatarScript(currentScene, scenePrompt)
      });
      steps.push({ sceneNumber: currentSceneNumber, name: "fill_prompt", ...fill, screenshot: await screenshot(page, outputDir, shotName("09-fill-prompt")), state: await pageState(page, outputDir, shotName("09-fill-prompt")) });
      if (!fill.filled) {
        throw new Error(`Scene ${currentSceneNumber} prompt fill failed: ${fill.reason || "unknown reason"}`);
      }

      let submit = { skipped: true };
      if (args.submit) {
        submit = await maybeSubmit(page);
        await page.waitForTimeout(Number(args["after-submit-wait"] || 45000));
      }
      steps.push({ sceneNumber: currentSceneNumber, name: "submit", ...submit, screenshot: await screenshot(page, outputDir, shotName("10-submit")), state: await pageState(page, outputDir, shotName("10-submit")) });
      if (args.submit && !submit.clicked) {
        throw new Error(`Scene ${currentSceneNumber} submit failed: ${submit.reason || "Generate button was not clicked."}`);
      }
      if (args.submit) {
        const limitMessage = await detectGenerationLimit(page);
        if (limitMessage) {
          throw new Error(`Google Vids generation limit hit on Scene ${currentSceneNumber}: ${limitMessage}`);
        }
      }

      if (args.insert) {
        const insert = await clickGeneratedInsert(page);
        steps.push({ sceneNumber: currentSceneNumber, name: "insert_generated_clip", ...insert, screenshot: await screenshot(page, outputDir, shotName("11-insert")), state: await pageState(page, outputDir, shotName("11-insert")) });
        if (!insert.clicked) {
          if (insert.limitHit) {
            throw new Error(`Google Vids generation limit hit on Scene ${currentSceneNumber}: ${insert.reason}`);
          }
          throw new Error(`Scene ${currentSceneNumber} insert failed: ${insert.reason || "Generated clip was not inserted."}`);
        }
      }
    }
  }

  if (args["insert-only"]) {
    const insert = await clickGeneratedInsert(page);
    steps.push({ name: "insert_generated_clip", ...insert, screenshot: await screenshot(page, outputDir, "07-insert"), state: await pageState(page, outputDir, "07-insert") });
  }

  await writeJson(path.join(outputDir, "vids-operator-report.json"), {
    ok: true,
    mode: args["insert-only"] ? "insert_only" : args.submit ? "submitted" : "filled_prompt_only",
    promptMode: args.master ? "master_reel_prompt" : "single_scene_clip_prompt",
    sceneNumber: args.master ? null : sceneNumber,
    sceneNumbers: args.master ? [] : sceneNumbers,
    scenesPath,
    manifestPath,
    promptPath,
    promptFiles,
    videoSize: {
      requested: requestedVideoSize,
      portraitRequested,
      requirePortrait: Boolean(args["require-portrait"])
    },
    ingredientUploads: ingredientReport(steps),
    targetUrl,
    currentUrl: page.url(),
    title: await page.title(),
    manualRecoveryWaitMs,
    steps
  });

  console.log(`Report: ${path.join(outputDir, "vids-operator-report.json")}`);
  console.log(args.submit ? "Submitted a generate/create action if a matching button was available." : "Prompt was prepared/filled where possible. Submit was skipped.");
  if (args["keep-open"]) {
    console.log("Press Enter after your review to close the browser.");
    process.stdin.resume();
    await new Promise((resolve) => process.stdin.once("data", resolve));
  }
} catch (error) {
  const errorScreenshot = await screenshot(page, outputDir, "error").catch(() => null);
  const errorState = await pageState(page, outputDir, "error").catch((stateError) => ({
    error: stateError.message
  }));
  const safetySnapshot = await saveGoogleVidsSafetySnapshot(page, outputDir, "error-final", {
    event: "operator_failed",
    error: error.message
  }).catch(() => null);
  const safetyFields = safetyFieldsFromError(error, safetySnapshot?.classification || null);
  await writeJson(path.join(outputDir, "vids-operator-report.json"), {
    ok: false,
    mode: args["insert-only"] ? "insert_only" : args.submit ? "submitted" : "filled_prompt_only",
    promptMode: args.master ? "master_reel_prompt" : "single_scene_clip_prompt",
    sceneNumber: args.master ? null : sceneNumber,
    sceneNumbers: args.master ? [] : sceneNumbers,
    scenesPath,
    manifestPath,
    promptPath,
    promptFiles,
    videoSize: {
      requested: requestedVideoSize,
      portraitRequested,
      requirePortrait: Boolean(args["require-portrait"])
    },
    ingredientUploads: ingredientReport(steps),
    targetUrl,
    currentUrl: page.url(),
    title: await page.title().catch(() => ""),
    manualRecoveryWaitMs,
    error: error.message,
    stack: error.stack,
    ...safetyFields,
    safetySnapshot,
    errorScreenshot,
    errorState,
    steps
  });
  console.error(`Google Vids operator failed: ${error.message}`);
  if (safetyFields.manualAction) {
    console.error(`Manual action: ${safetyFields.manualAction}`);
  }
  console.error(`Report: ${path.join(outputDir, "vids-operator-report.json")}`);
  process.exitCode = 1;
} finally {
  await context.close();
}
