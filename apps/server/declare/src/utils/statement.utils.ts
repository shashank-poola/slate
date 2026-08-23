import { creditRoleById } from "../config/credit.config";
import type { StatementsRequest, StatementsResult } from "../types/statement.type";

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
