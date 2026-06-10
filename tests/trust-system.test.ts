// ============================================================
// Tests — Trust System (Phase 2)
// ============================================================
// Pure-logic tests: review request eligibility (POPIA-safe),
// review URL building, and seller trust stats computation.
// ============================================================

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  checkReviewRequestEligibility,
  buildReviewUrl,
} from "@/lib/reviews/review-requests";
import {
  computeSellerTrustStats,
  formatDispatchLabel,
} from "@/lib/trust/seller-stats";

// ── Review request eligibility ──────────────────────────────

describe("checkReviewRequestEligibility", () => {
  const base = {
    buyerPhone: "+27821234567",
    marketingConsent: true,
    status: "DELIVERED",
    hasExistingRequest: false,
  };

  it("is eligible for a consented, delivered order with a phone", () => {
    assert.deepEqual(checkReviewRequestEligibility(base), { eligible: true });
  });

  it("rejects non-delivered orders", () => {
    const result = checkReviewRequestEligibility({ ...base, status: "SHIPPED" });
    assert.deepEqual(result, { eligible: false, reason: "not_delivered" });
  });

  it("is idempotent — rejects when a request already exists", () => {
    const result = checkReviewRequestEligibility({ ...base, hasExistingRequest: true });
    assert.deepEqual(result, { eligible: false, reason: "already_requested" });
  });

  it("rejects orders without a buyer phone", () => {
    const result = checkReviewRequestEligibility({ ...base, buyerPhone: null });
    assert.deepEqual(result, { eligible: false, reason: "no_phone" });
  });

  it("POPIA: rejects when buyer did not consent to WhatsApp updates", () => {
    const result = checkReviewRequestEligibility({ ...base, marketingConsent: false });
    assert.deepEqual(result, { eligible: false, reason: "no_consent" });
  });
});

describe("buildReviewUrl", () => {
  it("joins base URL and token", () => {
    assert.equal(
      buildReviewUrl("https://tradefeed.co.za", "tok123"),
      "https://tradefeed.co.za/review/tok123"
    );
  });

  it("strips a trailing slash from the base URL", () => {
    assert.equal(
      buildReviewUrl("https://tradefeed.co.za/", "tok123"),
      "https://tradefeed.co.za/review/tok123"
    );
  });
});

// ── Seller trust stats ──────────────────────────────────────

function order(
  status: string,
  createdAt: string,
  shippedAt: string | null = null
) {
  return {
    status,
    createdAt: new Date(createdAt),
    shippedAt: shippedAt ? new Date(shippedAt) : null,
  };
}

describe("computeSellerTrustStats", () => {
  it("handles no orders", () => {
    const stats = computeSellerTrustStats([]);
    assert.equal(stats.ordersFulfilled, 0);
    assert.equal(stats.fulfilmentRate, null);
    assert.equal(stats.avgDispatchHours, null);
  });

  it("counts delivered orders and computes fulfilment rate against closed orders", () => {
    const stats = computeSellerTrustStats([
      order("DELIVERED", "2026-05-01"),
      order("DELIVERED", "2026-05-02"),
      order("DELIVERED", "2026-05-03"),
      order("CANCELLED", "2026-05-04"),
      order("PENDING", "2026-05-05"), // open orders don't count against the rate
    ]);
    assert.equal(stats.ordersFulfilled, 3);
    assert.equal(stats.fulfilmentRate, 0.75);
  });

  it("computes average dispatch hours from createdAt → shippedAt", () => {
    const stats = computeSellerTrustStats([
      order("DELIVERED", "2026-05-01T08:00:00Z", "2026-05-01T20:00:00Z"), // 12h
      order("SHIPPED", "2026-05-02T08:00:00Z", "2026-05-03T20:00:00Z"), // 36h
    ]);
    assert.equal(stats.avgDispatchHours, 24);
  });

  it("ignores negative dispatch durations (clock skew safety)", () => {
    const stats = computeSellerTrustStats([
      order("DELIVERED", "2026-05-02T08:00:00Z", "2026-05-01T08:00:00Z"), // negative
    ]);
    assert.equal(stats.avgDispatchHours, null);
  });
});

describe("formatDispatchLabel", () => {
  it("returns null when no dispatch data", () => {
    assert.equal(formatDispatchLabel(null), null);
  });

  it("same day for <= 24h", () => {
    assert.equal(formatDispatchLabel(18), "Usually ships same day");
  });

  it("1–2 days for ~30h", () => {
    assert.equal(formatDispatchLabel(30), "Usually ships in 1–2 days");
  });

  it("3–4 days for ~80h", () => {
    assert.equal(formatDispatchLabel(80), "Usually ships in 3–4 days");
  });

  it("omits the label entirely for slow dispatch (not a trust signal)", () => {
    assert.equal(formatDispatchLabel(24 * 10), null);
  });
});
