import path from "node:path";
import { readWorkbookTable, normalizeWorkbookObjects } from "../src/lib/input.mjs";
import { writeSimpleXlsx } from "../src/lib/simple-xlsx-writer.mjs";
import { buildViralSeoData, viralBenefitLine } from "../src/lib/viral-script.mjs";

const inputPath = process.argv[2]
  ? path.resolve(process.argv[2])
  : "/Users/palsahu/Documents/Codex/excel/altf400.xlsx";
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const outputPath = process.argv[3]
  ? path.resolve(process.argv[3])
  : path.resolve("outputs", "script-improvements", `altf400-improved-scripts-${timestamp}.xlsx`);

function clean(value, fallback = "") {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text || fallback;
}

function limitWords(value, maxWords = 24) {
  const words = clean(value).split(" ").filter(Boolean);
  if (words.length <= maxWords) {
    return words.join(" ");
  }
  return `${words.slice(0, maxWords).join(" ").replace(/[,;:]+$/g, "")}.`;
}

function shortPhrase(value, fallback = "tool", maxWords = 7, maxChars = 72) {
  const text = clean(value, fallback)
    .replace(/[|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= maxChars && text.split(/\s+/).length <= maxWords) {
    return text;
  }
  return text
    .split(/\s+/)
    .slice(0, maxWords)
    .join(" ")
    .slice(0, maxChars)
    .replace(/\s+\S*$/, "")
    .trim() || fallback;
}

function hashText(value) {
  return clean(value).split("").reduce((total, char) => (
    ((total << 5) - total + char.charCodeAt(0)) >>> 0
  ), 0);
}

function toolLabel(row) {
  return shortPhrase(row.tool_name || row.topic, "ye tool", 8, 72);
}

function detectSignals(row) {
  const text = clean(`${row.tool_name} ${row.category} ${row.description} ${row.main_benefit}`).toLowerCase();
  return {
    privacy: /pii|privacy|redact|mask|blur|sensitive|secret|email|phone|id|otp|safe sharing/.test(text),
    checker: /check|checker|audit|review|validator|validate|scan|warning|risk|proof|detect/.test(text),
    converter: /convert|formatter|format|clean|extract|parser|compress|resize|merge|split/.test(text),
    calculator: /calculator|calculate|salary|tax|gst|invoice|emi|sip|budget|rate|estimate|cost/.test(text),
    generator: /generator|generate|builder|creator|maker|write|draft|caption|prompt/.test(text),
    content: /reel|caption|seo|content|video|post|social|instagram|youtube|creator/.test(text)
  };
}

function audienceLine(row, signals) {
  const explicit = clean(row.target_user);
  if (explicit) {
    return shortPhrase(explicit, explicit, 8, 84);
  }
  if (signals.privacy) {
    return "creators, HR, founders aur teams jo docs ya screenshots share karte hain";
  }
  if (signals.calculator) {
    return "founders, freelancers aur finance/HR teams";
  }
  if (signals.content) {
    return "creators, marketers aur small business owners";
  }
  if (signals.checker) {
    return "operators, founders aur teams jo quick review chahte hain";
  }
  return "creators, founders, freelancers aur small teams";
}

function actionLine(row, signals) {
  const name = toolLabel(row);
  if (signals.privacy) {
    return "demo text ya file add karo, sensitive details detect/mask karo";
  }
  if (signals.calculator) {
    return "sample numbers add karo, calculate/run click karo";
  }
  if (signals.checker) {
    return "input paste karo, check/review click karo";
  }
  if (signals.generator) {
    return "basic details add karo, generate/create click karo";
  }
  if (signals.converter) {
    return "raw input add karo, convert/format/process click karo";
  }
  return `${name} me demo input add karo, main action run karo`;
}

function resultLine(row, signals) {
  if (signals.privacy) {
    return "safe version, warning points aur review-ready output milta hai";
  }
  if (signals.calculator) {
    return "clear calculated result aur next decision point milta hai";
  }
  if (signals.checker) {
    return "summary, warnings aur next steps quickly samajh aate hain";
  }
  if (signals.generator) {
    return "usable draft/output milta hai jise review karke use kar sakte ho";
  }
  if (signals.converter) {
    return "messy input clean usable output me convert ho jata hai";
  }
  return "clean output milta hai jise final use se pehle review kar sakte ho";
}

function hookOptions(row, signals) {
  const name = toolLabel(row);
  const topic = shortPhrase(row.category || row.topic || row.tool_name, "daily workflow", 5, 50).toLowerCase();
  const action = actionLine(row, signals).replace(/\.$/, "");
  const result = resultLine(row, signals).replace(/\.$/, "");
  const hooks = [
    `Stop scrolling. Agar ${topic} manually kar rahe ho, ${name} ka real demo dekh lo.`,
    `Ye chhoti mistake avoid karni hai? ${name} me ${action}, phir output review karo.`,
    `Save this. ${name} tab kaam aayega jab ${topic} fast aur clean chahiye.`,
    `Most people ${topic} me ye step skip kar dete hain. ${name} ka result dekho.`,
    `Mujhe laga ye kaam manual hi rahega. Phir ${name}: input, run, review.`,
    `${name} boring task ko simple bana deta hai. Real page par 40-second workflow dekho.`,
    `Agar output share karne se pehle doubt hota hai, ${name} ka ye flow save kar lo.`
  ];
  if (signals.privacy) {
    hooks.unshift(`AI, email ya document me private data share karne se pehle ${name} ka ye demo dekh lo.`);
  }
  if (signals.calculator) {
    hooks.unshift(`Wrong number share karne se pehle ${name} se calculation quickly verify kar lo.`);
  }
  return hooks;
}

function buildImprovedScript(row) {
  const signals = detectSignals(row);
  const name = toolLabel(row);
  const url = clean(row.tool_url, "https://www.altftool.com/");
  const description = clean(row.description, `${name} ek focused AltFTool micro tool hai.`);
  const audience = audienceLine(row, signals);
  const action = actionLine(row, signals);
  const result = resultLine(row, signals);
  const benefit = shortPhrase(row.main_benefit || viralBenefitLine(row) || description, description, 10, 96);
  const hookPool = hookOptions(row, signals);
  const hook = limitWords(hookPool[Math.abs(hashText(name)) % hookPool.length], 22);
  const scene1 = hook;
  const scene2 = limitWords(`${name} ka use simple hai: ${description} Ye ${audience} ke liye useful hai jab kaam fast, clean aur review-ready chahiye.`, 24);
  const scene3 = limitWords(`Real demo me AltFTool par link open karo: ${url}. ${action}, aur screen par jo result aata hai use clearly review karo.`, 24);
  const scene4 = limitWords(`Best part: ${result}. Try ${name} on AltFTool, link caption me hai. Save karo aur comment TOOL for next demo.`, 24);
  const body = `${scene2} ${scene3}`;
  const cta = scene4;
  const sceneBreakdown = [
    `Scene 1 (0-10s): ${scene1}`,
    `Scene 2 (10-20s): ${scene2}`,
    `Scene 3 (20-30s): ${scene3}`,
    `Scene 4 (30-40s): ${scene4}`
  ].join("\n");
  const fullScript = [
    `Hook (0-5s): "${scene1}"`,
    `Body (5-30s): "${body}"`,
    `CTA (30-40s): "${cta}"`,
    "",
    "Scene Breakdown:",
    sceneBreakdown
  ].join("\n");
  const onscreen = [
    "Stop. Watch this.",
    `${name} in action`,
    "Open -> input -> run",
    "Review then use"
  ].join(" | ");
  const seo = buildViralSeoData({
    ...row,
    language: "Hinglish",
    script_language: "Hinglish",
    main_benefit: benefit
  }, { scenes: [
    { scene_number: 1, onscreen_text: "Stop. Watch this." },
    { scene_number: 2, onscreen_text: `${name} in action` },
    { scene_number: 3, onscreen_text: "Open -> input -> run" },
    { scene_number: 4, onscreen_text: "Review then use" }
  ] });
  const caption = [
    `${name} ka real demo.`,
    `${description}`,
    `Workflow: open link -> ${action} -> result review.`,
    "Fictional/demo data se test karo, final use se pehle human review rakho.",
    `Try on AltFTool: ${url}`,
    "Save this reel and comment TOOL for next micro-tool demo."
  ].join(" ");
  const hashtags = [...new Set([
    "#AltFTool",
    "#AITools",
    "#ProductivityHacks",
    "#ToolDemo",
    "#MicroTools",
    "#WorkflowHack",
    "#HinglishReels",
    "#ReelsIndia",
    "#SaveThis",
    "#OnlineTools",
    ...(seo.hashtags || [])
  ])].slice(0, 15).join(" ");
  const videoPrompt = [
    `Create a 40-second 9:16 vertical Instagram Reel for ${name}.`,
    "Scene 1 full-screen human avatar hook, no slow greeting.",
    `Scene 2 show what the tool does: ${description}`,
    `Scene 3 show actual AltFTool URL ${url}, cursor highlights, fictional input, and visible action.`,
    `Scene 4 show result/review plus CTA: try AltFTool, link in caption, save and comment TOOL.`,
    "Use real screenshots/screen recording when available, no fake UI, no real personal data, bold word-by-word captions after hook."
  ].join(" ");

  return {
    language: "Hinglish",
    duration: 40,
    hook,
    body,
    cta,
    sceneBreakdown,
    fullScript,
    onscreen,
    caption,
    hashtags,
    videoPrompt,
    toolUseFlow: `Open ${url} -> ${action} -> review ${result}`,
    improvementNotes: "Rebuilt from the same row tool name, link, category, and description. 40-second human Hinglish script with hook, real demo body, and AltFTool CTA."
  };
}

const table = await readWorkbookTable(inputPath);
const normalizedRows = normalizeWorkbookObjects(table.objects, {
  toolBaseUrl: "https://www.altftool.com/"
});
const rowBySource = new Map(normalizedRows.map((row) => [Number(row.source_row_number), row]));
const sourceHeaders = Object.keys(table.objects[0] || {});
const addedHeaders = [
  "Improved Script Type",
  "Improved Duration Seconds",
  "Improved Hook",
  "Improved Body",
  "Improved CTA",
  "Improved Scene Breakdown",
  "Improved Reel Script 30-50s",
  "Improved On Screen Text",
  "Improved Instagram Caption",
  "Improved Hashtags",
  "Improved AI Video Prompt",
  "Improved Tool Use Flow",
  "Improvement Notes"
];

const rows = [
  [...sourceHeaders, ...addedHeaders]
];

for (const [index, objectRow] of table.objects.entries()) {
  const sourceRow = index + 2;
  const normalized = rowBySource.get(sourceRow);
  const originalValues = sourceHeaders.map((header) => objectRow[header] ?? "");
  if (!normalized) {
    rows.push([...originalValues, ...addedHeaders.map(() => "")]);
    continue;
  }
  const improved = buildImprovedScript(normalized);
  rows.push([
    ...originalValues,
    improved.language,
    improved.duration,
    improved.hook,
    improved.body,
    improved.cta,
    improved.sceneBreakdown,
    improved.fullScript,
    improved.onscreen,
    improved.caption,
    improved.hashtags,
    improved.videoPrompt,
    improved.toolUseFlow,
    improved.improvementNotes
  ]);
}

await writeSimpleXlsx(outputPath, rows, "Improved Scripts");
console.log(JSON.stringify({
  ok: true,
  inputPath,
  outputPath,
  originalRows: table.dataRows.length,
  improvedRows: rows.length - 1,
  addedColumns: addedHeaders.length,
  sample: rows.slice(1, 4).map((row) => ({
    tool: row[sourceHeaders.indexOf("Idea Name")],
    hook: row[sourceHeaders.length + 2],
    duration: row[sourceHeaders.length + 1]
  }))
}, null, 2));
