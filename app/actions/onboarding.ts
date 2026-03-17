// ============================================================
// Server Action — Onboarding (Product-First Flow)
// ============================================================
// Combined shop creation + first product in a single action.
// Called from /get-started — replaces the old multi-page flow.
//
// FLOW:
// 1. Validate WhatsApp + shop name
// 2. Create shop + ShopUser + free subscription
// 3. Create first product (name + price)
// 4. Track onboarding event
// 5. Return shop slug + product ID for celebration screen
// ============================================================

"use server";

import { shopCreateSchema } from "@/lib/validation/shop";
import { createShop } from "@/lib/db/shops";
import { requireAuth } from "@/lib/auth";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email/resend";
import { welcomeEmailHtml, welcomeEmailText } from "@/lib/email/templates/welcome";
import { SITE_URL } from "@/lib/config/site";

type OnboardingResult = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  shopSlug?: string;
  productId?: string;
};

/**
 * Step 1: Create shop from WhatsApp number + shop name.
 * Called when seller completes the first step of onboarding.
 */
export async function createShopOnboardingAction(
  _prevState: OnboardingResult | null,
  formData: FormData,
): Promise<OnboardingResult> {
  try {
    const rawInput = {
      name: (formData.get("name") as string) ?? "",
      whatsappNumber: (formData.get("whatsappNumber") as string) ?? "",
      description: "",
    };

    const parsed = shopCreateSchema.safeParse(rawInput);
    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0]?.toString() ?? "unknown";
        if (!fieldErrors[field]) fieldErrors[field] = [];
        fieldErrors[field].push(issue.message);
      }
      return { success: false, error: "Please fix the errors below.", fieldErrors };
    }

    const user = await requireAuth();

    // Guard: if user already has a shop, return it
    const existingShop = await db.shopUser.findFirst({
      where: { userId: user.id, role: "OWNER" },
      select: { shop: { select: { slug: true } } },
    });
    if (existingShop) {
      return { success: true, shopSlug: existingShop.shop.slug };
    }

    // Check for referral cookie
    let referrerSlug: string | undefined;
    try {
      const cookieStore = await cookies();
      const refCode = cookieStore.get("tf_ref")?.value;
      if (refCode) {
        const referrer = await db.shop.findFirst({
          where: { referralCode: refCode, isActive: true },
          select: { slug: true },
        });
        if (referrer) referrerSlug = referrer.slug;
        cookieStore.delete("tf_ref");
      }
    } catch {
      // Non-fatal
    }

    // Create shop
    const shop = await createShop(parsed.data, user.id, referrerSlug);

    // Auto-assign free subscription
    const { createFreeSubscription } = await import("@/lib/db/subscriptions");
    await createFreeSubscription(shop.id).catch(() => {});

    // Send welcome WhatsApp (fire-and-forget)
    const { sendWelcomeSequence } = await import("@/lib/whatsapp/seller-sequences");
    sendWelcomeSequence(shop.id).catch(() => {});

    // Send welcome email (fire-and-forget)
    if (user.email) {
      const emailData = {
        shopName: shop.name,
        sellerName: user.firstName || shop.name,
        catalogUrl: `${SITE_URL}/catalog/${shop.slug}`,
        dashboardUrl: `${SITE_URL}/dashboard/${shop.slug}`,
      };
      sendEmail({
        to: user.email,
        subject: `Welcome to TradeFeed — ${shop.name} is live! 🎉`,
        html: welcomeEmailHtml(emailData),
        text: welcomeEmailText(emailData),
      }).catch(() => {});
    }

    // Track onboarding event
    await db.onboardingEvent.create({
      data: { userId: user.id, step: "shop_created", metadata: { source: "get-started" } },
    }).catch(() => {});

    return { success: true, shopSlug: shop.slug };
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") throw error;
    console.error("[createShopOnboardingAction]", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

/**
 * Step 2: Create first product in the shop.
 * Called after shop is created — creates product + default variant.
 */
export async function createFirstProductAction(
  shopSlug: string,
  formData: FormData,
): Promise<OnboardingResult> {
  try {
    const user = await requireAuth();

    const shop = await db.shop.findFirst({
      where: {
        slug: shopSlug,
        users: { some: { userId: user.id, role: "OWNER" } },
      },
      select: { id: true, slug: true },
    });
    if (!shop) return { success: false, error: "Shop not found." };

    const productName = ((formData.get("productName") as string) ?? "").trim() || "My First Product";
    const description = ((formData.get("description") as string) ?? "").trim();
    const categoryName = ((formData.get("category") as string) ?? "").trim();
    const quantity = ((formData.get("quantity") as string) ?? "1").trim() || "1";
    const priceInRands = ((formData.get("priceInRands") as string) ?? "").trim();

    if (!priceInRands || parseFloat(priceInRands) <= 0) {
      return { success: false, error: "Enter a price greater than zero." };
    }

    // Map AI category string → globalCategoryId (best-effort)
    let globalCategoryId: string | undefined;
    if (categoryName) {
      const globalCat = await db.globalCategory.findFirst({
        where: {
          isActive: true,
          name: { equals: categoryName, mode: "insensitive" },
        },
        select: { id: true },
      });
      if (globalCat) globalCategoryId = globalCat.id;
    }

    // Create product
    const { createProduct } = await import("@/lib/db/products");
    const product = await createProduct(
      {
        name: productName,
        description,
        isActive: true,
        aiGenerated: !!description,
        globalCategoryId,
        option1Label: "Size",
        option2Label: "Color",
        minWholesaleQty: 1,
        wholesaleOnly: false,
      },
      shop.id,
    );

    // Create default variant with price + stock
    const { variantCreateSchema } = await import("@/lib/validation/product");
    const variantInput = variantCreateSchema.safeParse({
      size: "Default",
      priceInRands,
      stock: quantity,
    });
    if (variantInput.success) {
      const { createVariant } = await import("@/lib/db/variants");
      await createVariant(product.id, shop.id, variantInput.data, productName);
    }

    // Track onboarding event
    await db.onboardingEvent.create({
      data: {
        userId: user.id,
        step: "product_created",
        metadata: { shopSlug, productId: product.id, source: "get-started" },
      },
    }).catch(() => {});

    return { success: true, shopSlug: shop.slug, productId: product.id };
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") throw error;
    console.error("[createFirstProductAction]", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

/**
 * Track onboarding completion (user saw celebration screen).
 */
export async function trackOnboardingCompleteAction(shopSlug: string): Promise<void> {
  try {
    const user = await requireAuth();
    await db.onboardingEvent.create({
      data: {
        userId: user.id,
        step: "completed",
        metadata: { shopSlug, source: "get-started" },
      },
    });
  } catch {
    // Non-fatal
  }
}
