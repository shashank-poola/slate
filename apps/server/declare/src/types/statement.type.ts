import type { z } from "zod";
import type { statementsRequestSchema } from "../schema/statement.schema";

export type StatementsRequest = z.infer<typeof statementsRequestSchema>;

export type StatementsResult = {
  contributionStatement: string;
  fundingStatement: string;
  conflictStatement: string;
};
