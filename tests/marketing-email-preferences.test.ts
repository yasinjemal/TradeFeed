import assert from "node:assert/strict";
import test from "node:test";
import {
  MAX_MARKETING_CUSTOM_COPY_LENGTH,
  createCampaignTemplateFingerprint,
  createMarketingEmailHash,
  createMarketingUnsubscribeToken,
  isMarketingEmailEligible,
  normalizeMarketingCustomCopy,
  normalizeMarketingEmail,
  selectMarketingCampaignSegment,
  verifyMarketingUnsubscribeToken,
} from "../lib/email/marketing-preferences";

const SECRET_A = "a".repeat(32);
const SECRET_B = "b".repeat(32);
const ISSUED_AT = new Date("2026-07-31T12:34:56.789Z");

test("normalizes email identity before creating a secret-scoped HMAC", () => {
  assert.equal(
    normalizeMarketingEmail("  Seller.Name+News@Example.COM  "),
    "seller.name+news@example.com",
  );
  assert.equal(
    normalizeMarketingEmail("ＳＥＬＬＥＲ@Example.COM"),
    "seller@example.com",
  );

  const firstHash = createMarketingEmailHash(
    "Seller.Name+News@Example.COM",
    SECRET_A,
  );
  const normalizedHash = createMarketingEmailHash(
    " seller.name+news@example.com ",
    SECRET_A,
  );

  assert.equal(firstHash, normalizedHash);
  assert.match(firstHash, /^[a-f0-9]{64}$/);
  assert.equal(firstHash.includes("seller"), false);
  assert.notEqual(
    firstHash,
    createMarketingEmailHash("seller.name+news@example.com", SECRET_B),
  );
});

test("rejects malformed emails and weak secrets", () => {
  assert.throws(
    () => normalizeMarketingEmail("not-an-email"),
    /valid email/i,
  );
  assert.throws(
    () => createMarketingEmailHash("seller@example.com", "too-short"),
    /at least 32 bytes/i,
  );
});

test("creates a versioned unsubscribe token without embedding raw email", () => {
  const token = createMarketingUnsubscribeToken({
    email: "Seller@Example.com",
    secret: SECRET_A,
    issuedAt: ISSUED_AT,
  });

  assert.match(token, /^tfmu\.v1\./);
  assert.equal(token.toLowerCase().includes("seller@example.com"), false);

  const verified = verifyMarketingUnsubscribeToken(token, SECRET_A);
  assert.ok(verified);
  assert.equal(
    verified.emailHash,
    createMarketingEmailHash("seller@example.com", SECRET_A),
  );
  assert.equal(
    verified.issuedAt.toISOString(),
    "2026-07-31T12:34:56.000Z",
  );
  assert.equal(verified.version, "v1");
});

test("unsubscribe verification resists payload and signature tampering", () => {
  const token = createMarketingUnsubscribeToken({
    email: "seller@example.com",
    secret: SECRET_A,
    issuedAt: ISSUED_AT,
  });
  const parts = token.split(".");

  const tamperedHash = [...parts];
  tamperedHash[3] = `${tamperedHash[3]?.slice(0, -1)}0`;
  assert.equal(
    verifyMarketingUnsubscribeToken(tamperedHash.join("."), SECRET_A),
    null,
  );

  const tamperedSignature = [...parts];
  const signature = tamperedSignature[4] as string;
  tamperedSignature[4] =
    `${signature.slice(0, -1)}${signature.endsWith("A") ? "B" : "A"}`;
  assert.equal(
    verifyMarketingUnsubscribeToken(
      tamperedSignature.join("."),
      SECRET_A,
    ),
    null,
  );

  assert.equal(verifyMarketingUnsubscribeToken(token, SECRET_B), null);
  assert.equal(
    verifyMarketingUnsubscribeToken(
      token.replace("tfmu.v1.", "tfmu.v2."),
      SECRET_A,
    ),
    null,
  );
});

test("marketing eligibility requires explicit OPTED_IN status", () => {
  assert.equal(isMarketingEmailEligible("OPTED_IN"), true);
  assert.equal(isMarketingEmailEligible("OPTED_OUT"), false);
  assert.equal(isMarketingEmailEligible("UNKNOWN"), false);
  assert.equal(isMarketingEmailEligible(null), false);
  assert.equal(isMarketingEmailEligible(undefined), false);
});

test("segments sellers using product count and an explicit activity clock", () => {
  const now = new Date("2026-07-31T12:00:00.000Z");
  const cutoff = new Date("2026-07-01T12:00:00.000Z");

  assert.equal(
    selectMarketingCampaignSegment({
      productCount: 0,
      lastProductAt: null,
      now,
    }),
    "NO_PRODUCTS",
  );
  assert.equal(
    selectMarketingCampaignSegment({
      productCount: 4,
      lastProductAt: null,
      now,
    }),
    "INACTIVE",
  );
  assert.equal(
    selectMarketingCampaignSegment({
      productCount: 4,
      lastProductAt: cutoff,
      now,
    }),
    "INACTIVE",
  );
  assert.equal(
    selectMarketingCampaignSegment({
      productCount: 4,
      lastProductAt: new Date(cutoff.getTime() + 1),
      now,
    }),
    "ACTIVE",
  );
  assert.equal(
    selectMarketingCampaignSegment({
      productCount: 4,
      lastProductAt: new Date("2026-07-30T12:00:00.000Z"),
      now,
    }),
    "ACTIVE",
  );
});

test("rejects invalid campaign segmentation inputs", () => {
  const now = new Date("2026-07-31T12:00:00.000Z");

  assert.throws(
    () =>
      selectMarketingCampaignSegment({
        productCount: -1,
        lastProductAt: null,
        now,
      }),
    /productCount/i,
  );
  assert.throws(
    () =>
      selectMarketingCampaignSegment({
        productCount: 1,
        lastProductAt: null,
        now,
        inactiveAfterDays: 0,
      }),
    /inactiveAfterDays/i,
  );
});

test("normalizes custom copy and enforces a hard character bound", () => {
  assert.equal(normalizeMarketingCustomCopy(undefined), undefined);
  assert.equal(normalizeMarketingCustomCopy(" \r\n "), undefined);
  assert.equal(
    normalizeMarketingCustomCopy("  First line\r\nSecond\u0000 line  "),
    "First line\nSecond line",
  );

  const atLimit = "🎉".repeat(MAX_MARKETING_CUSTOM_COPY_LENGTH);
  assert.equal(
    normalizeMarketingCustomCopy(atLimit),
    atLimit,
  );
  assert.throws(
    () =>
      normalizeMarketingCustomCopy(
        "a".repeat(MAX_MARKETING_CUSTOM_COPY_LENGTH + 1),
      ),
    /cannot exceed/i,
  );
});

test("campaign/template fingerprint is stable and binds both fields", () => {
  const fingerprint = createCampaignTemplateFingerprint({
    campaignKey: "hunt-launch-2026-07",
    template: "Line one\r\nLine two",
  });

  assert.match(fingerprint, /^[a-f0-9]{64}$/);
  assert.equal(
    fingerprint,
    createCampaignTemplateFingerprint({
      campaignKey: "hunt-launch-2026-07",
      template: "Line one\nLine two",
    }),
  );
  assert.notEqual(
    fingerprint,
    createCampaignTemplateFingerprint({
      campaignKey: "hunt-launch-2026-08",
      template: "Line one\nLine two",
    }),
  );
  assert.notEqual(
    fingerprint,
    createCampaignTemplateFingerprint({
      campaignKey: "hunt-launch-2026-07",
      template: "Different template",
    }),
  );
});
