import test from "node:test";
import assert from "node:assert/strict";

import {
  ANALYTICS_EVENT_ALLOWED_PROPERTIES,
  buildAnalyticsEventRecord,
  type AnalyticsEventInput,
} from "@/lib/analytics/event-policy";

test("AnalyticsEvent persistence discards unexpected sensitive properties", () => {
  const hostileInput = {
    type: "PRODUCT_VIEW",
    shopId: "shop_123",
    productId: "product_123",
    visitorId: "123e4567-e89b-42d3-a456-426614174000",
    userAgent: "Example Browser",
    referrer: "https://example.com/search?phone=0821234567#private",
    buyerName: "Private Person",
    email: "private@example.com",
    phone: "0821234567",
    password: "do-not-store",
    token: "secret-token",
    message: "private WhatsApp contents",
    paymentDetails: { card: "4111111111111111" },
  } as AnalyticsEventInput & Record<string, unknown>;

  const record = buildAnalyticsEventRecord(hostileInput);

  assert.deepEqual(Object.keys(record), [...ANALYTICS_EVENT_ALLOWED_PROPERTIES]);
  assert.equal("userAgent" in record, false);
  assert.equal("referrer" in record, false);
  assert.equal("email" in record, false);
  assert.equal("phone" in record, false);
  assert.equal("password" in record, false);
  assert.equal("token" in record, false);
  assert.equal("message" in record, false);
  assert.equal("paymentDetails" in record, false);
});

test("AnalyticsEvent identifier fields are bounded", () => {
  const record = buildAnalyticsEventRecord({
    type: "PAGE_VIEW",
    shopId: ` shop_${"x".repeat(150)} `,
  });

  assert.equal(record.shopId.length, 100);
  assert.equal(record.shopId.startsWith("shop_"), true);
  assert.equal(record.productId, null);
  assert.equal(record.visitorId, null);
});

test("AnalyticsEvent persistence rejects an empty tenant identifier", () => {
  assert.throws(
    () =>
      buildAnalyticsEventRecord({
        type: "PAGE_VIEW",
        shopId: "   ",
      }),
    /shopId is required/,
  );
});
