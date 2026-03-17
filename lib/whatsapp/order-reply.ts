// ============================================================
// WhatsApp — Smart Reply Handlers
// ============================================================
// Real data-driven replies for buyer WhatsApp messages.
// Replaces generic template replies with actual order status,
// stock availability, and payment link responses.
//
// Used by the webhook handler when intent detection finds
// order_status, availability, or payment-related intents.
// ============================================================

import { db } from "@/lib/db";
import { getOrderByNumber } from "@/lib/db/tracking";
import { formatZAR } from "@/types";
import type { IntentResult } from "./intent-detection";

// ── Order Status Reply ──────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  PENDING: "📋 Pending — The seller has received your order.",
  CONFIRMED: "✅ Confirmed — The seller is preparing your order.",
  SHIPPED: "🚚 Shipped — Your order is on its way!",
  DELIVERED: "📦 Delivered — Your order has been delivered.",
  CANCELLED: "❌ Cancelled — This order was cancelled.",
};

/**
 * Generate a reply with real order status data.
 * Returns null if order number not found or not extractable.
 */
export async function generateOrderStatusReply(
  intent: IntentResult,
  shopName: string,
  buyerPhone: string,
): Promise<string | null> {
  // Try to extract order number from the message
  const orderNumber = extractOrderNumber(intent);
  if (!orderNumber) {
    return (
      `I'd love to help track your order from *${shopName}*! 📋\n\n` +
      `Could you share your order number? It looks like *TF-XXXXXXXX-XXXX*.\n\n` +
      `You can also track it here:\nhttps://tradefeed.co.za/track`
    );
  }

  const order = await getOrderByNumber(orderNumber);
  if (!order) {
    return (
      `I couldn't find order *${orderNumber}*. 🤔\n\n` +
      `Please double-check the number and try again. Order numbers start with "TF-".\n\n` +
      `Or track your order here:\nhttps://tradefeed.co.za/track`
    );
  }

  // Build status message
  const statusLine = STATUS_LABELS[order.status] ?? `Status: ${order.status}`;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://tradefeed.co.za";
  const trackUrl = `${appUrl}/track/${encodeURIComponent(order.orderNumber)}`;

  const parts = [
    `🔍 *Order ${order.orderNumber}*`,
    `From: *${order.shop.name}*`,
    ``,
    statusLine,
  ];

  // Add shipping details if shipped
  if (order.status === "SHIPPED") {
    if (order.courierName) parts.push(`Courier: ${order.courierName}`);
    if (order.trackingNumber) parts.push(`Tracking #: ${order.trackingNumber}`);
    if (order.trackingUrl) parts.push(`Track shipment: ${order.trackingUrl}`);
    if (order.estimatedDelivery) {
      parts.push(`Est. delivery: ${new Date(order.estimatedDelivery).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}`);
    }
  }

  // Add payment info if pending
  if (order.status === "PENDING" && !order.paidAt) {
    parts.push(``, `💳 Payment: Not yet received`);
    parts.push(`Pay now: ${appUrl}/pay/${encodeURIComponent(order.orderNumber)}`);
  } else if (order.paidAt) {
    parts.push(``, `💳 Payment: ✅ Received`);
  }

  // Order total
  parts.push(``, `Total: *${formatZAR(order.totalCents)}* (${order.itemCount} item${order.itemCount !== 1 ? "s" : ""})`);

  // Track link
  parts.push(``, `Full details: ${trackUrl}`);

  return parts.join("\n");
}

/**
 * Extract order number from intent entities or raw message text.
 */
function extractOrderNumber(intent: IntentResult): string | null {
  // First check entities from intent detection
  if (intent.entities?.orderNumber) {
    const num = intent.entities.orderNumber;
    // Normalize: strip "order #" prefix if present
    const cleaned = num.replace(/^order\s*#?\s*/i, "").trim();
    if (cleaned.match(/^TF-/i)) return cleaned.toUpperCase();
    return null;
  }

  // Fallback: scan raw message for TF-XXXXXXXX-XXXX pattern
  const match = intent.originalMessage.match(/TF-[\w-]+/i);
  return match ? match[0].toUpperCase() : null;
}

// ── Stock / Availability Reply ──────────────────────────────

/**
 * Generate a reply with real stock data for the shop's products.
 * Uses entities (size, color) from intent if available.
 */
export async function generateStockReply(
  intent: IntentResult,
  shopId: string,
  shopName: string,
): Promise<string | null> {
  const { size, color } = intent.entities;

  // Get in-stock products, filtered if size/color specified
  const products = await db.product.findMany({
    where: {
      shopId,
      isActive: true,
      variants: {
        some: {
          stock: { gt: 0 },
          ...(size ? { size: { contains: size, mode: "insensitive" as const } } : {}),
          ...(color ? { color: { contains: color, mode: "insensitive" as const } } : {}),
        },
      },
    },
    take: 5,
    orderBy: { updatedAt: "desc" },
    select: {
      name: true,
      variants: {
        where: {
          stock: { gt: 0 },
          ...(size ? { size: { contains: size, mode: "insensitive" as const } } : {}),
          ...(color ? { color: { contains: color, mode: "insensitive" as const } } : {}),
        },
        select: {
          size: true,
          color: true,
          stock: true,
          priceInCents: true,
        },
      },
    },
  });

  if (products.length === 0) {
    const filterDesc = [size && `size ${size}`, color && `${color}`].filter(Boolean).join(" / ");
    return (
      `Sorry, we couldn't find products ${filterDesc ? `matching *${filterDesc}*` : "in stock"} at *${shopName}* right now. 😔\n\n` +
      `Check our full catalog for the latest:\nhttps://tradefeed.co.za/catalog/${await getShopSlug(shopId)}`
    );
  }

  const parts = [
    `📦 *Stock at ${shopName}*`,
    size || color ? `Filtered by: ${[size && `size ${size}`, color && color].filter(Boolean).join(", ")}` : "",
    ``,
  ];

  for (const p of products) {
    const sizes = [...new Set(p.variants.map((v) => v.size))].join(", ");
    const totalStock = p.variants.reduce((sum, v) => sum + v.stock, 0);
    const minPrice = Math.min(...p.variants.map((v) => v.priceInCents));
    parts.push(`• *${p.name}* — ${formatZAR(minPrice)}`);
    parts.push(`  Sizes: ${sizes} | ${totalStock} in stock`);
  }

  const slug = await getShopSlug(shopId);
  parts.push(``, `Browse all products:\nhttps://tradefeed.co.za/catalog/${slug}`);

  return parts.join("\n");
}

async function getShopSlug(shopId: string): Promise<string> {
  const shop = await db.shop.findUnique({ where: { id: shopId }, select: { slug: true } });
  return shop?.slug ?? "";
}

// ── Payment Intent Reply ────────────────────────────────────

/**
 * Generate a reply when buyer asks about payment or how to pay.
 * If an order number is found, provides the direct payment link.
 */
export async function generatePaymentReply(
  intent: IntentResult,
  shopName: string,
): Promise<string | null> {
  const orderNumber = extractOrderNumber(intent);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://tradefeed.co.za";

  if (orderNumber) {
    const order = await getOrderByNumber(orderNumber);
    if (order && !order.paidAt && order.status !== "CANCELLED") {
      return (
        `💳 *Pay for Order ${order.orderNumber}*\n\n` +
        `Amount: *${formatZAR(order.totalCents)}*\n` +
        `Shop: ${order.shop.name}\n\n` +
        `Pay now (card, EFT, or SnapScan):\n${appUrl}/pay/${encodeURIComponent(order.orderNumber)}\n\n` +
        `Secure checkout powered by PayFast 🔒`
      );
    }
    if (order?.paidAt) {
      return `✅ Order *${order.orderNumber}* is already paid! The seller is working on it. 🎉`;
    }
  }

  return (
    `💳 *Payment at ${shopName}*\n\n` +
    `We accept card payments, EFT, and SnapScan via PayFast.\n\n` +
    `To pay, share your order number (starts with "TF-") and we'll send you a payment link.\n\n` +
    `Or check your order here: ${appUrl}/track`
  );
}
