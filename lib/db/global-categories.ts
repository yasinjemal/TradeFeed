// ============================================================
// Data Access — Global Categories
// ============================================================
// Platform-wide category queries for marketplace discovery.
// Used by product forms (category picker), bulk mapping tool,
// and category suggestion engine.
//
// RULES:
// - These are PUBLIC platform categories, not per-shop categories
// - Returns tree structure: parent → children
// - Keyword map powers the auto-suggest feature (M8.3)
// ============================================================

import { db } from "@/lib/db";

export interface GlobalCategoryOption {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  parentId: string | null;
  children: GlobalCategoryOption[];
}

/**
 * Get all active global categories as a flat list with children nested.
 *
 * WHAT: Returns tree of platform-wide categories for dropdowns.
 * WHY: Product forms need a hierarchical picker: "Men's → Hoodies".
 */
export async function getGlobalCategoryTree(): Promise<GlobalCategoryOption[]> {
  const all = await db.globalCategory.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      icon: true,
      parentId: true,
    },
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
  });

  // Build tree: top-level parents with nested children
  const parentMap = new Map<string | null, typeof all>(); 
  for (const cat of all) {
    const key = cat.parentId;
    if (!parentMap.has(key)) parentMap.set(key, []);
    parentMap.get(key)!.push(cat);
  }

  const topLevel = parentMap.get(null) || [];
  return topLevel.map((parent) => ({
    ...parent,
    children: (parentMap.get(parent.id) || []).map((child) => ({
      ...child,
      children: [], // Only 2 levels deep
    })),
  }));
}

/**
 * Get a flat list of all global categories (for simple lookups).
 */
export async function getGlobalCategoryList() {
  return db.globalCategory.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      icon: true,
      parentId: true,
    },
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
  });
}

/**
 * Count unmapped products in a shop.
 *
 * WHAT: Products without a globalCategoryId.
 * WHY: Powers the "X products aren't discoverable" nudge (M8.4).
 */
export async function countUnmappedProducts(shopId: string) {
  const [total, unmapped] = await Promise.all([
    db.product.count({ where: { shopId, isActive: true } }),
    db.product.count({
      where: { shopId, isActive: true, globalCategoryId: null },
    }),
  ]);
  return { total, unmapped, mapped: total - unmapped };
}

/**
 * Get unmapped products for bulk mapping tool.
 *
 * WHAT: Active products without a globalCategoryId.
 * WHY: Bulk mapping page shows these for quick assignment.
 */
export async function getUnmappedProducts(shopId: string) {
  return db.product.findMany({
    where: { shopId, isActive: true, globalCategoryId: null },
    select: {
      id: true,
      name: true,
      images: { take: 1, orderBy: { position: "asc" }, select: { url: true } },
      category: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Get all products for bulk mapping (including already-mapped ones).
 */
export async function getAllProductsForMapping(shopId: string) {
  return db.product.findMany({
    where: { shopId, isActive: true },
    select: {
      id: true,
      name: true,
      globalCategoryId: true,
      globalCategory: { select: { name: true, slug: true } },
      images: { take: 1, orderBy: { position: "asc" }, select: { url: true } },
      category: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Bulk update global category for multiple products.
 *
 * WHAT: Assigns a globalCategoryId to a list of product IDs.
 * WHY: Sellers can map many products at once in the bulk tool.
 *
 * MULTI-TENANT: All products must belong to the given shopId.
 */
export async function bulkSetGlobalCategory(
  productIds: string[],
  globalCategoryId: string | null,
  shopId: string
) {
  return db.product.updateMany({
    where: {
      id: { in: productIds },
      shopId, // CRITICAL: Tenant isolation
    },
    data: { globalCategoryId },
  });
}

// ============================================================
// Category Suggestion Engine (M8.3)
// ============================================================
// Re-exported from lib/config/category-suggest.ts (client-safe).
// The keyword map and suggest function live there because client
// components need them and this file imports Prisma (server-only).
// ============================================================
export { suggestGlobalCategory } from "@/lib/config/category-suggest";
