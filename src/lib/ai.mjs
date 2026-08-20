import { buildGeminiRequest, buildOpenAiRequest } from "./prompt-builder.mjs";

function extractOutputText(responseJson) {
  if (typeof responseJson.output_text === "string") {
    return responseJson.output_text;
  }

  const chunks = [];

  for (const item of responseJson.output || []) {
    for (const content of item.content || []) {
      if (typeof content.text === "string") {
        chunks.push(content.text);
      }
    }
  }

  return chunks.join("\n").trim();
}

function extractGeminiText(responseJson) {
  const chunks = [];
  for (const candidate of responseJson.candidates || []) {
    for (const part of candidate.content?.parts || []) {
      if (typeof part.text === "string") {
        chunks.push(part.text);
      }
    }
  }
  return chunks.join("\n").trim();
}

function parseJsonText(text, label) {
  const cleaned = String(text || "")
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  if (!cleaned) {
    throw new Error(`${label} response did not contain output text.`);
  }
  return JSON.parse(cleaned);
}

async function generateScenePlanWithOpenAi(row, captureSummary, config) {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(buildOpenAiRequest(row, captureSummary, config))
  });

  const responseJson = await response.json();

  if (!response.ok) {
    const message = responseJson?.error?.message || response.statusText;
    throw new Error(`OpenAI request failed: ${message}`);
  }

  return parseJsonText(extractOutputText(responseJson), "OpenAI");
}

async function generateScenePlanWithGemini(row, captureSummary, config) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return null;
  }

  const model = process.env.GEMINI_MODEL || config.geminiModel || config.aiModel || "gemini-2.5-pro";
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(buildGeminiRequest(row, captureSummary, config))
  });

  const responseJson = await response.json();

  if (!response.ok) {
    const message = responseJson?.error?.message || response.statusText;
    throw new Error(`Gemini request failed: ${message}`);
  }

  return parseJsonText(extractGeminiText(responseJson), "Gemini");
}

export async function generateScenePlanWithAi(row, captureSummary, config) {
  const provider = String(process.env.TRF_AI_PROVIDER || config.aiProvider || "openai").trim().toLowerCase();
  if (provider === "gemini" || provider === "google") {
    return await generateScenePlanWithGemini(row, captureSummary, config);
  }
  return await generateScenePlanWithOpenAi(row, captureSummary, config);
}
