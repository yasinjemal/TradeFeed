// ============================================================
// WhatsApp Message Builder
// ============================================================
// Builds a structured order message from cart items.
//
// FORMAT (what the seller receives):
//
//   📋 *New Order from TradeFeed*
//
//   1× Floral Summer Dress
//      Size: M | Color: Red
//      R 299.99
//
//   2× Wireless Earbuds
//      Storage: 128GB | Color: Black
//      R 499.98
//
//   ─────────────────
//   *Total: R 999.97*
//   Items: 3
//
//   Thank you! 🙏
//
// WHY THIS FORMAT:
// - WhatsApp bold (*text*) works on all platforms
// - Line items are scannable — seller sees exactly what's needed
// - Total in ZAR — no ambiguity
// - Polite closing — important in SA business culture
// ============================================================

import type { CartItem } from "./types";

/**
 * Build a structured WhatsApp order message from cart items.
 *
 * @param items - Cart items to include in the order
 * @returns URL-encoded message string ready for wa.me
 */
export function buildWhatsAppMessage(items: CartItem[]): string {
  if (items.length === 0) return "";

  const totalCents = items.reduce(
    (sum, item) => sum + item.priceInCents * item.quantity,
    0
  );
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalRands = (totalCents / 100).toFixed(2);

  // Build line items
  const lineItems = items
    .map((item) => {
      const priceDisplay = ((item.priceInCents * item.quantity) / 100).toFixed(2);
      const opt1Label = item.option1Label || "Size";
      const opt2Label = item.option2Label || "Color";
      const details: string[] = [`${opt1Label}: ${item.size}`];
      if (item.color) {
        details.push(`${opt2Label}: ${item.color}`);
      }

      return (
        `${item.quantity}× *${item.productName}*\n` +
        `   ${details.join(" | ")}\n` +
        `   R ${priceDisplay}`
      );
    })
    .join("\n\n");

  const message =
    `📋 *New Order from TradeFeed*\n\n` +
    `${lineItems}\n\n` +
    `─────────────────\n` +
    `*Total: R ${totalRands}*\n` +
    `Items: ${totalItems}\n\n` +
    `Thank you! 🙏`;

  return message;
}

/**
 * Build the full wa.me URL with the structured order message.
 *
 * @param whatsappNumber - Shop's WhatsApp number (e.g. "+27612345678")
 * @param items - Cart items
 * @returns Full wa.me URL ready to open
 */
export function buildWhatsAppCheckoutUrl(
  whatsappNumber: string,
  items: CartItem[]
): string {
  const message = buildWhatsAppMessage(items);
  const phone = whatsappNumber.replace("+", "");
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
