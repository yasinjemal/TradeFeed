// ============================================================
// AI Product Image Analysis — Shared Helper
// ============================================================
// GPT-4o Vision analysis extracted from WhatsApp product import
// so it can be reused by bulk import, web dashboard, and any
// future image-to-listing flow.
// ============================================================

import { aiProductResponseSchema, applyAISafety } from "@/lib/validation/ai-product";

export interface AiProductAnalysis {
  name: string;
  description: string;
  category: string;
  tags: string[];
}

/**
 * Analyze a product image with GPT-4o Vision.
 *
 * @param imageUrl  CDN URL or base64 data URL of the product image
 * @param hint      Optional seller-provided caption or context
 * @param sellerContext  Optional AI context string (brand tone, audience, etc.)
 * @returns Structured product data, or null if analysis fails
 */
export async function analyzeProductImage(
  imageUrl: string,
  hint?: string,
  sellerContext?: string,
): Promise<AiProductAnalysis | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.log("[ai-analyze] No OpenAI key — returning mock data");
    return {
      name: "Product from Image",
      description: "Product imported via image upload. Edit to add a detailed description.",
      category: "Other",
      tags: ["image-import"],
    };
  }

  try {
    const OpenAI = (await import("openai")).default;
    const openai = new OpenAI({ apiKey });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 800,
      temperature: 0.5,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            `You are a product listing expert for TradeFeed, a South African online marketplace.\n` +
            `Analyze the product image and create a listing.\n\n` +
            `Return ONLY valid JSON:\n` +
            `{\n` +
            `  "name": "Product name (5-80 chars, descriptive, SEO-friendly)",\n` +
            `  "description": "Product description (100-300 chars, features, materials, use case)",\n` +
            `  "category": "Best fit from: T-Shirts, Hoodies, Jackets, Jeans, Dresses, Sneakers, Phones, Earbuds, Chargers, Skincare, Fragrance, Snacks, Beverages, Home Decor, Accessories, Other",\n` +
            `  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]\n` +
            `}\n\n` +
            `Rules:\n` +
            `- Be specific about the product type, material, and style\n` +
            `- Use South African English\n` +
            `- If the image is unclear, still try your best\n` +
            (sellerContext ? `\nSeller context:\n${sellerContext}` : ""),
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: hint
                ? `Seller hint: "${hint}"\n\nAnalyze this product image:`
                : "Analyze this product image and create a listing:",
            },
            {
              type: "image_url",
              image_url: { url: imageUrl, detail: "low" },
            },
          ],
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) return null;

    const parsed = JSON.parse(raw);

    const validated = aiProductResponseSchema.safeParse({
      ...parsed,
      shortCaption: parsed.shortCaption || "",
      seoTitle: parsed.seoTitle || "",
      seoDescription: parsed.seoDescription || "",
    });

    if (validated.success) {
      const { data } = applyAISafety(validated.data);
      return {
        name: data.name,
        description: data.description,
        category: data.category,
        tags: data.tags,
      };
    }

    return {
      name: typeof parsed.name === "string" ? parsed.name.slice(0, 200) : "Imported Product",
      description: typeof parsed.description === "string" ? parsed.description.slice(0, 2000) : "",
      category: typeof parsed.category === "string" ? parsed.category : "Other",
      tags: Array.isArray(parsed.tags)
        ? parsed.tags.filter((t: unknown) => typeof t === "string").slice(0, 10)
        : [],
    };
  } catch (err) {
    console.error("[ai-analyze] Image analysis failed:", err);
    return null;
  }
}

/**
 * Analyze multiple images in parallel with concurrency control.
 * Returns results in the same order as the input array.
 */
export async function analyzeProductImages(
  images: { url: string; hint?: string }[],
  sellerContext?: string,
  concurrency = 3,
): Promise<(AiProductAnalysis | null)[]> {
  const results: (AiProductAnalysis | null)[] = new Array(images.length).fill(null);

  for (let i = 0; i < images.length; i += concurrency) {
    const batch = images.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map((img) => analyzeProductImage(img.url, img.hint, sellerContext)),
    );
    for (let j = 0; j < batchResults.length; j++) {
      results[i + j] = batchResults[j] ?? null;
    }
  }

  return results;
}
