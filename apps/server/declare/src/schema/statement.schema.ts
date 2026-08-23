import { z } from "zod";
import { authorSchema, idSchema } from "./common.schema";

export const statementsRequestSchema = z.object({
  authors: z.array(authorSchema).min(1).max(100),
  contributions: z.array(z.object({
    authorId: idSchema,
    evidence: z.string().trim().max(10_000),
    roleIds: z.array(idSchema).max(14),
    status: z.enum(["approved", "ambiguous"]).default("approved"),
  })).max(500),
  funding: z.object({
    status: z.enum(["reported", "none", "unknown"]),
    funder: z.string().trim().max(500).optional(),
    awardNumber: z.string().trim().max(500).optional(),
    evidence: z.string().trim().max(10_000).default(""),
  }),
  conflicts: z.object({
    status: z.enum(["reported", "none", "unknown"]),
    items: z.array(z.object({
      authorId: idSchema.optional(),
      disclosure: z.string().trim().max(2_000).optional(),
      evidence: z.string().trim().max(10_000).default(""),
    })).max(100).default([]),
  }),
});
