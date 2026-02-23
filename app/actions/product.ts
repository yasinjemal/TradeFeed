// ============================================================
// Server Actions — Product & Variant CRUD
// ============================================================
// All product + variant mutations as Next.js server actions.
//
// FLOW: Validate input → Verify user access → Call data access → Return result
//
// RULES:
// - All input validated via Zod BEFORE touching the DB
// - shopId comes from the URL (verified via getShopBySlug + user check)
// - Never call Prisma directly — use /lib/db/products.ts and /lib/db/variants.ts
// - Return structured ActionResult, never raw errors
// ============================================================

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  productCreateSchema,
  productUpdateSchema,
  variantCreateSchema,
} from "@/lib/validation/product";
import { createProduct, updateProduct, deleteProduct } from "@/lib/db/products";
import { createVariant, deleteVariant } from "@/lib/db/variants";
import { requireShopAccess } from "@/lib/auth";

// ============================================================
// Shared Types
// ============================================================

type ActionResult = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

/**
 * Helper: Extract Zod field errors into a flat record.
 * WHY: UI needs { fieldName: ["error message"] } format for display.
 */
function extractFieldErrors(
  issues: { path: PropertyKey[]; message: string }[]
): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of issues) {
    const field = issue.path[0]?.toString() ?? "unknown";
    if (!fieldErrors[field]) {
      fieldErrors[field] = [];
    }
    fieldErrors[field].push(issue.message);
  }
  return fieldErrors;
}

/**
 * Helper: Resolve shopId from slug and verify user has access.
 *
 * MULTI-TENANT: This is the gatekeeper. Every product action must:
 * 1. Authenticate user via Clerk
 * 2. Resolve shop from slug
 * 3. Verify user belongs to that shop via ShopUser table
 * 4. Return { shopId, userId } for downstream queries
 */
async function resolveShopAccess(
  shopSlug: string
): Promise<{ shopId: string; userId: string } | null> {
  try {
    const access = await requireShopAccess(shopSlug);
    if (!access) return null;
    return { shopId: access.shopId, userId: access.userId };
  } catch {
    return null;
  }
}

// ============================================================
// PRODUCT ACTIONS
// ============================================================

/**
 * Create a new product in a shop.
 *
 * WHAT: Validates input → verifies shop access → creates product → redirects.
 * WHY: Core catalog building action. Products are what buyers see.
 */
export async function createProductAction(
  shopSlug: string,
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    // 1. Verify access
    const access = await resolveShopAccess(shopSlug);
    if (!access) {
      return { success: false, error: "Shop not found or access denied." };
    }

    // 2. Extract and validate
    const rawInput = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      categoryId: formData.get("categoryId") as string,
      isActive: formData.get("isActive") === "on",
    };

    const parsed = productCreateSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: "Please fix the errors below.",
        fieldErrors: extractFieldErrors(parsed.error.issues),
      };
    }

    // 3. Create product via data access layer
    const product = await createProduct(parsed.data, access.shopId);

    // 4. Redirect to product detail page (to add variants)
    redirect(`/dashboard/${shopSlug}/products/${product.id}`);
  } catch (error: unknown) {
    // Re-throw redirect
    if (error instanceof Error && "digest" in error) {
      throw error;
    }
    console.error("[createProductAction] Error:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

/**
 * Update an existing product.
 */
export async function updateProductAction(
  shopSlug: string,
  productId: string,
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    const access = await resolveShopAccess(shopSlug);
    if (!access) {
      return { success: false, error: "Shop not found or access denied." };
    }

    const rawInput = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      categoryId: formData.get("categoryId") as string,
      isActive: formData.get("isActive") === "on",
    };

    const parsed = productUpdateSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: "Please fix the errors below.",
        fieldErrors: extractFieldErrors(parsed.error.issues),
      };
    }

    const updated = await updateProduct(productId, access.shopId, parsed.data);
    if (!updated) {
      return { success: false, error: "Product not found." };
    }

    // Revalidate the products page to show updated data
    revalidatePath(`/dashboard/${shopSlug}/products`);
    revalidatePath(`/dashboard/${shopSlug}/products/${productId}`);

    return { success: true };
  } catch (error: unknown) {
    console.error("[updateProductAction] Error:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

/**
 * Delete a product (and all its variants + images via cascade).
 */
export async function deleteProductAction(
  shopSlug: string,
  productId: string
): Promise<ActionResult> {
  try {
    const access = await resolveShopAccess(shopSlug);
    if (!access) {
      return { success: false, error: "Shop not found or access denied." };
    }

    const deleted = await deleteProduct(productId, access.shopId);
    if (!deleted) {
      return { success: false, error: "Product not found." };
    }

    revalidatePath(`/dashboard/${shopSlug}/products`);
    redirect(`/dashboard/${shopSlug}/products`);
  } catch (error: unknown) {
    if (error instanceof Error && "digest" in error) {
      throw error;
    }
    console.error("[deleteProductAction] Error:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

// ============================================================
// VARIANT ACTIONS
// ============================================================

/**
 * Add a variant (size+color+price+stock) to a product.
 *
 * WHAT: Validates variant input → verifies shop access → creates variant.
 * WHY: Variants are the buyable unit. No variants = nothing to order.
 *
 * PRICE NOTE: Zod schema transforms rands → cents automatically.
 */
export async function addVariantAction(
  shopSlug: string,
  productId: string,
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    const access = await resolveShopAccess(shopSlug);
    if (!access) {
      return { success: false, error: "Shop not found or access denied." };
    }

    const rawInput = {
      size: formData.get("size") as string,
      color: formData.get("color") as string,
      priceInRands: formData.get("priceInRands") as string,
      stock: formData.get("stock") as string,
      sku: formData.get("sku") as string,
    };

    const parsed = variantCreateSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: "Please fix the errors below.",
        fieldErrors: extractFieldErrors(parsed.error.issues),
      };
    }

    const variant = await createVariant(productId, access.shopId, parsed.data);
    if (!variant) {
      return { success: false, error: "Product not found or access denied." };
    }

    revalidatePath(`/dashboard/${shopSlug}/products/${productId}`);
    return { success: true };
  } catch (error: unknown) {
    // Handle unique constraint violation (duplicate size+color)
    if (
      error instanceof Error &&
      error.message.includes("Unique constraint")
    ) {
      return {
        success: false,
        error: "A variant with this size and color already exists.",
      };
    }
    console.error("[addVariantAction] Error:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

/**
 * Delete a variant from a product.
 */
export async function deleteVariantAction(
  shopSlug: string,
  productId: string,
  variantId: string
): Promise<ActionResult> {
  try {
    const access = await resolveShopAccess(shopSlug);
    if (!access) {
      return { success: false, error: "Shop not found or access denied." };
    }

    const deleted = await deleteVariant(variantId, access.shopId);
    if (!deleted) {
      return { success: false, error: "Variant not found." };
    }

    revalidatePath(`/dashboard/${shopSlug}/products/${productId}`);
    return { success: true };
  } catch (error: unknown) {
    console.error("[deleteVariantAction] Error:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
