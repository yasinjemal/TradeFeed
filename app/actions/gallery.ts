// ============================================================
// Server Actions — Shop Gallery
// ============================================================
// CRUD actions for managing shop gallery images and videos.
// ============================================================

"use server";

import { revalidatePath } from "next/cache";
import { requireShopAccess } from "@/lib/auth";
import {
  getShopGallery,
  addGalleryItem,
  updateGalleryCaption,
  deleteGalleryItem,
} from "@/lib/db/gallery";
import type { GalleryMediaType } from "@prisma/client";

type ActionResult = {
  success: boolean;
  error?: string;
};

/**
 * Get gallery items for a shop (used in dashboard settings).
 */
export async function getGalleryAction(shopSlug: string) {
  try {
    const access = await requireShopAccess(shopSlug);
    if (!access) return { success: false as const, error: "Access denied.", items: [] };
    const items = await getShopGallery(access.shopId);
    return { success: true as const, items };
  } catch {
    return { success: false as const, error: "Failed to load gallery.", items: [] };
  }
}

/**
 * Add a new gallery item after upload completes.
 */
export async function addGalleryItemAction(
  shopSlug: string,
  url: string,
  key: string,
  type: GalleryMediaType,
  caption?: string
): Promise<ActionResult> {
  try {
    const access = await requireShopAccess(shopSlug);
    if (!access) return { success: false, error: "Access denied." };

    await addGalleryItem(access.shopId, { url, key, type, caption });

    revalidatePath(`/dashboard/${shopSlug}/settings`);
    revalidatePath(`/catalog/${shopSlug}`);
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to add gallery item.";
    return { success: false, error: message };
  }
}

/**
 * Update a gallery item's caption.
 */
export async function updateGalleryCaptionAction(
  shopSlug: string,
  itemId: string,
  caption: string
): Promise<ActionResult> {
  try {
    const access = await requireShopAccess(shopSlug);
    if (!access) return { success: false, error: "Access denied." };

    await updateGalleryCaption(itemId, access.shopId, caption);

    revalidatePath(`/dashboard/${shopSlug}/settings`);
    revalidatePath(`/catalog/${shopSlug}`);
    return { success: true };
  } catch {
    return { success: false, error: "Failed to update caption." };
  }
}

/**
 * Delete a gallery item and optionally clean up Uploadthing file.
 */
export async function deleteGalleryItemAction(
  shopSlug: string,
  itemId: string
): Promise<ActionResult> {
  try {
    const access = await requireShopAccess(shopSlug);
    if (!access) return { success: false, error: "Access denied." };

    const deleted = await deleteGalleryItem(itemId, access.shopId);
    if (!deleted) return { success: false, error: "Gallery item not found." };

    // Clean up Uploadthing file if key exists
    if (deleted.key) {
      try {
        const { UTApi } = await import("uploadthing/server");
        const utapi = new UTApi();
        await utapi.deleteFiles([deleted.key]);
      } catch (e) {
        console.error("[Gallery] Failed to delete Uploadthing file:", e);
        // Don't fail the action — DB record is already deleted
      }
    }

    revalidatePath(`/dashboard/${shopSlug}/settings`);
    revalidatePath(`/catalog/${shopSlug}`);
    return { success: true };
  } catch {
    return { success: false, error: "Failed to delete gallery item." };
  }
}
