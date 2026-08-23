import { describe, expect, test } from "bun:test";
import { env } from "../src/config/env.config";
import { analyzeWithGlm } from "../src/llm/glm";
import type { AnalyzeRequest, GlmAnalysis } from "../src/types/analyze.type";
import { validateAnalysis } from "../src/utils/analyze.utils";

const request: AnalyzeRequest = {
  authors: [
    { id: "shashank", name: "Shashank" },
    { id: "rahul", name: "Rahul" },
    { id: "mei", name: "Mei" },
  ],
  contributions: "Shashank designed the study and built the software. Rahul cleaned the dataset. Mei helped with the research.",
  funding: "XYZ Foundation funded the work.",
  conflicts: "",
};

const analysis = (contributions: GlmAnalysis["contributions"]): GlmAnalysis => ({
  contributions,
  funding: { status: "reported", funder: "XYZ Foundation", evidence: "XYZ Foundation funded the work." },
  conflicts: { status: "unknown", items: [] },
});

describe("Declare analysis validation", () => {
  test("keeps supported CRediT mappings", () => {
    const result = validateAnalysis(request, analysis([
      { authorId: "shashank", evidence: "designed the study", roleIds: ["conceptualization"], status: "proposed" },
      { authorId: "shashank", evidence: "built the software", roleIds: ["software"], status: "proposed" },
      { authorId: "rahul", evidence: "cleaned the dataset", roleIds: ["data_curation"], status: "proposed" },
    ]));

    expect(result.contributions.map((item) => item.roleIds)).toEqual([
      ["conceptualization"],
      ["software"],
      ["data_curation"],
    ]);
  });

  test("keeps vague input ambiguous", () => {
    const result = validateAnalysis(request, analysis([
      { authorId: "mei", evidence: "helped with the research", roleIds: [], status: "ambiguous" },
    ]));

    expect(result.contributions[0]).toMatchObject({ status: "ambiguous", roleIds: [] });
  });

  test("rejects invented authors, roles, and evidence", () => {
    const result = validateAnalysis(request, analysis([
      { authorId: "unknown", evidence: "built the software", roleIds: ["software"], status: "proposed" },
      { authorId: "shashank", evidence: "invented wording", roleIds: ["backend_development"], status: "proposed" },
    ]));

    expect(result.contributions).toEqual([
      { authorId: "shashank", evidence: "invented wording", roleIds: [], status: "ambiguous" },
    ]);
    expect(result.issues.map((issue) => issue.type)).toContain("UNKNOWN_AUTHOR");
    expect(result.issues.map((issue) => issue.type)).toContain("INVALID_CREDIT_ROLE");
    expect(result.issues.map((issue) => issue.type)).toContain("MISSING_EVIDENCE");
  });

  test("does not turn funder text into funding acquisition", () => {
    const result = validateAnalysis(request, analysis([
      { authorId: "shashank", evidence: "XYZ Foundation funded the work", roleIds: ["funding_acquisition"], status: "proposed" },
    ]));

    expect(result.contributions[0]).toMatchObject({ status: "ambiguous", roleIds: [] });
    expect(result.issues.some((issue) => issue.roleId === "funding_acquisition")).toBe(true);
  });

  test("turns empty COI input into unknown", () => {
    const result = validateAnalysis(request, analysis([
      { authorId: "shashank", evidence: "built the software", roleIds: ["software"], status: "proposed" },
    ]));

    expect(result.conflicts).toEqual({ status: "unknown", items: [] });
  });
});

test("GLM request is mocked and returns JSON only", async () => {
  const originalFetch = globalThis.fetch;
  const originalApiKey = env.GLM_API_KEY;
  env.GLM_API_KEY = "test-key";

  globalThis.fetch = (async (url, init) => {
    expect(String(url)).toContain("/chat/completions");
    expect(JSON.parse(String(init?.body))).toMatchObject({ model: "glm-5.3", response_format: { type: "json_object" } });
    return new Response(JSON.stringify({
      choices: [{ message: { content: JSON.stringify(analysis([
        { authorId: "shashank", evidence: "built the software", roleIds: ["software"], status: "proposed" },
      ])) } }],
    }));
  }) as typeof fetch;

  try {
    expect(await analyzeWithGlm(request)).toMatchObject({ contributions: [{ roleIds: ["software"] }] });
  } finally {
    globalThis.fetch = originalFetch;
    env.GLM_API_KEY = originalApiKey;
  }
});
