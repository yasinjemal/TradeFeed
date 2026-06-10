// ============================================================
// Data Access — Seller Trust Stats (Phase 2)
// ============================================================
// Fetches order rows for the pure trust-stat computation.
// Looks at the last 180 days so stats reflect current
// behaviour, not ancient history.
// ============================================================

import { db } from "@/lib/db";
import {
  computeSellerTrustStats,
  type SellerTrustStats,
} from "@/lib/trust/seller-stats";

const LOOKBACK_DAYS = 180;

export async function getSellerTrustStats(shopId: string): Promise<SellerTrustStats> {
  const since = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

  const rows = await db.order.findMany({
    where: {
      shopId,
      deletedAt: null,
      createdAt: { gte: since },
    },
    select: {
      status: true,
      createdAt: true,
      shippedAt: true,
    },
  });

  return computeSellerTrustStats(rows);
}
