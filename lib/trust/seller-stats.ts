// ============================================================
// Seller Trust Stats — Pure Computation (Phase 2)
// ============================================================
// Computes buyer-facing trust signals from order history:
// - orders fulfilled (DELIVERED count)
// - fulfilment rate (delivered vs closed orders)
// - avg dispatch time (order placed → shipped)
//
// RULES: pure functions only — no Prisma, no DB imports.
// Fetched by lib/db/trust.ts, displayed on the catalog page.
// ============================================================

export interface FulfilmentOrderRow {
  status: string; // OrderStatus
  createdAt: Date;
  shippedAt: Date | null;
}

export interface SellerTrustStats {
  /** Orders with status DELIVERED */
  ordersFulfilled: number;
  /** delivered / (delivered + cancelled), 0–1. Null when no closed orders. */
  fulfilmentRate: number | null;
  /** Mean hours from order creation to dispatch. Null when never shipped. */
  avgDispatchHours: number | null;
}

const MS_PER_HOUR = 1000 * 60 * 60;

export function computeSellerTrustStats(rows: FulfilmentOrderRow[]): SellerTrustStats {
  let delivered = 0;
  let cancelled = 0;
  let dispatchTotalHours = 0;
  let dispatchCount = 0;

  for (const row of rows) {
    if (row.status === "DELIVERED") delivered++;
    if (row.status === "CANCELLED") cancelled++;
    if (row.shippedAt) {
      const hours = (row.shippedAt.getTime() - row.createdAt.getTime()) / MS_PER_HOUR;
      if (hours >= 0) {
        dispatchTotalHours += hours;
        dispatchCount++;
      }
    }
  }

  const closed = delivered + cancelled;

  return {
    ordersFulfilled: delivered,
    fulfilmentRate: closed > 0 ? delivered / closed : null,
    avgDispatchHours: dispatchCount > 0 ? dispatchTotalHours / dispatchCount : null,
  };
}

/**
 * Human-friendly dispatch label, e.g.:
 * 18h → "Usually ships same day"
 * 30h → "Usually ships in 1–2 days"
 * 80h → "Usually ships in 3–4 days"
 */
export function formatDispatchLabel(avgDispatchHours: number | null): string | null {
  if (avgDispatchHours === null) return null;
  if (avgDispatchHours <= 24) return "Usually ships same day";
  const days = Math.ceil(avgDispatchHours / 24);
  if (days <= 2) return "Usually ships in 1–2 days";
  if (days <= 4) return "Usually ships in 3–4 days";
  if (days <= 7) return "Usually ships within a week";
  return null; // Slow dispatch isn't a trust signal — omit rather than harm
}
