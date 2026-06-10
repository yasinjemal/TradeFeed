// ============================================================
// Server Action — Background Removal (Phase 3)
// ============================================================
// Takes a ProductImage, strips the background via the provider,
// uploads the cleaned image to UploadThing, swaps the URL on
// the ProductImage row, and deletes the old file.
//
// Tenant-safe: verifies the image belongs to the seller's shop.
// Gated behind FEATURE_FLAGS.BG_REMOVAL.
// ============================================================

"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { utapi } from "@/lib/ut-api";
import { requireShopAccess } from "@/lib/auth";
import { FEATURE_FLAGS } from "@/lib/config/feature-flags";
import { removeBackground, isBgRemovalConfigured } from "@/lib/ai/remove-background";
import { reportError } from "@/lib/telemetry";

type Result =
  | { success: true; url: string }
  | { success: false; error: string };

export async function removeImageBackgroundAction(
  shopSlug: string,
  productImageId: string
): Promise<Result> {
  if (!FEATURE_FLAGS.BG_REMOVAL) {
    return { success: false, error: "Not available." };
  }
  if (!isBgRemovalConfigured()) {
    return { success: false, error: "Background removal isn't set up yet. Check back soon!" };
  }

  try {
    const access = await requireShopAccess(shopSlug);
    if (!access) {
      return { success: false, error: "Access denied." };
    }

    // ── Tenant check: image → product → this shop ───────
    const image = await db.productImage.findFirst({
      where: { id: productImageId, product: { shopId: access.shopId } },
      select: { id: true, url: true, key: true },
    });
    if (!image) {
      return { success: false, error: "Image not found." };
    }

    // ── Provider call ────────────────────────────────────
    const result = await removeBackground(image.url);
    if (!result) {
      return { success: false, error: "Couldn't process this image. Try a clearer photo." };
    }

    // ── Upload cleaned image ─────────────────────────────
    const file = new File(
      [new Uint8Array(result.imageBuffer)],
      `bg-removed-${productImageId}.jpg`,
      { type: result.contentType }
    );
    const uploaded = await utapi.uploadFiles(file);
    if (uploaded.error || !uploaded.data) {
      return { success: false, error: "Upload failed. Please try again." };
    }

    // ── Swap URL on the image row ────────────────────────
    const oldKey = image.key;
    await db.productImage.update({
      where: { id: image.id },
      data: { url: uploaded.data.ufsUrl ?? uploaded.data.url, key: uploaded.data.key },
    });

    // Delete the old file (fire-and-forget — orphans are cheap)
    if (oldKey) {
      utapi.deleteFiles(oldKey).catch(() => {});
    }

    revalidatePath(`/dashboard/${shopSlug}/products`);
    return { success: true, url: uploaded.data.ufsUrl ?? uploaded.data.url };
  } catch (error) {
    await reportError("removeImageBackgroundAction", error, { shopSlug, productImageId });
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
