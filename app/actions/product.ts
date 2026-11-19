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
import {
  createProduct,
  updateProduct,
  deleteProduct,
  addProductImage,
  countActiveProducts,
} from "@/lib/db/products";
import { createVariant, deleteVariant, batchCreateVariants, updateVariant } from "@/lib/db/variants";
import { requireShopAccess } from "@/lib/auth";
import { wasPriceProblem } from "@/lib/products/compare-at";
import {
  parseListingPricing,
  parseListingPhoto,
  resolveListingStatus,
  type DraftReason,
  type ListingStatus,
  type PhotoOutcome,
} from "@/lib/products/create-listing";

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
  // ── Set by createProductAction on success: what actually happened ──
  /** "live" only when the product is active AND has a priced option. */
  status?: ListingStatus;
  /** Why it was saved as a draft instead of going live. */
  draftReason?: DraftReason;
  /** Whether the photo the seller picked is on the product. */
  photo?: PhotoOutcome;
  /** The saved photo's id (for follow-up edits such as background removal). */
  imageId?: string;
  /** How many buyable options (sizes) were saved. */
  variantCount?: number;
};

export type ProductActionResult = ActionResult;

/** Everything the post-create side effects need to know. */
type ProductCreatedEvent = {
  shopId: string;
  userId: string;
  productId: string;
  name: string;
  status: ListingStatus;
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
  /** Live products before this create (first-product share prompt). */
  countActiveProducts: typeof countActiveProducts;
  /** Attach the photo the seller picked on the create screen. */
  addProductImage: typeof addProductImage;
  /** Referral reward, translations and the activity log. Never blocks the result. */
  afterProductCreated: (event: ProductCreatedEvent) => Promise<void>;
};

/**
 * Non-critical work after a product is created. Each step is
 * fire-and-forget: a failure here must never change what the
 * seller is told about their listing.
 */
async function runPostCreateEffects(event: ProductCreatedEvent): Promise<void> {
  // Referral reward qualification (3+ active products triggers reward for referrer)
  try {
    const { applyReferralReward } = await import("@/lib/db/referrals");
    applyReferralReward(event.shopId).catch(() => {});
  } catch {
    // Non-fatal — product creation succeeded
  }

  // AI listing translations on publish (fire-and-forget, Phase 3)
  try {
    const { FEATURE_FLAGS } = await import("@/lib/config/feature-flags");
    if (FEATURE_FLAGS.LISTING_TRANSLATIONS && event.status === "live") {
      import("@/lib/ai/translate-listing")
        .then(({ upsertTranslationsForProduct }) =>
          upsertTranslationsForProduct(event.productId, event.shopId)
        )
        .catch(() => {});
    }
  } catch {
    // Non-fatal
  }

  // Activity log (fire-and-forget)
  try {
    const { logShopActivity } = await import("@/lib/db/activity-logs");
    const { ACTIVITY_ACTIONS, ACTIVITY_ENTITY_TYPES } = await import("@/lib/config/activity-actions");
    const { db: prismaUser } = await import("@/lib/db");
    const actor = await prismaUser.user.findUnique({
      where: { id: event.userId },
      select: { firstName: true, lastName: true, email: true },
    });
    const actorName = [actor?.firstName, actor?.lastName].filter(Boolean).join(" ") || actor?.email || "Unknown";
    logShopActivity({
      shopId: event.shopId,
      userId: event.userId,
      userName: actorName,
      action: ACTIVITY_ACTIONS.PRODUCT_CREATED,
      entityType: ACTIVITY_ENTITY_TYPES.PRODUCT,
      entityId: event.productId,
      entityName: event.name,
      metadata: { name: event.name, isActive: event.status === "live" },
    });
  } catch { /* non-fatal */ }
}

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
  countActiveProducts,
  addProductImage,
  afterProductCreated: runPostCreateEffects,
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
    const access = await deps.requireShopAccess(shopSlug, "catalog:manage");
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
 * Create a new product in a shop — the one create path.
 *
 * WHAT: Validates everything → creates the product hidden → saves its
 * priced options and the chosen photo → publishes it only if it is
 * actually orderable → reports what happened.
 * WHY: Core catalog building action. Products are what buyers see.
 *
 * TRUTHFUL RESULT: `status` is "live" only when the product is active
 * and has a priced option. Anything else is a "draft" with a
 * `draftReason`. `photo` says whether the picked photo is attached.
 *
 * FormData (beyond the product fields):
 *   priceInRands  one price for every option; blank saves a draft
 *   compareAtPriceInRands  optional "was" price; must be above the price
 *   stock         stock when there are no sizes (blank → 1)
 *   sizes         JSON [{ size, stock }] — one option per size
 *   imageUrl / imageKey / imageName  the already-uploaded CDN photo
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
      aiGenerated: formData.get("aiGenerated") === "on",
    };

    const parsed = productCreateSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: "Please fix the errors below.",
        fieldErrors: extractFieldErrors(parsed.error.issues),
      };
    }

    // 2b. Price, sizes and photo are validated BEFORE anything is saved.
    // A typo in the price is something to fix on the form, not a reason
    // to leave a half-made product behind.
    const text = (key: string): string => {
      const value = formData.get(key);
      return typeof value === "string" ? value : "";
    };

    const pricingResult = parseListingPricing({
      priceInRands: text("priceInRands"),
      stock: text("stock"),
      sizes: text("sizes"),
      compareAtPriceInRands: text("compareAtPriceInRands"),
    });
    if (!pricingResult.ok) {
      return {
        success: false,
        error: "Please fix the errors below.",
        fieldErrors: pricingResult.fieldErrors,
      };
    }
    const pricing = pricingResult.pricing;

    const photoResult = parseListingPhoto({
      url: text("imageUrl"),
      key: text("imageKey"),
      name: text("imageName"),
    });
    if (!photoResult.ok) {
      return {
        success: false,
        error: photoResult.error,
        fieldErrors: { photo: [photoResult.error] },
      };
    }

    // 2c. Decide the outcome up front: no price → draft, hidden → draft.
    const intended = resolveListingStatus({
      wantsLive: parsed.data.isActive,
      hasPrice: pricing !== null,
    });
    let status: ListingStatus = intended.status;
    let draftReason: DraftReason | undefined = intended.draftReason;

    // 2d. Live products before this one (for the first-product share prompt)
    const countBefore = await deps.countActiveProducts(access.shopId);

    // 3. Create the product hidden. It only goes live in step 6, after
    // its price is saved, so buyers never see a "No pricing" listing and
    // a half-finished create can only ever leave a hidden draft behind.
    const product = await deps.createProduct(
      { ...parsed.data, isActive: false },
      access.shopId
    );

    // 4. Save the buyable options: one per size, or a single default option.
    let variantCount = 0;
    if (pricing) {
      try {
        if (pricing.hasRealSizes) {
          const created = await deps.batchCreateVariants(
            product.id,
            access.shopId,
            pricing.variants.map((variant) => ({
              size: variant.size,
              color: null,
              priceInCents: pricing.priceInCents,
              compareAtPriceCents: pricing.compareAtPriceCents,
              stock: variant.stock,
            })),
            parsed.data.name
          );
          variantCount = created?.count ?? 0;
        } else {
          const only = pricing.variants[0]!;
          const created = await deps.createVariant(
            product.id,
            access.shopId,
            {
              size: only.size,
              priceInRands: pricing.priceInCents, // already cents
              retailPriceInRands: undefined,
              compareAtPriceInRands: pricing.compareAtPriceCents ?? undefined, // already cents
              stock: only.stock,
            },
            parsed.data.name
          );
          variantCount = created ? 1 : 0;
        }
      } catch (variantError) {
        console.error("[createProductAction] Saving the price failed (product kept as a draft):", variantError);
      }

      if (variantCount === 0) {
        status = "draft";
        draftReason = "publish_failed";
      }
    }

    // 5. Attach the photo the seller picked — whichever path they used.
    let photo: PhotoOutcome = "none";
    let imageId: string | undefined;
    if (photoResult.photo) {
      try {
        const saved = await deps.addProductImage(product.id, access.shopId, photoResult.photo);
        if (saved) {
          photo = "attached";
          imageId = saved.id;
        } else {
          photo = "failed";
        }
      } catch (photoError) {
        photo = "failed";
        console.error("[createProductAction] Attaching the photo failed (product still created):", photoError);
      }
    }

    // 6. Publish — only now that the listing is orderable.
    if (status === "live") {
      try {
        const published = await deps.updateProduct(product.id, access.shopId, { isActive: true });
        if (!published) throw new Error("Product not found when publishing");
      } catch (publishError) {
        status = "draft";
        draftReason = "publish_failed";
        console.error("[createProductAction] Publishing failed (product kept as a draft):", publishError);
      }
    }

    // 7. Revalidate what changed
    deps.revalidatePath(`/dashboard/${shopSlug}/products`);
    if (status === "live") {
      deps.revalidatePath(`/catalog/${shopSlug}`);
    }

    // 8. Referral reward, translations, activity log — never block the result
    try {
      await deps.afterProductCreated({
        shopId: access.shopId,
        userId: access.userId,
        productId: product.id,
        name: parsed.data.name,
        status,
      });
    } catch {
      // Non-fatal — the product was created
    }

    return {
      success: true,
      productId: product.id,
      isFirstProduct: status === "live" && countBefore === 0,
      status,
      ...(draftReason && { draftReason }),
      photo,
      ...(imageId && { imageId }),
      variantCount,
      ...(draftReason === "missing_price" && {
        warning: "Price is required to publish. Your product was saved as a draft — add a price to go live.",
      }),
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

    // Refresh AI translations if the listing changed (fire-and-forget, Phase 3)
    // upsertTranslationsForProduct() skips the API call when the
    // source hash is unchanged, so this is cheap on no-op edits.
    try {
      const { FEATURE_FLAGS } = await import("@/lib/config/feature-flags");
      if (FEATURE_FLAGS.LISTING_TRANSLATIONS && parsed.data.isActive) {
        import("@/lib/ai/translate-listing")
          .then(({ upsertTranslationsForProduct }) =>
            upsertTranslationsForProduct(productId, access.shopId)
          )
          .catch(() => {});
      }
    } catch {
      // Non-fatal
    }

    // Log activity (fire-and-forget)
    try {
      const { logShopActivity } = await import("@/lib/db/activity-logs");
      const { ACTIVITY_ACTIONS, ACTIVITY_ENTITY_TYPES } = await import("@/lib/config/activity-actions");
      const { db: prismaUser } = await import("@/lib/db");
      const actor = await prismaUser.user.findUnique({
        where: { id: access.userId },
        select: { firstName: true, lastName: true, email: true },
      });
      const actorName = [actor?.firstName, actor?.lastName].filter(Boolean).join(" ") || actor?.email || "Unknown";
      logShopActivity({
        shopId: access.shopId,
        userId: access.userId,
        userName: actorName,
        action: ACTIVITY_ACTIONS.PRODUCT_UPDATED,
        entityType: ACTIVITY_ENTITY_TYPES.PRODUCT,
        entityId: productId,
        entityName: parsed.data.name,
        metadata: { name: parsed.data.name },
      });
    } catch { /* non-fatal */ }

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

    // Log activity (fire-and-forget)
    try {
      const { logShopActivity } = await import("@/lib/db/activity-logs");
      const { ACTIVITY_ACTIONS, ACTIVITY_ENTITY_TYPES } = await import("@/lib/config/activity-actions");
      const { db: prismaUser } = await import("@/lib/db");
      const actor = await prismaUser.user.findUnique({
        where: { id: access.userId },
        select: { firstName: true, lastName: true, email: true },
      });
      const actorName = [actor?.firstName, actor?.lastName].filter(Boolean).join(" ") || actor?.email || "Unknown";
      logShopActivity({
        shopId: access.shopId,
        userId: access.userId,
        userName: actorName,
        action: ACTIVITY_ACTIONS.PRODUCT_DELETED,
        entityType: ACTIVITY_ENTITY_TYPES.PRODUCT,
        entityId: productId,
        entityName: deleted.name ?? productId,
        metadata: { name: deleted.name },
      });
    } catch { /* non-fatal */ }

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
    /** "was" price in rands; "" or null removes it. */
    compareAtPriceInRands?: string | null;
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

    // A was-price is shown to buyers crossed out, so it has to be a real saving.
    const wasProblem =
      parsed.data.compareAtPriceInRands != null && parsed.data.priceInRands !== undefined
        ? wasPriceProblem(parsed.data.priceInRands, parsed.data.compareAtPriceInRands)
        : null;
    if (wasProblem) {
      return {
        success: false,
        error: "Please fix the errors below.",
        fieldErrors: { compareAtPriceInRands: [wasProblem] },
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
    /** "was" price in rands; "" removes it, omitted leaves it as it is. */
    compareAtPriceInRands?: string;
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
        ...(upd.compareAtPriceInRands !== undefined && {
          compareAtPriceInRands: upd.compareAtPriceInRands,
        }),
      });

      if (!parsed.success) {
        const wasPriceIssue = parsed.error.issues.find(
          (issue) => issue.path[0] === "compareAtPriceInRands"
        );
        errors.push(wasPriceIssue ? wasPriceIssue.message : `Variant ${upd.variantId}: Invalid data`);
        continue;
      }

      // A was-price is shown to buyers crossed out, so it has to be a real saving.
      const wasProblem =
        parsed.data.compareAtPriceInRands != null && parsed.data.priceInRands !== undefined
          ? wasPriceProblem(parsed.data.priceInRands, parsed.data.compareAtPriceInRands)
          : null;
      if (wasProblem) {
        errors.push(wasProblem);
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
      ...(errors.length > 0 && {
        errors,
        error:
          errors.length === 1
            ? errors[0]
            : `${errors.length} options could not be updated. ${errors[0]}`,
      }),
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
    const access = await resolveShopAccess(shopSlug, defaultDeps);
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
