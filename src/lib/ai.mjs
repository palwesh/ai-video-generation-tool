import { buildOpenAiRequest } from "./prompt-builder.mjs";

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

export async function generateScenePlanWithAi(row, captureSummary, config) {
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

  const outputText = extractOutputText(responseJson);

  if (!outputText) {
    throw new Error("OpenAI response did not contain output text.");
  }

  return JSON.parse(outputText);
}
