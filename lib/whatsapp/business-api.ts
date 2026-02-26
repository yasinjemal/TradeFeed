// ============================================================
// WhatsApp Business API — Client
// ============================================================
// Infrastructure for WhatsApp Cloud API integration.
// Enables automated order confirmations, status updates, and
// delivery notifications sent directly to buyers.
//
// SETUP REQUIRED:
// 1. Create a Meta Business account
// 2. Set up WhatsApp Business API in Meta Developer Portal
// 3. Add env vars: WHATSAPP_API_TOKEN, WHATSAPP_PHONE_NUMBER_ID
// 4. Register webhook URL: /api/webhooks/whatsapp
// 5. Approve message templates in Meta Business Manager
//
// Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
// ============================================================

const WHATSAPP_API_URL = "https://graph.facebook.com/v21.0";

interface WhatsAppConfig {
  apiToken: string;
  phoneNumberId: string;
}

function getConfig(): WhatsAppConfig | null {
  const apiToken = process.env.WHATSAPP_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!apiToken || !phoneNumberId) {
    return null;
  }

  return { apiToken, phoneNumberId };
}

interface SendMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

async function sendWhatsAppMessage(
  to: string,
  payload: Record<string, unknown>
): Promise<SendMessageResult> {
  const config = getConfig();

  if (!config) {
    console.log("[whatsapp-api] Not configured — would send:", { to, payload });
    return { success: true, messageId: "dev-mock" };
  }

  try {
    const response = await fetch(
      `${WHATSAPP_API_URL}/${config.phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: normalizePhoneNumber(to),
          ...payload,
        }),
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("[whatsapp-api] Send failed:", response.status, errorBody);
      return { success: false, error: `API error: ${response.status}` };
    }

    const data = await response.json();
    return {
      success: true,
      messageId: data?.messages?.[0]?.id,
    };
  } catch (error) {
    console.error("[whatsapp-api] Network error:", error);
    return { success: false, error: "Network error" };
  }
}

/**
 * Normalize SA phone number to international format.
 * Converts "07X XXX XXXX" to "27XXXXXXXXX"
 */
function normalizePhoneNumber(phone: string): string {
  const cleaned = phone.replace(/[\s\-()]/g, "");
  if (cleaned.startsWith("+")) return cleaned.slice(1);
  if (cleaned.startsWith("0")) return `27${cleaned.slice(1)}`;
  if (cleaned.startsWith("27")) return cleaned;
  return cleaned;
}

// ── Message Templates ────────────────────────────────────────

/**
 * Send order confirmation to buyer.
 * Template: "order_confirmation" (must be approved in Meta Business Manager)
 */
export async function sendOrderConfirmation(
  buyerPhone: string,
  orderNumber: string,
  shopName: string,
  totalFormatted: string,
  itemCount: number,
  trackingUrl: string
): Promise<SendMessageResult> {
  return sendWhatsAppMessage(buyerPhone, {
    type: "template",
    template: {
      name: "order_confirmation",
      language: { code: "en" },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: shopName },
            { type: "text", text: orderNumber },
            { type: "text", text: String(itemCount) },
            { type: "text", text: totalFormatted },
          ],
        },
        {
          type: "button",
          sub_type: "url",
          index: 0,
          parameters: [
            { type: "text", text: trackingUrl },
          ],
        },
      ],
    },
  });
}

/**
 * Send order status update to buyer.
 * Template: "order_status_update" (must be approved in Meta Business Manager)
 */
export async function sendOrderStatusUpdate(
  buyerPhone: string,
  orderNumber: string,
  shopName: string,
  newStatus: string,
  trackingUrl: string
): Promise<SendMessageResult> {
  return sendWhatsAppMessage(buyerPhone, {
    type: "template",
    template: {
      name: "order_status_update",
      language: { code: "en" },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: shopName },
            { type: "text", text: orderNumber },
            { type: "text", text: newStatus },
          ],
        },
        {
          type: "button",
          sub_type: "url",
          index: 0,
          parameters: [
            { type: "text", text: trackingUrl },
          ],
        },
      ],
    },
  });
}

/**
 * Send a simple text message (for free-form communication).
 * Only works within 24-hour customer service window.
 */
export async function sendTextMessage(
  to: string,
  text: string
): Promise<SendMessageResult> {
  return sendWhatsAppMessage(to, {
    type: "text",
    text: { body: text },
  });
}
