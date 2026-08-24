import { describe, expect, test } from "bun:test";
import type { StatementsRequest } from "../src/types/statement.type";
import { getStatementValidationIssues } from "../src/utils/review.utils";
import { buildStatements, buildStatementsHtml } from "../src/utils/statement.utils";

const reviewedFacts: StatementsRequest = {
  authors: [
    { id: "shashank", name: "Shashank" },
    { id: "rahul", name: "Rahul" },
  ],
  contributions: [
    { authorId: "shashank", evidence: "designed the study", roleIds: ["conceptualization", "software"], status: "approved" },
    { authorId: "rahul", evidence: "cleaned the dataset", roleIds: ["data_curation"], status: "approved" },
  ],
  funding: { status: "reported", funder: "XYZ Foundation", evidence: "XYZ Foundation funded the work." },
  conflicts: { status: "none", items: [] },
};

describe("Declare statements", () => {
  test("generates deterministic reviewed statements", () => {
    const result = buildStatements(reviewedFacts);

    expect(result.contributionStatement).toContain("Shashank: Conceptualization, Software.");
    expect(result.contributionStatement).toContain("Rahul: Data curation.");
    expect(result.fundingStatement).toContain("XYZ Foundation");
    expect(result.conflictStatement).toContain("no competing interests");
  });

  test("builds one escaped HTML declaration block", () => {
    const statements = buildStatements(reviewedFacts);
    const html = buildStatementsHtml(statements);

    expect(html).toContain('data-declare-statements="true"');
    expect(html).toContain("This work was supported by XYZ Foundation.");
    expect(html).toContain("The authors declare no competing interests.");
  });

  test("requires ambiguity and invalid roles to be reviewed first", () => {
    const issues = getStatementValidationIssues({
      ...reviewedFacts,
      contributions: [
        ...reviewedFacts.contributions,
        { authorId: "rahul", evidence: "helped", roleIds: ["backend_development"], status: "approved" },
        { authorId: "shashank", evidence: "helped", roleIds: [], status: "ambiguous" },
      ],
    });

    expect(issues.map((issue) => issue.type)).toContain("INVALID_CREDIT_ROLE");
    expect(issues.map((issue) => issue.type)).toContain("AMBIGUOUS_CONTRIBUTION");
  });
});
