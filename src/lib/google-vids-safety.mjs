import path from "node:path";
import fs from "node:fs/promises";

const emailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

export function redactGoogleVidsText(value) {
  return String(value || "")
    .replace(emailPattern, "[email]")
    .replace(/Google Account:\s*[^()]+ \(\[email\]\)/gi, "Google Account: [signed-in user] ([email])")
    .replace(/\s+/g, " ")
    .trim();
}

export function redactGoogleVidsJson(value) {
  if (typeof value === "string") {
    return redactGoogleVidsText(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => redactGoogleVidsJson(item));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, redactGoogleVidsJson(item)])
    );
  }
  return value;
}

function safeStageName(value) {
  return String(value || "screen")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 90) || "screen";
}

async function visibleBodyText(page) {
  return page.locator("body").innerText({ timeout: 5000 }).catch(() => "");
}

export async function classifyGoogleVidsScreen(page) {
  const url = page.url();
  const title = await page.title().catch(() => "");
  const bodyText = await visibleBodyText(page);
  const normalized = redactGoogleVidsText(bodyText);
  const sample = normalized.slice(0, 1200);
  const search = `${url} ${title} ${normalized}`;

  const result = {
    kind: "unknown_or_editor",
    blocking: false,
    requiresManualAction: false,
    recoverable: true,
    quotaHit: false,
    loginNeeded: false,
    message: "No known blocking Google Vids screen detected.",
    action: "Continue automation.",
    url,
    title,
    textSample: sample
  };

  if (/hit your limits for generating videos in Vids|limit(?:s)? .*generating videos|quota|credits?|credit exhausted|limit used/i.test(search)) {
    return {
      ...result,
      kind: "quota_or_credits_limit",
      blocking: true,
      requiresManualAction: false,
      recoverable: false,
      quotaHit: true,
      message: "Google Vids generation quota/credits limit is visible.",
      action: "Use another available profile or wait for quota reset."
    };
  }

  if (/accounts\.google\.com|ServiceLogin|signin|Sign in with Google|Use your Google Account|Choose an account|Enter your password|Forgot email/i.test(search)) {
    return {
      ...result,
      kind: "login_required",
      blocking: true,
      requiresManualAction: true,
      loginNeeded: true,
      message: "Google login/account screen is open.",
      action: "Complete login for this profile in the visible browser window."
    };
  }

  if (/2-Step Verification|Verify it.?s you|verification code|Get a verification code|Use your phone|Passkey|Security code/i.test(search)) {
    return {
      ...result,
      kind: "two_factor_required",
      blocking: true,
      requiresManualAction: true,
      loginNeeded: true,
      message: "Google verification/2FA screen is open.",
      action: "Complete the verification manually in the visible browser window."
    };
  }

  if (/Create content from images in Workspace|necessary rights|prohibited use policy|Agree to continue|Review and accept/i.test(search)) {
    return {
      ...result,
      kind: "workspace_images_consent",
      blocking: true,
      requiresManualAction: true,
      message: "Workspace image/content consent screen is visible.",
      action: "Review the consent text and click Agree/Continue only if acceptable."
    };
  }

  if (/You need access|Request access|Access denied|permission denied|not authorized|Ask for access|This file is unavailable/i.test(search)) {
    return {
      ...result,
      kind: "access_permission_blocked",
      blocking: true,
      requiresManualAction: true,
      message: "Google Vids access/permission screen is blocking automation.",
      action: "Switch profile, request access, or open a Vids file owned by this account."
    };
  }

  if (/This app is blocked|couldn.?t sign you in|browser or app may not be secure|unusual traffic|automated queries|temporarily disabled/i.test(search)) {
    return {
      ...result,
      kind: "google_security_block",
      blocking: true,
      requiresManualAction: true,
      message: "Google security or anti-abuse screen is blocking automation.",
      action: "Resolve the Google security prompt manually, then retry with the same profile."
    };
  }

  if (/Something went wrong|Try again later|Unable to generate|failed to generate|temporarily unavailable|Server error|Couldn.?t create/i.test(search)) {
    return {
      ...result,
      kind: "transient_generation_error",
      blocking: true,
      requiresManualAction: true,
      message: "Google Vids shows a temporary generation/error screen.",
      action: "Click Try again if visible, or retry the run later."
    };
  }

  if (/AI video|AI avatar|Video size|File|Download|Scene|Insert|Enter a script for this scene|Describe your video/i.test(search)) {
    return {
      ...result,
      kind: "editor_ready",
      message: "Google Vids editor appears ready."
    };
  }

  return result;
}

export async function saveGoogleVidsSafetySnapshot(page, outputDir, stage, extra = {}) {
  const safeStage = safeStageName(stage);
  const screenshotPath = path.join(outputDir, `safe-${safeStage}.png`);
  const statePath = path.join(outputDir, `safe-${safeStage}.json`);
  await page.screenshot({ path: screenshotPath, fullPage: false }).catch(() => null);
  const classification = await classifyGoogleVidsScreen(page).catch((error) => ({
    kind: "classification_failed",
    blocking: true,
    requiresManualAction: true,
    recoverable: true,
    message: error.message,
    action: "Review the screenshot manually.",
    url: page.url(),
    title: "",
    textSample: ""
  }));
  await fs.writeFile(
    statePath,
    `${JSON.stringify(redactGoogleVidsJson({ stage, ...extra, classification }), null, 2)}\n`,
    "utf8"
  );
  return {
    stage,
    screenshotPath,
    statePath,
    classification
  };
}

export async function ensureGoogleVidsSafe(page, outputDir, stage, options = {}) {
  const waitMs = Number(options.manualRecoveryWaitMs || 0);
  const pollMs = Number(options.pollMs || 5000);
  const first = await classifyGoogleVidsScreen(page);
  if (!first.blocking) {
    return { ok: true, recovered: false, classification: first };
  }

  const firstSnapshot = await saveGoogleVidsSafetySnapshot(page, outputDir, stage, {
    event: "blocking_screen_detected"
  });
  console.error(`[SAFE] ${first.message}`);
  console.error(`[SAFE] Action: ${first.action}`);
  console.error(`[SAFE] Screenshot: ${firstSnapshot.screenshotPath}`);

  if (!first.recoverable || waitMs <= 0) {
    const error = new Error(`${first.message} Action: ${first.action}`);
    error.safety = { ...first, stage, snapshot: firstSnapshot };
    throw error;
  }

  const startedAt = Date.now();
  console.error(`[SAFE] Waiting up to ${Math.round(waitMs / 1000)}s for manual recovery...`);
  while (Date.now() - startedAt < waitMs) {
    await page.waitForTimeout(pollMs);
    const current = await classifyGoogleVidsScreen(page);
    if (!current.blocking) {
      const recoveredSnapshot = await saveGoogleVidsSafetySnapshot(page, outputDir, `${stage}-recovered`, {
        event: "manual_recovery_completed",
        waitedMs: Date.now() - startedAt
      });
      console.error(`[SAFE] Manual recovery completed. Continuing automation.`);
      return {
        ok: true,
        recovered: true,
        waitedMs: Date.now() - startedAt,
        first,
        classification: current,
        snapshot: firstSnapshot,
        recoveredSnapshot
      };
    }
  }

  const timeoutSnapshot = await saveGoogleVidsSafetySnapshot(page, outputDir, `${stage}-timeout`, {
    event: "manual_recovery_timeout",
    waitedMs: Date.now() - startedAt
  });
  const error = new Error(`${first.message} Manual recovery timed out. Action: ${first.action}`);
  error.safety = { ...first, stage, snapshot: firstSnapshot, timeoutSnapshot };
  throw error;
}

export function safetyFieldsFromError(error, fallbackSafety = null) {
  const safety = error?.safety || fallbackSafety || null;
  return {
    safety,
    requiresManualAction: Boolean(safety?.requiresManualAction),
    manualAction: safety?.action || "",
    quotaHit: Boolean(safety?.quotaHit),
    loginNeeded: Boolean(safety?.loginNeeded),
    recoverable: safety ? Boolean(safety.recoverable) : true
  };
}
