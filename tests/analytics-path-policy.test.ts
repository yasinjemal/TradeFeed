import test from "node:test";
import assert from "node:assert/strict";

import {
  sanitizeAnalyticsPathname,
  sanitizeAnalyticsUrl,
  sanitizeSentryTransaction,
} from "@/lib/analytics/path-policy";

test("templates secret-bearing public routes", () => {
  assert.equal(
    sanitizeAnalyticsPathname("/invite/private-invitation-token?source=email"),
    "/invite/[token]",
  );
  assert.equal(
    sanitizeAnalyticsPathname("/pay/TF-20260727-0042"),
    "/pay/[orderNumber]",
  );
  assert.equal(
    sanitizeAnalyticsPathname("/track/TF-20260727-0042"),
    "/track/[orderNumber]",
  );
  assert.equal(
    sanitizeAnalyticsPathname("/review/private-review-token"),
    "/review/[token]",
  );
});

test("templates tenant and product identifiers while retaining route shape", () => {
  assert.equal(
    sanitizeAnalyticsPathname("/catalog/acme/products/product_123"),
    "/catalog/[shop]/products/[product]",
  );
  assert.equal(
    sanitizeAnalyticsPathname("/dashboard/acme/products/product_123"),
    "/dashboard/[shop]/products/[product]",
  );
  assert.equal(
    sanitizeAnalyticsPathname("/dashboard/acme/billing/upgrade"),
    "/dashboard/[shop]/billing/upgrade",
  );
});

test("removes query data from URLs and Sentry transaction names", () => {
  assert.equal(
    sanitizeAnalyticsUrl(
      "https://tradefeed.co.za/pay/TF-20260727-0042?phone=0821234567",
    ),
    "https://tradefeed.co.za/pay/[orderNumber]",
  );
  assert.equal(
    sanitizeSentryTransaction("GET /invite/private-token?email=a@example.com"),
    "GET /invite/[token]",
  );
  assert.equal(
    sanitizeSentryTransaction(
      "GET https://tradefeed.co.za/pay/TF-20260727-0042?phone=0821234567",
    ),
    "GET /pay/[orderNumber]",
  );
  assert.equal(
    sanitizeSentryTransaction("checkout for private@example.com"),
    undefined,
  );
});
