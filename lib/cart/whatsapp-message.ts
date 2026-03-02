// ============================================================
// WhatsApp Message Builder
// ============================================================
// Builds a structured, polished order message from cart items.
//
// FORMAT (what the seller receives):
//
//   🛒 *New Order #TF-20260302-A1B2*
//
//   ┌─────────────────────────
//   │ 6× *Mint Green Suit Jacket*
//   │    Size: 44 | Color: Teal
//   │    💰 R 4,500.00
//   │    🔗 tradefeed.co.za/catalog/shop/products/abc
//   └─────────────────────────
//
//   ━━━━━━━━━━━━━━━━━━━━━━━━
//   💰 *Total: R 4,500.00*
//   📦 Items: 6
//
//   📦 Track: tradefeed.co.za/track/TF-20260302-A1B2
//
//   Thank you for your order! 🙏
//
// WHY THIS FORMAT:
// - WhatsApp bold (*text*) works on all platforms
// - Product links let seller tap to view the exact item
// - Line items are scannable — seller sees exactly what's needed
// - Total in ZAR — no ambiguity
// - Polite closing — important in SA business culture
// ============================================================

import type { CartItem } from "./types";

const BASE_URL = "https://tradefeed.co.za";

export interface DeliveryAddress {
  address: string;
  city: string;
  province: string;
  postalCode: string;
}

/**
 * Build a structured WhatsApp order message from cart items.
 *
 * @param items - Cart items to include in the order
 * @param delivery - Optional delivery address
 * @param orderNumber - Optional order number (e.g. "TF-20260224-A1B2") to include at top
 * @param shopSlug - Optional shop slug for building product links
 * @returns URL-encoded message string ready for wa.me
 */
export function buildWhatsAppMessage(
  items: CartItem[],
  delivery?: DeliveryAddress | null,
  orderNumber?: string,
  shopSlug?: string,
): string {
  if (items.length === 0) return "";

  const totalCents = items.reduce(
    (sum, item) => sum + item.priceInCents * item.quantity,
    0
  );
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalFormatted = formatPrice(totalCents);

  // Build line items
  const lineItems = items
    .map((item) => {
      const lineTotal = formatPrice(item.priceInCents * item.quantity);
      const unitPrice = formatPrice(item.priceInCents);
      const opt1Label = item.option1Label || "Size";
      const opt2Label = item.option2Label || "Color";
      const details: string[] = [`${opt1Label}: ${item.size}`];
      if (item.color) {
        details.push(`${opt2Label}: ${item.color}`);
      }

      const orderLabel = item.orderType === "retail" ? " 🛍️" : "";
      const productLink = shopSlug
        ? `\n│    🔗 ${BASE_URL}/catalog/${shopSlug}/products/${item.productId}`
        : "";

      return (
        `┌─────────────────────────\n` +
        `│ ${item.quantity}× *${item.productName}*${orderLabel}\n` +
        `│    ${details.join(" | ")}\n` +
        `│    💰 ${item.quantity > 1 ? `${unitPrice} × ${item.quantity} = ${lineTotal}` : lineTotal}` +
        productLink + `\n` +
        `└─────────────────────────`
      );
    })
    .join("\n\n");

  // Build delivery section if provided
  const deliverySection = delivery?.address
    ? `\n\n📍 *Deliver to:*\n   ${delivery.address}\n   ${delivery.city}, ${delivery.province} ${delivery.postalCode}`
    : "";

  // Include order number in header when available (for tracking)
  const header = orderNumber
    ? `🛒 *New Order #${orderNumber}*`
    : `🛒 *New Order from TradeFeed*`;

  const trackingLine = orderNumber
    ? `\n\n📦 *Track:* ${BASE_URL}/track/${orderNumber}`
    : "";

  const message =
    header + `\n\n` +
    lineItems + `\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `💰 *Total: ${totalFormatted}*\n` +
    `📦 Items: ${totalItems}` +
    deliverySection +
    trackingLine + `\n\n` +
    `Thank you for your order! 🙏`;

  return message;
}

/**
 * Format cents to "R X,XXX.XX" display string.
 */
function formatPrice(cents: number): string {
  return `R ${(cents / 100).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Build the full wa.me URL with the structured order message.
 *
 * @param whatsappNumber - Shop's WhatsApp number (e.g. "+27612345678")
 * @param items - Cart items
 * @param delivery - Optional delivery address
 * @param orderNumber - Optional order number
 * @param shopSlug - Optional shop slug for product links
 * @returns Full wa.me URL ready to open
 */
export function buildWhatsAppCheckoutUrl(
  whatsappNumber: string,
  items: CartItem[],
  delivery?: DeliveryAddress | null,
  orderNumber?: string,
  shopSlug?: string,
): string {
  const message = buildWhatsAppMessage(items, delivery, orderNumber, shopSlug);
  const phone = whatsappNumber.replace("+", "");
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
