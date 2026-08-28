/**
 * Centralized query key factory.
 * Using `as const` ensures keys are narrowly typed for targeted invalidation.
 */
export const queryKeys = {
  employees: {
    all: ["employees"] as const,
    list: (filters: Record<string, unknown>) =>
      ["employees", "list", filters] as const,
    detail: (id: string) => ["employees", "detail", id] as const,
  },
  clients: {
    all: ["clients"] as const,
    list: (filters: Record<string, unknown>) =>
      ["clients", "list", filters] as const,
    detail: (id: string) => ["clients", "detail", id] as const,
    observations: (clientId: string) =>
      ["clients", clientId, "observations"] as const,
  },
  departments: {
    all: ["departments"] as const,
    list: (filters: Record<string, unknown>) =>
      ["departments", "list", filters] as const,
    detail: (id: string) => ["departments", "detail", id] as const,
  },
  documents: {
    all: ["documents"] as const,
    tree: ["documents", "tree"] as const,
    detail: (id: string) => ["documents", "detail", id] as const,
    versions: (docId: string) => ["documents", docId, "versions"] as const,
  },
  faq: {
    all: ["faq"] as const,
    list: (filters: Record<string, unknown>) =>
      ["faq", "list", filters] as const,
  },
  reports: {
    all: ["reports"] as const,
    list: (filters: Record<string, unknown>) =>
      ["reports", "list", filters] as const,
  },
  meetings: {
    all: ["meetings"] as const,
    list: (filters: Record<string, unknown>) =>
      ["meetings", "list", filters] as const,
    detail: (id: string) => ["meetings", "detail", id] as const,
  },
  surveys: {
    all: ["surveys"] as const,
    list: (filters: Record<string, unknown>) =>
      ["surveys", "list", filters] as const,
    detail: (id: string) => ["surveys", "detail", id] as const,
  },
  profile: {
    me: ["profile", "me"] as const,
  },
  policies: {
    all: ["policies"] as const,
    list: (filters: Record<string, unknown>) =>
      ["policies", "list", filters] as const,
    detail: (id: string) => ["policies", "detail", id] as const,
    versions: (policyId: string) => ["policies", policyId, "versions"] as const,
    compliance: ["policies", "compliance"] as const,
    active: ["policies", "active"] as const,
  },
  initiatives: {
    all: ["initiatives"] as const,
    list: (filters: Record<string, unknown>) =>
      ["initiatives", "list", filters] as const,
    detail: (id: string) => ["initiatives", "detail", id] as const,
    evaluationConfig: ["initiatives", "evaluationConfig"] as const,
  },
  roles: {
    all: ["roles"] as const,
  },
};
