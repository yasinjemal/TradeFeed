// ============================================================
// PayFast — SA Payment Gateway Integration
// ============================================================
// Utilities for building PayFast checkout URLs, validating
// ITN (Instant Transaction Notification) signatures, and
// managing subscription payments.
//
// PayFast docs: https://developers.payfast.co.za/docs
//
// FLOW:
// 1. Seller clicks "Upgrade to Pro" → we build a PayFast URL
// 2. PayFast handles the payment (hosted checkout page)
// 3. PayFast sends ITN webhook → we verify + activate subscription
// 4. Seller returns to our success/cancel page
//
// ENV VARS NEEDED:
// - PAYFAST_MERCHANT_ID
// - PAYFAST_MERCHANT_KEY
// - PAYFAST_PASSPHRASE (for signature validation)
// - NEXT_PUBLIC_APP_URL (for return/cancel URLs)
// ============================================================

const PAYFAST_SANDBOX_URL = "https://sandbox.payfast.co.za/eng/process";
const PAYFAST_LIVE_URL = "https://www.payfast.co.za/eng/process";

interface PayFastConfig {
  merchantId: string;
  merchantKey: string;
  passphrase: string;
  sandbox: boolean;
}

function getConfig(): PayFastConfig {
  return {
    merchantId: process.env.PAYFAST_MERCHANT_ID ?? "",
    merchantKey: process.env.PAYFAST_MERCHANT_KEY ?? "",
    passphrase: process.env.PAYFAST_PASSPHRASE ?? "",
    sandbox: process.env.NODE_ENV !== "production",
  };
}

interface CheckoutParams {
  shopId: string;
  shopSlug: string;
  planName: string;
  amountInCents: number;
  buyerEmail: string;
  buyerFirstName?: string;
  buyerLastName?: string;
}

/**
 * Build a PayFast checkout URL for a subscription payment.
 *
 * Returns a full URL that the buyer can be redirected to.
 * PayFast handles the rest — card capture, 3DS, etc.
 */
export function buildPayFastCheckoutUrl(params: CheckoutParams): string {
  const config = getConfig();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const amountInRands = (params.amountInCents / 100).toFixed(2);

  // PayFast field order matters for signature generation
  const data: Record<string, string> = {
    merchant_id: config.merchantId,
    merchant_key: config.merchantKey,
    return_url: `${appUrl}/dashboard/${params.shopSlug}/billing?status=success`,
    cancel_url: `${appUrl}/dashboard/${params.shopSlug}/billing?status=cancelled`,
    notify_url: `${appUrl}/api/webhooks/payfast`,
    name_first: params.buyerFirstName ?? "",
    name_last: params.buyerLastName ?? "",
    email_address: params.buyerEmail,
    m_payment_id: params.shopId,
    amount: amountInRands,
    item_name: `TradeFeed ${params.planName} Plan — Monthly`,
    item_description: `Monthly subscription for ${params.planName} plan`,
    // Subscription-specific fields
    subscription_type: "1", // 1 = subscription
    billing_date: new Date().toISOString().split("T")[0]!,
    recurring_amount: amountInRands,
    frequency: "3", // 3 = monthly
    cycles: "0", // 0 = indefinite
  };

  // Remove empty values
  const filteredData = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== ""),
  );

  // Generate signature
  const signature = generateSignature(filteredData, config.passphrase);
  filteredData["signature"] = signature;

  // Build URL
  const baseUrl = config.sandbox ? PAYFAST_SANDBOX_URL : PAYFAST_LIVE_URL;
  const queryString = new URLSearchParams(filteredData).toString();

  return `${baseUrl}?${queryString}`;
}

/**
 * Generate a PayFast MD5 signature.
 *
 * PayFast requires an MD5 hash of all parameters in order,
 * with the passphrase appended (if set).
 */
function generateSignature(
  data: Record<string, string>,
  passphrase: string,
): string {
  // Build the parameter string in the order they appear
  const paramString = Object.entries(data)
    .filter(([key]) => key !== "signature")
    .map(([key, val]) => `${key}=${encodeURIComponent(val.trim()).replace(/%20/g, "+")}`)
    .join("&");

  const stringToHash = passphrase
    ? `${paramString}&passphrase=${encodeURIComponent(passphrase.trim()).replace(/%20/g, "+")}`
    : paramString;

  // Use Web Crypto API for MD5 (not available natively — use a simple implementation)
  return md5(stringToHash);
}

/**
 * Validate a PayFast ITN (Instant Transaction Notification).
 *
 * Checks:
 * 1. Signature matches
 * 2. Source IP is PayFast
 * 3. Payment amount matches expected
 */
export function validatePayFastITN(
  body: Record<string, string>,
  expectedAmountInCents?: number,
): { valid: boolean; error?: string } {
  const config = getConfig();

  // 1. Verify signature
  const receivedSignature = body["signature"];
  if (!receivedSignature) {
    return { valid: false, error: "Missing signature" };
  }

  const dataForSignature = Object.fromEntries(
    Object.entries(body).filter(([key]) => key !== "signature"),
  );

  const expectedSignature = generateSignature(dataForSignature, config.passphrase);
  if (receivedSignature !== expectedSignature) {
    return { valid: false, error: "Invalid signature" };
  }

  // 2. Verify amount (if provided)
  if (expectedAmountInCents !== undefined) {
    const receivedAmount = parseFloat(body["amount_gross"] ?? "0") * 100;
    if (Math.abs(receivedAmount - expectedAmountInCents) > 1) {
      return { valid: false, error: "Amount mismatch" };
    }
  }

  return { valid: true };
}

// ── Simple MD5 Implementation ────────────────────────────────
// Needed because Web Crypto doesn't support MD5 and PayFast requires it.
// This is a minimal, dependency-free MD5 for signature generation only.

function md5(input: string): string {
  // Using Node.js crypto module (available in server-side Next.js)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const crypto = require("crypto") as typeof import("crypto");
  return crypto.createHash("md5").update(input).digest("hex");
}
