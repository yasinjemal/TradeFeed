// ============================================================
// Zod Validation — Checkout (Buyer Order Submission)
// ============================================================
// Validates buyer-submitted data at checkout. No auth required
// since buyers aren't logged in. All string fields are trimmed
// and length-limited to prevent abuse.
// ============================================================

import { z } from "zod";

/**
 * SA phone number regex: +27 followed by 9 digits, or 0 followed by 9 digits.
 * Accepts optional spaces/dashes for readability.
 */
const saPhoneRegex = /^(\+27|0)\d{9}$/;

/** Sanitize a phone string: strip spaces, dashes, parens */
function normalizePhone(val: string): string {
  return val.replace(/[\s\-()]/g, "");
}

export const checkoutItemSchema = z.object({
  productId: z.string().min(1, "Product ID required"),
  variantId: z.string().min(1, "Variant ID required"),
  productName: z.string().trim().min(1).max(300),
  option1Label: z.string().trim().max(100),
  option1Value: z.string().trim().max(100),
  option2Label: z.string().trim().max(100),
  option2Value: z.string().trim().max(100).nullable(),
  priceInCents: z.number().int().min(0),
  quantity: z.number().int().min(1, "Quantity must be at least 1").max(1000, "Quantity too large"),
});

export const checkoutSchema = z.object({
  shopId: z.string().min(1, "Shop ID required"),
  shopSlug: z.string().min(1, "Shop slug required").max(200),
  items: z.array(checkoutItemSchema).min(1, "Cart is empty").max(100, "Too many items"),
  whatsappMessage: z.string().max(10000, "Message too long"),
  buyerName: z
    .string()
    .trim()
    .max(100, "Name too long")
    .optional()
    .or(z.literal("")),
  buyerPhone: z.preprocess(
    (val) => (val === undefined || val === "" ? undefined : normalizePhone(String(val))),
    z.string().regex(saPhoneRegex, "Enter a valid SA phone number (e.g. +27821234567 or 0821234567)").optional()
  ),
  buyerNote: z
    .string()
    .trim()
    .max(1000, "Note too long")
    .optional()
    .or(z.literal("")),
  deliveryAddress: z
    .string()
    .trim()
    .max(300, "Address too long")
    .optional()
    .or(z.literal("")),
  deliveryCity: z
    .string()
    .trim()
    .max(100, "City too long")
    .optional()
    .or(z.literal("")),
  deliveryProvince: z
    .string()
    .trim()
    .max(100, "Province too long")
    .optional()
    .or(z.literal("")),
  deliveryPostalCode: z
    .string()
    .trim()
    .max(10, "Postal code too long")
    .optional()
    .or(z.literal("")),
  marketingConsent: z.boolean().optional().default(false),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
