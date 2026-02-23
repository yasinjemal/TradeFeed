// ============================================================
// Data Access — Products
// ============================================================
// All database operations for the Product model live here.
//
// RULES:
// - EVERY query MUST filter by shopId — no exceptions
// - This is the ONLY place Prisma is called for products
// - Includes variants and images in reads for UI rendering
// - Business logic stays here, not in UI or actions
// ============================================================

import { db } from "@/lib/db";
import type { ProductCreateInput, ProductUpdateInput } from "@/lib/validation/product";

/**
 * Create a new product in a shop.
 *
 * WHAT: Creates a Product record scoped to a shopId.
 * WHY: Products are the core catalog entity. Must be tenant-scoped.
 *
 * MULTI-TENANT: shopId is a required parameter — never inferred.
 * The caller (server action) verifies the user has access to this shop.
 */
export async function createProduct(
  input: ProductCreateInput,
  shopId: string
) {
  return db.product.create({
    data: {
      name: input.name,
      description: input.description || null,
      isActive: input.isActive,
      shopId,
      categoryId: input.categoryId || null,
    },
    include: {
      variants: true,
      images: { orderBy: { position: "asc" } },
      category: true,
    },
  });
}

/**
 * Get all products for a shop.
 *
 * WHAT: Returns all products belonging to a shop with their variants.
 * WHY: Dashboard product list shows all products with stock/price info.
 *
 * MULTI-TENANT: Filtered by shopId — never returns cross-tenant data.
 */
export async function getProducts(shopId: string) {
  return db.product.findMany({
    where: { shopId },
    include: {
      variants: {
        orderBy: { createdAt: "asc" },
      },
      images: {
        orderBy: { position: "asc" },
        take: 1, // Only the primary image for list view
      },
      category: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Get a single product by ID — scoped by shopId.
 *
 * WHAT: Fetches a product with all its variants and images.
 * WHY: Product detail/edit page needs the full picture.
 *
 * MULTI-TENANT CRITICAL: Always filter by BOTH productId AND shopId.
 * If we only filter by productId, a malicious user could access another
 * shop's products by guessing IDs.
 */
export async function getProduct(productId: string, shopId: string) {
  return db.product.findFirst({
    where: {
      id: productId,
      shopId, // CRITICAL: Tenant isolation
    },
    include: {
      variants: {
        orderBy: [{ size: "asc" }, { color: "asc" }],
      },
      images: {
        orderBy: { position: "asc" },
      },
      category: true,
    },
  });
}

/**
 * Update a product — scoped by shopId.
 *
 * WHAT: Partial update of product fields.
 * WHY: Seller may only change name, toggle active, etc.
 *
 * MULTI-TENANT: Uses findFirst with shopId check before updating.
 * Prevents updating a product that belongs to another shop.
 */
export async function updateProduct(
  productId: string,
  shopId: string,
  input: ProductUpdateInput
) {
  // First verify the product belongs to this shop
  const existing = await db.product.findFirst({
    where: { id: productId, shopId },
    select: { id: true },
  });

  if (!existing) {
    return null; // Product not found or doesn't belong to this shop
  }

  return db.product.update({
    where: { id: productId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && {
        description: input.description || null,
      }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
      ...(input.categoryId !== undefined && {
        categoryId: input.categoryId || null,
      }),
    },
    include: {
      variants: { orderBy: { createdAt: "asc" } },
      images: { orderBy: { position: "asc" } },
      category: true,
    },
  });
}

/**
 * Delete a product — scoped by shopId.
 *
 * WHAT: Hard deletes a product and cascades to variants + images.
 * WHY: Sellers need to remove discontinued products from their catalog.
 *
 * MULTI-TENANT: Verifies shopId ownership before deletion.
 * CASCADE: Prisma schema has onDelete: Cascade for variants and images.
 */
export async function deleteProduct(productId: string, shopId: string) {
  // Verify the product belongs to this shop
  const existing = await db.product.findFirst({
    where: { id: productId, shopId },
    select: { id: true },
  });

  if (!existing) {
    return null;
  }

  return db.product.delete({
    where: { id: productId },
  });
}

/**
 * Count products in a shop (for dashboard stats).
 */
export async function countProducts(shopId: string) {
  return db.product.count({
    where: { shopId },
  });
}
