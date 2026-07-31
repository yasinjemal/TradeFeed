import test from "node:test";
import assert from "node:assert/strict";

import {
  sanitizeSentryEvent,
  sanitizeTelemetryMeta,
} from "@/lib/telemetry-privacy";

test("telemetry extras use a strict property allowlist", () => {
  assert.deepEqual(
    sanitizeTelemetryMeta({
      shopId: "shop_123",
      huntMediaKey: "hunt_upload_key_123",
      itemCount: 3,
      token: "one-time-secret",
      email: "private@example.com",
      phone: "0821234567",
      form: { message: "private form content" },
    }),
    {
      shopId: "shop_123",
      huntMediaKey: "hunt_upload_key_123",
      itemCount: 3,
    },
  );
});

test("Sentry error events retain diagnostics but remove identifying request data", () => {
  const sanitized = sanitizeSentryEvent({
    event_id: "event_123",
    user: { id: "user_123", email: "private@example.com" },
    request: {
      method: "POST",
      url: "https://tradefeed.co.za/checkout?phone=0821234567#notes",
      headers: { cookie: "session=secret" },
      cookies: { session: "secret" },
      data: { buyerNote: "private" },
      query_string: "phone=0821234567",
    },
    transaction: "POST /pay/TF-20260727-0042?phone=0821234567",
    message: "Checkout failed for private@example.com token=secret-token",
    logentry: {
      message: "Buyer phone 0821234567",
    },
    exception: {
      values: [
        {
          type: "CheckoutError",
          value: "Checkout failed for 0821234567 token=secret-token",
          stacktrace: {
            frames: [
              {
                filename: "https://tradefeed.co.za/pay/TF-0042?token=secret",
                abs_path: "https://tradefeed.co.za/pay/TF-0042?token=secret",
                function: "checkoutAction",
                lineno: 42,
                context_line: "throw new Error(buyerPhone)",
                vars: { buyerPhone: "0821234567" },
              },
            ],
          },
          mechanism: {
            type: "generic",
            handled: true,
            data: { token: "secret-token" },
          },
        },
      ],
    },
    extra: {
      orderId: "order_123",
      token: "secret-token",
      buyerPhone: "0821234567",
    },
    breadcrumbs: [
      {
        message: "Submitted private buyer note",
        data: { phone: "0821234567" },
      },
    ],
    tags: {
      email: "private@example.com",
    },
    contexts: {
      trace: {
        trace_id: "trace_123",
        span_id: "span_123",
        data: { token: "private" },
      },
      profile: {
        email: "private@example.com",
      },
    },
    spans: [
      {
        span_id: "child_123",
        description: "GET /checkout?phone=0821234567",
        data: { buyerNote: "private" },
      },
    ],
  });

  assert.equal("user" in sanitized, false);
  assert.deepEqual(sanitized.request, {
    method: "POST",
    url: "https://tradefeed.co.za/checkout",
  });
  assert.equal(sanitized.transaction, "POST /pay/[orderNumber]");
  assert.deepEqual(sanitized.extra, { orderId: "order_123" });
  assert.equal("breadcrumbs" in sanitized, false);
  assert.equal("tags" in sanitized, false);
  assert.deepEqual(sanitized.contexts, {
    trace: {
      trace_id: "trace_123",
      span_id: "span_123",
    },
  });
  assert.deepEqual(sanitized.spans, [{ span_id: "child_123" }]);
  assert.equal("message" in sanitized, false);
  assert.equal("logentry" in sanitized, false);
  assert.deepEqual(sanitized.exception, {
    values: [
      {
        type: "CheckoutError",
        stacktrace: {
          frames: [
            {
              function: "checkoutAction",
              lineno: 42,
              filename: "https://tradefeed.co.za/pay/[orderNumber]",
              abs_path: "https://tradefeed.co.za/pay/[orderNumber]",
            },
          ],
        },
        mechanism: {
          type: "generic",
          handled: true,
        },
      },
    ],
  });
  assert.equal(sanitized.event_id, "event_123");
});
