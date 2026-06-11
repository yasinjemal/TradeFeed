// ============================================================
// Feature Flags — Runtime Feature Toggles
// ============================================================
// Simple env-var-based feature flags. Each flag defaults to OFF
// unless explicitly enabled in .env.
//
// USAGE:
//   import { FEATURE_FLAGS } from "@/lib/config/feature-flags";
//   if (FEATURE_FLAGS.WHATSAPP_PRODUCT_IMPORT) { ... }
// ============================================================

export const FEATURE_FLAGS = {
  /** Allow sellers to create products by sending WhatsApp photos */
  WHATSAPP_PRODUCT_IMPORT: process.env.NEXT_PUBLIC_FF_WHATSAPP_PRODUCT_IMPORT === "true",

  // ── Buyer Retention (Phase 1) ────────────────────────────
  /** Phone-based buyer accounts (WhatsApp OTP — no password) */
  BUYER_ACCOUNTS: process.env.NEXT_PUBLIC_FF_BUYER_ACCOUNTS === "true",
  /** Follow/save shops + "new from shops you follow" feed */
  SHOP_FOLLOW: process.env.NEXT_PUBLIC_FF_SHOP_FOLLOW === "true",

  // ── Trust System (Phase 2) ───────────────────────────────
  /** Verified badge backed by SellerVerification record + seller stats */
  TRUST_SYSTEM: process.env.NEXT_PUBLIC_FF_TRUST_SYSTEM === "true",
  /** Automated review request after order marked Delivered */
  REVIEW_REQUESTS: process.env.NEXT_PUBLIC_FF_REVIEW_REQUESTS === "true",

  // ── AI Deepening (Phase 3) ───────────────────────────────
  /** Translate listings into zu/xh/af/st on publish */
  LISTING_TRANSLATIONS: process.env.NEXT_PUBLIC_FF_LISTING_TRANSLATIONS === "true",
  /** Price suggestion from similar listings in the product wizard */
  PRICE_SUGGESTIONS: process.env.NEXT_PUBLIC_FF_PRICE_SUGGESTIONS === "true",
  /** Background removal on product image upload */
  BG_REMOVAL: process.env.NEXT_PUBLIC_FF_BG_REMOVAL === "true",

  // ── Onboarding (Phase 4) ─────────────────────────────────
  /** Make WhatsApp catalogue import the primary onboarding path */
  WA_IMPORT_PRIMARY: process.env.NEXT_PUBLIC_FF_WA_IMPORT_PRIMARY === "true",
  /** Catalogue import flow: bulk photos/text/csv → review grid → publish */
  CATALOGUE_IMPORT: process.env.NEXT_PUBLIC_FF_CATALOGUE_IMPORT === "true",

  // ── Trust Redesign (2026) ────────────────────────────────────
  /** New "Verified Seller" design system (components/tf). Live UI untouched while off. */
  UI_REDESIGN: process.env.NEXT_PUBLIC_FF_UI_REDESIGN === "true",
} as const;
