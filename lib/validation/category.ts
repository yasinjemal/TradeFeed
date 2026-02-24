// ============================================================
// Zod Validation — Category Schema
// ============================================================
// Category name: 2-100 chars, generates slug automatically.
// ============================================================

import { z } from "zod";

export const categoryCreateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Category name must be at least 2 characters")
    .max(100, "Category name must be under 100 characters"),
});

export const categoryUpdateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Category name must be at least 2 characters")
    .max(100, "Category name must be under 100 characters"),
});

export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>;
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>;
