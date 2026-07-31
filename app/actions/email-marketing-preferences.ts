"use server";

import { revalidatePath } from "next/cache";
import { requireShopAccess } from "@/lib/auth";
import { db } from "@/lib/db";
import { createMarketingEmailHash } from "@/lib/email/marketing-preferences";

const PRODUCT_NEWS_CONSENT_SOURCE =
  "seller_dashboard_notifications_toggle";
const PRODUCT_NEWS_CONSENT_VERSION = "product_news_v1";

type EmailMarketingPreferenceActionResult =
  | { success: true; optedIn: boolean }
  | { success: false; error: string };

function getMarketingHmacSecret(): string | null {
  const secret = process.env.EMAIL_MARKETING_HMAC_SECRET?.trim();
  return secret && Buffer.byteLength(secret, "utf8") >= 32
    ? secret
    : null;
}

/**
 * Persist the signed-in seller's explicit product-news choice.
 *
 * Marketing consent belongs to the account email, not to a shop notification
 * override. Transactional order, stock, and review alerts are intentionally
 * untouched.
 */
export async function updateEmailMarketingPreferenceAction(
  shopSlug: string,
  optedIn: boolean,
): Promise<EmailMarketingPreferenceActionResult> {
  try {
    if (typeof optedIn !== "boolean") {
      return { success: false, error: "Invalid preference." };
    }

    const access = await requireShopAccess(
      shopSlug,
      "settings:manage",
    );
    if (!access) {
      return { success: false, error: "Access denied." };
    }

    const secret = getMarketingHmacSecret();
    if (!secret) {
      console.error(
        "[updateEmailMarketingPreferenceAction] EMAIL_MARKETING_HMAC_SECRET is unavailable.",
      );
      return {
        success: false,
        error: "Email preferences are temporarily unavailable.",
      };
    }

    const user = await db.user.findUnique({
      where: { id: access.userId },
      select: { email: true },
    });
    if (!user?.email) {
      return {
        success: false,
        error: "No account email is available.",
      };
    }

    const now = new Date();
    const normalizedEmailHash = createMarketingEmailHash(
      user.email,
      secret,
    );

    if (optedIn) {
      await db.$transaction([
        db.emailMarketingPreference.upsert({
          where: { userId: access.userId },
          create: {
            userId: access.userId,
            status: "OPTED_IN",
            consentSource: PRODUCT_NEWS_CONSENT_SOURCE,
            consentVersion: PRODUCT_NEWS_CONSENT_VERSION,
            consentRequestedAt: now,
            consentedAt: now,
            optedOutAt: null,
          },
          update: {
            status: "OPTED_IN",
            consentSource: PRODUCT_NEWS_CONSENT_SOURCE,
            consentVersion: PRODUCT_NEWS_CONSENT_VERSION,
            consentRequestedAt: now,
            consentedAt: now,
            optedOutAt: null,
          },
        }),
        // An explicit re-opt-in releases only a prior user unsubscribe.
        // Bounce, complaint, provider, NCC and admin suppressions remain active.
        db.emailSuppression.updateMany({
          where: {
            normalizedEmailHash,
            reason: "UNSUBSCRIBED",
            releasedAt: null,
          },
          data: { releasedAt: now },
        }),
      ]);
    } else {
      await db.$transaction([
        db.emailMarketingPreference.upsert({
          where: { userId: access.userId },
          create: {
            userId: access.userId,
            status: "OPTED_OUT",
            consentSource: PRODUCT_NEWS_CONSENT_SOURCE,
            consentVersion: PRODUCT_NEWS_CONSENT_VERSION,
            consentRequestedAt: now,
            consentedAt: null,
            optedOutAt: now,
          },
          update: {
            status: "OPTED_OUT",
            consentSource: PRODUCT_NEWS_CONSENT_SOURCE,
            consentVersion: PRODUCT_NEWS_CONSENT_VERSION,
            consentRequestedAt: now,
            optedOutAt: now,
          },
        }),
        db.emailSuppression.upsert({
          where: {
            normalizedEmailHash_reason: {
              normalizedEmailHash,
              reason: "UNSUBSCRIBED",
            },
          },
          create: {
            normalizedEmailHash,
            reason: "UNSUBSCRIBED",
            source: PRODUCT_NEWS_CONSENT_SOURCE,
            suppressedAt: now,
            releasedAt: null,
          },
          update: {
            source: PRODUCT_NEWS_CONSENT_SOURCE,
            suppressedAt: now,
            releasedAt: null,
          },
        }),
      ]);
    }

    revalidatePath(`/dashboard/${shopSlug}/notifications`);
    return { success: true, optedIn };
  } catch (error) {
    console.error(
      "[updateEmailMarketingPreferenceAction] Failed:",
      error,
    );
    return {
      success: false,
      error: "Failed to update email preference.",
    };
  }
}
