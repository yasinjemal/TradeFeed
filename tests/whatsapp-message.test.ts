import test from "node:test";
import assert from "node:assert/strict";
import { buildWhatsAppCheckoutUrl, buildWhatsAppMessage } from "@/lib/cart/whatsapp-message";
import type { CartItem } from "@/lib/cart/types";

const items: CartItem[] = [
  {
    variantId: "v1",
    productId: "p1",
    productName: "Hoodie",
    size: "L",
    color: "Black",
    option1Label: "Size",
    option2Label: "Color",
    priceInCents: 25000,
    quantity: 2,
    maxStock: 10,
    minWholesaleQty: 1,
    orderType: "wholesale",
  },
];

test("buildWhatsAppMessage creates a structured message with totals", () => {
  const message = buildWhatsAppMessage(items);
  assert.match(message, /New Order from TradeFeed/);
  assert.match(message, /\*Total: R 500.00\*/);
  assert.match(message, /Items: 2/);
});

test("buildWhatsAppMessage includes order number when provided", () => {
  const message = buildWhatsAppMessage(items, null, "TF-20260226-X1Y2");
  assert.match(message, /New Order #TF-20260226-X1Y2/);
  assert.match(message, /tradefeed\.co\.za\/track\/TF-20260226-X1Y2/);
  // Should NOT contain the generic header when order number is present
  assert.doesNotMatch(message, /New Order from TradeFeed/);
});

test("buildWhatsAppCheckoutUrl strips plus sign and encodes the message", () => {
  const url = buildWhatsAppCheckoutUrl("+27611234567", items);
  assert.ok(url.startsWith("https://wa.me/27611234567?text="));
  const encoded = url.split("?text=")[1] ?? "";
  assert.match(decodeURIComponent(encoded), /New Order from TradeFeed/);
});

test("buildWhatsAppCheckoutUrl includes order number in URL message", () => {
  const url = buildWhatsAppCheckoutUrl("+27611234567", items, null, "TF-20260226-A1B2");
  const encoded = url.split("?text=")[1] ?? "";
  const decoded = decodeURIComponent(encoded);
  assert.match(decoded, /New Order #TF-20260226-A1B2/);
  assert.match(decoded, /tradefeed\.co\.za\/track\/TF-20260226-A1B2/);
});
