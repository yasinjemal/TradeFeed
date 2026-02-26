// ============================================================
// Data Access — Admin Product Moderation
// ============================================================
// Flag/unflag products for policy violations.
// ============================================================

import { db } from "@/lib/db";

export interface FlaggedProduct {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  isFlagged: boolean;
  flagReason: string | null;
  flaggedAt: Date | null;
  createdAt: Date;
  imageUrl: string | null;
  shop: { id: string; name: string; slug: string };
  variantCount: number;
}

/**
 * Get products for moderation — flagged first, then all.
 */
export async function getModerationProducts(options?: {
  search?: string;
  page?: number;
  limit?: number;
  filter?: "all" | "flagged" | "active" | "inactive";
}): Promise<{ products: FlaggedProduct[]; total: number; page: number; totalPages: number }> {
  const { search, page = 1, limit = 20, filter = "all" } = options || {};

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { shop: { name: { contains: search, mode: "insensitive" } } },
    ];
  }
  if (filter === "flagged") where.isFlagged = true;
  if (filter === "active") where.isActive = true;
  if (filter === "inactive") where.isActive = false;

  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        isFlagged: true,
        flagReason: true,
        flaggedAt: true,
        createdAt: true,
        images: { select: { url: true }, take: 1, orderBy: { position: "asc" } },
        shop: { select: { id: true, name: true, slug: true } },
        _count: { select: { variants: true } },
      },
      orderBy: [{ isFlagged: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.product.count({ where }),
  ]);

  return {
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      isActive: p.isActive,
      isFlagged: p.isFlagged,
      flagReason: p.flagReason,
      flaggedAt: p.flaggedAt,
      createdAt: p.createdAt,
      imageUrl: p.images[0]?.url ?? null,
      shop: p.shop,
      variantCount: p._count.variants,
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Flag a product for policy violation.
 */
export async function flagProduct(productId: string, reason: string) {
  return db.product.update({
    where: { id: productId },
    data: { isFlagged: true, flagReason: reason, flaggedAt: new Date(), isActive: false },
    select: { id: true, name: true, shop: { select: { name: true } } },
  });
}

/**
 * Unflag a product — restore it.
 */
export async function unflagProduct(productId: string) {
  return db.product.update({
    where: { id: productId },
    data: { isFlagged: false, flagReason: null, flaggedAt: null, isActive: true },
    select: { id: true, name: true, shop: { select: { name: true } } },
  });
}
