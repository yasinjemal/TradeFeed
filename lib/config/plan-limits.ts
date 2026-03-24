// ============================================================
// Config — Plan Limits & Team Member Constants
// ============================================================
// Centralized plan limit definitions. These are the source of
// truth for enforcement — DB Plan.staffLimit should match.
// ============================================================

export const PLAN_LIMITS = {
  free: { staffLimit: 2, label: "Free" },
  starter: { staffLimit: 3, label: "Starter" },
  pro: { staffLimit: 5, label: "Pro" },
  business: { staffLimit: 15, label: "Business" },
} as const;

export type PlanSlug = keyof typeof PLAN_LIMITS;

/** The percentage at which we show a "near limit" warning. */
export const TEAM_LIMIT_WARNING_THRESHOLD = 0.8;

/** Structured error code for team limit reached. */
export const TEAM_LIMIT_ERROR = {
  code: "TEAM_LIMIT_REACHED" as const,
  message: "Upgrade required to add more team members",
};
