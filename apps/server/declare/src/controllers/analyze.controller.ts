import type { Request, Response } from "express";
import { ZodError } from "zod";
import { analyzeWithGlm } from "../llm/glm";
import { analyzeRequestSchema, glmAnalysisSchema } from "../schema/analyze.schema";
import { validateAnalysis } from "../utils/analyze.utils";

export const analyze = async (req: Request, res: Response) => {
  try {
    const input = analyzeRequestSchema.parse(req.body);
    const glmResult = glmAnalysisSchema.parse(await analyzeWithGlm(input));
    const result = validateAnalysis(input, glmResult);

    return res.status(200).json({
      success: true,
      data: result,
      error: null,
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: null,
        error: "INVALID_ANALYZE_REQUEST_OR_GLM_RESPONSE",
        issues: err.issues,
      });
    }

    if (err instanceof Error && err.message === "GLM_API_KEY is not configured") {
      return res.status(503).json({ success: false, message: null, error: "GLM_PROVIDER_NOT_CONFIGURED" });
    }

    console.error("Declare analysis failed:", err);
    return res.status(502).json({ success: false, message: null, error: "DECLARE_ANALYSIS_FAILED" });
  }
};
