// ============================================================
// Unit tests — PayFast signature & amount validation
// ============================================================
// Run with: npm test
// No external dependencies; no database connection required.
// ============================================================

import { describe, test, before } from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";

// getConfig() reads these at call time (not module load time),
// so setting them here before any test runs is sufficient.
process.env.PAYFAST_MERCHANT_ID = "10000100";
process.env.PAYFAST_MERCHANT_KEY = "46f0cd694581a";
process.env.PAYFAST_PASSPHRASE = "jt7NOE43FZPn";

import { validatePayFastITN } from "@/lib/payfast";

// ── Local replica of lib/payfast.ts generateSignature ────────
// Keeping it here lets tests verify the algorithm independently
// rather than importing a private symbol.

function computeSignature(data: Record<string, string>, passphrase: string): string {
  const paramString = Object.entries(data)
    .filter(([k]) => k !== "signature")
    .map(([k, v]) => `${k}=${encodeURIComponent(v.trim()).replace(/%20/g, "+")}`)
    .join("&");
  const toHash = passphrase
    ? `${paramString}&passphrase=${encodeURIComponent(passphrase.trim()).replace(/%20/g, "+")}`
    : paramString;
  return crypto.createHash("md5").update(toHash).digest("hex");
}

const PASSPHRASE = "jt7NOE43FZPn";

// Realistic PayFast ITN body (subscription COMPLETE at R299)
const BASE_BODY: Record<string, string> = {
  m_payment_id: "cuid_abc123:pro",
  pf_payment_id: "7654321",
  payment_status: "COMPLETE",
  item_name: "TradeFeed Pro Plan — Monthly",
  amount_gross: "299.00",
  amount_fee: "7.53",
  amount_net: "291.47",
  merchant_id: "10000100",
};

// ── Signature tests ───────────────────────────────────────────

describe("validatePayFastITN — signature verification", () => {
  test("accepts a correctly signed ITN", () => {
    const body = { ...BASE_BODY, signature: computeSignature(BASE_BODY, PASSPHRASE) };
    assert.deepEqual(validatePayFastITN(body), { valid: true });
  });

  test("rejects when the signature field is missing entirely", () => {
    const result = validatePayFastITN(BASE_BODY); // no signature key
    assert.equal(result.valid, false);
    assert.equal(result.error, "Missing signature");
  });

  test("rejects an obviously wrong signature", () => {
    const body = { ...BASE_BODY, signature: "00000000000000000000000000000000" };
    const result = validatePayFastITN(body);
    assert.equal(result.valid, false);
    assert.equal(result.error, "Invalid signature");
  });

  test("rejects when a field is tampered with after signing (amount changed)", () => {
    // Attacker signs at R1, then inflates amount_gross in the webhook
    const tampered: Record<string, string> = { ...BASE_BODY, amount_gross: "1.00" };
    const sig = computeSignature(tampered, PASSPHRASE);
    // Now send R299 body with R1 signature
    const body = { ...BASE_BODY, amount_gross: "299.00", signature: sig };
    const result = validatePayFastITN(body);
    assert.equal(result.valid, false);
    assert.equal(result.error, "Invalid signature");
  });

  test("rejects when extra fields are injected (signature computed on shorter set)", () => {
    const subset = { m_payment_id: BASE_BODY["m_payment_id"]!, amount_gross: BASE_BODY["amount_gross"]! };
    const sig = computeSignature(subset, PASSPHRASE);
    // Full body has more fields → signature mismatch
    const body = { ...BASE_BODY, signature: sig };
    const result = validatePayFastITN(body);
    assert.equal(result.valid, false);
    assert.equal(result.error, "Invalid signature");
  });
});

// ── Amount tests ──────────────────────────────────────────────

describe("validatePayFastITN — amount guard", () => {
  function signedBody(overrides: Record<string, string> = {}): Record<string, string> {
    const data = { ...BASE_BODY, ...overrides };
    return { ...data, signature: computeSignature(data, PASSPHRASE) };
  }

  test("accepts when paid amount exactly matches expected (R299 = 29900 cents)", () => {
    assert.deepEqual(validatePayFastITN(signedBody(), 29900), { valid: true });
  });

  test("accepts a 1-cent rounding difference (at the tolerance boundary)", () => {
    // amount_gross = 299.00 → 29900 cents; expected = 29901 → |diff| = 1, not > 1 → accept
    assert.deepEqual(validatePayFastITN(signedBody(), 29901), { valid: true });
  });

  test("rejects when paid amount is substantially less than expected (free-plan bypass attempt)", () => {
    // Attacker pays R1 but expected is R299
    const body = signedBody({ amount_gross: "1.00" });
    const result = validatePayFastITN(body, 29900);
    assert.equal(result.valid, false);
    assert.equal(result.error, "Amount mismatch");
  });

  test("rejects zero-amount payment against a paid plan", () => {
    const body = signedBody({ amount_gross: "0.00" });
    const result = validatePayFastITN(body, 29900);
    assert.equal(result.valid, false);
    assert.equal(result.error, "Amount mismatch");
  });

  test("rejects partial payment (R99 instead of R299)", () => {
    const body = signedBody({ amount_gross: "99.00" });
    const result = validatePayFastITN(body, 29900);
    assert.equal(result.valid, false);
    assert.equal(result.error, "Amount mismatch");
  });

  test("skips amount check when expectedAmountInCents is not passed", () => {
    // Signature is valid; no expected amount → amount check is skipped
    assert.deepEqual(validatePayFastITN(signedBody(), undefined), { valid: true });
  });
});
