// ============================================================
// Zod Validation — AI Product Generation Response
// ============================================================
// Validates the structured response from the AI generation endpoint.
// Ensures AI output is safe to prefill into the product creation form.
// ============================================================

import { z } from "zod";

/**
 * Schema for the AI-generated product data.
 * Must be compatible with productCreateSchema fields.
 */
export const aiProductResponseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(200, "Name must be under 200 characters"),

  description: z
    .string()
    .trim()
    .max(2000, "Description must be under 2000 characters"),

  category: z
    .string()
    .trim()
    .max(100, "Category must be under 100 characters"),

  tags: z
    .array(z.string().trim().max(50))
    .max(10, "Maximum 10 tags"),

  shortCaption: z
    .string()
    .trim()
    .max(500, "Caption must be under 500 characters"),
});

export type AiProductResponse = z.infer<typeof aiProductResponseSchema>;

/**
 * Schema for the request body to the AI generation endpoint.
 */
export const aiGenerateRequestSchema = z.object({
  imageUrl: z.string().url("Must be a valid image URL"),
  shopSlug: z.string().min(1, "Shop slug is required"),
});

export type AiGenerateRequest = z.infer<typeof aiGenerateRequestSchema>;
