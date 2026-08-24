import type { StatementsResult } from "../types/statement.type";
import { buildStatementsHtml } from "../utils/statement.utils";

export const buildSuperdocsMessage = (statements: StatementsResult): string =>
  `Append the exact HTML block below at the very end of the manuscript as one insertion. Do not edit, replace, match, reuse, or infer from existing manuscript text. Do not split the block into separate edits. Do not change any wording.\n\n${buildStatementsHtml(statements)}`;
