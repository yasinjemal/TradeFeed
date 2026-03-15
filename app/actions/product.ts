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
  variantUpdateSchema,
} from "@/lib/validation/product";
import { createProduct, updateProduct, deleteProduct } from "@/lib/db/products";
import { createVariant, deleteVariant, batchCreateVariants, updateVariant } from "@/lib/db/variants";
import { requireShopAccess } from "@/lib/auth";

// ============================================================
// Shared Types
// ============================================================

type ActionResult = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  productId?: string;
  /** True when this was the shop's first product (for post-publish share prompt) */
  isFirstProduct?: boolean;
  /** Non-blocking warning (e.g. "saved as draft because price missing") */
  warning?: string;
};

export type ProductActionDeps = {
  requireShopAccess: typeof requireShopAccess;
  createProduct: typeof createProduct;
  updateProduct: typeof updateProduct;
  deleteProduct: typeof deleteProduct;
  createVariant: (productId: string, shopId: string, input: Parameters<typeof createVariant>[2], productName?: string) => ReturnType<typeof createVariant>;
  deleteVariant: typeof deleteVariant;
  batchCreateVariants: (productId: string, shopId: string, variants: Parameters<typeof batchCreateVariants>[2], productName?: string) => ReturnType<typeof batchCreateVariants>;
  revalidatePath: typeof revalidatePath;
  redirect: typeof redirect;
  checkProductLimit: (
    shopId: string
  ) => Promise<{ allowed: boolean; current: number; limit: number }>;
};

const defaultDeps: ProductActionDeps = {
  requireShopAccess,
  createProduct,
  updateProduct,
  deleteProduct,
  createVariant,
  deleteVariant,
  batchCreateVariants,
  revalidatePath,
  redirect,
  async checkProductLimit(shopId: string) {
    const { checkProductLimit } = await import("@/lib/db/subscriptions");
    return checkProductLimit(shopId);
  },
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
 * Helper: Extract a user-friendly error message from unknown errors.
 * Handles Prisma errors, generic Error objects, and unknown throws.
 */
function extractActionError(error: unknown): string {
  if (error instanceof Error) {
    // Prisma known request errors (e.g. foreign key violation, unique constraint)
    if ("code" in error && typeof (error as Record<string, unknown>).code === "string") {
      const code = (error as Record<string, unknown>).code as string;
      if (code === "P2002") return "A product with these details already exists.";
      if (code === "P2003") return "Invalid category or reference. Please try again.";
      if (code === "P2025") return "Record not found. Please refresh and try again.";
      // Connection / timeout
      if (code === "P1001" || code === "P1002" || code === "P1008" || code === "P1017") {
        return "Database connection issue. Please try again in a moment.";
      }
      return `Database error (${code}). Please try again.`;
    }
    // Generic errors — show message but cap length
    return error.message.length > 200
      ? error.message.slice(0, 200) + "…"
      : error.message;
  }
  return "Something went wrong. Please try again.";
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
  shopSlug: string,
  deps: ProductActionDeps
): Promise<{ shopId: string; userId: string } | null> {
  try {
    const access = await deps.requireShopAccess(shopSlug);
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
  formData: FormData,
  deps: ProductActionDeps = defaultDeps
): Promise<ActionResult> {
  try {
    // 1. Verify access
    const access = await resolveShopAccess(shopSlug, deps);
    if (!access) {
      return { success: false, error: "Shop not found or access denied." };
    }

    // 1b. Check product limit (free tier gate)
    const limit = await deps.checkProductLimit(access.shopId);
    if (!limit.allowed) {
      return {
        success: false,
        error: `Product limit reached (${limit.current}/${limit.limit}). Upgrade to Pro for unlimited products.`,
      };
    }

    // 2. Extract and validate — use ?? "" to guard against null FormData values
    const rawInput = {
      name: (formData.get("name") as string) ?? "",
      description: (formData.get("description") as string) ?? "",
      categoryId: (formData.get("categoryId") as string) || "",
      globalCategoryId: (formData.get("globalCategoryId") as string) || "",
      option1Label: (formData.get("option1Label") as string) || "Size",
      option2Label: (formData.get("option2Label") as string) || "Color",
      minWholesaleQty: parseInt((formData.get("minWholesaleQty") as string) || "1", 10) || 1,
      wholesaleOnly: formData.get("wholesaleOnly") === "on",
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

    // 2b. Product count before create (for first-product share prompt)
    const { db } = await import("@/lib/db");
    const countBefore = await db.product.count({
      where: { shopId: access.shopId, isActive: true },
    });

    // 3. Create product via data access layer
    const product = await deps.createProduct(parsed.data, access.shopId);

    // 3b. Auto-create default variant if inline price was provided
    const inlinePrice = formData.get("priceInRands") as string;
    const inlineStock = formData.get("stock") as string;

    // P3 FIX: Reject active products without a price — prevents "No pricing" listings
    if (parsed.data.isActive && (!inlinePrice || inlinePrice.trim() === "")) {
      // Product was created — flip to draft so it doesn't show "No pricing" to buyers
      await deps.updateProduct(product.id, access.shopId, { isActive: false });
      deps.revalidatePath(`/dashboard/${shopSlug}/products`);
      return {
        success: true,
        productId: product.id,
        isFirstProduct: countBefore === 0,
        warning: "Price is required to publish. Your product was saved as a draft — add a price to go live.",
      };
    }

    if (inlinePrice && inlinePrice.trim() !== "") {
      try {
        const { variantCreateSchema } = await import("@/lib/validation/product");
        // P1 FIX: Default stock to "1" instead of "0" — prevents instant "sold out"
        const variantInput = variantCreateSchema.safeParse({
          size: "Default",
          priceInRands: inlinePrice.trim(),
          stock: (inlineStock && inlineStock.trim() !== "") ? inlineStock.trim() : "1",
        });
        if (variantInput.success) {
          await deps.createVariant(product.id, access.shopId, variantInput.data, parsed.data.name);
        }
      } catch (variantError) {
        // Variant creation failed but product was created — don't block the seller
        console.error("[createProductAction] Variant creation failed (product still created):", variantError);
      }
      // If variant validation fails, we still created the product — seller can add variants manually
    }

    // 4. Revalidate and return success (show success screen in form)
    deps.revalidatePath(`/dashboard/${shopSlug}/products`);
    return {
      success: true,
      productId: product.id,
      isFirstProduct: countBefore === 0,
    };
  } catch (error: unknown) {
    // Re-throw redirect
    if (error instanceof Error && "digest" in error) {
      throw error;
    }

    // Surface a useful error message instead of hiding behind generic text
    const message = extractActionError(error);
    console.error("[createProductAction] Error:", message, error);
    return { success: false, error: message };
  }
}

/**
 * Update an existing product.
 */
export async function updateProductAction(
  shopSlug: string,
  productId: string,
  _prevState: ActionResult | null,
  formData: FormData,
  deps: ProductActionDeps = defaultDeps
): Promise<ActionResult> {
  try {
    const access = await resolveShopAccess(shopSlug, deps);
    if (!access) {
      return { success: false, error: "Shop not found or access denied." };
    }

    const rawInput = {
      name: (formData.get("name") as string) ?? "",
      description: (formData.get("description") as string) ?? "",
      categoryId: (formData.get("categoryId") as string) || "",
      globalCategoryId: (formData.get("globalCategoryId") as string) || "",
      option1Label: (formData.get("option1Label") as string) || undefined,
      option2Label: (formData.get("option2Label") as string) || undefined,
      minWholesaleQty: parseInt((formData.get("minWholesaleQty") as string) || "1", 10) || 1,
      wholesaleOnly: formData.get("wholesaleOnly") === "on",
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

    const updated = await deps.updateProduct(productId, access.shopId, parsed.data);
    if (!updated) {
      return { success: false, error: "Product not found." };
    }

    // Revalidate the products page to show updated data
    deps.revalidatePath(`/dashboard/${shopSlug}/products`);
    deps.revalidatePath(`/dashboard/${shopSlug}/products/${productId}`);

    return { success: true };
  } catch (error: unknown) {
    const message = extractActionError(error);
    console.error("[updateProductAction] Error:", message, error);
    return { success: false, error: message };
  }
}

/**
 * Delete a product (and all its variants + images via cascade).
 */
export async function deleteProductAction(
  shopSlug: string,
  productId: string,
  deps: ProductActionDeps = defaultDeps
): Promise<ActionResult> {
  try {
    const access = await resolveShopAccess(shopSlug, deps);
    if (!access) {
      return { success: false, error: "Shop not found or access denied." };
    }

    const deleted = await deps.deleteProduct(productId, access.shopId);
    if (!deleted) {
      return { success: false, error: "Product not found." };
    }

    deps.revalidatePath(`/dashboard/${shopSlug}/products`);
    deps.redirect(`/dashboard/${shopSlug}/products`);
  } catch (error: unknown) {
    if (error instanceof Error && "digest" in error) {
      throw error;
    }
    const message = extractActionError(error);
    console.error("[deleteProductAction] Error:", message, error);
    return { success: false, error: message };
  }
}

// ============================================================
// VARIANT ACTIONS
// ============================================================

/**
 * Add a variant (option1+option2+price+stock) to a product.
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
  formData: FormData,
  deps: ProductActionDeps = defaultDeps
): Promise<ActionResult> {
  try {
    const access = await resolveShopAccess(shopSlug, deps);
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

    // Fetch product name for auto-SKU generation (when SKU not manually provided)
    let productName: string | undefined;
    if (!parsed.data.sku) {
      const { db } = await import("@/lib/db");
      const product = await db.product.findFirst({
        where: { id: productId, shopId: access.shopId },
        select: { name: true },
      });
      productName = product?.name;
    }

    const variant = await deps.createVariant(productId, access.shopId, parsed.data, productName);
    if (!variant) {
      return { success: false, error: "Product not found or access denied." };
    }

    deps.revalidatePath(`/dashboard/${shopSlug}/products/${productId}`);
    return { success: true };
  } catch (error: unknown) {
    // Handle unique constraint violation (duplicate size+color)
    if (
      error instanceof Error &&
      error.message.includes("Unique constraint")
    ) {
      return {
        success: false,
        error: "A variant with these options already exists.",
      };
    }
    const message = extractActionError(error);
    console.error("[addVariantAction] Error:", message, error);
    return { success: false, error: message };
  }
}

/**
 * Delete a variant from a product.
 */
export async function deleteVariantAction(
  shopSlug: string,
  productId: string,
  variantId: string,
  deps: ProductActionDeps = defaultDeps
): Promise<ActionResult> {
  try {
    const access = await resolveShopAccess(shopSlug, deps);
    if (!access) {
      return { success: false, error: "Shop not found or access denied." };
    }

    const deleted = await deps.deleteVariant(variantId, access.shopId);
    if (!deleted) {
      return { success: false, error: "Variant not found." };
    }

    deps.revalidatePath(`/dashboard/${shopSlug}/products/${productId}`);
    return { success: true };
  } catch (error: unknown) {
    const message = extractActionError(error);
    console.error("[deleteVariantAction] Error:", message, error);
    return { success: false, error: message };
  }
}

// ── batchCreateVariantsAction ───────────────────────────────

/**
 * Batch create variants from option1 × option2 combinations.
 *
 * WHAT: Smart variant creator calls this with arrays of option values.
 * WHY: Wholesalers need to create many option combos at once.
 * Skips duplicates automatically.
 */
export async function batchCreateVariantsAction(
  shopSlug: string,
  productId: string,
  sizes: string[],
  colors: string[],
  priceInCents: number,
  stock: number,
  retailPriceCents?: number | null,
  deps: ProductActionDeps = defaultDeps
): Promise<ActionResult> {
  try {
    const access = await resolveShopAccess(shopSlug, deps);
    if (!access) return { success: false, error: "Access denied." };

    // Fetch product name for auto-SKU generation
    const { db } = await import("@/lib/db");
    const product = await db.product.findFirst({
      where: { id: productId, shopId: access.shopId },
      select: { name: true },
    });

    // Generate all size × color combinations
    const colorsToUse: (string | null)[] =
      colors.length > 0 ? colors : [null];
    const variants = sizes.flatMap((size) =>
      colorsToUse.map((color) => ({
        size,
        color,
        priceInCents,
        stock,
        retailPriceCents: retailPriceCents ?? null,
      }))
    );

    const result = await deps.batchCreateVariants(
      productId,
      access.shopId,
      variants,
      product?.name,
    );
    if (!result) return { success: false, error: "Product not found." };

    deps.revalidatePath(`/dashboard/${shopSlug}/products/${productId}`);
    return { success: true };
  } catch (error: unknown) {
    console.error("[batchCreateVariantsAction] Error:", error);
    return { success: false, error: "Failed to create variants." };
  }
}

// ============================================================
// VARIANT UPDATE ACTIONS
// ============================================================

/**
 * Update a single variant's price, stock, or SKU.
 *
 * WHAT: Partial update of variant fields.
 * WHY: Seller adjusts pricing or restocks from the bulk editor.
 */
export async function updateVariantAction(
  shopSlug: string,
  productId: string,
  variantId: string,
  data: {
    priceInRands?: string;
    stock?: string;
    sku?: string;
  },
  deps: ProductActionDeps = defaultDeps
): Promise<ActionResult> {
  try {
    const access = await resolveShopAccess(shopSlug, deps);
    if (!access) {
      return { success: false, error: "Shop not found or access denied." };
    }

    const parsed = variantUpdateSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        error: "Please fix the errors below.",
        fieldErrors: extractFieldErrors(parsed.error.issues),
      };
    }

    const updated = await updateVariant(variantId, access.shopId, parsed.data);
    if (!updated) {
      return { success: false, error: "Variant not found or access denied." };
    }

    deps.revalidatePath(`/dashboard/${shopSlug}/products/${productId}`);
    return { success: true };
  } catch (error: unknown) {
    const message = extractActionError(error);
    console.error("[updateVariantAction] Error:", message, error);
    return { success: false, error: message };
  }
}

/**
 * Bulk update multiple variants at once (price + stock).
 *
 * WHAT: Accepts array of variant edits, validates each, updates in sequence.
 * WHY: Bulk editor saves all changed rows in one action call.
 */
export async function bulkUpdateVariantsAction(
  shopSlug: string,
  productId: string,
  updates: {
    variantId: string;
    priceInRands: string;
    stock: string;
    sku?: string;
  }[]
): Promise<ActionResult & { updatedCount?: number; errors?: string[] }> {
  try {
    const access = await resolveShopAccess(shopSlug, defaultDeps);
    if (!access) {
      return { success: false, error: "Shop not found or access denied." };
    }

    if (updates.length === 0) {
      return { success: true, updatedCount: 0 };
    }

    if (updates.length > 200) {
      return { success: false, error: "Too many variants (max 200 at once)." };
    }

    const errors: string[] = [];
    let updatedCount = 0;

    for (const upd of updates) {
      const parsed = variantUpdateSchema.safeParse({
        priceInRands: upd.priceInRands,
        stock: upd.stock,
        ...(upd.sku !== undefined && { sku: upd.sku }),
      });

      if (!parsed.success) {
        errors.push(`Variant ${upd.variantId}: Invalid data`);
        continue;
      }

      const updated = await updateVariant(upd.variantId, access.shopId, parsed.data);
      if (updated) {
        updatedCount++;
      } else {
        errors.push(`Variant ${upd.variantId}: Not found or access denied`);
      }
    }

    revalidatePath(`/dashboard/${shopSlug}/products/${productId}`);
    revalidatePath(`/catalog/${shopSlug}`);

    return {
      success: errors.length === 0,
      updatedCount,
      ...(errors.length > 0 && { errors, error: `${errors.length} variant(s) failed to update.` }),
    };
  } catch (error: unknown) {
    const message = extractActionError(error);
    console.error("[bulkUpdateVariantsAction] Error:", message, error);
    return { success: false, error: message };
  }
}

// ============================================================
// Bulk Discount Tiers
// ============================================================

/**
 * Save bulk discount tiers for a product.
 * Replaces ALL existing tiers with the new set.
 */
export async function saveBulkDiscountTiersAction(
  shopSlug: string,
  productId: string,
  tiers: { minQuantity: number; discountPercent: number }[]
): Promise<ActionResult> {
  try {
    const access = await resolveShopAccess(shopSlug);
    if (!access) {
      return { success: false, error: "Shop not found or access denied." };
    }

    // Validate tiers
    for (const tier of tiers) {
      if (tier.minQuantity < 2) {
        return { success: false, error: "Minimum quantity must be at least 2." };
      }
      if (tier.discountPercent <= 0 || tier.discountPercent > 50) {
        return { success: false, error: "Discount must be between 0.1% and 50%." };
      }
    }

    // Check for duplicate quantities
    const quantities = tiers.map((t) => t.minQuantity);
    if (new Set(quantities).size !== quantities.length) {
      return { success: false, error: "Each quantity tier must be unique." };
    }

    // Verify product belongs to this shop
    const { db } = await import("@/lib/db");
    const product = await db.product.findFirst({
      where: { id: productId, shopId: access.shopId },
      select: { id: true },
    });
    if (!product) {
      return { success: false, error: "Product not found." };
    }

    // Delete existing tiers and create new ones in a transaction
    await db.$transaction([
      db.bulkDiscountTier.deleteMany({ where: { productId } }),
      ...tiers.map((tier) =>
        db.bulkDiscountTier.create({
          data: {
            productId,
            minQuantity: tier.minQuantity,
            discountPercent: tier.discountPercent,
          },
        })
      ),
    ]);

    revalidatePath(`/dashboard/${shopSlug}/products/${productId}`);
    return { success: true };
  } catch (error: unknown) {
    const message = extractActionError(error);
    console.error("[saveBulkDiscountTiersAction] Error:", message, error);
    return { success: false, error: message };
  }
}
