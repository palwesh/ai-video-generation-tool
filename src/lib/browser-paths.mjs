import fs from "node:fs/promises";
import path from "node:path";

const chromeCandidates = [
  process.env.PLAYWRIGHT_EXECUTABLE_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  process.env.PROGRAMFILES ? path.join(process.env.PROGRAMFILES, "Google", "Chrome", "Application", "chrome.exe") : "",
  process.env["PROGRAMFILES(X86)"] ? path.join(process.env["PROGRAMFILES(X86)"], "Google", "Chrome", "Application", "chrome.exe") : "",
  process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, "Google", "Chrome", "Application", "chrome.exe") : "",
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/snap/bin/chromium"
].filter(Boolean);

async function accessOrNull(filePath) {
  return fs.access(filePath).then(() => filePath).catch(() => null);
}

export async function existingChromeExecutable() {
  for (const candidate of chromeCandidates) {
    const found = await accessOrNull(candidate);
    if (found) {
      return found;
    }
  }
  return null;
}

export async function applyChromeLaunchOptions(launchOptions, options = {}) {
  const executablePath = await existingChromeExecutable();
  if (executablePath) {
    launchOptions.executablePath = executablePath;
    return launchOptions;
  }

  if (options.channelFallback !== false) {
    launchOptions.channel = process.env.PLAYWRIGHT_CHANNEL || "chrome";
  }
  return launchOptions;
}

export async function launchWithBundledFallback(chromium, launchOptions, launcher) {
  try {
    return await launcher(launchOptions);
  } catch (error) {
    if (launchOptions.executablePath && !process.env.PLAYWRIGHT_EXECUTABLE_PATH) {
      const fallbackOptions = { ...launchOptions };
      delete fallbackOptions.executablePath;
      delete fallbackOptions.channel;
      console.warn("System Chrome launch failed. Retrying with bundled Playwright Chromium.");
      return await launcher(fallbackOptions);
    }
    throw error;
  }
}
