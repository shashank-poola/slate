import { z } from "zod";
import { idSchema } from "./common.schema";
import { statementsRequestSchema } from "./statement.schema";

const sessionIdSchema = idSchema.regex(/^[A-Za-z0-9_.-]+$/);

export const superdocsApplySchema = z.object({
  sessionId: sessionIdSchema,
  facts: statementsRequestSchema,
  documentHtml: z.string().trim().min(1).max(50_000_000).optional(),
  approvalMode: z.enum(["approve_all", "ask_every_time"]).default("ask_every_time"),
});

export const superdocsUploadSchema = z.object({
  sessionId: sessionIdSchema,
  filename: z.string().trim().min(1).max(512),
  fileBase64: z.string().min(1).max(28_000_000),
  returnHtml: z.boolean().default(true),
});

export const superdocsApproveSchema = z.object({
  sessionId: sessionIdSchema,
  jobId: idSchema,
  approved: z.boolean(),
  feedback: z.string().trim().max(2_000).optional(),
  changes: z.array(z.object({
    changeId: idSchema,
    approved: z.boolean(),
    feedback: z.string().trim().max(2_000).optional(),
  })).max(100).optional(),
});

export const superdocsExportSchema = z.object({
  sessionId: sessionIdSchema.optional(),
  documentHtml: z.string().trim().min(1).max(50_000_000).optional(),
  format: z.enum(["doc", "docx", "pdf", "html", "markdown", "txt"]).default("docx"),
  filename: z.string().trim().min(1).max(255).optional(),
}).refine((value) => Boolean(value.sessionId || value.documentHtml), {
  message: "Provide sessionId or documentHtml.",
});
