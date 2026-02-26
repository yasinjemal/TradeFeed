// ============================================================
// Data Access — Shops
// ============================================================
// All database operations for the Shop model live here.
// Business logic stays in this layer, NOT in UI or API routes.
//
// RULES:
// - Every query that touches tenant data MUST filter by shopId
// - createShop uses a transaction to ensure Shop + ShopUser are atomic
// - Slug uniqueness is enforced before insert
// - This is the ONLY place Prisma is called for shops
// ============================================================

import { db } from "@/lib/db";
import type { ShopCreateInput } from "@/lib/validation/shop";
import type { ShopSettingsInput } from "@/lib/validation/shop-settings";
import { generateSlug, generateUniqueSlug } from "@/lib/utils/slug";

// Infer the Shop type from Prisma's return types.
// WHY: Prisma v6 doesn't export model types as top-level named exports.
// We infer from the client's findFirst return to get the exact shape.
type ShopResult = NonNullable<Awaited<ReturnType<typeof db.shop.findFirst>>>;

/**
 * Check if a shop slug already exists in the database.
 *
 * WHY: Slugs are public URL identifiers. Must be globally unique.
 * USED BY: generateUniqueSlug() during shop creation.
 */
async function slugExists(slug: string): Promise<boolean> {
  const existing = await db.shop.findUnique({
    where: { slug },
    select: { id: true }, // Only need to know if it exists — no data leak
  });
  return existing !== null;
}

/**
 * Create a new shop and link the creator as OWNER.
 *
 * WHAT: Creates a Shop record + ShopUser join record in a single transaction.
 * WHY: A shop without an owner is an orphaned tenant. The transaction ensures
 *      both records are created atomically — if one fails, both roll back.
 *
 * MULTI-TENANT NOTE:
 * - This is the genesis of a new tenant
 * - The userId becomes the OWNER via ShopUser
 * - The slug is auto-generated from the shop name and made unique
 *
 * @param input - Validated shop data (from Zod schema)
 * @param userId - The ID of the user creating the shop (will be OWNER)
 * @returns The created Shop record
 */
export async function createShop(
  input: ShopCreateInput,
  userId: string,
  referredBySlug?: string,
): Promise<ShopResult> {
  // Generate a unique slug from the shop name
  const baseSlug = generateSlug(input.name);
  const slug = await generateUniqueSlug(baseSlug, slugExists);

  // Transaction: Create shop + link owner atomically
  // WHY: If ShopUser creation fails, we don't want an orphaned shop
  const shop = await db.$transaction(async (tx: Omit<typeof db, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">) => {
    // 1. Create the shop (with optional referral link)
    const newShop = await tx.shop.create({
      data: {
        name: input.name,
        slug,
        description: input.description || null,
        whatsappNumber: input.whatsappNumber,
        referredBy: referredBySlug || null,
      },
    });

    // 2. Link the creator as OWNER
    // CRITICAL: Every shop MUST have at least one OWNER
    await tx.shopUser.create({
      data: {
        userId,
        shopId: newShop.id,
        role: "OWNER",
      },
    });

    return newShop;
  });

  return shop;
}

/**
 * Get a shop by its slug.
 *
 * WHAT: Looks up a shop using the URL-safe slug.
 * WHY: Public catalog pages use slugs in the URL (/catalog/marble-tower-fashions).
 *
 * NOTE: This does NOT require shopId filtering because slug is the lookup key
 * and this is used for public catalog access.
 */
export async function getShopBySlug(slug: string): Promise<ShopResult | null> {
  return db.shop.findUnique({
    where: { slug, isActive: true },
  });
}

/**
 * Update a shop's profile/settings.
 *
 * WHAT: Partial update of shop fields (name, location, hours, socials, etc.)
 * WHY: Sellers need to fill in their profile progressively after creation.
 *
 * MULTI-TENANT: shopId required. Access control happens in the server action.
 */
export async function updateShopSettings(
  shopId: string,
  input: ShopSettingsInput,
): Promise<ShopResult> {
  return db.shop.update({
    where: { id: shopId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && {
        description: input.description || null,
      }),
      ...(input.aboutText !== undefined && {
        aboutText: input.aboutText || null,
      }),
      ...(input.whatsappNumber !== undefined && input.whatsappNumber && {
        whatsappNumber: input.whatsappNumber,
      }),
      ...(input.retailWhatsappNumber !== undefined && {
        retailWhatsappNumber: input.retailWhatsappNumber || null,
      }),
      ...(input.address !== undefined && { address: input.address || null }),
      ...(input.city !== undefined && { city: input.city || null }),
      ...(input.province !== undefined && { province: input.province || null }),
      ...(input.latitude !== undefined && { latitude: input.latitude ?? null }),
      ...(input.longitude !== undefined && {
        longitude: input.longitude ?? null,
      }),
      ...(input.businessHours !== undefined && {
        businessHours: input.businessHours || null,
      }),
      ...(input.instagram !== undefined && {
        instagram: input.instagram || null,
      }),
      ...(input.facebook !== undefined && { facebook: input.facebook || null }),
      ...(input.tiktok !== undefined && { tiktok: input.tiktok || null }),
      ...(input.website !== undefined && { website: input.website || null }),
    },
  });
}

/**
 * Get a shop by ID — scoped to a specific user.
 *
 * WHAT: Fetches a shop only if the given user has access to it.
 * WHY: Prevents unauthorized access. A user can only see shops they belong to.
 *
 * MULTI-TENANT: This is the pattern for all authenticated shop access.
 * We check ShopUser membership, not just shopId existence.
 */
export async function getShopForUser(
  shopId: string,
  userId: string
): Promise<ShopResult | null> {
  const shopUser = await db.shopUser.findUnique({
    where: {
      userId_shopId: { userId, shopId },
    },
    include: {
      shop: true,
    },
  });

  if (!shopUser || !shopUser.shop.isActive) {
    return null;
  }

  return shopUser.shop;
}

/**
 * Get all shops that a user belongs to.
 *
 * WHAT: Returns all shops linked to a user via ShopUser.
 * WHY: For the dashboard — user sees only their shop(s).
 *
 * MVP: Users have one shop. Schema supports multiple for future.
 */
export async function getShopsForUser(userId: string) {
  const shopUsers = await db.shopUser.findMany({
    where: { userId },
    include: {
      shop: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Type is inferred by Prisma's include — each su has .shop and .role
  return shopUsers.map((su: (typeof shopUsers)[number]) => ({
    ...su.shop,
    role: su.role,
  }));
}

/**
 * Get aggregated dashboard stats for a shop.
 *
 * WHAT: Single query batch for overview metrics.
 * WHY: Dashboard needs product count, stock totals, price range, profile status.
 */
export async function getDashboardStats(shopId: string) {
  // Start of today (UTC — fine for daily aggregates)
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [
    productCount,
    activeProductCount,
    variantAgg,
    recentProducts,
    outOfStockCount,
    ordersToday,
    revenueToday,
  ] = await Promise.all([
    // Total products
    db.product.count({ where: { shopId } }),
    // Active products
    db.product.count({ where: { shopId, isActive: true } }),
    // Variant aggregates: total stock, price range
    db.productVariant.aggregate({
      where: { product: { shopId } },
      _sum: { stock: true },
      _min: { priceInCents: true },
      _max: { priceInCents: true },
      _count: true,
    }),
    // 5 most recent products with primary image
    db.product.findMany({
      where: { shopId },
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        isActive: true,
        createdAt: true,
        images: { take: 1, orderBy: { position: "asc" }, select: { url: true } },
        variants: { select: { stock: true, priceInCents: true } },
        category: { select: { name: true } },
      },
    }),
    // Out of stock variants
    db.productVariant.count({
      where: { product: { shopId }, stock: 0 },
    }),
    // Orders placed today
    db.order.count({
      where: { shopId, createdAt: { gte: startOfToday } },
    }),
    // Revenue today (sum of totalCents)
    db.order.aggregate({
      where: { shopId, createdAt: { gte: startOfToday } },
      _sum: { totalCents: true },
    }),
  ]);

  return {
    productCount,
    activeProductCount,
    inactiveProductCount: productCount - activeProductCount,
    variantCount: variantAgg._count,
    totalStock: variantAgg._sum.stock ?? 0,
    minPrice: variantAgg._min.priceInCents,
    maxPrice: variantAgg._max.priceInCents,
    outOfStockCount,
    recentProducts,
    ordersToday,
    revenueTodayCents: revenueToday._sum.totalCents ?? 0,
  };
}
