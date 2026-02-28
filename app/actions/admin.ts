// ============================================================
// Server Actions — Platform Admin
// ============================================================
// Actions for platform-level admin operations.
// All actions require platform admin auth (ADMIN_USER_IDS).
// Every mutation is audit-logged via logAdminAction().
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
import { logAdminAction } from "@/lib/db/admin-audit";
import { banUser, unbanUser } from "@/lib/db/admin-users";
import { flagProduct, unflagProduct } from "@/lib/db/admin-moderation";
import {
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  reorderPaymentMethods,
  approveUpgradeRequest,
  rejectUpgradeRequest,
} from "@/lib/db/manual-payments";
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
    const admin = await requireAdmin();
    const shop = await setShopVerified(shopId, true);
    await logAdminAction({
      adminId: admin.id, adminEmail: admin.email,
      action: "SHOP_VERIFY", entityType: "shop", entityId: shopId, entityName: shop.name,
    });
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
    const admin = await requireAdmin();
    const shop = await setShopVerified(shopId, false);
    await logAdminAction({
      adminId: admin.id, adminEmail: admin.email,
      action: "SHOP_UNVERIFY", entityType: "shop", entityId: shopId, entityName: shop.name,
    });
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
    const admin = await requireAdmin();
    const shop = await setShopActive(shopId, false);
    await logAdminAction({
      adminId: admin.id, adminEmail: admin.email,
      action: "SHOP_DEACTIVATE", entityType: "shop", entityId: shopId, entityName: shop.name,
    });
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
    const admin = await requireAdmin();
    const shop = await setShopActive(shopId, true);
    await logAdminAction({
      adminId: admin.id, adminEmail: admin.email,
      action: "SHOP_REACTIVATE", entityType: "shop", entityId: shopId, entityName: shop.name,
    });
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
    const admin = await requireAdmin();
    const shop = await setShopFeatured(shopId, featured);
    await logAdminAction({
      adminId: admin.id, adminEmail: admin.email,
      action: featured ? "SHOP_FEATURE" : "SHOP_UNFEATURE",
      entityType: "shop", entityId: shopId, entityName: shop.name,
    });
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
    const admin = await requireAdmin();
    const cat = await createGlobalCategory(data);
    await logAdminAction({
      adminId: admin.id, adminEmail: admin.email,
      action: "CATEGORY_CREATE", entityType: "category", entityId: cat.id, entityName: cat.name,
    });
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
    const admin = await requireAdmin();
    const cat = await updateGlobalCategory(categoryId, data);
    await logAdminAction({
      adminId: admin.id, adminEmail: admin.email,
      action: "CATEGORY_UPDATE", entityType: "category", entityId: categoryId, entityName: cat.name,
      details: data as Record<string, unknown>,
    });
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
    const admin = await requireAdmin();
    await reorderCategories(updates);
    await logAdminAction({
      adminId: admin.id, adminEmail: admin.email,
      action: "CATEGORY_REORDER", entityType: "category", entityId: "batch",
      entityName: `${updates.length} categories`,
    });
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
    const admin = await requireAdmin();
    const result = await deleteGlobalCategory(categoryId);
    if (!result) return { success: false, error: "Category not found." };
    await logAdminAction({
      adminId: admin.id, adminEmail: admin.email,
      action: "CATEGORY_DELETE", entityType: "category", entityId: categoryId, entityName: result.name,
    });
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
    const admin = await requireAdmin();
    const result = await adminCancelPromotion(promotionId);
    await logAdminAction({
      adminId: admin.id, adminEmail: admin.email,
      action: "PROMOTION_CANCEL", entityType: "promotion", entityId: promotionId,
      entityName: `${result.product.name} (${result.shop.name})`,
    });
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

// ══════════════════════════════════════════════════════════════
// User Management — Ban / Unban
// ══════════════════════════════════════════════════════════════

/**
 * Ban a user from the platform.
 */
export async function banUserAction(userId: string, reason: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const user = await banUser(userId, reason);
    await logAdminAction({
      adminId: admin.id, adminEmail: admin.email,
      action: "USER_BAN", entityType: "user", entityId: userId,
      entityName: user.email || userId,
      details: { reason },
    });
    revalidatePath("/admin/users");
    return { success: true, message: `User ${user.email} has been banned.` };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to ban user.",
    };
  }
}

/**
 * Unban a user — restores platform access.
 */
export async function unbanUserAction(userId: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const user = await unbanUser(userId);
    await logAdminAction({
      adminId: admin.id, adminEmail: admin.email,
      action: "USER_UNBAN", entityType: "user", entityId: userId,
      entityName: user.email || userId,
    });
    revalidatePath("/admin/users");
    return { success: true, message: `User ${user.email} has been unbanned.` };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to unban user.",
    };
  }
}

// ══════════════════════════════════════════════════════════════
// Product Moderation — Flag / Unflag
// ══════════════════════════════════════════════════════════════

/**
 * Flag a product for policy violation — deactivates it.
 */
export async function flagProductAction(productId: string, reason: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const product = await flagProduct(productId, reason);
    await logAdminAction({
      adminId: admin.id, adminEmail: admin.email,
      action: "PRODUCT_FLAG", entityType: "product", entityId: productId,
      entityName: `${product.name} (${product.shop.name})`,
      details: { reason },
    });
    revalidatePath("/admin/moderation");
    return { success: true, message: `"${product.name}" has been flagged and deactivated.` };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to flag product.",
    };
  }
}

/**
 * Unflag a product — restores it.
 */
export async function unflagProductAction(productId: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const product = await unflagProduct(productId);
    await logAdminAction({
      adminId: admin.id, adminEmail: admin.email,
      action: "PRODUCT_UNFLAG", entityType: "product", entityId: productId,
      entityName: `${product.name} (${product.shop.name})`,
    });
    revalidatePath("/admin/moderation");
    return { success: true, message: `"${product.name}" has been restored.` };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to unflag product.",
    };
  }
}

// ══════════════════════════════════════════════════════════════
// Manual Payment Methods
// ══════════════════════════════════════════════════════════════

/**
 * Create a manual payment method.
 */
export async function createPaymentMethodAction(data: {
  name: string;
  description?: string;
  instructions: string;
}): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const method = await createPaymentMethod(data);
    await logAdminAction({
      adminId: admin.id, adminEmail: admin.email,
      action: "PAYMENT_METHOD_CREATE", entityType: "payment_method",
      entityId: method.id, entityName: method.name,
    });
    revalidatePath("/admin/payment-methods");
    return { success: true, message: `"${method.name}" created.` };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create payment method.",
    };
  }
}

/**
 * Update a manual payment method.
 */
export async function updatePaymentMethodAction(
  id: string,
  data: {
    name?: string;
    description?: string;
    instructions?: string;
    isActive?: boolean;
    displayOrder?: number;
  },
): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const method = await updatePaymentMethod(id, data);
    await logAdminAction({
      adminId: admin.id, adminEmail: admin.email,
      action: "PAYMENT_METHOD_UPDATE", entityType: "payment_method",
      entityId: method.id, entityName: method.name,
    });
    revalidatePath("/admin/payment-methods");
    return { success: true, message: `"${method.name}" updated.` };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update payment method.",
    };
  }
}

/**
 * Delete a manual payment method.
 */
export async function deletePaymentMethodAction(id: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const method = await deletePaymentMethod(id);
    await logAdminAction({
      adminId: admin.id, adminEmail: admin.email,
      action: "PAYMENT_METHOD_DELETE", entityType: "payment_method",
      entityId: method.id, entityName: method.name,
    });
    revalidatePath("/admin/payment-methods");
    return { success: true, message: `"${method.name}" deleted.` };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete payment method.",
    };
  }
}

/**
 * Reorder manual payment methods.
 */
export async function reorderPaymentMethodsAction(
  orderedIds: string[],
): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    await reorderPaymentMethods(orderedIds);
    await logAdminAction({
      adminId: admin.id, adminEmail: admin.email,
      action: "PAYMENT_METHOD_REORDER", entityType: "payment_method",
      entityId: "bulk", entityName: `${orderedIds.length} methods reordered`,
    });
    revalidatePath("/admin/payment-methods");
    return { success: true, message: "Payment methods reordered." };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to reorder.",
    };
  }
}

// ══════════════════════════════════════════════════════════════
// Upgrade Request Review
// ══════════════════════════════════════════════════════════════

/**
 * Approve an upgrade request — activates the requested plan.
 */
export async function approveUpgradeAction(
  subscriptionId: string,
  adminNote?: string,
): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const result = await approveUpgradeRequest(subscriptionId, adminNote);
    await logAdminAction({
      adminId: admin.id, adminEmail: admin.email,
      action: "UPGRADE_APPROVE", entityType: "subscription",
      entityId: subscriptionId,
      entityName: `${result.shop.name} → ${result.plan.name}`,
    });
    revalidatePath("/admin/upgrade-requests");
    return { success: true, message: `${result.shop.name} upgraded to ${result.plan.name}.` };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to approve upgrade.",
    };
  }
}

/**
 * Reject an upgrade request.
 */
export async function rejectUpgradeAction(
  subscriptionId: string,
  adminNote?: string,
): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const result = await rejectUpgradeRequest(subscriptionId, adminNote);
    await logAdminAction({
      adminId: admin.id, adminEmail: admin.email,
      action: "UPGRADE_REJECT", entityType: "subscription",
      entityId: subscriptionId,
      entityName: `${result.shop.name} — rejected`,
    });
    revalidatePath("/admin/upgrade-requests");
    return { success: true, message: `Upgrade request for ${result.shop.name} rejected.` };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to reject upgrade.",
    };
  }
}
