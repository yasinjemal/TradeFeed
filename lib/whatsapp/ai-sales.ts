// ============================================================
// WhatsApp — AI Sales Assistant Reply Generator
// ============================================================
// Uses GPT-4o-mini to generate intelligent, product-aware
// replies to buyer WhatsApp messages. Builds context from the
// shop's product catalog and conversation history.
//
// Only active for pro-ai / business plan sellers.
// Falls back to template-based replies for other plans.
// ============================================================

import { db } from "@/lib/db";
import { buildSellerAIContext } from "@/lib/db/seller-preferences";

const MAX_HISTORY_MESSAGES = 10;
const MAX_PRODUCTS_IN_CONTEXT = 20;

interface ShopProductContext {
  name: string;
  description: string | null;
  price: string;
  retailPrice: string | null;
  sizes: string[];
  stock: number;
  minWholesaleQty: number;
  category: string | null;
}

/**
 * Get or create a conversation for a buyer+shop pair.
 */
async function getOrCreateConversation(shopId: string, buyerPhone: string) {
  return db.whatsAppConversation.upsert({
    where: { shopId_buyerPhone: { shopId, buyerPhone } },
    create: { shopId, buyerPhone },
    update: { lastMessageAt: new Date() },
    select: {
      id: true,
      messages: {
        orderBy: { createdAt: "desc" },
        take: MAX_HISTORY_MESSAGES,
        select: { role: true, content: true },
      },
    },
  });
}

/**
 * Store a message in the conversation.
 */
async function storeMessage(
  conversationId: string,
  role: "buyer" | "assistant" | "seller",
  content: string,
  options?: { intent?: string; aiGenerated?: boolean },
) {
  await db.whatsAppMessage.create({
    data: {
      conversationId,
      role,
      content,
      intent: options?.intent,
      aiGenerated: options?.aiGenerated ?? false,
    },
  });
}

/**
 * Fetch the shop's product catalog for AI context.
 */
async function getProductContext(shopId: string): Promise<ShopProductContext[]> {
  const products = await db.product.findMany({
    where: { shopId, isActive: true },
    take: MAX_PRODUCTS_IN_CONTEXT,
    orderBy: { updatedAt: "desc" },
    select: {
      name: true,
      description: true,
      minWholesaleQty: true,
      category: { select: { name: true } },
      variants: {
        where: { stock: { gt: 0 } },
        select: {
          size: true,
          priceInCents: true,
          retailPriceCents: true,
          stock: true,
        },
      },
    },
  });

  return products.map((p) => ({
    name: p.name,
    description: p.description,
    price: p.variants.length > 0 ? `R${(Math.min(...p.variants.map((v) => v.priceInCents)) / 100).toFixed(2)}` : "N/A",
    retailPrice: p.variants.some((v) => v.retailPriceCents)
      ? `R${(Math.min(...p.variants.filter((v) => v.retailPriceCents).map((v) => v.retailPriceCents!)) / 100).toFixed(2)}`
      : null,
    sizes: [...new Set(p.variants.map((v) => v.size))],
    stock: p.variants.reduce((sum, v) => sum + v.stock, 0),
    minWholesaleQty: p.minWholesaleQty,
    category: p.category?.name ?? null,
  }));
}

/**
 * Build the product knowledge section for the system prompt.
 */
function buildProductKnowledge(products: ShopProductContext[]): string {
  if (products.length === 0) return "No products currently in this shop's catalog.";

  return products
    .map((p) => {
      const parts = [`- ${p.name}: ${p.price}`];
      if (p.retailPrice) parts.push(`(retail: ${p.retailPrice})`);
      if (p.sizes.length > 0) parts.push(`| Sizes: ${p.sizes.join(", ")}`);
      parts.push(`| Stock: ${p.stock}`);
      if (p.category) parts.push(`| Cat: ${p.category}`);
      if (p.minWholesaleQty > 1) parts.push(`| Min order: ${p.minWholesaleQty}`);
      return parts.join(" ");
    })
    .join("\n");
}

/**
 * Generate an AI-powered reply to a buyer's WhatsApp message.
 *
 * Uses GPT-4o-mini with:
 * - Shop product catalog as context
 * - Conversation history for multi-turn
 * - Seller AI preferences for tone/personality
 *
 * Returns null if OpenAI is not configured.
 */
export async function generateAIReply(
  shopId: string,
  shopName: string,
  shopSlug: string,
  buyerPhone: string,
  messageText: string,
  detectedIntent?: string,
): Promise<{ reply: string; conversationId: string } | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.log("[ai-sales] OpenAI not configured — skipping AI reply");
    return null;
  }

  try {
    // Fetch context in parallel
    const [conversation, products, sellerPrefs] = await Promise.all([
      getOrCreateConversation(shopId, buyerPhone),
      getProductContext(shopId),
      db.sellerPreferences.findUnique({ where: { shopId } }),
    ]);

    // Store the buyer's message
    await storeMessage(conversation.id, "buyer", messageText, { intent: detectedIntent });

    // Build conversation history (reverse to get chronological order)
    const history = conversation.messages.reverse();

    // Build system prompt
    const catalogUrl = `https://tradefeed.co.za/catalog/${shopSlug}`;
    const sellerContext = sellerPrefs ? buildSellerAIContext(sellerPrefs) : "";

    const systemPrompt =
      `You are an AI sales assistant for "${shopName}" on TradeFeed, a South African marketplace.\n` +
      `Your job is to help buyers find products, answer questions about pricing/availability/delivery, and guide them to purchase.\n\n` +
      `RULES:\n` +
      `- Be friendly, helpful, and concise (WhatsApp messages should be short)\n` +
      `- Use relevant emojis sparingly\n` +
      `- Always include the catalog link when mentioning products: ${catalogUrl}\n` +
      `- Prices are in South African Rand (R)\n` +
      `- If you don't know something specific, say you'll check with the seller\n` +
      `- Never make up product information that isn't in the catalog below\n` +
      `- For order issues, ask for the order number (starts with "TF-")\n` +
      `- Keep responses under 300 characters when possible\n` +
      `- Respond in the same language the buyer uses\n\n` +
      `CATALOG (${products.length} products):\n${buildProductKnowledge(products)}\n` +
      sellerContext;

    // Build messages array
    const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: systemPrompt },
    ];

    // Add conversation history
    for (const msg of history) {
      if (msg.role === "buyer") {
        messages.push({ role: "user", content: msg.content });
      } else if (msg.role === "assistant") {
        messages.push({ role: "assistant", content: msg.content });
      }
    }

    // Add current message (if not already in history)
    if (history.length === 0 || history[history.length - 1]?.content !== messageText) {
      messages.push({ role: "user", content: messageText });
    }

    // Call GPT-4o-mini
    const OpenAI = (await import("openai")).default;
    const openai = new OpenAI({ apiKey });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      max_tokens: 300,
      temperature: 0.7,
    });

    const reply = completion.choices[0]?.message?.content?.trim();
    if (!reply) return null;

    // Store the AI reply
    await storeMessage(conversation.id, "assistant", reply, {
      intent: detectedIntent,
      aiGenerated: true,
    });

    return { reply, conversationId: conversation.id };
  } catch (error) {
    console.error("[ai-sales] AI reply generation failed:", error);
    return null;
  }
}

/**
 * Get conversations for a shop (seller dashboard).
 */
export async function getShopConversations(
  shopId: string,
  page = 1,
  pageSize = 20,
) {
  const [conversations, total] = await Promise.all([
    db.whatsAppConversation.findMany({
      where: { shopId },
      orderBy: { lastMessageAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        buyerPhone: true,
        lastMessageAt: true,
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { content: true, role: true, aiGenerated: true },
        },
        _count: { select: { messages: true } },
      },
    }),
    db.whatsAppConversation.count({ where: { shopId } }),
  ]);

  return { conversations, total, pages: Math.ceil(total / pageSize) };
}

/**
 * Get a single conversation with all messages.
 */
export async function getConversationMessages(
  conversationId: string,
  shopId: string,
) {
  return db.whatsAppConversation.findFirst({
    where: { id: conversationId, shopId },
    select: {
      id: true,
      buyerPhone: true,
      lastMessageAt: true,
      messages: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          role: true,
          content: true,
          intent: true,
          aiGenerated: true,
          createdAt: true,
        },
      },
    },
  });
}
