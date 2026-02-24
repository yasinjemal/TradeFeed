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
// Simple keyword-based matching. Maps product name keywords
// to global category slugs. No AI needed — just smart defaults.
// ============================================================

const KEYWORD_MAP: Record<string, string[]> = {
  // Men's Clothing
  "mens-t-shirts": ["t-shirt", "tee", "tshirt", "t shirt"],
  "mens-shirts": ["shirt", "formal shirt", "button-down", "oxford"],
  "hoodies-sweaters": ["hoodie", "sweater", "sweatshirt", "pullover", "fleece", "crewneck"],
  "mens-jackets": ["jacket", "bomber", "windbreaker", "puffer", "denim jacket"],
  "mens-jeans": ["jeans", "denim", "slim fit jeans", "straight jeans"],
  "mens-trousers": ["trousers", "chinos", "pants", "cargo", "joggers", "sweatpants"],
  "mens-shorts": ["shorts", "swim shorts", "board shorts"],
  "tracksuits-sets": ["tracksuit", "track suit", "matching set", "two piece"],
  "vests-tanks": ["vest", "tank", "tank top", "sleeveless"],
  "mens-underwear": ["underwear", "boxer", "briefs", "underpants"],

  // Women's Clothing
  "womens-dresses": ["dress", "maxi dress", "mini dress", "sundress", "bodycon"],
  "womens-tops": ["top", "blouse", "crop top", "camisole", "tunic"],
  "womens-skirts": ["skirt", "mini skirt", "maxi skirt", "pencil skirt", "pleated"],
  "womens-jeans": ["women jeans", "ladies jeans", "skinny jeans", "mom jeans"],
  "womens-trousers": ["women trousers", "palazzo", "culottes", "wide leg"],
  "leggings-tights": ["leggings", "tights", "yoga pants", "compression"],
  "womens-jackets": ["women jacket", "blazer", "cardigan", "coat"],
  "womens-lingerie": ["lingerie", "bra", "panties", "nightwear", "sleepwear"],
  "activewear": ["activewear", "sportswear", "gym wear", "fitness", "workout"],

  // Unisex
  "unisex-tees": ["unisex t-shirt", "unisex tee"],
  "unisex-hoodies": ["unisex hoodie", "oversized hoodie"],
  "unisex-caps": ["cap", "beanie", "bucket hat", "snapback", "trucker hat", "hat"],

  // Kids
  "boys-clothing": ["boys", "boy"],
  "girls-clothing": ["girls", "girl"],
  "baby-clothing": ["baby", "infant", "onesie", "romper", "babygrow"],
  "school-uniforms": ["school uniform", "school shirt", "school pants"],

  // Footwear
  "sneakers": ["sneaker", "sneakers", "trainers", "kicks", "running shoes"],
  "formal-shoes": ["formal shoes", "oxford shoes", "loafers", "brogues", "dress shoes"],
  "sandals-slides": ["sandals", "slides", "flip flops", "slippers"],
  "boots": ["boots", "ankle boots", "chelsea boots", "combat boots", "work boots"],
  "kids-shoes": ["kids shoes", "children shoes", "baby shoes"],

  // Accessories
  "bags-backpacks": ["bag", "backpack", "handbag", "tote", "duffel", "sling bag", "crossbody"],
  "belts": ["belt", "leather belt"],
  "wallets": ["wallet", "purse", "card holder"],
  "sunglasses": ["sunglasses", "shades", "glasses"],
  "jewellery": ["jewellery", "jewelry", "necklace", "bracelet", "ring", "earring", "chain", "pendant"],
  "scarves-wraps": ["scarf", "scarves", "wrap", "shawl", "hijab"],
  "watches": ["watch", "watches", "timepiece", "smartwatch"],

  // Formal & Traditional
  "suits-blazers": ["suit", "blazer", "tuxedo", "two piece suit", "three piece"],
  "traditional-african": ["traditional", "african", "dashiki", "ankara", "shweshwe", "isicholo", "umqhele"],
  "formal-dresses": ["formal dress", "evening gown", "cocktail dress", "prom dress"],
};

/**
 * Suggest a global category based on product name.
 *
 * WHAT: Simple keyword matching — finds best category for a product name.
 * WHY: Reduces friction when sellers add products. One-tap category assignment.
 *
 * ALGORITHM:
 * 1. Lowercase the product name
 * 2. Check each keyword list for matches
 * 3. Return the slug of the best match (longest keyword match wins)
 * 4. If no match, return null
 */
export function suggestGlobalCategory(
  productName: string
): string | null {
  const name = productName.toLowerCase().trim();
  if (!name) return null;

  let bestMatch: { slug: string; matchLength: number } | null = null;

  for (const [slug, keywords] of Object.entries(KEYWORD_MAP)) {
    for (const keyword of keywords) {
      if (name.includes(keyword)) {
        if (!bestMatch || keyword.length > bestMatch.matchLength) {
          bestMatch = { slug, matchLength: keyword.length };
        }
      }
    }
  }

  return bestMatch?.slug ?? null;
}
