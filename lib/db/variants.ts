// ============================================================
// Data Access — Product Variants
// ============================================================
// All database operations for the ProductVariant model live here.
//
// RULES:
// - Every mutation MUST verify the parent product belongs to the shop
// - Never allow variant operations without shopId verification
// - Price stored as integer cents (ZAR)
// - Stock must be non-negative
// ============================================================

import { db } from "@/lib/db";
import type { VariantCreateInput, VariantUpdateInput } from "@/lib/validation/product";

// ── Price Denormalization ──────────────────────────────────
// After every variant create/update/delete, recalculate the
// minPriceCents and maxPriceCents on the parent Product.
// This enables efficient price sorting on marketplace queries
// without joining/aggregating variants at read time.
// ───────────────────────────────────────────────────────────

export async function syncProductPriceRange(productId: string): Promise<void> {
  const variants = await db.productVariant.findMany({
    where: { productId, isActive: true },
    select: { priceInCents: true },
  });

  const prices = variants.map((v) => v.priceInCents);
  const minPriceCents = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPriceCents = prices.length > 0 ? Math.max(...prices) : 0;

  await db.product.update({
    where: { id: productId },
    data: { minPriceCents, maxPriceCents },
  });
}

/**
 * Verify a product belongs to a shop.
 *
 * WHAT: Checks product ownership before any variant mutation.
 * WHY: Variants don't have a direct shopId — they belong to a Product
 * which belongs to a Shop. We must trace the chain.
 *
 * MULTI-TENANT: This is the guard that prevents cross-shop variant manipulation.
 */
async function verifyProductOwnership(
  productId: string,
  shopId: string
): Promise<boolean> {
  const product = await db.product.findFirst({
    where: { id: productId, shopId },
    select: { id: true },
  });
  return product !== null;
}

/**
 * Create a new variant for a product.
 *
 * WHAT: Adds an option1+option2+price+stock combination to a product.
 * WHY: Variants are the buyable unit — what buyers actually order.
 *
 * MULTI-TENANT: Verifies product belongs to shop before creating.
 * UNIQUE CONSTRAINT: DB enforces unique (productId, size, color) —
 * Prisma will throw if duplicate exists.
 */
export async function createVariant(
  productId: string,
  shopId: string,
  input: VariantCreateInput
) {
  // Verify product belongs to this shop
  const isOwner = await verifyProductOwnership(productId, shopId);
  if (!isOwner) {
    return null;
  }

  const variant = await db.productVariant.create({
    data: {
      productId,
      size: input.size,
      color: input.color || null,
      priceInCents: input.priceInRands, // Already converted to cents by Zod transform
      retailPriceCents: input.retailPriceInRands ?? null, // Optional retail price in cents
      stock: input.stock,
      sku: input.sku || null,
    },
  });

  // Keep denormalized price range in sync
  await syncProductPriceRange(productId);

  return variant;
}

/**
 * Update a variant.
 *
 * WHAT: Partial update of variant fields (price, stock, etc.).
 * WHY: Seller updates stock levels or adjusts pricing.
 *
 * MULTI-TENANT: Verifies the variant's product belongs to the shop.
 */
export async function updateVariant(
  variantId: string,
  shopId: string,
  input: VariantUpdateInput
) {
  // Get the variant and verify its product belongs to this shop
  const variant = await db.productVariant.findFirst({
    where: { id: variantId },
    include: { product: { select: { shopId: true } } },
  });

  if (!variant || variant.product.shopId !== shopId) {
    return null;
  }

  const updated = await db.productVariant.update({
    where: { id: variantId },
    data: {
      ...(input.size !== undefined && { size: input.size }),
      ...(input.color !== undefined && { color: input.color || null }),
      ...(input.priceInRands !== undefined && {
        priceInCents: input.priceInRands, // Already cents from Zod
      }),
      ...(input.retailPriceInRands !== undefined && {
        retailPriceCents: input.retailPriceInRands, // null clears it, number sets it
      }),
      ...(input.stock !== undefined && { stock: input.stock }),
      ...(input.sku !== undefined && { sku: input.sku || null }),
    },
  });

  // Keep denormalized price range in sync (price may have changed)
  if (input.priceInRands !== undefined) {
    await syncProductPriceRange(variant.productId);
  }

  return updated;
}

/**
 * Delete a variant.
 *
 * WHAT: Removes a variant from a product.
 * WHY: Seller discontinues a specific option combo.
 *
 * MULTI-TENANT: Verifies ownership before deletion.
 */
export async function deleteVariant(variantId: string, shopId: string) {
  // Verify ownership
  const variant = await db.productVariant.findFirst({
    where: { id: variantId },
    include: { product: { select: { shopId: true } } },
  });

  if (!variant || variant.product.shopId !== shopId) {
    return null;
  }

  const deleted = await db.productVariant.delete({
    where: { id: variantId },
  });

  // Keep denormalized price range in sync
  await syncProductPriceRange(variant.productId);

  return deleted;
}

/**
 * Batch create multiple variants for a product.
 *
 * WHAT: Creates all size × color combinations in one DB call.
 * WHY: Smart variant creator generates many variants at once.
 * Uses createMany with skipDuplicates to avoid conflicts.
 */
export async function batchCreateVariants(
  productId: string,
  shopId: string,
  variants: { size: string; color: string | null; priceInCents: number; stock: number; retailPriceCents?: number | null }[]
) {
  const isOwner = await verifyProductOwnership(productId, shopId);
  if (!isOwner) return null;

  const result = await db.productVariant.createMany({
    data: variants.map((v) => ({
      productId,
      size: v.size,
      color: v.color,
      priceInCents: v.priceInCents,
      retailPriceCents: v.retailPriceCents ?? null,
      stock: v.stock,
    })),
    skipDuplicates: true,
  });

  // Keep denormalized price range in sync
  await syncProductPriceRange(productId);

  return result;
}
