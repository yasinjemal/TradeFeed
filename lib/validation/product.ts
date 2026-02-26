// ============================================================
// Zod Validation — Product & Variant Schemas
// ============================================================
// All product-related input validation lives here.
// Used by server actions — never validate inline in components.
//
// RULES:
// - Product name: 2-200 chars
// - Description: optional, max 2000 chars
// - Price: stored as cents (integer). UI sends rands, we convert.
// - Size: required for every variant
// - Color: optional
// - Stock: non-negative integer
// ============================================================

import { z } from "zod";

/**
 * Schema for creating a new product.
 *
 * WHAT: Validates product creation input.
 * WHY: Sellers type product names, descriptions — must be sanitized.
 *
 * NOTE: shopId is NOT in the schema — it comes from the authenticated
 * session / URL params and is passed separately. Never trust shopId from client.
 */
export const productCreateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Product name must be at least 2 characters")
    .max(200, "Product name must be under 200 characters"),

  description: z
    .string()
    .trim()
    .max(2000, "Description must be under 2000 characters")
    .optional()
    .or(z.literal("")),

  categoryId: z
    .string()
    .cuid()
    .optional()
    .or(z.literal("")),

  globalCategoryId: z
    .string()
    .cuid()
    .optional()
    .or(z.literal("")),

  // Dynamic variant labels (Option C — additive columns)
  option1Label: z
    .string()
    .trim()
    .min(1, "Option 1 label is required")
    .max(50, "Label must be under 50 characters")
    .default("Size"),

  option2Label: z
    .string()
    .trim()
    .min(1, "Option 2 label is required")
    .max(50, "Label must be under 50 characters")
    .default("Color"),

  isActive: z.boolean().default(true),
});

export type ProductCreateInput = z.infer<typeof productCreateSchema>;

/**
 * Schema for updating an existing product.
 *
 * WHAT: All fields optional (partial update).
 * WHY: Seller may only want to change the name or toggle active status.
 */
export const productUpdateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Product name must be at least 2 characters")
    .max(200, "Product name must be under 200 characters")
    .optional(),

  description: z
    .string()
    .trim()
    .max(2000, "Description must be under 2000 characters")
    .optional()
    .or(z.literal("")),

  categoryId: z
    .string()
    .cuid()
    .optional()
    .nullable()
    .or(z.literal("")),

  globalCategoryId: z
    .string()
    .cuid()
    .optional()
    .nullable()
    .or(z.literal("")),

  option1Label: z
    .string()
    .trim()
    .min(1, "Option 1 label is required")
    .max(50)
    .optional(),

  option2Label: z
    .string()
    .trim()
    .min(1, "Option 2 label is required")
    .max(50)
    .optional(),

  isActive: z.boolean().optional(),
});

export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;

/**
 * Schema for creating a product variant.
 *
 * WHAT: Validates size, color, price, and stock.
 * WHY: Variants are the buyable unit — invalid data means broken orders.
 *
 * PRICE NOTE:
 * - UI sends price in rands (e.g. "299.99")
 * - We convert to cents (29999) via transform
 * - DB stores as integer cents — no floating point bugs
 */
export const variantCreateSchema = z.object({
  size: z
    .string()
    .trim()
    .min(1, "Size is required")
    .max(20, "Size must be under 20 characters"),

  color: z
    .string()
    .trim()
    .max(50, "Color must be under 50 characters")
    .optional()
    .or(z.literal("")),

  // Price in rands (string from form) → converted to cents (integer)
  priceInRands: z
    .string()
    .trim()
    .min(1, "Price is required")
    .transform((val) => parseFloat(val))
    .pipe(
      z
        .number()
        .positive("Price must be greater than zero")
        .max(999999, "Price cannot exceed R999,999")
    )
    .transform((rands) => Math.round(rands * 100)), // Convert to cents

  // Optional retail price (higher than wholesale)
  retailPriceInRands: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((val) => {
      if (!val || val === "") return undefined;
      const num = parseFloat(val);
      if (isNaN(num) || num <= 0) return undefined;
      return Math.round(num * 100);
    }),

  stock: z
    .string()
    .trim()
    .transform((val) => parseInt(val, 10))
    .pipe(
      z
        .number()
        .int("Stock must be a whole number")
        .min(0, "Stock cannot be negative")
        .max(999999, "Stock cannot exceed 999,999")
    ),

  sku: z
    .string()
    .trim()
    .max(100, "SKU must be under 100 characters")
    .optional()
    .or(z.literal("")),
});

export type VariantCreateInput = z.infer<typeof variantCreateSchema>;

/**
 * Schema for updating a variant.
 * All fields optional — seller can update just stock or just price.
 */
export const variantUpdateSchema = z.object({
  size: z
    .string()
    .trim()
    .min(1, "Size is required")
    .max(20)
    .optional(),

  color: z
    .string()
    .trim()
    .max(50)
    .optional()
    .nullable()
    .or(z.literal("")),

  priceInRands: z
    .string()
    .trim()
    .min(1, "Price is required")
    .transform((val) => parseFloat(val))
    .pipe(z.number().positive("Price must be greater than zero").max(999999))
    .transform((rands) => Math.round(rands * 100))
    .optional(),

  retailPriceInRands: z
    .string()
    .trim()
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((val) => {
      if (val === null) return null; // Explicitly cleared
      if (!val || val === "") return undefined; // Not provided
      const num = parseFloat(val);
      if (isNaN(num) || num <= 0) return undefined;
      return Math.round(num * 100);
    }),

  stock: z
    .string()
    .trim()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(0).max(999999))
    .optional(),

  sku: z
    .string()
    .trim()
    .max(100)
    .optional()
    .nullable()
    .or(z.literal("")),
});

export type VariantUpdateInput = z.infer<typeof variantUpdateSchema>;
