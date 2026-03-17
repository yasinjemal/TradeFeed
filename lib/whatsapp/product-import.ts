// ============================================================
// WhatsApp Product Import — Core Service
// ============================================================
// Processes incoming WhatsApp image messages from sellers and
// creates product listings using AI image analysis.
//
// FLOW:
//   1. Seller sends image + optional text via WhatsApp
//   2. System matches sender phone → shop (via ShopUser + Shop.whatsappNumber)
//   3. Downloads image from WhatsApp CDN
//   4. Sends image to GPT-4o Vision for analysis
//   5. Parses text for price/sizes/colors
//   6. Creates product + variants in seller's shop
//   7. Stores image as ProductImage
//   8. Replies to seller with confirmation + link
//
// MULTI-TENANT: Shop resolved from sender phone number.
// RATE LIMIT: Max 10 imports per hour per shop.
// ============================================================

import { db } from "@/lib/db";
import { createProduct } from "@/lib/db/products";
import { batchCreateVariants } from "@/lib/db/variants";
import { parseProductMessage } from "./product-import-parser";
import { sendTextMessage } from "./business-api";
import { getSellerPreferences, buildSellerAIContext } from "@/lib/db/seller-preferences";
import { aiProductResponseSchema, applyAISafety } from "@/lib/validation/ai-product";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://tradefeed.co.za";
const MAX_IMPORTS_PER_HOUR = 10;

// ── Types ───────────────────────────────────────────────────

export interface WhatsAppImageMessage {
  from: string;           // Sender phone number (international format)
  imageId: string;        // WhatsApp media ID
  caption?: string;       // Optional text sent with image
  messageId: string;      // WhatsApp message ID (for dedup)
  timestamp: string;      // Unix timestamp
}

interface ImportResult {
  success: boolean;
  productId?: string;
  productUrl?: string;
  error?: string;
  shopSlug?: string;
}

// ── Shop Resolution ─────────────────────────────────────────

/**
 * Find the shop associated with a WhatsApp number.
 * Matches the last 9 digits of the sender phone to Shop.whatsappNumber
 * or ShopUser's associated shop.
 */
async function resolveShopFromPhone(senderPhone: string) {
  const last9 = senderPhone.slice(-9);

  // Try matching shop WhatsApp number directly
  const shop = await db.shop.findFirst({
    where: {
      isActive: true,
      OR: [
        { whatsappNumber: { endsWith: last9 } },
        { retailWhatsappNumber: { endsWith: last9 } },
      ],
    },
    select: {
      id: true,
      slug: true,
      name: true,
      subscription: {
        select: {
          status: true,
          plan: { select: { slug: true, productLimit: true } },
        },
      },
    },
  });

  return shop;
}

// ── Rate Limiting ───────────────────────────────────────────

/**
 * Check if shop has exceeded import rate limit.
 * Uses WhatsAppProductImport table as counter.
 */
async function checkImportRateLimit(shopId: string): Promise<boolean> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const count = await db.whatsAppProductImport.count({
    where: {
      shopId,
      createdAt: { gte: oneHourAgo },
    },
  });
  return count < MAX_IMPORTS_PER_HOUR;
}

// ── Duplicate Detection ─────────────────────────────────────

/**
 * Check if this WhatsApp message was already processed (idempotency).
 */
async function isDuplicateMessage(messageId: string): Promise<boolean> {
  const existing = await db.whatsAppProductImport.findFirst({
    where: { messageId },
  });
  return !!existing;
}

// ── Image Download ──────────────────────────────────────────

/**
 * Download image from WhatsApp Cloud API using media ID.
 * Returns the image URL that can be used with OpenAI Vision.
 */
async function getWhatsAppMediaUrl(mediaId: string): Promise<string | null> {
  const apiToken = process.env.WHATSAPP_API_TOKEN;
  if (!apiToken) {
    console.log("[wa-import] No API token — mock mode");
    return null;
  }

  try {
    // Step 1: Get media URL from WhatsApp
    const metaResponse = await fetch(
      `https://graph.facebook.com/v21.0/${mediaId}`,
      {
        headers: { Authorization: `Bearer ${apiToken}` },
      }
    );

    if (!metaResponse.ok) {
      console.error("[wa-import] Failed to get media metadata:", metaResponse.status);
      return null;
    }

    const metaData = await metaResponse.json();
    const mediaUrl = metaData.url;

    if (!mediaUrl) return null;

    // Step 2: Download the actual image binary
    const imageResponse = await fetch(mediaUrl, {
      headers: { Authorization: `Bearer ${apiToken}` },
    });

    if (!imageResponse.ok) {
      console.error("[wa-import] Failed to download media:", imageResponse.status);
      return null;
    }

    // Convert to base64 data URL for OpenAI Vision
    const buffer = await imageResponse.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const contentType = imageResponse.headers.get("content-type") || "image/jpeg";
    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    console.error("[wa-import] Media download error:", error);
    return null;
  }
}

// ── AI Product Analysis ─────────────────────────────────────

/**
 * Analyze product image with GPT-4o Vision.
 * Returns structured product data (name, description, category, tags).
 */
async function analyzeProductImage(
  imageUrl: string,
  captionText: string,
  sellerContext: string
) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.log("[wa-import] No OpenAI key — returning mock data");
    return {
      name: "Product from WhatsApp",
      description: "Product imported via WhatsApp. Edit to add a detailed description.",
      category: "Other",
      tags: ["whatsapp-import"],
    };
  }

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
        content: `You are a product listing expert for TradeFeed, a South African online marketplace.
Analyze the product image and create a listing. The seller sent this via WhatsApp with their product photo.

Return ONLY valid JSON:
{
  "name": "Product name (5-80 chars, descriptive, SEO-friendly)",
  "description": "Product description (100-300 chars, features, materials, use case)",
  "category": "Best fit from: T-Shirts, Hoodies, Jackets, Jeans, Dresses, Sneakers, Phones, Earbuds, Chargers, Skincare, Fragrance, Snacks, Beverages, Home Decor, Accessories, Other",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}

Rules:
- Be specific about the product type, material, and style
- Use South African English
- If the image is unclear, still try your best
- The seller may have included additional context in the caption
` + sellerContext,
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: captionText
              ? `Seller's message: "${captionText}"\n\nAnalyze this product image:`
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

  try {
    const parsed = JSON.parse(raw);
    // Apply safety checks
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

    // Partial parse — use what we can
    return {
      name: typeof parsed.name === "string" ? parsed.name.slice(0, 200) : "WhatsApp Product",
      description: typeof parsed.description === "string" ? parsed.description.slice(0, 2000) : "",
      category: typeof parsed.category === "string" ? parsed.category : "Other",
      tags: Array.isArray(parsed.tags) ? parsed.tags.filter((t: unknown) => typeof t === "string").slice(0, 10) : [],
    };
  } catch {
    console.error("[wa-import] Failed to parse AI response");
    return null;
  }
}

// ── Product Creation ────────────────────────────────────────

/**
 * Create a product from WhatsApp import data.
 */
async function createProductFromImport(
  shopId: string,
  aiData: { name: string; description: string; category: string; tags: string[] },
  price: { minPriceCents: number; maxPriceCents: number | null } | null,
  sizes: string[],
  colors: string[],
  imageUrl: string | null
) {
  // Find matching global category
  let globalCategoryId: string | null = null;
  if (aiData.category && aiData.category !== "Other") {
    const globalCat = await db.globalCategory.findFirst({
      where: {
        OR: [
          { name: { equals: aiData.category, mode: "insensitive" } },
          { slug: { equals: aiData.category.toLowerCase().replace(/\s+/g, "-") } },
        ],
      },
      select: { id: true },
    });
    globalCategoryId = globalCat?.id || null;
  }

  // Create product
  const product = await createProduct(
    {
      name: aiData.name,
      description: aiData.description,
      isActive: !!price, // Draft if no price detected
      globalCategoryId: globalCategoryId || "",
      categoryId: "",
      option1Label: "Size",
      option2Label: "Color",
      minWholesaleQty: 1,
      wholesaleOnly: false,
      aiGenerated: false,
    },
    shopId
  );

  // Mark as WhatsApp import + AI-generated
  await db.product.update({
    where: { id: product.id },
    data: { source: "WHATSAPP", aiGenerated: true },
  });

  // Create variants from parsed sizes × colors
  const effectiveSizes = sizes.length > 0 ? sizes : ["Default"];
  const effectivePrice = price?.minPriceCents || 0;
  const variants: { size: string; color: string | null; priceInCents: number; stock: number }[] = [];

  if (colors.length > 0) {
    // Create Size × Color matrix
    for (const size of effectiveSizes) {
      for (const color of colors) {
        variants.push({
          size,
          color,
          priceInCents: effectivePrice,
          stock: 10, // Default stock for WhatsApp imports
        });
      }
    }
  } else {
    // Sizes only
    for (const size of effectiveSizes) {
      variants.push({
        size,
        color: null,
        priceInCents: effectivePrice,
        stock: 10,
      });
    }
  }

  if (variants.length > 0) {
    await batchCreateVariants(product.id, shopId, variants, product.name);
  }

  // Save WhatsApp image as product image (if available)
  if (imageUrl && !imageUrl.startsWith("data:")) {
    // Only save URL-based images (not base64 data URIs)
    await db.productImage.create({
      data: {
        productId: product.id,
        url: imageUrl,
        altText: aiData.name,
        position: 0,
      },
    });
  }

  return product;
}

// ── Main Import Handler ─────────────────────────────────────

/**
 * Process an incoming WhatsApp image message as a product import.
 *
 * This is the main entry point called by the webhook handler
 * when a seller sends an image message.
 */
export async function processWhatsAppProductImport(
  message: WhatsAppImageMessage
): Promise<ImportResult> {
  const { from, imageId, caption, messageId } = message;

  try {
    // 1. Check for duplicate message (idempotency)
    if (await isDuplicateMessage(messageId)) {
      console.log("[wa-import] Duplicate message:", messageId);
      return { success: false, error: "DUPLICATE" };
    }

    // 2. Resolve sender → shop
    const shop = await resolveShopFromPhone(from);
    if (!shop) {
      await sendTextMessage(from,
        "👋 Hi! To import products via WhatsApp, you need a TradeFeed store first.\n\n" +
        `Sign up free at ${APP_URL}/create-shop`
      );
      return { success: false, error: "NO_SHOP" };
    }

    // 3. Create import record (tracks progress)
    const importRecord = await db.whatsAppProductImport.create({
      data: {
        shopId: shop.id,
        messageId,
        imageMediaId: imageId,
        captionText: caption || null,
        status: "PENDING",
      },
    });

    // 4. Check rate limit
    if (!(await checkImportRateLimit(shop.id))) {
      await db.whatsAppProductImport.update({
        where: { id: importRecord.id },
        data: { status: "FAILED", errorMessage: "Rate limit exceeded" },
      });
      await sendTextMessage(from,
        "⏳ You've reached the import limit (10 products/hour). Try again in a bit!"
      );
      return { success: false, error: "RATE_LIMITED" };
    }

    // 5. Check product limit
    const productCount = await db.product.count({ where: { shopId: shop.id } });
    const planLimit = shop.subscription?.plan?.productLimit || 10;
    if (productCount >= planLimit) {
      await db.whatsAppProductImport.update({
        where: { id: importRecord.id },
        data: { status: "FAILED", errorMessage: "Product limit reached" },
      });
      await sendTextMessage(from,
        `📦 Your store has reached its product limit (${productCount}/${planLimit}). ` +
        `Upgrade your plan at ${APP_URL}/dashboard/${shop.slug}/billing to add more!`
      );
      return { success: false, error: "PRODUCT_LIMIT" };
    }

    // 6. Download image from WhatsApp
    const imageDataUrl = await getWhatsAppMediaUrl(imageId);
    if (!imageDataUrl) {
      await db.whatsAppProductImport.update({
        where: { id: importRecord.id },
        data: { status: "FAILED", errorMessage: "Failed to download image" },
      });
      await sendTextMessage(from,
        "📸 Couldn't download your photo. Please try sending it again."
      );
      return { success: false, error: "IMAGE_DOWNLOAD_FAILED" };
    }

    // 7. Parse caption text for price/sizes/colors
    const parsed = parseProductMessage(caption || "");

    // 8. Get seller AI context
    const sellerPrefs = await getSellerPreferences(shop.id);
    const sellerContext = buildSellerAIContext(sellerPrefs);

    // 9. AI product analysis
    const aiData = await analyzeProductImage(imageDataUrl, caption || "", sellerContext);
    if (!aiData) {
      await db.whatsAppProductImport.update({
        where: { id: importRecord.id },
        data: { status: "FAILED", errorMessage: "AI analysis failed" },
      });
      await sendTextMessage(from,
        "🤖 Couldn't analyze your product photo. Try a clearer image with good lighting!"
      );
      return { success: false, error: "AI_FAILED" };
    }

    // 10. Create product + variants
    const product = await createProductFromImport(
      shop.id,
      aiData,
      parsed.price,
      parsed.sizes,
      parsed.colors,
      null // Image saved separately via CDN
    );

    // 11. Update import record with success
    await db.whatsAppProductImport.update({
      where: { id: importRecord.id },
      data: {
        status: "PROCESSED",
        productId: product.id,
        parsedPrice: parsed.price?.minPriceCents || null,
        parsedSizes: parsed.sizes,
        aiProductName: aiData.name,
      },
    });

    // 12. Send confirmation to seller
    const productUrl = `${APP_URL}/catalog/${shop.slug}/products/${product.slug || product.id}`;
    const priceDisplay = parsed.price
      ? `R${(parsed.price.minPriceCents / 100).toFixed(0)}`
      : "No price set";

    const confirmationParts = [
      `✅ Product created!`,
      ``,
      `📦 *${aiData.name}*`,
      `💰 ${priceDisplay}`,
      parsed.sizes.length > 1 ? `📏 Sizes: ${parsed.sizes.join(", ")}` : null,
      parsed.colors.length > 0 ? `🎨 Colors: ${parsed.colors.join(", ")}` : null,
      ``,
      `🔗 View: ${productUrl}`,
      ``,
      !parsed.price ? `⚠️ No price detected — edit your product to add pricing.` : null,
      `✏️ Edit: ${APP_URL}/dashboard/${shop.slug}/products/${product.id}`,
    ].filter(Boolean);

    await sendTextMessage(from, confirmationParts.join("\n"));

    return {
      success: true,
      productId: product.id,
      productUrl,
      shopSlug: shop.slug,
    };
  } catch (error) {
    console.error("[wa-import] Product import error:", error);

    // Try to send error message to seller
    try {
      await sendTextMessage(from,
        "❌ Something went wrong creating your product. Please try again or use the web dashboard."
      );
    } catch {
      // Silent — don't crash on notification failure
    }

    return { success: false, error: "INTERNAL_ERROR" };
  }
}
