// ============================================================
// Zod Validation — Shop Schemas
// ============================================================
// All shop-related input validation lives here.
// Used by server actions and API routes.
//
// RULES:
// - WhatsApp number must be SA format (+27XXXXXXXXX)
// - Shop name: 2-100 chars, trimmed
// - Description: optional, max 500 chars
// ============================================================

import { z } from "zod";

/**
 * Normalize a South African phone number to +27 format.
 * Handles: 0712345678, 27712345678, +27712345678
 *
 * WHY: Sellers will type numbers in different formats.
 * We normalize to +27XXXXXXXXX for wa.me links to work reliably.
 */
function normalizeWhatsAppNumber(value: string): string {
  // Strip all spaces, dashes, parentheses
  const cleaned = value.replace(/[\s\-()]/g, "");

  // Already in +27 format
  if (/^\+27\d{9}$/.test(cleaned)) {
    return cleaned;
  }

  // Starts with 27 (no plus)
  if (/^27\d{9}$/.test(cleaned)) {
    return `+${cleaned}`;
  }

  // Starts with 0 (local SA format)
  if (/^0\d{9}$/.test(cleaned)) {
    return `+27${cleaned.slice(1)}`;
  }

  // Return as-is — the regex validation below will catch invalid formats
  return cleaned;
}

/**
 * Schema for creating a new shop.
 *
 * WHAT: Validates and transforms shop creation input.
 * WHY: Never trust client input. Zod catches bad data before it hits the DB.
 *
 * MULTI-TENANT NOTE: This schema doesn't include shopId (the shop doesn't exist yet).
 * The userId (owner) is passed separately from the authenticated session.
 */
export const shopCreateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Shop name must be at least 2 characters")
    .max(100, "Shop name must be under 100 characters"),

  description: z
    .string()
    .trim()
    .max(500, "Description must be under 500 characters")
    .optional()
    .or(z.literal("")),

  whatsappNumber: z
    .string()
    .trim()
    .transform(normalizeWhatsAppNumber)
    .pipe(
      z
        .string()
        .regex(
          /^\+27\d{9}$/,
          "Enter a valid SA WhatsApp number (e.g. 071 234 5678)"
        )
    ),
});

/**
 * TypeScript type inferred from the schema.
 * Use this wherever you need the validated shape.
 */
export type ShopCreateInput = z.infer<typeof shopCreateSchema>;
