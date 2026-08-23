import { creditRoleIds } from "../config/credit.config";
import type {
  AnalyzeIssue,
  AnalyzeRequest,
  AnalyzeResult,
  GlmAnalysis,
} from "../types/analyze.type";

const includesEvidence = (text: string, evidence: string): boolean =>
  evidence.trim().length > 0 &&
  text.toLocaleLowerCase().includes(evidence.trim().toLocaleLowerCase());

const securedFunding = (evidence: string): boolean =>
  /\b(acquired|secured|obtained|raised) (the )?(funding|grant)|funding acquisition\b/i.test(evidence);

export const validateAnalysis = (
  request: AnalyzeRequest,
  analysis: GlmAnalysis,
): AnalyzeResult => {
  const authorIds = new Set(request.authors.map((author) => author.id));
  const issues: AnalyzeIssue[] = [];

  const contributions = analysis.contributions.flatMap((contribution) => {
    if (!authorIds.has(contribution.authorId)) {
      issues.push({
        type: "UNKNOWN_AUTHOR",
        message: `Contribution references unknown author "${contribution.authorId}".`,
        authorId: contribution.authorId,
      });
      return [];
    }

    const hasValidEvidence = includesEvidence(request.contributions, contribution.evidence);
    let roleIds = [...new Set(contribution.roleIds)].filter((roleId) => {
      if (creditRoleIds.has(roleId)) {
        return true;
      }

      issues.push({
        type: "INVALID_CREDIT_ROLE",
        message: `Unsupported CRediT role "${roleId}".`,
        authorId: contribution.authorId,
        roleId,
      });
      return false;
    });

    if (!hasValidEvidence) {
      issues.push({
        type: "MISSING_EVIDENCE",
        message: "Contribution evidence must be an exact phrase from the supplied contribution text.",
        authorId: contribution.authorId,
      });
      roleIds = [];
    }

    if (contribution.roleIds.includes("funding_acquisition") && !securedFunding(contribution.evidence)) {
      issues.push({
        type: "INVALID_CREDIT_ROLE",
        message: "funding_acquisition requires evidence that the author secured funding.",
        authorId: contribution.authorId,
        roleId: "funding_acquisition",
      });
      roleIds = roleIds.filter((roleId) => roleId !== "funding_acquisition");
    }

    let status = contribution.status;
    if (!hasValidEvidence || (status === "proposed" && roleIds.length === 0)) {
      status = "ambiguous";
    }

    if (status === "ambiguous") {
      issues.push({
        type: "AMBIGUOUS_CONTRIBUTION",
        message: "Contribution needs researcher review before roles can be approved.",
        authorId: contribution.authorId,
      });
    }

    if (status === "unsupported") {
      issues.push({
        type: "UNSUPPORTED_CONTRIBUTION",
        message: "Contribution evidence does not support a specific CRediT role.",
        authorId: contribution.authorId,
      });
    }

    return [{
      authorId: contribution.authorId,
      evidence: contribution.evidence,
      roleIds: status === "proposed" ? roleIds : [],
      status,
    }];
  });

  const funding = !request.funding.trim()
    ? { status: "unknown" as const, evidence: "" }
    : analysis.funding;

  if (funding.status === "reported" && !funding.funder?.trim()) {
    issues.push({ type: "INVALID_FUNDING", message: "Reported funding is missing a funder name." });
  }

  if (funding.status === "reported" && !includesEvidence(request.funding, funding.evidence)) {
    issues.push({
      type: "INVALID_FUNDING",
      message: "Funding evidence must be an exact phrase from the supplied funding text.",
    });
  }

  const conflicts = !request.conflicts.trim()
    ? { status: "unknown" as const, items: [] }
    : {
      ...analysis.conflicts,
      items: analysis.conflicts.items.filter((item) => {
        const hasValidEvidence = includesEvidence(request.conflicts, item.evidence);

        if (!hasValidEvidence) {
          issues.push({
            type: "INVALID_CONFLICT",
            message: "Conflict evidence must be an exact phrase from the supplied conflict text.",
            authorId: item.authorId,
          });
        }

        if (item.authorId && !authorIds.has(item.authorId)) {
          issues.push({
            type: "UNKNOWN_AUTHOR",
            message: `Conflict disclosure references unknown author "${item.authorId}".`,
            authorId: item.authorId,
          });
          return false;
        }

        return hasValidEvidence;
      }),
    };

  if (contributions.length === 0) {
    issues.push({
      type: "AMBIGUOUS_CONTRIBUTION",
      message: "No contribution could be mapped from the supplied text.",
    });
  }

  return {
    contributions,
    funding,
    conflicts: {
      status: conflicts.status,
      items: conflicts.items.map((item) => ({
        status: conflicts.status,
        authorId: item.authorId,
        disclosure: item.disclosure,
        evidence: item.evidence,
      })),
    },
    issues,
  };
};
