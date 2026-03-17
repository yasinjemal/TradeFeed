// ============================================================
// WhatsApp — Auto-Reply Generator
// ============================================================
// Generates contextual reply messages based on detected buyer
// intent. Pure function — no I/O, no API calls.
//
// Uses seller preferences (shop name, catalog URL) to
// personalise replies. Keeps messages short, WhatsApp-friendly.
//
// Usage:
//   import { generateAutoReply } from "@/lib/whatsapp/auto-reply";
// ============================================================

import type { IntentResult, BuyerIntent } from "./intent-detection";

export interface ShopContext {
  shopName: string;
  catalogUrl: string;
  whatsappNumber?: string;
}

export interface AutoReplyResult {
  message: string;
  intent: BuyerIntent;
  /** Whether this reply should actually be sent (some intents are info-only) */
  shouldSend: boolean;
}

/**
 * Generate a WhatsApp-friendly auto-reply based on buyer intent.
 *
 * @param intent - Detected buyer intent from detectIntent()
 * @param shop - Shop context for personalisation
 * @returns AutoReplyResult with message and send decision
 */
export function generateAutoReply(
  intent: IntentResult,
  shop: ShopContext
): AutoReplyResult {
  const { shopName, catalogUrl } = shop;

  switch (intent.intent) {
    case "greeting":
      return {
        intent: "greeting",
        shouldSend: true,
        message:
          `Hi there! 👋 Welcome to ${shopName}.\n\n` +
          `Browse our catalog here:\n${catalogUrl}\n\n` +
          `Send us a photo or product name and we'll help you! 🛍️`,
      };

    case "price_inquiry":
      return {
        intent: "price_inquiry",
        shouldSend: true,
        message:
          `Thanks for your interest! 💰\n\n` +
          `You can see all our prices on our catalog:\n${catalogUrl}\n\n` +
          `Or send us the product name / photo and we'll share the price right away.`,
      };

    case "availability":
      return {
        intent: "availability",
        shouldSend: true,
        message:
          `Great question! 📦\n\n` +
          `Check live stock on our catalog:\n${catalogUrl}\n\n` +
          (intent.entities?.size
            ? `Looking for size ${intent.entities.size}? Let us check for you — one moment!\n\n`
            : "") +
          (intent.entities?.color
            ? `Interested in ${intent.entities.color}? We'll confirm availability shortly.\n\n`
            : "") +
          `A team member will confirm shortly. 🙏`,
      };

    case "delivery":
      return {
        intent: "delivery",
        shouldSend: true,
        message:
          `Thanks for asking about delivery! 🚚\n\n` +
          (intent.entities?.city
            ? `We'll check delivery options to ${intent.entities.city} and get back to you shortly.\n\n`
            : `We deliver across South Africa. Let us know your city and we'll share delivery options.\n\n`) +
          `Browse products while you wait:\n${catalogUrl}`,
      };

    case "order_status":
      return {
        intent: "order_status",
        shouldSend: true,
        message:
          `We're checking on your order! 📋\n\n` +
          (intent.entities?.orderNumber
            ? `Order ${intent.entities.orderNumber} — let us pull up the details.\n\n`
            : `Could you share your order number? It starts with "TF-".\n\n`) +
          `A team member will update you shortly. ⏳`,
      };

    case "product_info":
      return {
        intent: "product_info",
        shouldSend: true,
        message:
          `Sure thing! ℹ️\n\n` +
          `You can find full product details, sizes, and photos on our catalog:\n${catalogUrl}\n\n` +
          `Or tell us which product you're looking at and we'll share the details. 📸`,
      };

    case "payment":
      return {
        intent: "payment",
        shouldSend: true,
        message:
          `💳 *Payment at ${shopName}*\n\n` +
          `We accept card payments, EFT, and SnapScan via PayFast.\n\n` +
          `To pay, share your order number (starts with "TF-") and we'll send you a payment link.\n\n` +
          `Or check your order here:\nhttps://tradefeed.co.za/track`,
      };

    case "thanks":
      return {
        intent: "thanks",
        shouldSend: true,
        message:
          `You're welcome! 😊\n\n` +
          `Feel free to reach out anytime. Happy shopping at ${shopName}! 🛍️`,
      };

    case "unknown":
    default:
      return {
        intent: "unknown",
        shouldSend: false,
        message: "",
      };
  }
}
