import type { Request, Response } from "express";
import { ZodError } from "zod";
import { statementsRequestSchema } from "../schema/statement.schema";
import { getStatementValidationIssues } from "../utils/review.utils";
import { buildStatements } from "../utils/statement.utils";

export const statements = async (req: Request, res: Response) => {
  try {
    const input = statementsRequestSchema.parse(req.body);
    const issues = getStatementValidationIssues(input);

    if (issues.length > 0) {
      return res.status(422).json({ success: false, message: null, error: "REVIEW_REQUIRED", issues });
    }

    return res.status(200).json({
      success: true,
      data: buildStatements(input),
      error: null,
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: null,
        error: "INVALID_STATEMENTS_REQUEST",
        issues: err.issues,
      });
    }

    console.error("Declare statements failed:", err);
    return res.status(500).json({ success: false, message: null, error: "STATEMENTS_RENDER_FAILED" });
  }
};
