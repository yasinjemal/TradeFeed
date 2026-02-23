// ============================================================
// Server Actions — Product Image Upload & Delete
// ============================================================
// Handles image upload (base64 stored in DB) and deletion.
// Client compresses images before upload to keep payloads small.
//
// Phase 5: Swap base64 → Uploadthing/Cloudinary for CDN delivery.
// ============================================================

"use server";

import { requireShopAccess } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

type ImageActionResult = {
  success: boolean;
  error?: string;
};

const MAX_IMAGES = 8;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB per file

/**
 * Upload one or more product images.
 *
 * WHAT: Accepts compressed images via FormData, converts to base64, stores in DB.
 * WHY: Sellers need product photos. Base64 storage = zero external dependencies.
 *
 * Client-side compression (1200px max, JPEG 0.85) keeps payloads under ~200KB each.
 */
export async function uploadProductImagesAction(
  shopSlug: string,
  productId: string,
  formData: FormData
): Promise<ImageActionResult> {
  try {
    const access = await requireShopAccess(shopSlug);
    if (!access) return { success: false, error: "Access denied." };

    const product = await db.product.findFirst({
      where: { id: productId, shopId: access.shopId },
      select: { id: true, _count: { select: { images: true } } },
    });
    if (!product) return { success: false, error: "Product not found." };

    const currentCount = product._count.images;
    const files = formData.getAll("images") as File[];

    if (files.length === 0 || (files.length === 1 && !files[0]?.size)) {
      return { success: false, error: "No files selected." };
    }

    if (currentCount + files.length > MAX_IMAGES) {
      return {
        success: false,
        error: `Max ${MAX_IMAGES} images. You have ${currentCount}, trying to add ${files.length}.`,
      };
    }

    // Validate each file
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return { success: false, error: `"${file.name}" exceeds 5MB limit.` };
      }
      if (!file.type.startsWith("image/")) {
        return { success: false, error: `"${file.name}" is not an image.` };
      }
    }

    // Convert to base64 and store
    const creates = files.map(async (file, index) => {
      const buffer = Buffer.from(await file.arrayBuffer());
      const base64 = buffer.toString("base64");
      const dataUrl = `data:${file.type};base64,${base64}`;

      return db.productImage.create({
        data: {
          productId,
          url: dataUrl,
          altText: file.name.replace(/\.[^/.]+$/, ""),
          position: currentCount + index,
        },
      });
    });

    await Promise.all(creates);
    revalidatePath(`/dashboard/${shopSlug}/products/${productId}`);
    return { success: true };
  } catch (error) {
    console.error("[uploadProductImages]", error);
    return { success: false, error: "Upload failed. Please try again." };
  }
}

/**
 * Delete a product image.
 */
export async function deleteProductImageAction(
  shopSlug: string,
  productId: string,
  imageId: string
): Promise<ImageActionResult> {
  try {
    const access = await requireShopAccess(shopSlug);
    if (!access) return { success: false, error: "Access denied." };

    const image = await db.productImage.findFirst({
      where: { id: imageId, productId, product: { shopId: access.shopId } },
      select: { id: true },
    });
    if (!image) return { success: false, error: "Image not found." };

    await db.productImage.delete({ where: { id: imageId } });
    revalidatePath(`/dashboard/${shopSlug}/products/${productId}`);
    return { success: true };
  } catch (error) {
    console.error("[deleteProductImage]", error);
    return { success: false, error: "Delete failed." };
  }
}
