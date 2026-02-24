// ============================================================
// Server Actions — Platform Admin
// ============================================================
// Actions for platform-level admin operations.
// All actions require platform admin auth (ADMIN_USER_IDS).
// ============================================================

"use server";

import { requireAdmin } from "@/lib/auth/admin";
import { setShopVerified, setShopActive } from "@/lib/db/admin";
import { revalidatePath } from "next/cache";

type ActionResult = { success: true; message: string } | { success: false; error: string };

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
