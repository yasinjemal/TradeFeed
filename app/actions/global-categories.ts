// ============================================================
// Server Actions — Global Category Mapping
// ============================================================
// Actions for assigning products to platform-wide marketplace
// categories. Used by bulk mapping tool and individual picker.
// ============================================================

"use server";

import { revalidatePath } from "next/cache";
import { requireShopAccess } from "@/lib/auth";
import { bulkSetGlobalCategory } from "@/lib/db/global-categories";
import { db } from "@/lib/db";

type ActionResult = {
  success: boolean;
  error?: string;
  count?: number;
};

/**
 * Assign a single product to a global category.
 */
export async function setProductGlobalCategoryAction(
  shopSlug: string,
  productId: string,
  globalCategoryId: string | null
): Promise<ActionResult> {
  try {
    const access = await requireShopAccess(shopSlug);
    if (!access) {
      return { success: false, error: "Access denied." };
    }

    // Verify product belongs to this shop
    const product = await db.product.findFirst({
      where: { id: productId, shopId: access.shopId },
      select: { id: true },
    });
    if (!product) {
      return { success: false, error: "Product not found." };
    }

    await db.product.update({
      where: { id: productId },
      data: { globalCategoryId: globalCategoryId || null },
    });

    revalidatePath(`/dashboard/${shopSlug}/products`);
    revalidatePath(`/dashboard/${shopSlug}/products/${productId}`);
    revalidatePath(`/dashboard/${shopSlug}/marketplace-categories`);

    return { success: true };
  } catch (error) {
    console.error("[setProductGlobalCategoryAction] Error:", error);
    return { success: false, error: "Something went wrong." };
  }
}

/**
 * Bulk assign a global category to multiple products at once.
 */
export async function bulkSetGlobalCategoryAction(
  shopSlug: string,
  productIds: string[],
  globalCategoryId: string | null
): Promise<ActionResult> {
  try {
    const access = await requireShopAccess(shopSlug);
    if (!access) {
      return { success: false, error: "Access denied." };
    }

    if (productIds.length === 0) {
      return { success: false, error: "No products selected." };
    }

    const result = await bulkSetGlobalCategory(
      productIds,
      globalCategoryId,
      access.shopId
    );

    revalidatePath(`/dashboard/${shopSlug}/products`);
    revalidatePath(`/dashboard/${shopSlug}/marketplace-categories`);

    return { success: true, count: result.count };
  } catch (error) {
    console.error("[bulkSetGlobalCategoryAction] Error:", error);
    return { success: false, error: "Something went wrong." };
  }
}
