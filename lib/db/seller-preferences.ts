// ============================================================
// Data Access — Seller Preferences (AI Memory)
// ============================================================
// CRUD helpers for the SellerPreferences model.
// Used by the AI product generator to personalize output
// and by the WhatsApp auto-reply system for seller context.
//
// Usage:
//   import { getSellerPreferences, upsertSellerPreferences } from "@/lib/db/seller-preferences";
// ============================================================

import { db } from "@/lib/db";
import type { SellerPreferences } from "@prisma/client";

/**
 * Get seller preferences for a shop.
 * Returns null if no preferences have been set yet.
 */
export async function getSellerPreferences(
  shopId: string
): Promise<SellerPreferences | null> {
  return db.sellerPreferences.findUnique({
    where: { shopId },
  });
}

/**
 * Create or update seller preferences.
 * Uses upsert — safe to call repeatedly.
 */
export async function upsertSellerPreferences(
  shopId: string,
  data: {
    brandTone?: string | null;
    brandDescription?: string | null;
    defaultCategory?: string | null;
    preferredTags?: string[];
    priceRange?: string | null;
    targetAudience?: string | null;
    languagePreference?: string;
    aiToneNotes?: string | null;
    autoReplyEnabled?: boolean;
    whatsappImportEnabled?: boolean;
  }
): Promise<SellerPreferences> {
  return db.sellerPreferences.upsert({
    where: { shopId },
    create: {
      shopId,
      ...data,
    },
    update: data,
  });
}

/**
 * Build an AI context string from seller preferences.
 * Injected into the GPT system prompt for personalized output.
 * Returns empty string if no preferences are set.
 */
export function buildSellerAIContext(
  prefs: SellerPreferences | null
): string {
  if (!prefs) return "";

  const parts: string[] = [];

  if (prefs.brandTone) {
    parts.push(`Brand tone: ${prefs.brandTone}`);
  }
  if (prefs.brandDescription) {
    parts.push(`Brand story: ${prefs.brandDescription}`);
  }
  if (prefs.defaultCategory) {
    parts.push(`Preferred category: ${prefs.defaultCategory}`);
  }
  if (prefs.preferredTags && prefs.preferredTags.length > 0) {
    parts.push(`Common tags: ${prefs.preferredTags.join(", ")}`);
  }
  if (prefs.priceRange) {
    parts.push(`Price positioning: ${prefs.priceRange}`);
  }
  if (prefs.targetAudience) {
    parts.push(`Target audience: ${prefs.targetAudience}`);
  }
  if (prefs.languagePreference && prefs.languagePreference !== "en") {
    parts.push(`Preferred language: ${prefs.languagePreference}`);
  }
  if (prefs.aiToneNotes) {
    parts.push(`Seller notes: ${prefs.aiToneNotes}`);
  }

  if (parts.length === 0) return "";

  return `\n\nSELLER CONTEXT (personalize the listing based on this):\n${parts.join("\n")}`;
}
