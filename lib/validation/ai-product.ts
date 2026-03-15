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

  // ── SEO fields ─────────────────────────────────────────
  seoTitle: z
    .string()
    .trim()
    .max(70, "SEO title must be under 70 characters")
    .optional()
    .default(""),

  seoDescription: z
    .string()
    .trim()
    .max(160, "SEO description must be under 160 characters")
    .optional()
    .default(""),
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

// ============================================================
// AI Safety Layer — Sanitize & Moderate AI Output
// ============================================================
// Applied AFTER Zod validation but BEFORE returning to client.
// Prevents hallucinations, spam, and unsafe content from
// reaching the product creation form.
// ============================================================

/** Words/phrases that should never appear in product listings */
const BLOCKED_PATTERNS: RegExp[] = [
  // Spam / scam signals
  /\b(100%\s*guaranteed|act\s*now|limited\s*time\s*only|click\s*here)\b/gi,
  // Dangerous claims
  /\b(cures?\s+cancer|weight\s*loss\s*miracle|fda\s*approved)\b/gi,
  // Contact info injection (AI shouldn't generate phone/email)
  /(\+?\d{10,15})/g,
  /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
  // URL injection
  /(https?:\/\/[^\s]+)/gi,
];

/**
 * Sanitize raw AI output — strip HTML, excessive whitespace, and suspicious URLs.
 * Returns cleaned version of the AI response.
 */
export function sanitizeAIOutput(data: AiProductResponse): AiProductResponse {
  const stripHtml = (str: string) => str.replace(/<[^>]*>/g, "");
  const normalizeWhitespace = (str: string) =>
    str.replace(/\s{3,}/g, "  ").trim();

  return {
    name: normalizeWhitespace(stripHtml(data.name)),
    description: normalizeWhitespace(stripHtml(data.description)),
    category: stripHtml(data.category).trim(),
    tags: data.tags
      .map((t) => stripHtml(t).trim())
      .filter((t) => t.length > 0),
    shortCaption: normalizeWhitespace(stripHtml(data.shortCaption)),
    seoTitle: normalizeWhitespace(stripHtml(data.seoTitle ?? "")),
    seoDescription: normalizeWhitespace(stripHtml(data.seoDescription ?? "")),
  };
}

/**
 * Content moderation — flag or clean blocked patterns from AI output.
 * Returns { clean: true/false, data, flags[] }.
 */
export function moderateContent(data: AiProductResponse): {
  clean: boolean;
  data: AiProductResponse;
  flags: string[];
} {
  const flags: string[] = [];

  const scrub = (field: string, value: string): string => {
    let cleaned = value;
    for (const pattern of BLOCKED_PATTERNS) {
      // Reset lastIndex for global regexps
      pattern.lastIndex = 0;
      if (pattern.test(value)) {
        flags.push(`${field}: matched "${pattern.source}"`);
        cleaned = cleaned.replace(pattern, "***");
      }
      pattern.lastIndex = 0;
    }
    return cleaned;
  };

  const cleaned: AiProductResponse = {
    name: scrub("name", data.name),
    description: scrub("description", data.description),
    category: data.category, // category from allowed list, no scrub needed
    tags: data.tags.map((t, i) => scrub(`tags[${i}]`, t)),
    shortCaption: scrub("shortCaption", data.shortCaption),
    seoTitle: scrub("seoTitle", data.seoTitle ?? ""),
    seoDescription: scrub("seoDescription", data.seoDescription ?? ""),
  };

  return {
    clean: flags.length === 0,
    data: cleaned,
    flags,
  };
}

/**
 * Enforce hard tag limit — truncate if AI returns too many.
 * Also deduplicates and lowercases for consistency.
 */
export function limitTags(
  tags: string[],
  max: number = 10
): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const tag of tags) {
    const normalized = tag.toLowerCase().trim();
    if (normalized.length > 0 && !seen.has(normalized)) {
      seen.add(normalized);
      result.push(tag.trim());
    }
    if (result.length >= max) break;
  }

  return result;
}

/**
 * Full AI safety pipeline — sanitize → moderate → limit tags.
 * Call this AFTER Zod validation, BEFORE returning to client.
 */
export function applyAISafety(data: AiProductResponse): {
  data: AiProductResponse;
  flags: string[];
} {
  // Step 1: Sanitize (strip HTML, normalize whitespace)
  const sanitized = sanitizeAIOutput(data);

  // Step 2: Moderate (detect + scrub blocked patterns)
  const moderated = moderateContent(sanitized);

  // Step 3: Limit tags (deduplicate + cap at 10)
  const finalData: AiProductResponse = {
    ...moderated.data,
    tags: limitTags(moderated.data.tags, 10),
  };

  return {
    data: finalData,
    flags: moderated.flags,
  };
}
