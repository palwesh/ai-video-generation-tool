import dotenv from "dotenv";
import { parseArgs } from "./lib/args.mjs";
dotenv.config({ quiet: true });

const { chromium } = await import("playwright");

const args = parseArgs(process.argv.slice(2));
const profileDir = args.profile || "work/google-vids-profile";
const waitMs = args["wait-ms"] ? Number(args["wait-ms"]) : null;
const macChromeExecutable = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const launchOptions = {
  headless: false,
  viewport: { width: 1365, height: 768 }
};

launchOptions.executablePath = process.env.PLAYWRIGHT_EXECUTABLE_PATH || macChromeExecutable;

console.log("Opening Google Vids with a persistent browser profile.");
console.log(`Profile: ${profileDir}`);
console.log("Login with the Google account you want to use for Vids generations.");
if (waitMs) {
  console.log(`This browser will stay open for ${Math.round(waitMs / 1000)} seconds.`);
} else {
  console.log("When login is complete, return here and press Enter.");
}

const context = await chromium.launchPersistentContext(profileDir, launchOptions);
const page = await context.newPage();
await page.goto("https://vids.new", { waitUntil: "domcontentloaded" });

async function closeAndExit() {
  await context.close();
  console.log(`Saved browser profile at ${profileDir}`);
  process.exit(0);
}

if (waitMs) {
  setTimeout(closeAndExit, waitMs);
} else {
  process.stdin.resume();
  process.stdin.once("data", closeAndExit);
}
