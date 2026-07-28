// ============================================================
// Server Actions — Product Video Management
// ============================================================
// One showcase video per product (v1), from three sources:
// - Link (YouTube or direct https video file) — free for all plans
// - Hosted upload via UploadThing — Starter+ (checkVideoUploadAccess)
//
// The pasted-URL flow re-runs lib/video/parse.ts ON THE SERVER —
// client classification is UX sugar only, never trusted. Upload
// saves verify the CDN hostname so an arbitrary URL can't be
// smuggled in as a hosted "upload" to bypass the plan gate.
// ============================================================

"use server";

import { requireShopAccess } from "@/lib/auth";
import { db } from "@/lib/db";
import { utapi } from "@/lib/ut-api";
import { revalidatePath } from "next/cache";
import { parseVideoUrl, isUploadThingUrl } from "@/lib/video/parse";
import {
  addVideoLinkSchema,
  saveVideoUploadSchema,
  MAX_VIDEOS_PER_PRODUCT,
} from "@/lib/validation/video";
import { checkVideoUploadAccess } from "@/lib/db/subscriptions";
import { FEATURE_FLAGS } from "@/lib/config/feature-flags";

export interface ProductVideoDto {
  id: string;
  url: string;
  source: "UPLOAD" | "YOUTUBE" | "DIRECT";
  thumbnailUrl: string | null;
}

type VideoActionResult = {
  success: boolean;
  error?: string;
  video?: ProductVideoDto | null;
};

async function getOwnedProduct(shopId: string, productId: string) {
  return db.product.findFirst({
    where: { id: productId, shopId },
    select: { id: true, _count: { select: { videos: true } } },
  });
}

function toDto(video: {
  id: string;
  url: string;
  source: "UPLOAD" | "YOUTUBE" | "DIRECT";
  thumbnailUrl: string | null;
}): ProductVideoDto {
  return {
    id: video.id,
    url: video.url,
    source: video.source,
    thumbnailUrl: video.thumbnailUrl,
  };
}

/**
 * Attach a video by pasted link (YouTube or direct file URL).
 * Free for every plan.
 */
export async function addProductVideoLinkAction(
  shopSlug: string,
  productId: string,
  rawUrl: string,
): Promise<VideoActionResult> {
  try {
    if (!FEATURE_FLAGS.PRODUCT_VIDEO) {
      return { success: false, error: "Product videos are not available yet." };
    }

    const access = await requireShopAccess(shopSlug, "catalog:manage");
    if (!access) return { success: false, error: "Access denied." };

    const parsedInput = addVideoLinkSchema.safeParse({ url: rawUrl });
    if (!parsedInput.success) {
      return { success: false, error: parsedInput.error.issues[0]?.message ?? "Invalid link." };
    }

    // Authoritative classification — never trust the client's idea
    // of what kind of URL this is.
    const parsed = parseVideoUrl(parsedInput.data.url);
    if (!parsed.ok) return { success: false, error: parsed.error };

    const product = await getOwnedProduct(access.shopId, productId);
    if (!product) return { success: false, error: "Product not found." };

    if (product._count.videos >= MAX_VIDEOS_PER_PRODUCT) {
      return {
        success: false,
        error: "This product already has a video. Remove it first to add a different one.",
      };
    }

    const video = await db.productVideo.create({
      data: {
        productId,
        source: parsed.video.source,
        url: parsed.video.url,
        thumbnailUrl: parsed.video.source === "YOUTUBE" ? parsed.video.thumbnailUrl : null,
        position: 0,
      },
      select: { id: true, url: true, source: true, thumbnailUrl: true },
    });

    revalidatePath(`/dashboard/${shopSlug}/products/${productId}`);
    return { success: true, video: toDto(video) };
  } catch (error) {
    console.error("[addProductVideoLink]", error);
    return { success: false, error: "Failed to add video. Please try again." };
  }
}

/**
 * Save a hosted video upload (after UploadThing completes).
 * Requires a paid plan (or active trial).
 */
export async function saveProductVideoUploadAction(
  shopSlug: string,
  productId: string,
  file: { url: string; key: string; name: string },
): Promise<VideoActionResult> {
  try {
    if (!FEATURE_FLAGS.PRODUCT_VIDEO) {
      return { success: false, error: "Product videos are not available yet." };
    }

    const access = await requireShopAccess(shopSlug, "catalog:manage");
    if (!access) return { success: false, error: "Access denied." };

    const parsed = saveVideoUploadSchema.safeParse(file);
    if (!parsed.success) return { success: false, error: "Invalid upload data." };

    // The plan gate — the UI hides the upload path for free shops,
    // but the server is the enforcement point.
    const uploadAccess = await checkVideoUploadAccess(access.shopId);
    if (!uploadAccess.allowed) {
      return {
        success: false,
        error: "Video uploads need a Starter plan or higher. YouTube links are free on every plan.",
      };
    }

    // Only UploadThing CDN URLs may be stored as UPLOAD — otherwise a
    // client could label an arbitrary URL an "upload".
    if (!isUploadThingUrl(parsed.data.url)) {
      return { success: false, error: "Invalid upload URL." };
    }

    const product = await getOwnedProduct(access.shopId, productId);
    if (!product) return { success: false, error: "Product not found." };

    if (product._count.videos >= MAX_VIDEOS_PER_PRODUCT) {
      // Clean up the just-uploaded file so it doesn't orphan on the CDN
      try {
        await utapi.deleteFiles(parsed.data.key);
      } catch (err) {
        console.warn("[saveProductVideoUpload] Orphan cleanup failed:", err);
      }
      return {
        success: false,
        error: "This product already has a video. Remove it first to add a different one.",
      };
    }

    const video = await db.productVideo.create({
      data: {
        productId,
        source: "UPLOAD",
        url: parsed.data.url,
        key: parsed.data.key,
        position: 0,
      },
      select: { id: true, url: true, source: true, thumbnailUrl: true },
    });

    revalidatePath(`/dashboard/${shopSlug}/products/${productId}`);
    return { success: true, video: toDto(video) };
  } catch (error) {
    console.error("[saveProductVideoUpload]", error);
    return { success: false, error: "Failed to save video. Please try again." };
  }
}

/**
 * Remove a product's video (and its CDN file for uploads).
 */
export async function deleteProductVideoAction(
  shopSlug: string,
  productId: string,
  videoId: string,
): Promise<VideoActionResult> {
  try {
    const access = await requireShopAccess(shopSlug, "catalog:manage");
    if (!access) return { success: false, error: "Access denied." };

    const video = await db.productVideo.findFirst({
      where: { id: videoId, productId, product: { shopId: access.shopId } },
      select: { id: true, key: true },
    });
    if (!video) return { success: false, error: "Video not found." };

    // Delete from UploadThing CDN (uploads only)
    if (video.key) {
      try {
        await utapi.deleteFiles(video.key);
      } catch (err) {
        console.warn("[deleteProductVideo] Failed to delete from CDN:", err);
        // Continue with DB deletion even if CDN delete fails
      }
    }

    await db.productVideo.delete({ where: { id: videoId } });
    revalidatePath(`/dashboard/${shopSlug}/products/${productId}`);
    return { success: true, video: null };
  } catch (error) {
    console.error("[deleteProductVideo]", error);
    return { success: false, error: "Delete failed." };
  }
}
