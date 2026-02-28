// ============================================================
// API Route — AI Product Generator
// ============================================================
// POST /api/ai/generate-product
//
// Accepts an image URL + shop slug, verifies the shop has
// a PRO_AI plan, then calls OpenAI Vision to generate:
//   - Product name
//   - Description
//   - Category suggestion
//   - Tags
//   - WhatsApp short caption
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
        max_tokens: 800,
        temperature: 0.7,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You are a product listing expert for a South African wholesale marketplace called TradeFeed. 
Given a product image, generate structured product listing data.
Return ONLY valid JSON with these exact fields:
{
  "name": "Concise product name (2-80 chars)",
  "description": "Compelling product description for wholesale buyers (50-300 chars). Mention material, style, and selling points.",
  "category": "Best-fitting category from: T-Shirts, Hoodies, Jackets, Jeans, Dresses, Sneakers, Phones, Earbuds, Chargers, Skincare, Fragrance, Snacks, Beverages, Home Decor, Accessories, Other",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "shortCaption": "WhatsApp-ready caption with emoji (under 160 chars). Include a call-to-action."
}
Keep it professional, concise, and optimized for SA wholesale market.`,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this product image and generate a complete product listing:",
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
        name: "Premium Wholesale Product",
        description:
          "High-quality wholesale item perfect for resellers. Durable construction with modern styling. Available in bulk quantities at competitive prices.",
        category: "Other",
        tags: ["wholesale", "bulk", "premium", "trending", "new-arrival"],
        shortCaption:
          "🔥 New arrival! Premium quality at wholesale prices. DM to order in bulk! 📦",
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
