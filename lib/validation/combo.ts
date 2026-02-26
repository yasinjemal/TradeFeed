// ============================================================
// Zod Validation — Combo Schemas
// ============================================================

import { z } from "zod";

// ── Combo Category ──────────────────────────────────────────

export const comboCategoryCreateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Category name must be at least 2 characters")
    .max(100, "Category name must be under 100 characters"),
});

export type ComboCategoryCreateInput = z.infer<typeof comboCategoryCreateSchema>;

// ── Combo Items (what's in the bundle) ──────────────────────

export const comboItemSchema = z.object({
  productId: z.string().optional().or(z.literal("")),
  variantId: z.string().optional().or(z.literal("")),
  productName: z
    .string()
    .trim()
    .min(1, "Product name is required")
    .max(200),
  variantLabel: z
    .string()
    .trim()
    .max(100)
    .optional()
    .or(z.literal("")),
  quantity: z
    .number()
    .int()
    .min(1, "Quantity must be at least 1")
    .max(100)
    .default(1),
});

// ── Combo Create ────────────────────────────────────────────

export const comboCreateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Combo name must be at least 2 characters")
    .max(200, "Combo name must be under 200 characters"),

  description: z
    .string()
    .trim()
    .max(2000, "Description must be under 2000 characters")
    .optional()
    .or(z.literal("")),

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
    .transform((rands) => Math.round(rands * 100)),

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
        .max(999999)
    ),

  comboCategoryId: z
    .string()
    .cuid()
    .optional()
    .or(z.literal("")),

  isActive: z.boolean().default(true),

  items: z
    .array(comboItemSchema)
    .min(2, "A combo must have at least 2 items"),
});

export type ComboCreateInput = z.infer<typeof comboCreateSchema>;

// ── Combo Update ────────────────────────────────────────────

export const comboUpdateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2)
    .max(200)
    .optional(),

  description: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .or(z.literal("")),

  priceInRands: z
    .string()
    .trim()
    .min(1)
    .transform((val) => parseFloat(val))
    .pipe(z.number().positive().max(999999))
    .transform((rands) => Math.round(rands * 100))
    .optional(),

  retailPriceInRands: z
    .string()
    .trim()
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((val) => {
      if (val === null) return null;
      if (!val || val === "") return undefined;
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

  comboCategoryId: z
    .string()
    .cuid()
    .optional()
    .nullable()
    .or(z.literal("")),

  isActive: z.boolean().optional(),

  items: z
    .array(comboItemSchema)
    .min(2, "A combo must have at least 2 items")
    .optional(),
});

export type ComboUpdateInput = z.infer<typeof comboUpdateSchema>;
