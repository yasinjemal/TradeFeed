// ============================================================
// Zod Validation — Review Schemas
// ============================================================
// Buyers submit reviews without an account, and the text is shown
// on public product pages and in product JSON-LD, so every free-text
// field is trimmed and stripped of HTML tags before it is stored.
// ============================================================

import { z } from "zod";
import { stripHtml } from "./strip-html";

const cleanText = (value: string) => stripHtml(value).trim();

export const submitReviewSchema = z.object({
  rating: z.number().int().min(1, "Rating must be 1-5").max(5, "Rating must be 1-5"),
  title: z
    .string()
    .trim()
    .transform(cleanText)
    .pipe(z.string().max(200, "Title too long"))
    .optional()
    .or(z.literal("")),
  comment: z
    .string()
    .trim()
    .transform(cleanText)
    .pipe(z.string().max(2000, "Review too long"))
    .optional()
    .or(z.literal("")),
  buyerName: z
    .string()
    .trim()
    .transform(cleanText)
    .pipe(z.string().min(1, "Name is required").max(100, "Name too long")),
  buyerEmail: z.string().email("Invalid email").optional().or(z.literal("")),
});
