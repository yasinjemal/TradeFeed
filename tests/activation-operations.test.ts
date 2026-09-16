import test from "node:test";
import assert from "node:assert/strict";
import { listingQualityIssues } from "@/lib/marketplace/listing-readiness";
import {
  sellerFollowupSchema,
  orderFollowupSchema,
  sellerPriority,
  parseFollowup,
} from "@/lib/activation/operations-policy";

test("listing completion requires facts, category and purchasable stock, irrespective of grace", () => {
  const product = {
    isActive: true,
    isFlagged: false,
    minPriceCents: 100,
    images: [{ url: "photo" }],
    variants: [{ isActive: true, stock: 1, priceInCents: 100 }],
    description: "A detailed factual description supplied by the seller.",
    globalCategoryId: "category",
  };
  assert.deepEqual(listingQualityIssues(product), []);
  assert.equal(
    listingQualityIssues({
      ...product,
      description: "   short   ",
      globalCategoryId: null,
    }).length,
    2,
  );
  assert.ok(
    listingQualityIssues({ ...product, variants: [] }).some((i) =>
      i.includes("stock"),
    ),
  );
  assert.ok(
    listingQualityIssues({ ...product, isFlagged: true }).some((i) =>
      i.includes("moderation"),
    ),
  );
});
test("recent empty sellers lead the queue; enquiry evidence alone cannot complete activation", () => {
  const now = new Date("2026-09-16T12:00:00Z");
  const input = {
    createdAt: new Date("2026-09-15"),
    ready: 0,
    active: 0,
    shopReady: false,
    shared: false,
    confirmedEnquiry: false,
  };
  assert.ok(
    sellerPriority(input, now) >
      sellerPriority({ ...input, createdAt: new Date("2026-01-01") }, now),
  );
  assert.ok(
    sellerPriority(
      { ...input, ready: 3, shopReady: true, confirmedEnquiry: true },
      now,
    ) > 0,
  );
  assert.equal(
    sellerPriority(
      {
        ...input,
        ready: 3,
        shopReady: true,
        shared: true,
        confirmedEnquiry: true,
      },
      now,
    ),
    0,
  );
});
test("follow-up requires valid dates and evidence; closing never manufactures enquiry confirmation", () => {
  const input = {
    shopId: "s",
    status: "CLOSED",
    nextAction: "Seller chose to pause",
    evidence: "Seller asked us to close the follow-up.",
    enquiry: "UNCONFIRMED",
    due: "2026-09-20",
  };
  assert.equal(sellerFollowupSchema.parse(input).enquiry, "UNCONFIRMED");
  assert.equal(
    sellerFollowupSchema.safeParse({ ...input, due: "2026-02-31" }).success,
    false,
  );
  assert.equal(
    sellerFollowupSchema.safeParse({
      ...input,
      enquiry: "SELLER_CONFIRMED",
      evidence: "not enough",
    }).success,
    false,
  );
  assert.equal(parseFollowup("not json").success, false);
});
test("legacy order follow-up rejects unsupported outcomes and unsubstantiated notes", () => {
  assert.equal(
    orderFollowupSchema.safeParse({
      orderId: "o",
      outcome: "PAID",
      evidence: "Seller confirmed delivery today.",
    }).success,
    false,
  );
  assert.equal(
    orderFollowupSchema.safeParse({
      orderId: "o",
      outcome: "SELLER_CONFIRMED_FULFILLED",
      evidence: "yes",
    }).success,
    false,
  );
});
