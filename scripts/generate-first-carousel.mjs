import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const rootDir = process.cwd();
const outputDir = path.join(rootDir, "outputs", "instagram", "altftools_review_first_carousel");
const slidesDir = path.join(outputDir, "slides");
const logoPath = path.join(rootDir, "public", "brand", "altf-logo.png");
const homeDir = process.env.HOME || "";

const slides = [
  {
    kicker: "NEW PAGE",
    title: "AltF Tools Review",
    body: "Useful web tools ka real demo. Short, clear, and actually practical.",
    badge: "Swipe to know",
    accent: "#22d3ee",
    variant: "hero"
  },
  {
    kicker: "WHAT YOU GET",
    title: "60-sec tool reviews",
    body: "AI, privacy, productivity, editing, documents, calculators, and daily work tools.",
    badge: "Save time",
    accent: "#facc15",
    variant: "list",
    points: ["Real use-case", "Simple workflow", "Quick result"]
  },
  {
    kicker: "NO FAKE UI",
    title: "Real screen demo only",
    body: "Har reel me actual tool open hoga, demo data use hoga, aur output clearly show hoga.",
    badge: "Trust first",
    accent: "#34d399",
    variant: "browser"
  },
  {
    kicker: "FOR WHO",
    title: "Creators, students, freelancers",
    body: "Agar aap online kaam karte ho, yaha aapko small tools milenge jo kaam fast kar dete hain.",
    badge: "Practical picks",
    accent: "#60a5fa",
    variant: "grid",
    points: ["Creators", "Students", "Teams", "Freelancers"]
  },
  {
    kicker: "WHY FOLLOW",
    title: "One tool. One problem. One clear demo.",
    body: "Scroll karne layak noise nahi. Sirf useful tools jo save, share, aur try karne layak ho.",
    badge: "Daily value",
    accent: "#fb7185",
    variant: "proof"
  },
  {
    kicker: "START HERE",
    title: "Follow @altftools_review",
    body: "Next reel me ek useful AltFTool ka real demo aayega. Try tools at altftool.com",
    badge: "Comment TOOL",
    accent: "#22d3ee",
    variant: "cta"
  }
];

function safeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderVariant(slide) {
  if (slide.variant === "list") {
    return `
      <div class="point-stack">
        ${slide.points.map((point, index) => `
          <div class="point">
            <span>${String(index + 1).padStart(2, "0")}</span>
            <strong>${safeHtml(point)}</strong>
          </div>
        `).join("")}
      </div>
    `;
  }

  if (slide.variant === "browser") {
    return `
      <div class="browser-card">
        <div class="browser-top"><span></span><span></span><span></span><em>altftool.com</em></div>
        <div class="browser-body">
          <div class="demo-line wide"></div>
          <div class="demo-line"></div>
          <div class="demo-row">
            <div></div>
            <div></div>
          </div>
          <div class="demo-button">ACTUAL DEMO</div>
        </div>
      </div>
    `;
  }

  if (slide.variant === "grid") {
    return `
      <div class="audience-grid">
        ${slide.points.map((point) => `<div>${safeHtml(point)}</div>`).join("")}
      </div>
    `;
  }

  if (slide.variant === "proof") {
    return `
      <div class="proof-card">
        <div><span>Problem</span><strong>Manual searching</strong></div>
        <div><span>After</span><strong>Clear tool demo</strong></div>
      </div>
    `;
  }

  if (slide.variant === "cta") {
    return `
      <div class="cta-box">
        <strong>altftool.com</strong>
        <span>Real demos start now</span>
      </div>
    `;
  }

  return `
    <div class="hero-orbit">
      <div class="orbit one">AI</div>
      <div class="orbit two">TOOLS</div>
      <div class="orbit three">DEMO</div>
    </div>
  `;
}

function slideHtml(slide, index, logoDataUrl) {
  const slideNumber = `${index + 1}/${slides.length}`;
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
            font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            background: #020617;
          }
          .slide {
            position: relative;
            width: 1080px;
            height: 1080px;
            padding: 58px;
            overflow: hidden;
            color: #fff;
            background:
              radial-gradient(circle at 88% 14%, ${slide.accent}44 0, transparent 270px),
              radial-gradient(circle at 10% 90%, #ffffff1f 0, transparent 260px),
              linear-gradient(145deg, #020617 0%, #08111f 58%, #0f172a 100%);
          }
          .slide::before {
            content: "";
            position: absolute;
            inset: 18px;
            border: 2px solid rgba(255,255,255,0.12);
            pointer-events: none;
          }
          .topbar {
            position: relative;
            z-index: 2;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .brand {
            display: flex;
            align-items: center;
            gap: 18px;
            min-width: 0;
          }
          .brand img {
            width: 72px;
            height: 72px;
            object-fit: contain;
          }
          .brand span {
            font-size: 28px;
            font-weight: 850;
            letter-spacing: 0;
            white-space: nowrap;
          }
          .counter {
            padding: 12px 18px;
            border-radius: 999px;
            background: rgba(255,255,255,0.1);
            color: rgba(255,255,255,0.82);
            font-size: 22px;
            font-weight: 800;
          }
          .content {
            position: relative;
            z-index: 2;
            margin-top: 92px;
            max-width: 895px;
          }
          .kicker {
            display: inline-flex;
            padding: 14px 20px;
            border-radius: 999px;
            background: ${slide.accent};
            color: #06111e;
            font-size: 25px;
            line-height: 1;
            font-weight: 950;
          }
          h1 {
            margin: 30px 0 0;
            max-width: 900px;
            font-size: ${slide.title.length > 34 ? 74 : 88}px;
            line-height: 0.96;
            letter-spacing: 0;
            font-weight: 950;
            text-wrap: balance;
          }
          p {
            margin: 32px 0 0;
            max-width: 790px;
            color: rgba(255,255,255,0.78);
            font-size: 35px;
            line-height: 1.18;
            font-weight: 650;
            text-wrap: balance;
          }
          .visual {
            position: absolute;
            left: 58px;
            right: 58px;
            bottom: 135px;
            height: 280px;
            z-index: 2;
          }
          .badge {
            position: absolute;
            left: 58px;
            bottom: 58px;
            z-index: 3;
            display: inline-flex;
            align-items: center;
            gap: 14px;
            padding: 18px 24px;
            border-radius: 999px;
            background: rgba(255,255,255,0.94);
            color: #06111e;
            font-size: 27px;
            font-weight: 920;
            box-shadow: 0 20px 60px rgba(0,0,0,0.28);
          }
          .badge::before {
            content: "";
            width: 14px;
            height: 14px;
            border-radius: 999px;
            background: ${slide.accent};
          }
          .handle {
            position: absolute;
            right: 58px;
            bottom: 70px;
            z-index: 3;
            color: rgba(255,255,255,0.76);
            font-size: 24px;
            font-weight: 760;
          }
          .hero-orbit {
            position: absolute;
            inset: 0;
          }
          .orbit {
            position: absolute;
            display: grid;
            place-items: center;
            border-radius: 999px;
            background: rgba(255,255,255,0.1);
            border: 2px solid rgba(255,255,255,0.18);
            color: #fff;
            font-weight: 950;
          }
          .one { right: 80px; top: 8px; width: 135px; height: 135px; color: ${slide.accent}; }
          .two { right: 245px; top: 92px; width: 190px; height: 190px; }
          .three { right: 36px; top: 175px; width: 150px; height: 150px; }
          .point-stack {
            display: grid;
            gap: 18px;
          }
          .point {
            display: flex;
            align-items: center;
            gap: 18px;
            padding: 24px 26px;
            border-radius: 22px;
            background: rgba(255,255,255,0.1);
            border: 2px solid rgba(255,255,255,0.14);
          }
          .point span {
            color: ${slide.accent};
            font-size: 25px;
            font-weight: 950;
          }
          .point strong {
            font-size: 36px;
            line-height: 1;
          }
          .browser-card {
            height: 270px;
            border-radius: 28px;
            overflow: hidden;
            background: #f8fafc;
            box-shadow: 0 30px 90px rgba(0,0,0,0.34);
          }
          .browser-top {
            height: 58px;
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 0 22px;
            background: #e2e8f0;
            color: #334155;
            font-size: 18px;
            font-weight: 750;
          }
          .browser-top span {
            width: 15px;
            height: 15px;
            border-radius: 999px;
            background: #94a3b8;
          }
          .browser-top em {
            margin-left: auto;
            font-style: normal;
          }
          .browser-body {
            padding: 28px;
          }
          .demo-line {
            height: 28px;
            width: 62%;
            border-radius: 999px;
            background: #cbd5e1;
            margin-bottom: 18px;
          }
          .demo-line.wide { width: 82%; background: ${slide.accent}; }
          .demo-row { display: flex; gap: 16px; margin-top: 20px; }
          .demo-row div {
            flex: 1;
            height: 72px;
            border-radius: 18px;
            background: #e2e8f0;
          }
          .demo-button {
            position: absolute;
            right: 36px;
            bottom: 34px;
            padding: 15px 20px;
            border-radius: 999px;
            background: #020617;
            color: ${slide.accent};
            font-size: 20px;
            font-weight: 950;
          }
          .audience-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 18px;
          }
          .audience-grid div {
            padding: 34px 24px;
            border-radius: 26px;
            background: rgba(255,255,255,0.11);
            border: 2px solid rgba(255,255,255,0.16);
            color: #fff;
            font-size: 32px;
            font-weight: 900;
            text-align: center;
          }
          .proof-card {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
          }
          .proof-card div {
            min-height: 200px;
            padding: 26px;
            border-radius: 28px;
            background: rgba(255,255,255,0.1);
            border: 2px solid rgba(255,255,255,0.16);
          }
          .proof-card span {
            display: block;
            color: ${slide.accent};
            font-size: 24px;
            font-weight: 950;
          }
          .proof-card strong {
            display: block;
            margin-top: 20px;
            font-size: 39px;
            line-height: 1.02;
          }
          .cta-box {
            height: 230px;
            padding: 34px;
            border-radius: 30px;
            background: rgba(255,255,255,0.94);
            color: #06111e;
            display: flex;
            flex-direction: column;
            justify-content: center;
            box-shadow: 0 30px 90px rgba(0,0,0,0.34);
          }
          .cta-box strong {
            font-size: 58px;
            line-height: 1;
          }
          .cta-box span {
            margin-top: 20px;
            color: #475569;
            font-size: 30px;
            font-weight: 720;
          }
        </style>
      </head>
      <body>
        <main class="slide">
          <div class="topbar">
            <div class="brand">
              <img src="${logoDataUrl}" alt="AltF" />
              <span>AltF Tools Review</span>
            </div>
            <div class="counter">${slideNumber}</div>
          </div>
          <section class="content">
            <div class="kicker">${safeHtml(slide.kicker)}</div>
            <h1>${safeHtml(slide.title)}</h1>
            <p>${safeHtml(slide.body)}</p>
          </section>
          <section class="visual">
            ${renderVariant(slide)}
          </section>
          <div class="badge">${safeHtml(slide.badge)}</div>
          <div class="handle">@altftools_review</div>
        </main>
      </body>
    </html>
  `;
}

async function main() {
  await fs.mkdir(slidesDir, { recursive: true });
  const logoBase64 = await fs.readFile(logoPath, "base64");
  const logoDataUrl = `data:image/png;base64,${logoBase64}`;

  const executablePath = await findBrowserExecutable();
  const browser = await chromium.launch({
    headless: true,
    ...(executablePath ? { executablePath } : {})
  });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1080 }, deviceScaleFactor: 1 });

  for (let index = 0; index < slides.length; index += 1) {
    await page.setContent(slideHtml(slides[index], index, logoDataUrl), { waitUntil: "networkidle" });
    await page.screenshot({
      path: path.join(slidesDir, `slide-${String(index + 1).padStart(2, "0")}.png`),
      type: "png"
    });
  }

  await browser.close();

  const caption = `Welcome to @altftools_review.\n\nYaha daily useful AltFTool micro tools ke real demos milenge: no fake UI, no extra confusion, bas practical workflow aur clear result.\n\nFollow karo, save karo, aur comment TOOL agar next review me aap kisi specific tool ka demo chahte ho.\n\nTry tools: https://www.altftool.com/\n\n#altftool #altftools_review #aitools #freetools #productivitytools #webtools #toolreview #digitaltools #smartwork #creatortools #usefultools`;
  await fs.writeFile(path.join(outputDir, "caption.txt"), caption);
  await fs.writeFile(
    path.join(outputDir, "README.md"),
    [
      "# AltF Tools Review First Carousel",
      "",
      "Upload the PNG files from `slides/` to Instagram in order.",
      "",
      "Recommended order:",
      ...slides.map((slide, index) => `- slide-${String(index + 1).padStart(2, "0")}.png: ${slide.title}`),
      "",
      "Use `caption.txt` as the Instagram caption."
    ].join("\n")
  );

  console.log(`Generated ${slides.length} carousel slides`);
  console.log(slidesDir);
  console.log(path.join(outputDir, "caption.txt"));
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
      // Try the next local browser before asking Playwright to download one.
    }
  }

  return "";
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
