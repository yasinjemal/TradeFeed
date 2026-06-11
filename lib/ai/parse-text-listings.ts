// ============================================================
// AI — Text Dump → Listing Array (Phase 4, Flow B)
// ============================================================
// One cheap text call parses a pasted block of WhatsApp
// captions into structured drafts. Falls back to the pure
// regex pipeline (lib/imports/split-captions) when the model
// is unavailable — sellers are never blocked.
// ============================================================

import { normalizeImportDraftResponse, type ImportDraft } from "@/lib/ai/import-draft";
import { parseTextDump } from "@/lib/imports/split-captions";

export interface ParsedTextListing extends ImportDraft {
  originalCaption: string;
}

/** Regex-only fallback — free, no quota. Exported for tests. */
export function parseTextDumpFallback(text: string): ParsedTextListing[] {
  return parseTextDump(text).map((seed) => ({
    title: seed.title,
    category: "",
    description: seed.description ?? "",
    priceMinCents: seed.priceMinCents,
    priceMaxCents: seed.priceMaxCents,
    attributes: { sizes: seed.sizes, colours: [], material: "" },
    confidence: seed.priceMinCents !== null ? 0.5 : 0.35,
    flags: seed.priceMinCents === null ? ["no_price_detected"] : [],
    originalCaption: seed.originalCaption,
  }));
}

/**
 * Parse a WhatsApp text dump with AI. Returns drafts in the
 * same shape as photo imports (minus images). Never throws;
 * falls back to regex parsing on any failure.
 */
export async function parseTextListings(text: string): Promise<{
  listings: ParsedTextListing[];
  usedAi: boolean;
}> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { listings: parseTextDumpFallback(text), usedAi: false };
  }

  try {
    const OpenAI = (await import("openai")).default;
    const openai = new OpenAI({ apiKey });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 3000,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            `You parse WhatsApp sales captions for TradeFeed, a South African marketplace.\n` +
            `The seller pasted a dump of their product posts. Split it into individual products.\n\n` +
            `Return ONLY valid JSON: {"products": [\n` +
            `  {\n` +
            `    "title": "Product name (specific, buyer-facing)",\n` +
            `    "category": "Best fit from: T-Shirts, Hoodies, Jackets, Jeans, Dresses, Sneakers, Phones, Earbuds, Chargers, Skincare, Fragrance, Snacks, Beverages, Home Decor, Accessories, Other",\n` +
            `    "description": "Short buyer-facing description from the caption only — never invent",\n` +
            `    "priceMin": 280 or null, "priceMax": 350 or null,\n` +
            `    "attributes": { "sizes": ["S","M"], "colours": ["Black"], "material": "" },\n` +
            `    "confidence": 0.9, "flags": [],\n` +
            `    "originalCaption": "the exact caption text for this product"\n` +
            `  }\n` +
            `]}\n\n` +
            `Rules:\n` +
            `- Prices are ZAR. "R280", "280", "R 1 500", and ranges "R280–350" are all valid. No visible price → null + "no_price_detected" flag.\n` +
            `- NEVER merge two products into one entry. Split on line breaks, emoji separators, or topic changes.\n` +
            `- Maximum 50 products. Keep descriptions short.\n` +
            `- Use South African English.`,
        },
        { role: "user", content: text.slice(0, 12000) },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) return { listings: parseTextDumpFallback(text), usedAi: false };

    const parsed = JSON.parse(raw) as { products?: unknown[] };
    if (!Array.isArray(parsed.products)) {
      return { listings: parseTextDumpFallback(text), usedAi: false };
    }

    const listings: ParsedTextListing[] = [];
    for (const item of parsed.products.slice(0, 50)) {
      const draft = normalizeImportDraftResponse(item);
      if (!draft) continue;
      const caption =
        typeof (item as Record<string, unknown>).originalCaption === "string"
          ? ((item as Record<string, unknown>).originalCaption as string).slice(0, 1500)
          : "";
      listings.push({ ...draft, originalCaption: caption });
    }

    if (listings.length === 0) {
      return { listings: parseTextDumpFallback(text), usedAi: false };
    }
    return { listings, usedAi: true };
  } catch (error) {
    console.error("[parse-text-listings] AI parse failed — regex fallback:", error);
    return { listings: parseTextDumpFallback(text), usedAi: false };
  }
}
