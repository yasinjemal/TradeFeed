// ============================================================
// Server Actions — Platform Admin
// ============================================================
// Actions for platform-level admin operations.
// All actions require platform admin auth (ADMIN_USER_IDS).
// ============================================================

"use server";

import { requireAdmin } from "@/lib/auth/admin";
import {
  setShopVerified,
  setShopActive,
  setShopFeatured,
  createGlobalCategory,
  updateGlobalCategory,
  reorderCategories,
  deleteGlobalCategory,
  adminCancelPromotion,
} from "@/lib/db/admin";
import { revalidatePath } from "next/cache";

type ActionResult = { success: true; message: string } | { success: false; error: string };

// ══════════════════════════════════════════════════════════════
// Shop Management
// ══════════════════════════════════════════════════════════════

/**
 * Verify a shop — grants the verified badge.
 */
export async function verifyShopAction(shopId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const shop = await setShopVerified(shopId, true);
    revalidatePath("/admin");
    revalidatePath(`/catalog/${shop.name}`);
    return { success: true, message: `${shop.name} has been verified.` };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to verify shop.",
    };
  }
}

/**
 * Unverify a shop — removes the verified badge.
 */
export async function unverifyShopAction(shopId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const shop = await setShopVerified(shopId, false);
    revalidatePath("/admin");
    return { success: true, message: `${shop.name} verification removed.` };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to unverify shop.",
    };
  }
}

/**
 * Deactivate a shop — hides from public catalog.
 */
export async function deactivateShopAction(shopId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const shop = await setShopActive(shopId, false);
    revalidatePath("/admin");
    return { success: true, message: `${shop.name} has been deactivated.` };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to deactivate shop.",
    };
  }
}

/**
 * Reactivate a shop — makes it visible again.
 */
export async function reactivateShopAction(shopId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const shop = await setShopActive(shopId, true);
    revalidatePath("/admin");
    return { success: true, message: `${shop.name} has been reactivated.` };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to reactivate shop.",
    };
  }
}

/**
 * M7.2 — Toggle featured shop status.
 */
export async function toggleFeaturedShopAction(shopId: string, featured: boolean): Promise<ActionResult> {
  try {
    await requireAdmin();
    const shop = await setShopFeatured(shopId, featured);
    revalidatePath("/admin");
    revalidatePath("/marketplace");
    return {
      success: true,
      message: featured
        ? `${shop.name} is now featured on the marketplace.`
        : `${shop.name} removed from featured shops.`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update featured status.",
    };
  }
}

// ══════════════════════════════════════════════════════════════
// M7.1 — Global Category CRUD
// ══════════════════════════════════════════════════════════════

/**
 * Create a new global category.
 */
export async function createCategoryAction(data: {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  imageUrl?: string;
  parentId?: string;
  displayOrder?: number;
}): Promise<ActionResult> {
  try {
    await requireAdmin();
    const cat = await createGlobalCategory(data);
    revalidatePath("/admin/categories");
    revalidatePath("/marketplace");
    return { success: true, message: `Category "${cat.name}" created.` };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create category.",
    };
  }
}

/**
 * Update an existing global category.
 */
export async function updateCategoryAction(
  categoryId: string,
  data: {
    name?: string;
    slug?: string;
    description?: string | null;
    icon?: string | null;
    imageUrl?: string | null;
    parentId?: string | null;
    displayOrder?: number;
    isActive?: boolean;
  }
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const cat = await updateGlobalCategory(categoryId, data);
    revalidatePath("/admin/categories");
    revalidatePath("/marketplace");
    return { success: true, message: `Category "${cat.name}" updated.` };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update category.",
    };
  }
}

/**
 * Reorder categories — batch update display orders.
 */
export async function reorderCategoriesAction(
  updates: { id: string; displayOrder: number }[]
): Promise<ActionResult> {
  try {
    await requireAdmin();
    await reorderCategories(updates);
    revalidatePath("/admin/categories");
    revalidatePath("/marketplace");
    return { success: true, message: "Categories reordered." };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to reorder categories.",
    };
  }
}

/**
 * Delete a global category (only if empty).
 */
export async function deleteCategoryAction(categoryId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const result = await deleteGlobalCategory(categoryId);
    if (!result) return { success: false, error: "Category not found." };
    revalidatePath("/admin/categories");
    revalidatePath("/marketplace");
    return { success: true, message: `Category "${result.name}" deleted.` };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete category.",
    };
  }
}

// ══════════════════════════════════════════════════════════════
// M7.4 — Promotion Moderation
// ══════════════════════════════════════════════════════════════

/**
 * Admin cancel a promotion for policy violations.
 */
export async function adminCancelPromotionAction(promotionId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const result = await adminCancelPromotion(promotionId);
    revalidatePath("/admin/promotions");
    return {
      success: true,
      message: `Promotion for "${result.product.name}" (${result.shop.name}) has been cancelled.`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to cancel promotion.",
    };
  }
}
