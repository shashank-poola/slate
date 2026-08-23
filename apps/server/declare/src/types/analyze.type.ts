import type { z } from "zod";
import type { analyzeRequestSchema, glmAnalysisSchema } from "../schema/analyze.schema";

export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>;
export type GlmAnalysis = z.infer<typeof glmAnalysisSchema>;

export type AnalyzeIssue = {
  type:
    | "UNKNOWN_AUTHOR"
    | "INVALID_CREDIT_ROLE"
    | "MISSING_EVIDENCE"
    | "AMBIGUOUS_CONTRIBUTION"
    | "UNSUPPORTED_CONTRIBUTION"
    | "INVALID_FUNDING"
    | "INVALID_CONFLICT";
  message: string;
  authorId?: string;
  roleId?: string;
};

export type AnalyzeResult = {
  contributions: Array<{
    authorId: string;
    evidence: string;
    roleIds: string[];
    status: "proposed" | "ambiguous" | "unsupported";
  }>;
  funding: GlmAnalysis["funding"];
  conflicts: {
    status: "reported" | "none" | "unknown";
    items: Array<{
      status: "reported" | "none" | "unknown";
      authorId?: string;
      disclosure?: string;
      evidence: string;
    }>;
  };
  issues: AnalyzeIssue[];
};
