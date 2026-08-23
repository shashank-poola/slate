import { creditRoleById, creditRoleIds } from "../config/credit.config";
import type { AnalyzeIssue } from "../types/analyze.type";
import type { StatementsRequest, StatementsResult } from "../types/statement.type";

export const getStatementValidationIssues = (facts: StatementsRequest): AnalyzeIssue[] => {
  const issues: AnalyzeIssue[] = [];
  const authorIds = new Set(facts.authors.map((author) => author.id));

  for (const contribution of facts.contributions) {
    if (contribution.status === "ambiguous" || contribution.roleIds.length === 0) {
      issues.push({
        type: "AMBIGUOUS_CONTRIBUTION",
        message: `Contribution for ${contribution.authorId} still needs review.`,
        authorId: contribution.authorId,
      });
      continue;
    }

    if (!authorIds.has(contribution.authorId)) {
      issues.push({
        type: "UNKNOWN_AUTHOR",
        message: `Contribution references unknown author "${contribution.authorId}".`,
        authorId: contribution.authorId,
      });
    }

    for (const roleId of contribution.roleIds) {
      if (!creditRoleIds.has(roleId)) {
        issues.push({
          type: "INVALID_CREDIT_ROLE",
          message: `Unsupported CRediT role "${roleId}".`,
          authorId: contribution.authorId,
          roleId,
        });
      }
    }
  }

  if (!facts.contributions.some((item) => item.status === "approved" && item.roleIds.length > 0)) {
    issues.push({
      type: "AMBIGUOUS_CONTRIBUTION",
      message: "At least one approved contribution with roles is required.",
    });
  }

  if (facts.funding.status === "reported" && !facts.funding.funder?.trim()) {
    issues.push({ type: "INVALID_FUNDING", message: "Reported funding needs a reviewed funder name." });
  }

  if (facts.conflicts.status === "unknown") {
    issues.push({
      type: "INVALID_CONFLICT",
      message: "Conflict-of-interest information must be reviewed before rendering.",
    });
  }

  if (facts.conflicts.status === "reported" && facts.conflicts.items.length === 0) {
    issues.push({
      type: "INVALID_CONFLICT",
      message: "Reported conflicts need at least one reviewed disclosure.",
    });
  }

  for (const conflict of facts.conflicts.items) {
    if (conflict.authorId && !authorIds.has(conflict.authorId)) {
      issues.push({
        type: "UNKNOWN_AUTHOR",
        message: `Conflict disclosure references unknown author "${conflict.authorId}".`,
        authorId: conflict.authorId,
      });
    }
  }

  return issues;
};

export const buildStatements = (facts: StatementsRequest): StatementsResult => {
  const rolesByAuthor = new Map<string, Set<string>>();

  for (const contribution of facts.contributions) {
    if (contribution.status !== "approved") {
      continue;
    }

    const roles = rolesByAuthor.get(contribution.authorId) ?? new Set<string>();
    contribution.roleIds.forEach((roleId) => roles.add(roleId));
    rolesByAuthor.set(contribution.authorId, roles);
  }

  const contributionLines = facts.authors
    .filter((author) => rolesByAuthor.has(author.id))
    .map((author) => {
      const labels = [...(rolesByAuthor.get(author.id) ?? [])]
        .map((roleId) => creditRoleById.get(roleId)?.label ?? roleId)
        .sort((left, right) => left.localeCompare(right));

      return `${author.name}: ${labels.join(", ")}.`;
    });

  const fundingStatement = facts.funding.status === "reported"
    ? `Funding\n\nThis work was supported by ${facts.funding.funder}${facts.funding.awardNumber ? ` (grant ${facts.funding.awardNumber})` : ""}.`
    : facts.funding.status === "none"
      ? "Funding\n\nThis research received no external funding."
      : "Funding\n\nFunding information was not provided.";

  const conflictStatement = facts.conflicts.status === "none"
    ? "Competing Interests\n\nThe authors declare no competing interests."
    : `Competing Interests\n\n${facts.conflicts.items.map((item) => item.disclosure || item.evidence).join("; ")}`;

  return {
    contributionStatement: `Author Contributions\n\n${contributionLines.join("\n")}`,
    fundingStatement,
    conflictStatement,
  };
};

export const buildSuperdocsMessage = (statements: StatementsResult): string =>
  `Update the manuscript with these reviewed statements. Replace or add the Author Contributions, Funding, and Competing Interests sections using this exact content:\n\n${statements.contributionStatement}\n\n${statements.fundingStatement}\n\n${statements.conflictStatement}\n\nDo not change the CRediT role mapping. Insert the text exactly as provided.`;
