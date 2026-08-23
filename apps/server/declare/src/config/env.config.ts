import dotenv from "dotenv";
import path from "path";
import { z } from "zod";

dotenv.config({ path: path.resolve(process.cwd(), ".env"), quiet: true });
dotenv.config({ path: path.resolve(process.cwd(), "../../../.env"), quiet: true });

const EnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(8000),
  GLM_API_KEY: z.string().min(1).optional(),
  GLM_BASE_URL: z.string().url().default("https://api.z.ai/api/paas/v4"),
  GLM_MODEL: z.string().min(1).default("glm-5.3"),
  GLM_TIMEOUT_MS: z.coerce.number().int().positive().default(120_000),
  SUPERDOCS_API_KEY: z.string().min(1).optional(),
  SUPERDOCS_BASE_URL: z.string().url().default("https://api.superdocs.app"),
  SUPERDOCS_TIMEOUT_MS: z.coerce.number().int().positive().default(300_000),
});

export const env = EnvSchema.parse(process.env);
