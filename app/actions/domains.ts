"use server";

// ============================================================
// Server Actions — Custom Domain Management
// ============================================================
// Pro-only: add, verify, remove, swap, and health-check domains.
// Calls Vercel REST API and persists state in Prisma.
//
// Features:
// - Add domain with auto www variant
// - Swap domain (change without remove-first)
// - Full health check with SSL status
// - Smart apex vs subdomain detection
// ============================================================

import { db } from "@/lib/db";
import { requireShopAccess } from "@/lib/auth";
import { getShopSubscription, isTrialActive } from "@/lib/db/subscriptions";
import {
  addDomainToProject,
  removeDomainFromProject,
  verifyDomainConfig,
  checkDomainHealth,
  isApexDomain,
} from "@/lib/vercel/domains";
import type { DomainHealthResult } from "@/lib/vercel/domains";
import { revalidatePath } from "next/cache";

// Basic domain format validation — no protocol, no path, no spaces
const DOMAIN_RE = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;

async function requireProAccess(shopSlug: string) {
  const access = await requireShopAccess(shopSlug);
  if (!access) throw new Error("Unauthorized");

  const shop = await db.shop.findUnique({
    where: { slug: shopSlug },
    select: { id: true, slug: true, customDomain: true, domainStatus: true },
  });
  if (!shop) throw new Error("Shop not found");

  const subscription = await getShopSubscription(shop.id);
  const isPro =
    (!!subscription?.plan.slug &&
      subscription.plan.slug !== "free" &&
      subscription.plan.slug !== "starter") ||
    isTrialActive(subscription).active;

  if (!isPro) throw new Error("Pro plan required");

  return shop;
}

/**
 * Add a custom domain to the seller's shop.
 * Auto-adds www variant for apex domains.
 */
export async function addCustomDomainAction(
  shopSlug: string,
  domain: string,
): Promise<{ success: boolean; error?: string; isApex?: boolean }> {
  try {
    const shop = await requireProAccess(shopSlug);

    // Sanitize
    const cleaned = domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    if (!DOMAIN_RE.test(cleaned)) {
      return { success: false, error: "Invalid domain format. Example: myshop.co.za" };
    }

    // Block known domains
    const blocked = ["tradefeed.co.za", "vercel.app", "vercel.com", "localhost"];
    if (blocked.some((b) => cleaned === b || cleaned.endsWith(`.${b}`))) {
      return { success: false, error: "This domain cannot be used" };
    }

    // Check not already taken by another shop
    const existing = await db.shop.findUnique({
      where: { customDomain: cleaned },
      select: { id: true },
    });
    if (existing && existing.id !== shop.id) {
      return { success: false, error: "This domain is already in use by another shop" };
    }

    // Remove old domain from Vercel if swapping
    if (shop.customDomain && shop.customDomain !== cleaned) {
      await removeDomainFromProject(shop.customDomain);
      // Also remove old www variant
      if (isApexDomain(shop.customDomain)) {
        await removeDomainFromProject(`www.${shop.customDomain}`);
      }
    }

    // Add primary domain to Vercel
    const result = await addDomainToProject(cleaned);
    if (!result.success) {
      return { success: false, error: result.error || "Failed to add domain to hosting" };
    }

    // Auto-add www variant for apex domains (www.example.co.za → redirect to example.co.za)
    const apex = isApexDomain(cleaned);
    if (apex) {
      await addDomainToProject(`www.${cleaned}`).catch(() => {});
    }

    // Save to DB
    await db.shop.update({
      where: { id: shop.id },
      data: {
        customDomain: cleaned,
        domainStatus: "PENDING",
        domainVerifiedAt: null,
      },
    });

    revalidatePath(`/dashboard/${shopSlug}/settings`);
    return { success: true, isApex: apex };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    if (msg === "Unauthorized" || msg === "Pro plan required") {
      return { success: false, error: msg };
    }
    console.error("[addCustomDomain]", err);
    return { success: false, error: "Something went wrong" };
  }
}

/**
 * Verify DNS configuration for the seller's custom domain.
 */
export async function verifyCustomDomainAction(
  shopSlug: string,
): Promise<{ success: boolean; configured: boolean; error?: string }> {
  try {
    const shop = await requireProAccess(shopSlug);

    if (!shop.customDomain) {
      return { success: false, configured: false, error: "No domain configured" };
    }

    const result = await verifyDomainConfig(shop.customDomain);

    if (result.configured) {
      await db.shop.update({
        where: { id: shop.id },
        data: {
          domainStatus: "ACTIVE",
          domainVerifiedAt: new Date(),
        },
      });
    } else {
      await db.shop.update({
        where: { id: shop.id },
        data: { domainStatus: "PENDING" },
      });
    }

    revalidatePath(`/dashboard/${shopSlug}/settings`);
    return { success: true, configured: result.configured };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[verifyCustomDomain]", err);
    return { success: false, configured: false, error: msg };
  }
}

/**
 * Full health check — DNS + SSL status for the settings UI.
 */
export async function checkDomainHealthAction(
  shopSlug: string,
): Promise<{ success: boolean; health?: DomainHealthResult; error?: string }> {
  try {
    const shop = await requireProAccess(shopSlug);

    if (!shop.customDomain) {
      return { success: false, error: "No domain configured" };
    }

    const health = await checkDomainHealth(shop.customDomain);

    // Update status if changed
    let newStatus = shop.domainStatus;
    if (health.configured && health.sslReady) {
      newStatus = "ACTIVE";
    } else if (health.configured) {
      newStatus = shop.domainStatus === "ACTIVE" ? "ACTIVE" : "PENDING";
    } else {
      newStatus = shop.domainStatus === "ACTIVE" ? "ERROR" : "PENDING";
    }

    if (newStatus !== shop.domainStatus) {
      await db.shop.update({
        where: { id: shop.id },
        data: {
          domainStatus: newStatus,
          ...(newStatus === "ACTIVE" ? { domainVerifiedAt: new Date() } : {}),
        },
      });
      revalidatePath(`/dashboard/${shopSlug}/settings`);
    }

    return { success: true, health };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[checkDomainHealth]", err);
    return { success: false, error: msg };
  }
}

/**
 * Remove the custom domain from the seller's shop.
 */
export async function removeCustomDomainAction(
  shopSlug: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const shop = await requireProAccess(shopSlug);

    if (shop.customDomain) {
      await removeDomainFromProject(shop.customDomain);
      // Also remove www variant if apex
      if (isApexDomain(shop.customDomain)) {
        await removeDomainFromProject(`www.${shop.customDomain}`).catch(() => {});
      }
    }

    await db.shop.update({
      where: { id: shop.id },
      data: {
        customDomain: null,
        domainStatus: null,
        domainVerifiedAt: null,
      },
    });

    revalidatePath(`/dashboard/${shopSlug}/settings`);
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[removeCustomDomain]", err);
    return { success: false, error: msg };
  }
}
