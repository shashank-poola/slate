import { env } from "../config/env.config";
import { buildAnalyzeMessages } from "../prompt/analyze.prompt";
import type { AnalyzeRequest } from "../types/analyze.type";

export const analyzeWithGlm = async (request: AnalyzeRequest): Promise<unknown> => {
  if (!env.GLM_API_KEY) {
    throw new Error("GLM_API_KEY is not configured");
  }

  const response = await fetch(`${env.GLM_BASE_URL.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.GLM_API_KEY}`,
    },
    body: JSON.stringify({
      model: env.GLM_MODEL,
      messages: buildAnalyzeMessages(request),
      temperature: 0,
      max_tokens: 4096,
      response_format: { type: "json_object" },
      thinking: { type: "enabled" },
      reasoning_effort: "low",
      stream: false,
    }),
    signal: AbortSignal.timeout(env.GLM_TIMEOUT_MS),
  });

  const responseText = await response.text();
  let payload: unknown;

  try {
    payload = JSON.parse(responseText);
  } catch {
    throw new Error(`GLM request failed with status ${response.status}`);
  }

  if (!response.ok) {
    throw new Error(`GLM request failed with status ${response.status}`);
  }

  if (
    typeof payload !== "object" ||
    payload === null ||
    !("choices" in payload) ||
    !Array.isArray(payload.choices) ||
    !payload.choices[0] ||
    typeof payload.choices[0] !== "object" ||
    !("message" in payload.choices[0]) ||
    typeof payload.choices[0].message !== "object" ||
    payload.choices[0].message === null ||
    !("content" in payload.choices[0].message) ||
    typeof payload.choices[0].message.content !== "string"
  ) {
    throw new Error("GLM response did not match the expected completion shape");
  }

  const content = payload.choices[0].message.content.trim();
  if (!content) {
    throw new Error("GLM response did not contain structured content");
  }

  try {
    return JSON.parse(content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim());
  } catch {
    throw new Error("GLM returned malformed JSON");
  }
};
