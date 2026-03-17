// ============================================================
// Webhook — WhatsApp Business API
// ============================================================
// Handles incoming webhooks from the WhatsApp Cloud API:
// - Webhook verification (GET)
// - Message status updates (POST)
// - Incoming messages from buyers (POST) with auto-reply
//
// SETUP:
// 1. Set WHATSAPP_VERIFY_TOKEN in .env (any random string)
// 2. Register this URL in Meta Developer Portal:
//    https://yourdomain.com/api/webhooks/whatsapp
// 3. Meta will send a GET request with the verify token
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { detectIntent, shouldAutoReply } from "@/lib/whatsapp/intent-detection";
import { generateAutoReply } from "@/lib/whatsapp/auto-reply";
import { generateAIReply } from "@/lib/whatsapp/ai-sales";
import { generateOrderStatusReply, generateStockReply, generatePaymentReply } from "@/lib/whatsapp/order-reply";
import { sendTextMessage } from "@/lib/whatsapp/business-api";
import { processWhatsAppProductImport } from "@/lib/whatsapp/product-import";
import { FEATURE_FLAGS } from "@/lib/config/feature-flags";
import { db } from "@/lib/db";

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

/**
 * GET /api/webhooks/whatsapp
 * Webhook verification — Meta sends this during setup.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("[whatsapp-webhook] Verification successful");
    return new NextResponse(challenge, { status: 200 });
  }

  console.warn("[whatsapp-webhook] Verification failed — token mismatch");
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

interface WhatsAppWebhookEntry {
  id: string;
  changes: {
    value: {
      messaging_product: string;
      metadata: { phone_number_id: string };
      statuses?: {
        id: string;
        status: string;
        timestamp: string;
        recipient_id: string;
      }[];
      messages?: {
        id: string;
        from: string;
        timestamp: string;
        type: string;
        text?: { body: string };
        image?: { id: string; mime_type: string; caption?: string };
      }[];
    };
    field: string;
  }[];
}

/**
 * POST /api/webhooks/whatsapp
 * Handles incoming webhook events from WhatsApp.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.object !== "whatsapp_business_account") {
      return NextResponse.json({ error: "Unknown object type" }, { status: 400 });
    }

    const entries = body.entry as WhatsAppWebhookEntry[];

    for (const entry of entries) {
      for (const change of entry.changes) {
        const value = change.value;

        // Message status updates (sent, delivered, read)
        if (value.statuses) {
          for (const status of value.statuses) {
            console.log("[whatsapp-webhook] Status update:", {
              messageId: status.id,
              status: status.status,
              recipientId: status.recipient_id,
              timestamp: status.timestamp,
            });
          }
        }

        // Incoming messages from buyers
        if (value.messages) {
          for (const message of value.messages) {
            console.log("[whatsapp-webhook] Incoming message:", {
              from: message.from,
              type: message.type,
              text: message.text?.body,
              timestamp: message.timestamp,
            });

            // Auto-reply for text messages
            if (message.type === "text" && message.text?.body) {
              await handleAutoReply(
                message.from,
                message.text.body,
                value.metadata.phone_number_id
              );
            }

            // Product import for image messages from sellers
            if (FEATURE_FLAGS.WHATSAPP_PRODUCT_IMPORT && message.type === "image" && message.image?.id) {
              await handleImageImport(message);
            }
          }
        }
      }
    }

    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (error) {
    console.error("[whatsapp-webhook] Error processing webhook:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// ── Auto-Reply Handler ────────────────────────────────────

/** Plan slugs that include AI sales assistant */
const AI_SALES_PLANS = ["pro-ai", "business"];

/** Intents that use smart data-driven replies (bypass generic templates) */
const SMART_REPLY_INTENTS = new Set(["order_status", "availability", "payment"]);

/**
 * Detect buyer intent and send an auto-reply if applicable.
 * Uses smart data-driven replies for order/stock/payment intents,
 * AI (GPT-4o-mini) for pro-ai/business plans, template replies otherwise.
 */
async function handleAutoReply(
  buyerPhone: string,
  messageText: string,
  _phoneNumberId: string
) {
  try {
    const intent = detectIntent(messageText);

    if (!shouldAutoReply(intent)) {
      console.log("[whatsapp-webhook] No auto-reply for intent:", intent.intent);
      return;
    }

    // Find the shop this buyer most recently ordered from
    const recentOrder = await db.order.findFirst({
      where: {
        buyerPhone: { contains: buyerPhone.slice(-9) }, // match last 9 digits
        deletedAt: null,
      },
      orderBy: { createdAt: "desc" },
      select: {
        shopId: true,
        shop: {
          select: {
            name: true,
            slug: true,
            sellerPreferences: { select: { autoReplyEnabled: true, autoReplyStartHour: true, autoReplyEndHour: true } },
            subscription: {
              select: { status: true, plan: { select: { slug: true } } },
            },
          },
        },
      },
    });

    if (!recentOrder) {
      console.log("[whatsapp-webhook] No shop found for buyer:", buyerPhone);
      return;
    }

    // Check if seller has auto-reply enabled
    if (!recentOrder.shop.sellerPreferences?.autoReplyEnabled) {
      console.log("[whatsapp-webhook] Auto-reply disabled for shop:", recentOrder.shop.slug);
      return;
    }

    // Check auto-reply hours (SAST = UTC+2)
    const prefs = recentOrder.shop.sellerPreferences;
    const startHour = prefs.autoReplyStartHour ?? 8;
    const endHour = prefs.autoReplyEndHour ?? 22;
    const nowSAST = new Date(Date.now() + 2 * 60 * 60 * 1000); // UTC+2
    const currentHour = nowSAST.getUTCHours();
    if (currentHour < startHour || currentHour >= endHour) {
      console.log(`[whatsapp-webhook] Outside auto-reply hours (${startHour}-${endHour}, current: ${currentHour} SAST)`);
      return;
    }

    let replyText: string | null = null;

    // ── Smart replies: real data for order/stock/payment intents ──
    if (SMART_REPLY_INTENTS.has(intent.intent)) {
      try {
        if (intent.intent === "order_status") {
          replyText = await generateOrderStatusReply(intent, recentOrder.shop.name, buyerPhone);
        } else if (intent.intent === "availability") {
          replyText = await generateStockReply(intent, recentOrder.shopId, recentOrder.shop.name);
        } else if (intent.intent === "payment") {
          replyText = await generatePaymentReply(intent, recentOrder.shop.name);
        }
        if (replyText) {
          console.log("[whatsapp-webhook] Smart reply generated:", intent.intent);
        }
      } catch (err) {
        // Fall through to AI/template if smart reply fails
        console.error("[whatsapp-webhook] Smart reply failed, falling back:", err);
      }
    }

    // ── AI reply for pro-ai/business plans (if no smart reply) ──
    if (!replyText) {
      const planSlug = recentOrder.shop.subscription?.plan?.slug;
      const hasAI =
        recentOrder.shop.subscription?.status === "ACTIVE" &&
        !!planSlug &&
        AI_SALES_PLANS.includes(planSlug);

      if (hasAI) {
        const aiResult = await generateAIReply(
          recentOrder.shopId,
          recentOrder.shop.name,
          recentOrder.shop.slug,
          buyerPhone,
          messageText,
          intent.intent,
        );
        if (aiResult) {
          replyText = aiResult.reply;
          console.log("[whatsapp-webhook] AI reply generated for shop:", recentOrder.shop.slug);
        }
      }
    }

    // ── Fall back to template reply ──
    if (!replyText) {
      const reply = generateAutoReply(intent, {
        shopName: recentOrder.shop.name,
        catalogUrl: `https://tradefeed.co.za/catalog/${recentOrder.shop.slug}`,
      });
      if (!reply.shouldSend) return;
      replyText = reply.message;
    }

    const result = await sendTextMessage(buyerPhone, replyText);
    console.log("[whatsapp-webhook] Reply sent:", {
      intent: intent.intent,
      success: result.success,
      messageId: result.messageId,
    });
  } catch (error) {
    // Non-fatal — don't crash the webhook handler
    console.error("[whatsapp-webhook] Auto-reply error:", error);
  }
}

// ── Image Import Handler ──────────────────────────────────

/**
 * Process an image message as a potential product import.
 * Checks if the sender is a registered seller, then delegates
 * to the product import service.
 */
async function handleImageImport(message: {
  id: string;
  from: string;
  timestamp: string;
  image?: { id: string; mime_type: string; caption?: string };
}) {
  try {
    if (!message.image?.id) return;

    const result = await processWhatsAppProductImport({
      from: message.from,
      imageId: message.image.id,
      caption: message.image.caption,
      messageId: message.id,
      timestamp: message.timestamp,
    });

    console.log("[whatsapp-webhook] Image import result:", {
      from: message.from,
      success: result.success,
      productId: result.productId,
      error: result.error,
    });
  } catch (error) {
    console.error("[whatsapp-webhook] Image import error:", error);
  }
}
