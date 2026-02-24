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

  return db.productVariant.create({
    data: {
      productId,
      size: input.size,
      color: input.color || null,
      priceInCents: input.priceInRands, // Already converted to cents by Zod transform
      stock: input.stock,
      sku: input.sku || null,
    },
  });
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

  return db.productVariant.update({
    where: { id: variantId },
    data: {
      ...(input.size !== undefined && { size: input.size }),
      ...(input.color !== undefined && { color: input.color || null }),
      ...(input.priceInRands !== undefined && {
        priceInCents: input.priceInRands, // Already cents from Zod
      }),
      ...(input.stock !== undefined && { stock: input.stock }),
      ...(input.sku !== undefined && { sku: input.sku || null }),
    },
  });
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

  return db.productVariant.delete({
    where: { id: variantId },
  });
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
  variants: { size: string; color: string | null; priceInCents: number; stock: number }[]
) {
  const isOwner = await verifyProductOwnership(productId, shopId);
  if (!isOwner) return null;

  return db.productVariant.createMany({
    data: variants.map((v) => ({
      productId,
      size: v.size,
      color: v.color,
      priceInCents: v.priceInCents,
      stock: v.stock,
    })),
    skipDuplicates: true,
  });
}
