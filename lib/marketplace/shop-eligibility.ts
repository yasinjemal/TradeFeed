// ============================================================
// Shop-level marketplace eligibility
// ============================================================
// A listing can be complete and still stay off the marketplace
// because of something on the SHOP (today: no delivery or
// collection option, no returns policy).
//
// That rule is not restated here. It is read out of the live
// gate in ./eligibility, so a seller-facing "your shop is not
// ready" note can never disagree with what the marketplace
// actually filters on, even when the gate changes.
// ============================================================

import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { marketplaceContentStandard } from "@/lib/marketplace/eligibility";

/**
 * The shop conditions inside the marketplace content standard,
 * or null when the standard asks nothing of the shop.
 */
export function shopLevelMarketplaceStandard(now = new Date()): Prisma.ShopWhereInput | null {
  const branches = marketplaceContentStandard(now).OR;
  const list = Array.isArray(branches) ? branches : branches ? [branches] : [];
  for (const branch of list) {
    const shop = branch.shop as { is?: Prisma.ShopWhereInput | null } | undefined;
    if (shop?.is) return shop.is;
  }
  return null;
}

/** Would a complete new listing from this shop pass the shop part of the gate? */
export async function shopMeetsMarketplaceStandard(shopId: string): Promise<boolean> {
  const standard = shopLevelMarketplaceStandard();
  if (!standard) return true;
  const matching = await db.shop.count({ where: { AND: [{ id: shopId }, standard] } });
  return matching > 0;
}
