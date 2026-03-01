// ============================================================
// API Route — AI Product Generator (SEO-Optimized)
// ============================================================
// POST /api/ai/generate-product
//
// Accepts an image URL + shop slug, verifies the shop has
// a PRO_AI plan, then calls OpenAI Vision to generate:
//   - SEO-optimized product name (Google Merchant friendly)
//   - Keyword-rich product description
//   - Category suggestion
//   - Search-relevant tags
//   - WhatsApp short caption
//   - SEO title (for Google search results)
//   - SEO meta description (for Google snippets)
//
// Returns structured JSON — does NOT auto-save to DB.
// The seller reviews + edits before manually saving.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { requireShopAccess } from "@/lib/auth";
import { checkAiAccess } from "@/lib/db/ai";
import { aiGenerateRequestSchema, aiProductResponseSchema } from "@/lib/validation/ai-product";
import type { AiProductResponse } from "@/lib/validation/ai-product";

export async function POST(req: NextRequest) {
  try {
    // 1. Parse & validate request body
    const body = await req.json();
    const parsed = aiGenerateRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "INVALID_INPUT", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { imageUrl, shopSlug } = parsed.data;

    // 2. Verify shop access (multi-tenant gatekeeper)
    const access = await requireShopAccess(shopSlug);
    if (!access) {
      return NextResponse.json(
        { error: "ACCESS_DENIED" },
        { status: 403 }
      );
    }

    // 3. Check plan — AI is a paid feature
    const { hasAccess, planSlug } = await checkAiAccess(access.shopId);
    if (!hasAccess) {
      return NextResponse.json(
        {
          error: "PLAN_REQUIRED",
          message: "AI product generation requires a Pro AI plan. Upgrade to unlock this feature.",
          currentPlan: planSlug,
        },
        { status: 403 }
      );
    }

    // 4. Call AI provider
    let aiResult: AiProductResponse;

    if (process.env.OPENAI_API_KEY) {
      // Real OpenAI Vision call
      const OpenAI = (await import("openai")).default;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        max_tokens: 1200,
        temperature: 0.6,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You are an SEO-specialist product listing expert for TradeFeed, a South African online marketplace.
Your job: generate product listings that rank well on Google Shopping AND Google Search in South Africa.

SEO RULES:
- Product NAME: Use a Google Merchant Center-friendly title format.
  Pattern: "[Brand if visible] [Product Type] [Key Feature] — [Material/Color/Size Range]"
  Example: "Premium Oversized Hoodie — Fleece Lined, Unisex, S-XXL"
  Keep 5-80 characters. Front-load the most important keyword.

- Product DESCRIPTION: Write 100-350 characters. Structure it as:
  Line 1: What it is + primary selling point.
  Line 2: Key features (material, fit, size range, technical specs).
  Line 3: Who it's for or use case.
  Naturally include relevant search terms South African buyers would use.
  Avoid keyword stuffing — write for humans first, Google second.

- SEO TITLE (seoTitle): Optimized for Google search results. Under 60 characters.
  Include the product type + "Buy Online" or "South Africa" or price-related term.
  Example: "Oversized Fleece Hoodie — Buy Online | TradeFeed SA"

- SEO DESCRIPTION (seoDescription): Meta description for Google. 120-155 characters.
  Include a benefit, a feature, and a call-to-action.
  Example: "Shop premium fleece-lined hoodies in S-XXL. Free catalog browsing, order via WhatsApp. Available now on TradeFeed."

- TAGS: 5-8 search-relevant keywords buyers would type. Mix broad + specific.
  Include "buy [product] online South Africa" variations and material/style terms.

- SHORT CAPTION: WhatsApp-ready with emoji (under 160 chars). Include a call-to-action.

Return ONLY valid JSON:
{
  "name": "SEO-optimized product name (5-80 chars)",
  "description": "Keyword-rich, structured product description (100-350 chars)",
  "category": "Best-fitting category from: T-Shirts, Hoodies, Jackets, Jeans, Dresses, Sneakers, Phones, Earbuds, Chargers, Skincare, Fragrance, Snacks, Beverages, Home Decor, Accessories, Other",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6"],
  "shortCaption": "WhatsApp caption with emoji + CTA (under 160 chars)",
  "seoTitle": "Google search title under 60 chars with Buy Online or SA keyword",
  "seoDescription": "Google meta description 120-155 chars with benefit + feature + CTA"
}`,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this product image and generate a complete, SEO-optimized product listing for the South African market:",
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
      if (!raw) {
        return NextResponse.json(
          { error: "AI_FAILED", message: "AI did not return a response. Try again." },
          { status: 502 }
        );
      }

      const parsedAi = aiProductResponseSchema.safeParse(JSON.parse(raw));
      if (!parsedAi.success) {
        console.error("[AI] Response validation failed:", parsedAi.error.flatten());
        return NextResponse.json(
          { error: "AI_FAILED", message: "AI returned invalid data. Try again." },
          { status: 502 }
        );
      }

      aiResult = parsedAi.data;
    } else {
      // Mock fallback for development (no API key)
      aiResult = {
        name: "Premium Oversized Hoodie — Fleece Lined, Unisex, S-XXL",
        description:
          "Stay warm in style with this premium fleece-lined oversized hoodie. Soft-touch cotton blend, relaxed fit with ribbed cuffs and kangaroo pocket. Available in sizes S to XXL — perfect for South African winters or casual everyday wear.",
        category: "Hoodies",
        tags: ["hoodie", "oversized hoodie", "fleece hoodie South Africa", "buy hoodie online", "winter clothing SA", "unisex hoodie"],
        shortCaption:
          "🔥 Premium fleece hoodie — S to XXL! Cozy, stylish & affordable. Order now via WhatsApp 📦",
        seoTitle: "Oversized Fleece Hoodie — Buy Online | TradeFeed SA",
        seoDescription: "Shop premium fleece-lined hoodies in S-XXL. Soft cotton blend, relaxed fit. Browse free, order via WhatsApp. Available now on TradeFeed.",
      };
    }

    // 5. Return structured response (no auto-save)
    return NextResponse.json({
      success: true,
      data: aiResult,
    });
  } catch (error) {
    console.error("[AI Generate Product] Error:", error);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
