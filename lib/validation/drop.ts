// ============================================================
// Zod Validation — Stock Drop Schemas
// ============================================================

import { z } from "zod";

// ── Drop Item (product in a stock drop) ─────────────────────

export const dropItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  productName: z
    .string()
    .trim()
    .min(1, "Product name is required")
    .max(200),
  priceSnapshot: z.number().int().min(0),
  imageUrl: z.string().optional().or(z.literal("")),
});

// ── Drop Create ─────────────────────────────────────────────

export const dropCreateSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Title must be at least 2 characters")
    .max(200, "Title must be under 200 characters"),

  message: z
    .string()
    .trim()
    .min(5, "Message must be at least 5 characters")
    .max(2000, "Message must be under 2000 characters"),

  items: z
    .array(dropItemSchema)
    .min(1, "Select at least one product")
    .max(50, "Maximum 50 products per drop"),
});

export type DropCreateInput = z.infer<typeof dropCreateSchema>;

// ── Drop Update ─────────────────────────────────────────────

export const dropUpdateSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Title must be at least 2 characters")
    .max(200, "Title must be under 200 characters")
    .optional(),

  message: z
    .string()
    .trim()
    .min(5, "Message must be at least 5 characters")
    .max(2000, "Message must be under 2000 characters")
    .optional(),

  items: z
    .array(dropItemSchema)
    .min(1, "Select at least one product")
    .max(50, "Maximum 50 products per drop")
    .optional(),
});

export type DropUpdateInput = z.infer<typeof dropUpdateSchema>;
