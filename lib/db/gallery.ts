// ============================================================
// Data Access — Shop Gallery (CRUD)
// ============================================================
// Manages gallery images and videos for a shop's profile.
// Builds buyer trust by showing the physical shop, team, etc.
//
// RULES:
// - All mutations scoped by shopId (multi-tenant safety)
// - Gallery items ordered by position
// - Max 12 items per shop (prevent abuse)
// ============================================================

import { db } from "@/lib/db";
import type { GalleryMediaType } from "@prisma/client";

const MAX_GALLERY_ITEMS = 12;

/**
 * Get all gallery items for a shop, ordered by position.
 */
export async function getShopGallery(shopId: string) {
  return db.shopGalleryItem.findMany({
    where: { shopId },
    orderBy: { position: "asc" },
    select: {
      id: true,
      url: true,
      key: true,
      type: true,
      caption: true,
      position: true,
      createdAt: true,
    },
  });
}

/**
 * Add a gallery item to a shop.
 * Position defaults to the next available slot.
 */
export async function addGalleryItem(
  shopId: string,
  data: {
    url: string;
    key?: string;
    type: GalleryMediaType;
    caption?: string;
  }
) {
  // Check limit
  const count = await db.shopGalleryItem.count({ where: { shopId } });
  if (count >= MAX_GALLERY_ITEMS) {
    throw new Error(`Gallery limit reached (max ${MAX_GALLERY_ITEMS})`);
  }

  // Find the highest position
  const maxPos = await db.shopGalleryItem.aggregate({
    where: { shopId },
    _max: { position: true },
  });
  const nextPosition = (maxPos._max.position ?? -1) + 1;

  return db.shopGalleryItem.create({
    data: {
      shopId,
      url: data.url,
      key: data.key ?? null,
      type: data.type,
      caption: data.caption ?? null,
      position: nextPosition,
    },
  });
}

/**
 * Update a gallery item's caption.
 */
export async function updateGalleryCaption(
  itemId: string,
  shopId: string,
  caption: string
) {
  return db.shopGalleryItem.updateMany({
    where: { id: itemId, shopId },
    data: { caption },
  });
}

/**
 * Delete a gallery item.
 * Returns the deleted item (for Uploadthing key cleanup).
 */
export async function deleteGalleryItem(itemId: string, shopId: string) {
  // Verify ownership
  const item = await db.shopGalleryItem.findFirst({
    where: { id: itemId, shopId },
    select: { id: true, key: true },
  });
  if (!item) return null;

  await db.shopGalleryItem.delete({ where: { id: item.id } });
  return item;
}
