import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { hasPaidEntitlement, effectivePlanSlug } from "../lib/billing/subscription-status";

const NOW = new Date("2026-07-15T12:00:00Z");
const FUTURE = new Date("2026-08-01T00:00:00Z");
const PAST = new Date("2026-07-01T00:00:00Z");

describe("hasPaidEntitlement", () => {
  test("no subscription → not entitled", () => {
    assert.equal(hasPaidEntitlement(null, NOW), false);
    assert.equal(hasPaidEntitlement(undefined, NOW), false);
  });

  test("free plan is never entitled, regardless of status", () => {
    assert.equal(
      hasPaidEntitlement({ status: "ACTIVE", currentPeriodEnd: FUTURE, plan: { slug: "free" } }, NOW),
      false,
    );
  });

  test("ACTIVE paid plan → entitled (renewal lapses are the cron's job)", () => {
    assert.equal(
      hasPaidEntitlement({ status: "ACTIVE", currentPeriodEnd: FUTURE, plan: { slug: "pro" } }, NOW),
      true,
    );
    // Even past period end — the cron + PayFast grace window owns downgrades
    assert.equal(
      hasPaidEntitlement({ status: "ACTIVE", currentPeriodEnd: PAST, plan: { slug: "pro" } }, NOW),
      true,
    );
  });

  test("CANCELLED keeps benefits until the paid period ends", () => {
    assert.equal(
      hasPaidEntitlement({ status: "CANCELLED", currentPeriodEnd: FUTURE, plan: { slug: "pro" } }, NOW),
      true,
    );
  });

  test("CANCELLED past period end → not entitled (the forever-free leak)", () => {
    assert.equal(
      hasPaidEntitlement({ status: "CANCELLED", currentPeriodEnd: PAST, plan: { slug: "pro" } }, NOW),
      false,
    );
  });

  test("CANCELLED with no period end → not entitled", () => {
    assert.equal(
      hasPaidEntitlement({ status: "CANCELLED", currentPeriodEnd: null, plan: { slug: "pro-ai" } }, NOW),
      false,
    );
    assert.equal(
      hasPaidEntitlement({ status: "CANCELLED", plan: { slug: "pro-ai" } }, NOW),
      false,
    );
  });

  test("other statuses (EXPIRED, PAST_DUE, …) → not entitled", () => {
    assert.equal(
      hasPaidEntitlement({ status: "EXPIRED", currentPeriodEnd: FUTURE, plan: { slug: "starter" } }, NOW),
      false,
    );
  });

  test("boundary: period ending exactly now → not entitled", () => {
    assert.equal(
      hasPaidEntitlement({ status: "CANCELLED", currentPeriodEnd: NOW, plan: { slug: "pro" } }, NOW),
      false,
    );
  });
});

describe("effectivePlanSlug", () => {
  test("entitled → the paid plan's slug", () => {
    assert.equal(
      effectivePlanSlug({ status: "ACTIVE", currentPeriodEnd: FUTURE, plan: { slug: "pro-ai" } }, NOW),
      "pro-ai",
    );
    assert.equal(
      effectivePlanSlug({ status: "CANCELLED", currentPeriodEnd: FUTURE, plan: { slug: "starter" } }, NOW),
      "starter",
    );
  });

  test("not entitled → free", () => {
    assert.equal(effectivePlanSlug(null, NOW), "free");
    assert.equal(
      effectivePlanSlug({ status: "CANCELLED", currentPeriodEnd: PAST, plan: { slug: "pro" } }, NOW),
      "free",
    );
  });
});
