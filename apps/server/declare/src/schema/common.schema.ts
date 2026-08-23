import { z } from "zod";

export const idSchema = z.string().trim().min(1).max(256);

export const authorSchema = z.object({
  id: idSchema,
  name: z.string().trim().min(1).max(200),
});
