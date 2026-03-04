// ============================================================
// Data Access — Stock Drops
// ============================================================
// CRUD for Drop + DropItem. All scoped by shopId.
// ============================================================

import { db } from "@/lib/db";
import type { DropCreateInput, DropUpdateInput } from "@/lib/validation/drop";

// ══════════════════════════════════════════════════════════════
// DROPS — Dashboard (seller-facing)
// ══════════════════════════════════════════════════════════════

/** Get all drops for a shop (dashboard) */
export async function getDrops(shopId: string) {
  return db.drop.findMany({
    where: { shopId, isActive: true },
    include: {
      items: true,
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

/** Get a single drop by ID (dashboard) */
export async function getDrop(dropId: string, shopId: string) {
  return db.drop.findFirst({
    where: { id: dropId, shopId, isActive: true },
    include: {
      items: true,
    },
  });
}

/** Create a drop with items */
export async function createDrop(input: DropCreateInput, shopId: string) {
  return db.drop.create({
    data: {
      title: input.title,
      message: input.message,
      shopId,
      items: {
        create: input.items.map((item) => ({
          productId: item.productId || null,
          productName: item.productName,
          priceSnapshot: item.priceSnapshot,
          imageUrl: item.imageUrl || null,
        })),
      },
    },
    include: {
      items: true,
    },
  });
}

/** Update a drop */
export async function updateDrop(
  dropId: string,
  shopId: string,
  input: DropUpdateInput
) {
  const existing = await db.drop.findFirst({
    where: { id: dropId, shopId, isActive: true },
  });
  if (!existing) return null;

  // Build update data
  const data: Record<string, unknown> = {};
  if (input.title !== undefined) data.title = input.title;
  if (input.message !== undefined) data.message = input.message;

  // If items are provided, replace all items
  if (input.items) {
    await db.dropItem.deleteMany({ where: { dropId } });
    await db.dropItem.createMany({
      data: input.items.map((item) => ({
        dropId,
        productId: item.productId || null,
        productName: item.productName,
        priceSnapshot: item.priceSnapshot,
        imageUrl: item.imageUrl || null,
      })),
    });
  }

  return db.drop.update({
    where: { id: dropId },
    data,
    include: { items: true },
  });
}

/** Publish a drop (DRAFT → PUBLISHED) */
export async function publishDrop(dropId: string, shopId: string) {
  const existing = await db.drop.findFirst({
    where: { id: dropId, shopId, isActive: true, status: "DRAFT" },
  });
  if (!existing) return null;

  return db.drop.update({
    where: { id: dropId },
    data: {
      status: "PUBLISHED",
      publishedAt: new Date(),
    },
    include: { items: true },
  });
}

/** Archive a drop */
export async function archiveDrop(dropId: string, shopId: string) {
  const existing = await db.drop.findFirst({
    where: { id: dropId, shopId, isActive: true },
  });
  if (!existing) return null;

  return db.drop.update({
    where: { id: dropId },
    data: { status: "ARCHIVED" },
  });
}

/** Soft-delete a drop */
export async function deleteDrop(dropId: string, shopId: string) {
  const existing = await db.drop.findFirst({
    where: { id: dropId, shopId },
  });
  if (!existing) return null;

  return db.drop.update({
    where: { id: dropId },
    data: { isActive: false },
  });
}

// ══════════════════════════════════════════════════════════════
// DROPS — Public (buyer-facing)
// ══════════════════════════════════════════════════════════════

/** Get a published drop for public viewing */
export async function getPublicDrop(dropId: string) {
  return db.drop.findFirst({
    where: {
      id: dropId,
      status: "PUBLISHED",
      isActive: true,
    },
    include: {
      items: true,
      shop: {
        select: {
          id: true,
          name: true,
          slug: true,
          whatsappNumber: true,
          logoUrl: true,
          city: true,
          isVerified: true,
        },
      },
    },
  });
}

/** Get recent published drops for a shop's catalog */
export async function getShopDrops(shopSlug: string, limit = 10) {
  return db.drop.findMany({
    where: {
      shop: { slug: shopSlug },
      status: "PUBLISHED",
      isActive: true,
    },
    include: {
      items: true,
      _count: { select: { items: true } },
    },
    orderBy: { publishedAt: "desc" },
    take: limit,
  });
}

/** Get products for a shop (for the drop product picker) */
export async function getShopProductsForDrop(shopId: string) {
  return db.product.findMany({
    where: { shopId, isActive: true },
    select: {
      id: true,
      name: true,
      minPriceCents: true,
      images: {
        orderBy: { position: "asc" },
        take: 1,
        select: { url: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
