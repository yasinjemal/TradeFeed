// ============================================================
// Data Access — Platform Admin
// ============================================================
// Cross-tenant queries for platform admins.
// Used by the admin dashboard for seller verification,
// platform metrics, and shop management.
//
// RULES:
// - Every function requires admin auth (checked at action/page level)
// - Cross-tenant access is intentional here
// - Audit-friendly: returns only what admins need
// ============================================================

import { db } from "@/lib/db";

/**
 * Get platform-wide statistics.
 * WHAT: Counts of shops, products, users, subscriptions.
 */
export async function getAdminStats() {
  const [
    totalShops,
    activeShops,
    verifiedShops,
    totalProducts,
    totalUsers,
    proSubscriptions,
  ] = await Promise.all([
    db.shop.count(),
    db.shop.count({ where: { isActive: true } }),
    db.shop.count({ where: { isVerified: true } }),
    db.product.count(),
    db.user.count(),
    db.subscription.count({
      where: {
        status: "ACTIVE",
        plan: { slug: { not: "free" } },
      },
    }),
  ]);

  return {
    totalShops,
    activeShops,
    verifiedShops,
    totalProducts,
    totalUsers,
    proSubscriptions,
  };
}

/**
 * Get all shops with owner info for admin management.
 * Supports search and pagination.
 */
export async function getAdminShops(options?: {
  search?: string;
  page?: number;
  limit?: number;
  filter?: "all" | "verified" | "unverified" | "inactive";
}) {
  const { search, page = 1, limit = 20, filter = "all" } = options || {};

  const where: Record<string, unknown> = {};

  // Search filter
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { slug: { contains: search, mode: "insensitive" } },
      { city: { contains: search, mode: "insensitive" } },
    ];
  }

  // Status filter
  if (filter === "verified") where.isVerified = true;
  if (filter === "unverified") where.isVerified = false;
  if (filter === "inactive") where.isActive = false;

  const [shops, total] = await Promise.all([
    db.shop.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        whatsappNumber: true,
        city: true,
        province: true,
        isActive: true,
        isVerified: true,
        logoUrl: true,
        createdAt: true,
        _count: {
          select: {
            products: true,
          },
        },
        subscription: {
          select: {
            status: true,
            plan: { select: { name: true, slug: true } },
          },
        },
        users: {
          where: { role: "OWNER" },
          select: {
            user: {
              select: {
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.shop.count({ where }),
  ]);

  return {
    shops,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Verify or unverify a shop.
 */
export async function setShopVerified(shopId: string, verified: boolean) {
  return db.shop.update({
    where: { id: shopId },
    data: { isVerified: verified },
    select: { id: true, name: true, isVerified: true },
  });
}

/**
 * Activate or deactivate a shop.
 */
export async function setShopActive(shopId: string, active: boolean) {
  return db.shop.update({
    where: { id: shopId },
    data: { isActive: active },
    select: { id: true, name: true, isActive: true },
  });
}
