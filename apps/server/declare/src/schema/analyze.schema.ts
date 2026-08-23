import { z } from "zod";
import { authorSchema, idSchema } from "./common.schema";

export const analyzeRequestSchema = z.object({
  authors: z.array(authorSchema).min(1).max(100),
  contributions: z.string().trim().min(1).max(50_000),
  funding: z.string().trim().max(50_000).optional().default(""),
  conflicts: z.string().trim().max(50_000).optional().default(""),
});

export const glmAnalysisSchema = z.object({
  contributions: z.array(z.object({
    authorId: idSchema,
    evidence: z.string().trim().max(10_000).default(""),
    roleIds: z.array(idSchema).max(14).default([]),
    status: z.enum(["proposed", "ambiguous", "unsupported"]).default("ambiguous"),
  })).max(500).default([]),
  funding: z.object({
    status: z.enum(["reported", "none", "unknown"]).default("unknown"),
    funder: z.string().trim().max(500).optional(),
    awardNumber: z.string().trim().max(500).optional(),
    evidence: z.string().trim().max(10_000).default(""),
  }).default({ status: "unknown", evidence: "" }),
  conflicts: z.object({
    status: z.enum(["reported", "none", "unknown"]).default("unknown"),
    items: z.array(z.object({
      authorId: idSchema.optional(),
      disclosure: z.string().trim().max(2_000).optional(),
      evidence: z.string().trim().max(10_000).default(""),
    })).max(100).default([]),
  }).default({ status: "unknown", items: [] }),
});
