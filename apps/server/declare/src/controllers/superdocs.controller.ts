import type { Request, Response } from "express";
import { ZodError } from "zod";
import {
  superdocsApplySchema,
  superdocsApproveSchema,
  superdocsExportSchema,
  superdocsUploadSchema,
} from "../schema/superdocs.schema";
import {
  approveSuperdocsChanges,
  exportSuperdocsDocument,
  getSuperdocsJob,
  startSuperdocsApply,
  uploadSuperdocsDocument,
} from "../utils/superdocs.utils";
import { getStatementValidationIssues } from "../utils/statement.utils";

export const apply = async (req: Request, res: Response) => {
  try {
    const input = superdocsApplySchema.parse(req.body);
    const issues = getStatementValidationIssues(input.facts);

    if (issues.length > 0) {
      return res.status(422).json({
        success: false,
        message: null,
        error: "REVIEW_REQUIRED",
        issues,
      });
    }

    const job = await startSuperdocsApply(input);

    return res.status(200).json({
      success: true,
      data: job,
      error: null,
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: null,
        error: "INVALID_SUPERDOCS_REQUEST",
        issues: err.issues,
      });
    }

    if (err instanceof Error && err.message === "SUPERDOCS_API_KEY is not configured") {
      return res.status(503).json({
        success: false,
        message: null,
        error: "SUPERDOCS_NOT_CONFIGURED",
      });
    }

    console.error("SuperDocs apply failed:", err);

    return res.status(502).json({
      success: false,
      message: null,
      error: "SUPERDOCS_APPLY_FAILED",
    });
  }
};

export const getJob = async (req: Request, res: Response) => {
  try {
    const jobId = typeof req.params.jobId === "string" ? req.params.jobId : req.params.jobId?.[0];
    if (!jobId) {
      return res.status(400).json({
        success: false,
        message: null,
        error: "MISSING_JOB_ID",
      });
    }

    const job = await getSuperdocsJob(jobId);

    return res.status(200).json({
      success: true,
      data: job,
      error: null,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "SUPERDOCS_API_KEY is not configured") {
      return res.status(503).json({
        success: false,
        message: null,
        error: "SUPERDOCS_NOT_CONFIGURED",
      });
    }

    console.error("SuperDocs job lookup failed:", err);

    return res.status(502).json({
      success: false,
      message: null,
      error: "SUPERDOCS_JOB_LOOKUP_FAILED",
    });
  }
};

export const approve = async (req: Request, res: Response) => {
  try {
    const input = superdocsApproveSchema.parse(req.body);
    const result = await approveSuperdocsChanges(input);

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
        error: "INVALID_SUPERDOCS_REQUEST",
        issues: err.issues,
      });
    }

    if (err instanceof Error && err.message === "SUPERDOCS_API_KEY is not configured") {
      return res.status(503).json({
        success: false,
        message: null,
        error: "SUPERDOCS_NOT_CONFIGURED",
      });
    }

    console.error("SuperDocs approve failed:", err);

    return res.status(502).json({
      success: false,
      message: null,
      error: "SUPERDOCS_APPROVE_FAILED",
    });
  }
};

export const upload = async (req: Request, res: Response) => {
  try {
    const input = superdocsUploadSchema.parse(req.body);
    const result = await uploadSuperdocsDocument(input);

    return res.status(200).json({ success: true, data: result, error: null });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: null,
        error: "INVALID_SUPERDOCS_REQUEST",
        issues: err.issues,
      });
    }

    if (err instanceof Error && err.message === "SUPERDOCS_API_KEY is not configured") {
      return res.status(503).json({ success: false, message: null, error: "SUPERDOCS_NOT_CONFIGURED" });
    }

    console.error("SuperDocs upload failed:", err);
    return res.status(502).json({ success: false, message: null, error: "SUPERDOCS_UPLOAD_FAILED" });
  }
};

export const exportDocument = async (req: Request, res: Response) => {
  try {
    const input = superdocsExportSchema.parse(req.body);
    const result = await exportSuperdocsDocument(input);

    if (Buffer.isBuffer(result.data)) {
      res.setHeader("Content-Type", result.contentType || "application/octet-stream");
      return res.status(200).send(result.data);
    }

    return res.status(200).json({ success: true, data: result.data, error: null });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: null,
        error: "INVALID_SUPERDOCS_REQUEST",
        issues: err.issues,
      });
    }

    if (err instanceof Error && err.message === "SUPERDOCS_API_KEY is not configured") {
      return res.status(503).json({
        success: false,
        message: null,
        error: "SUPERDOCS_NOT_CONFIGURED",
      });
    }

    console.error("SuperDocs export failed:", err);

    return res.status(502).json({
      success: false,
      message: null,
      error: "SUPERDOCS_EXPORT_FAILED",
    });
  }
};
