// ============================================================
// AI — Import Draft Generation (Phase 4)
// ============================================================
// Vision call for the catalogue import flow. Extends the
// existing photo→listing pipeline with price detection,
// attributes, confidence, and quality flags.
//
// Strict output contract (spec §5A):
// { title, category, description, priceMin, priceMax,
//   attributes: { sizes, colours, material }, confidence, flags }
// ============================================================

import { z } from "zod";

export const importDraftSchema = z.object({
  title: z.string().trim().min(2).max(200),
  category: z.string().trim().max(100).default(""),
  description: z.string().trim().max(2000).default(""),
  priceMinCents: z.number().int().positive().nullable(),
  priceMaxCents: z.number().int().positive().nullable(),
  attributes: z.object({
    sizes: z.array(z.string().trim().max(20)).max(15).default([]),
    colours: z.array(z.string().trim().max(30)).max(15).default([]),
    material: z.string().trim().max(100).default(""),
  }),
  confidence: z.number().min(0).max(1),
  flags: z.array(z.string()).default([]),
});

export type ImportDraft = z.infer<typeof importDraftSchema>;

/**
 * Normalize the raw model JSON (prices in rands) into the
 * validated draft shape (prices in cents). Exported for tests.
 */
export function normalizeImportDraftResponse(raw: unknown): ImportDraft | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;

  const toCents = (v: unknown): number | null => {
    if (typeof v !== "number" || !Number.isFinite(v) || v <= 0) return null;
    const cents = Math.round(v * 100);
    return cents >= 100 && cents <= 100_000_000 ? cents : null;
  };

  const attributes =
    typeof r.attributes === "object" && r.attributes !== null
      ? (r.attributes as Record<string, unknown>)
      : {};

  const parsed = importDraftSchema.safeParse({
    title: r.title,
    category: r.category ?? "",
    description: r.description ?? "",
    priceMinCents: toCents(r.priceMin),
    priceMaxCents: toCents(r.priceMax),
    attributes: {
      sizes: Array.isArray(attributes.sizes) ? attributes.sizes : [],
      colours: Array.isArray(attributes.colours) ? attributes.colours : [],
      material: typeof attributes.material === "string" ? attributes.material : "",
    },
    confidence: typeof r.confidence === "number" ? Math.max(0, Math.min(1, r.confidence)) : 0,
    flags: Array.isArray(r.flags) ? r.flags.filter((f) => typeof f === "string") : [],
  });

  if (!parsed.success) return null;

  // Ensure min <= max when both present
  const draft = parsed.data;
  if (
    draft.priceMinCents !== null &&
    draft.priceMaxCents !== null &&
    draft.priceMaxCents < draft.priceMinCents
  ) {
    return { ...draft, priceMaxCents: draft.priceMinCents };
  }
  return draft;
}

/**
 * Analyze one import photo. Returns null on failure — the caller
 * marks the draft needs_review with no AI fields.
 */
export async function generateImportDraft(
  imageUrl: string,
  globalContext?: string | null
): Promise<ImportDraft | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.log("[import-draft] No OpenAI key — returning mock draft");
    return {
      title: "Imported product",
      category: "Other",
      description: "Imported via catalogue import. Edit to add details.",
      priceMinCents: null,
      priceMaxCents: null,
      attributes: { sizes: [], colours: [], material: "" },
      confidence: 0.3,
      flags: ["no_price_detected"],
    };
  }

  try {
    const OpenAI = (await import("openai")).default;
    const openai = new OpenAI({ apiKey });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 700,
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            `You analyze product photos for TradeFeed, a South African WhatsApp-first marketplace.\n` +
            `Create a draft listing for the photo.\n\n` +
            `Return ONLY valid JSON:\n` +
            `{\n` +
            `  "title": "Product name (5-80 chars, specific, buyer-facing)",\n` +
            `  "category": "Best fit from: T-Shirts, Hoodies, Jackets, Jeans, Dresses, Sneakers, Phones, Earbuds, Chargers, Skincare, Fragrance, Snacks, Beverages, Home Decor, Accessories, Other",\n` +
            `  "description": "Short buyer-facing description (60-200 chars). Describe only what you can see — never invent specs.",\n` +
            `  "priceMin": 280 or null,\n` +
            `  "priceMax": 350 or null,\n` +
            `  "attributes": { "sizes": ["S","M"], "colours": ["Black"], "material": "" },\n` +
            `  "confidence": 0.85,\n` +
            `  "flags": []\n` +
            `}\n\n` +
            `Rules:\n` +
            `- Prices are in ZAR (rands, numbers only). If no price is visible in the image or context, set priceMin and priceMax to null and add "no_price_detected" to flags.\n` +
            `- If the image clearly shows multiple DISTINCT products (not variants of one), add "multi_item_photo".\n` +
            `- If the image is blurry or you're guessing, lower confidence accordingly.\n` +
            `- If the image carries a watermark, another store's branding, or looks like a stock/competitor photo, add "watermark_suspected".\n` +
            `- Use South African English. Keep it short.\n` +
            (globalContext
              ? `\nSeller's usual caption style / batch context (may contain prices and sizes that apply):\n"""${globalContext.slice(0, 800)}"""`
              : ""),
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Create a draft listing for this product photo:" },
            { type: "image_url", image_url: { url: imageUrl, detail: "low" } },
          ],
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) return null;
    return normalizeImportDraftResponse(JSON.parse(raw));
  } catch (error) {
    console.error("[import-draft] Generation failed:", error);
    return null;
  }
}
