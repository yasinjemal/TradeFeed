// ============================================================
// Webhook — WhatsApp Business API
// ============================================================
// Handles incoming webhooks from the WhatsApp Cloud API:
// - Webhook verification (GET)
// - Message status updates (POST)
// - Incoming messages from buyers (POST)
//
// SETUP:
// 1. Set WHATSAPP_VERIFY_TOKEN in .env (any random string)
// 2. Register this URL in Meta Developer Portal:
//    https://yourdomain.com/api/webhooks/whatsapp
// 3. Meta will send a GET request with the verify token
// ============================================================

import { NextRequest, NextResponse } from "next/server";

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
