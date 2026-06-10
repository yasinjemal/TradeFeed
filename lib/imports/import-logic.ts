// ============================================================
// Catalogue Import — Pure Logic (chunking, quota, status)
// ============================================================
// No Prisma, no network — everything here is unit-testable.
// ============================================================

/** Vision calls per server-action invocation (Vercel-timeout safe). */
export const IMPORT_CHUNK_SIZE = 4;

/** Confidence below this ⇒ needs_review + low_confidence flag. */
export const LOW_CONFIDENCE_THRESHOLD = 0.6;

export const DRAFT_FLAGS = [
  "low_confidence",
  "possible_duplicate",
  "multi_item_photo",
  "no_price_detected",
  "watermark_suspected",
  "ai_quota_exceeded",
] as const;
export type DraftFlag = (typeof DRAFT_FLAGS)[number];

// ── Quota planning ───────────────────────────────────────────

export interface AiBudget {
  /** How many of the pending drafts get AI generation */
  withAi: number;
  /** How many are marked needs_review without AI (quota exhausted) */
  withoutAi: number;
}

/**
 * Split a pending batch against the seller's remaining AI credits.
 * Never silently drops items: everything beyond the budget is
 * processed without AI and flagged ai_quota_exceeded.
 */
export function planAiBudget(
  pendingCount: number,
  creditsRemaining: number,
  hasUnlimitedAi: boolean
): AiBudget {
  if (pendingCount <= 0) return { withAi: 0, withoutAi: 0 };
  if (hasUnlimitedAi) return { withAi: pendingCount, withoutAi: 0 };

  const withAi = Math.max(0, Math.min(pendingCount, creditsRemaining));
  return { withAi, withoutAi: pendingCount - withAi };
}

// ── Draft status derivation ──────────────────────────────────

export interface DraftAssessment {
  status: "NEEDS_REVIEW" | "READY";
  flags: DraftFlag[];
}

/**
 * Decide whether an AI-generated draft is publishable as-is or
 * needs the seller's attention. Flags from the model are merged
 * with locally derived ones (confidence, missing price).
 */
export function assessDraft(input: {
  confidence: number;
  modelFlags: string[];
  hasPrice: boolean;
  hasTitle: boolean;
}): DraftAssessment {
  const flags = new Set<DraftFlag>();

  // Keep only known flags from the model (defensive)
  for (const flag of input.modelFlags) {
    if ((DRAFT_FLAGS as readonly string[]).includes(flag)) {
      flags.add(flag as DraftFlag);
    }
  }

  if (input.confidence < LOW_CONFIDENCE_THRESHOLD) flags.add("low_confidence");
  if (!input.hasPrice) flags.add("no_price_detected");

  const needsReview = flags.size > 0 || !input.hasTitle;
  return {
    status: needsReview ? "NEEDS_REVIEW" : "READY",
    flags: [...flags],
  };
}

// ── Review grid ordering ─────────────────────────────────────

/**
 * Sort weight for the review grid: flagged cards first (they
 * need attention), then ready cards, stable within groups.
 */
export function draftSortWeight(status: string, flagCount: number): number {
  if (status === "NEEDS_REVIEW") return 0 - Math.min(flagCount, 9) / 10; // more flags → earlier
  if (status === "PROCESSING") return 1;
  if (status === "READY") return 2;
  return 3; // published/skipped sink to the bottom
}

// ── Title similarity (duplicate detection v1) ───────────────

/**
 * Token-overlap similarity (0–1) between two product titles.
 * Cheap, language-agnostic enough for catalogue dedupe.
 */
export function titleSimilarity(a: string, b: string): number {
  const tokenize = (s: string) =>
    new Set(
      s
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, "")
        .split(/\s+/)
        .filter((t) => t.length > 1)
    );

  const ta = tokenize(a);
  const tb = tokenize(b);
  if (ta.size === 0 || tb.size === 0) return 0;

  let common = 0;
  for (const token of ta) if (tb.has(token)) common++;

  return common / Math.min(ta.size, tb.size);
}

export const DUPLICATE_SIMILARITY_THRESHOLD = 0.8;
