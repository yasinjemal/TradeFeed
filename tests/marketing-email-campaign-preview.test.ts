import assert from "node:assert/strict";
import test from "node:test";
import {
  buildSafeMarketingEmailSample,
  buildSellerMarketingAudiencePreview,
  createMarketingEmailHash,
  resolveMarketingEmailSafetyLocks,
  type SellerMarketingOwnerCandidate,
} from "../lib/db/marketing-email-campaigns";

const SECRET = "m".repeat(32);
const NOW = new Date("2026-07-31T12:00:00.000Z");

function candidate(
  overrides: Partial<SellerMarketingOwnerCandidate> = {},
): SellerMarketingOwnerCandidate {
  return {
    userId: "user-1",
    email: "seller@example.com",
    isBanned: false,
    consentStatus: "OPTED_IN",
    shopId: "shop-1",
    shopName: "Seller Shop",
    shopSlug: "seller-shop",
    shopCreatedAt: new Date("2026-01-01T00:00:00.000Z"),
    shopUpdatedAt: new Date("2026-07-30T00:00:00.000Z"),
    productCount: 4,
    lastProductAt: new Date("2026-07-30T00:00:00.000Z"),
    ...overrides,
  };
}

test("marketing delivery locks require fresh dated NCC evidence", () => {
  const ready = resolveMarketingEmailSafetyLocks(
    {
      EMAIL_MARKETING_HMAC_SECRET: SECRET,
      EMAIL_MARKETING_PROVIDER_READY: "true",
      EMAIL_MARKETING_NCC_CLEANSED_AT:
        "2026-07-31T00:00:00.000Z",
      EMAIL_MARKETING_SEND_ENABLED: "true",
      RESEND_API_KEY: "re_test",
    },
    NOW,
  );

  assert.equal(ready.testSendAllowed, true);
  assert.equal(ready.customerSendAllowed, true);
  assert.equal(
    ready.nccCleansingExpiresAt,
    "2026-08-01T00:00:00.000Z",
  );
  assert.deepEqual(ready.blockers, []);

  const stale = resolveMarketingEmailSafetyLocks(
    {
      EMAIL_MARKETING_HMAC_SECRET: SECRET,
      EMAIL_MARKETING_PROVIDER_READY: "true",
      EMAIL_MARKETING_NCC_CLEANSED_AT:
        "2026-07-30T11:59:59.999Z",
      EMAIL_MARKETING_SEND_ENABLED: "true",
      RESEND_API_KEY: "re_test",
    },
    NOW,
  );
  assert.equal(stale.nccCleansingFresh, false);
  assert.equal(stale.customerSendAllowed, false);
  assert.ok(
    stale.blockers.includes(
      "ncc_cleansing_missing_or_stale",
    ),
  );
});

test("marketing locks reject implicit, stale and future configuration", () => {
  const locked = resolveMarketingEmailSafetyLocks(
    {
      EMAIL_MARKETING_HMAC_SECRET: "short",
      EMAIL_MARKETING_PROVIDER_READY: "TRUE",
      EMAIL_MARKETING_NCC_CLEANSED_AT:
        "2026-07-31T12:00:00",
      EMAIL_MARKETING_SEND_ENABLED: "1",
      RESEND_API_KEY: "",
    },
    NOW,
  );

  assert.equal(locked.hmacReady, false);
  assert.equal(locked.providerReady, false);
  assert.equal(locked.nccCleansingFresh, false);
  assert.equal(locked.customerSendEnabled, false);
  assert.equal(locked.testSendAllowed, false);
  assert.equal(locked.customerSendAllowed, false);

  const future = resolveMarketingEmailSafetyLocks(
    {
      EMAIL_MARKETING_HMAC_SECRET: SECRET,
      EMAIL_MARKETING_PROVIDER_READY: "true",
      EMAIL_MARKETING_NCC_CLEANSED_AT:
        "2026-07-31T12:00:00.001Z",
      EMAIL_MARKETING_SEND_ENABLED: "true",
      RESEND_API_KEY: "re_test",
    },
    NOW,
  );
  assert.equal(future.nccCleansingFresh, false);
});

test("audience preview is deterministic, deduplicated and reconciled", () => {
  const candidates = [
    candidate({
      userId: "multi-shop",
      email: "owner@example.com",
      shopId: "older-shop",
      shopUpdatedAt: new Date("2026-06-01T00:00:00.000Z"),
      productCount: 0,
      lastProductAt: null,
    }),
    candidate({
      userId: "multi-shop",
      email: "owner@example.com",
      shopId: "current-shop",
      shopUpdatedAt: new Date("2026-07-30T00:00:00.000Z"),
      productCount: 2,
      lastProductAt: new Date("2026-07-30T00:00:00.000Z"),
    }),
    candidate({
      userId: "unknown",
      email: "unknown@example.com",
      shopId: "unknown-shop",
      consentStatus: null,
    }),
    candidate({
      userId: "opted-out",
      email: "out@example.com",
      shopId: "out-shop",
      consentStatus: "OPTED_OUT",
    }),
    candidate({
      userId: "banned",
      email: "banned@example.com",
      shopId: "banned-shop",
      isBanned: true,
    }),
    candidate({
      userId: "invalid",
      email: "not-an-email",
      shopId: "invalid-shop",
    }),
    candidate({
      userId: "suppressed",
      email: "suppressed@example.com",
      shopId: "suppressed-shop",
    }),
  ];
  const suppressionHash = createMarketingEmailHash(
    "suppressed@example.com",
    SECRET,
  );

  const preview = buildSellerMarketingAudiencePreview(
    [...candidates].reverse(),
    new Set([suppressionHash]),
    SECRET,
    NOW,
  );

  assert.deepEqual(preview.counts, {
    ownerMemberships: 7,
    uniqueOwners: 6,
    duplicateShopMemberships: 1,
    explicitOptIns: 2,
    eligible: 1,
    excluded: {
      banned: 1,
      invalidEmail: 1,
      duplicateEmail: 0,
      consentUnknown: 1,
      optedOut: 1,
      activeSuppression: 1,
    },
    segments: {
      zero: 0,
      starter: 1,
      stale: 0,
      active: 0,
    },
  });
});

test("case-insensitive duplicate owner addresses are all excluded", () => {
  const preview = buildSellerMarketingAudiencePreview(
    [
      candidate({
        userId: "user-a",
        email: "Shared@Example.com",
        shopId: "shop-a",
      }),
      candidate({
        userId: "user-b",
        email: " shared@example.com ",
        shopId: "shop-b",
      }),
    ],
    new Set(),
    SECRET,
    NOW,
  );

  assert.equal(preview.counts.uniqueOwners, 2);
  assert.equal(preview.counts.eligible, 0);
  assert.equal(preview.counts.excluded.duplicateEmail, 2);
});

test("missing consent is UNKNOWN and never eligible", () => {
  const preview = buildSellerMarketingAudiencePreview(
    [
      candidate({
        consentStatus: null,
      }),
      candidate({
        userId: "explicit-unknown",
        email: "explicit-unknown@example.com",
        shopId: "explicit-unknown-shop",
        consentStatus: "UNKNOWN",
      }),
    ],
    new Set(),
    SECRET,
    NOW,
  );

  assert.equal(preview.counts.eligible, 0);
  assert.equal(preview.counts.excluded.consentUnknown, 2);
});

test("campaign preview rejects legacy non-deliverable addresses", () => {
  const preview = buildSellerMarketingAudiencePreview(
    [
      candidate({
        userId: "local-domain",
        email: "seller@localhost",
        shopId: "local-domain-shop",
      }),
      candidate({
        userId: "bad-label",
        email: "seller@-example.com",
        shopId: "bad-label-shop",
      }),
    ],
    new Set(),
    SECRET,
    NOW,
  );

  assert.equal(preview.counts.eligible, 0);
  assert.equal(preview.counts.excluded.invalidEmail, 2);
});

test("safe email samples contain fixed preview identities only", () => {
  const sample = buildSafeMarketingEmailSample({
    segment: "stale",
    customMessage:
      "Welcome back <script>alert('unsafe')</script>",
  });

  assert.match(sample.subject, /Preview shop/);
  assert.match(sample.html, /Preview seller/);
  assert.match(sample.text, /Preview seller/);
  assert.equal(sample.html.includes("<script>"), false);
  assert.match(
    sample.html,
    /&lt;script&gt;alert\(&#39;unsafe&#39;\)&lt;\/script&gt;/,
  );
  assert.equal(sample.html.includes("seller@example.com"), false);
  assert.equal(sample.text.includes("seller@example.com"), false);
  assert.match(sample.html, /preview-not-a-live-token/);
});
