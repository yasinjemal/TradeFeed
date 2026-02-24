// ============================================================
// Server Actions — Product Image Management
// ============================================================
// After images are uploaded to Uploadthing CDN (client-side),
// this action saves the URLs + keys to our database.
// Delete action removes from both DB and Uploadthing CDN.
//
// Flow: Client → Uploadthing CDN → onClientUploadComplete → saveProductImagesAction → DB
// ============================================================

"use server";

import { requireShopAccess } from "@/lib/auth";
import { db } from "@/lib/db";
import { utapi } from "@/lib/ut-api";
import { revalidatePath } from "next/cache";

type ImageActionResult = {
  success: boolean;
  error?: string;
};

const MAX_IMAGES = 8;

/** Data from Uploadthing's onClientUploadComplete callback */
interface UploadedImage {
  url: string;
  key: string;
  name: string;
}

/**
 * Save uploaded image URLs to the database.
 *
 * WHAT: Receives CDN URLs from Uploadthing (already uploaded), saves to DB.
 * WHY: Uploadthing handles the heavy lifting (CDN, compression, delivery).
 *      We just store the URL + key for retrieval and deletion.
 *
 * Called from the client AFTER Uploadthing upload completes.
 */
export async function saveProductImagesAction(
  shopSlug: string,
  productId: string,
  images: UploadedImage[]
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

    if (images.length === 0) {
      return { success: false, error: "No images to save." };
    }

    if (currentCount + images.length > MAX_IMAGES) {
      return {
        success: false,
        error: `Max ${MAX_IMAGES} images. You have ${currentCount}, trying to add ${images.length}.`,
      };
    }

    // Save all image URLs to the database
    await db.productImage.createMany({
      data: images.map((img, index) => ({
        productId,
        url: img.url,
        key: img.key,
        altText: img.name.replace(/\.[^/.]+$/, ""),
        position: currentCount + index,
      })),
    });

    revalidatePath(`/dashboard/${shopSlug}/products/${productId}`);
    return { success: true };
  } catch (error) {
    console.error("[saveProductImages]", error);
    return { success: false, error: "Failed to save images. Please try again." };
  }
}

/**
 * Delete a product image from both DB and Uploadthing CDN.
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
      select: { id: true, key: true },
    });
    if (!image) return { success: false, error: "Image not found." };

    // Delete from Uploadthing CDN (if we have the key)
    if (image.key) {
      try {
        await utapi.deleteFiles(image.key);
      } catch (err) {
        console.warn("[deleteProductImage] Failed to delete from CDN:", err);
        // Continue with DB deletion even if CDN delete fails
      }
    }

    // Delete from database
    await db.productImage.delete({ where: { id: imageId } });
    revalidatePath(`/dashboard/${shopSlug}/products/${productId}`);
    return { success: true };
  } catch (error) {
    console.error("[deleteProductImage]", error);
    return { success: false, error: "Delete failed." };
  }
}
