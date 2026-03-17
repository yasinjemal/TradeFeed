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
} as const;
