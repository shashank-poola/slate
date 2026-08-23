export const creditRoles = [
  {
    id: "conceptualization",
    label: "Conceptualization",
    description:
      "Ideas; formulation or evolution of the overarching research goals and aims.",
  },
  {
    id: "data_curation",
    label: "Data curation",
    description:
      "Management activities to annotate, scrub, maintain, and prepare research data for initial use and later reuse.",
  },
  {
    id: "formal_analysis",
    label: "Formal analysis",
    description:
      "Application of statistical, mathematical, computational, or other formal techniques to analyze or synthesize study data.",
  },
  {
    id: "funding_acquisition",
    label: "Funding acquisition",
    description:
      "Acquisition of financial support for the project leading to this publication.",
  },
  {
    id: "investigation",
    label: "Investigation",
    description:
      "Conducting the research and investigation process, specifically performing experiments or collecting data and evidence.",
  },
  {
    id: "methodology",
    label: "Methodology",
    description: "Development or design of methodology; creation of models.",
  },
  {
    id: "project_administration",
    label: "Project administration",
    description:
      "Management and coordination responsibility for the research activity planning and execution.",
  },
  {
    id: "resources",
    label: "Resources",
    description:
      "Provision of study materials, reagents, samples, instrumentation, computing resources, or other analysis tools.",
  },
  {
    id: "software",
    label: "Software",
    description:
      "Programming, software development, implementation of computer code and supporting algorithms, and testing of existing code components.",
  },
  {
    id: "supervision",
    label: "Supervision",
    description:
      "Oversight responsibility for the research activity planning and execution, including mentorship external to the core team.",
  },
  {
    id: "validation",
    label: "Validation",
    description:
      "Verification of the overall replication or reproducibility of results, experiments, and other research outputs.",
  },
  {
    id: "visualization",
    label: "Visualization",
    description:
      "Preparation, creation, or presentation of the published work, specifically visualization and data presentation.",
  },
  {
    id: "writing_original_draft",
    label: "Writing – original draft",
    description:
      "Preparation, creation, or presentation of the published work, specifically writing the initial draft.",
  },
  {
    id: "writing_review_editing",
    label: "Writing – review & editing",
    description:
      "Preparation, creation, or presentation of the published work, specifically critical review, commentary, or revision.",
  },
] as const;

export type CreditRole = (typeof creditRoles)[number];

export const creditRoleIds = new Set<string>(creditRoles.map((role) => role.id));

export const creditRoleById = new Map<string, CreditRole>(
  creditRoles.map((role) => [role.id, role]),
);
