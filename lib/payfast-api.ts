// ============================================================
// PayFast REST API — subscription management
// ============================================================
// lib/payfast.ts talks to PayFast's hosted payment page (checkout
// URLs + ITN validation). This file talks to PayFast's REST API,
// which is the only way to stop a recurring subscription from our
// side. Marking a subscription CANCELLED in our database does NOT
// stop PayFast charging the seller — this call does.
//
// Source of truth for everything below:
//   https://developers.payfast.co.za/api  (read 2026-11-19)
// cross-checked against PayFast's own PHP SDK
//   github.com/Payfast/payfast-php-sdk  lib/Request.php, lib/Auth.php
//
//   PUT https://api.payfast.co.za/subscriptions/{token}/cancel
//   Sandbox: the same URL with ?testing=true
//   Headers: merchant-id, version ("v1"), timestamp, signature
//   Signature: MD5 of every submitted variable (headers, body, query
//     string) plus the passphrase, sorted alphabetically by key and
//     joined as key=urlencode(value) with "&". The `testing` flag is
//     excluded. This is NOT the checkout signature, which keeps the
//     documented field order instead of sorting.
//   Success body: { "code": 200, "status": "success",
//                   "data": { "response": true } }
//
// PayFast emails the buyer when a subscription is cancelled, and
// sends our notify_url an ITN with payment_status=CANCELLED.
//
// Account prerequisites (PayFast dashboard → Settings):
//   - a passphrase must be set, or the API rejects every call
//   - if a Recurring Billing IP whitelist is configured, our server
//     IPs must be on it (otherwise: 401 "Request origin could not be
//     verified"). Vercel has no fixed egress IPs, so leave the
//     whitelist empty unless static IPs are in use.
// ============================================================

import crypto from "crypto";
import { getPayFastConfig, type PayFastConfig } from "@/lib/payfast";

const PAYFAST_API_BASE_URL = "https://api.payfast.co.za";
const PAYFAST_API_VERSION = "v1";
const REQUEST_TIMEOUT_MS = 10_000;

/** PayFast subscription tokens are UUID-shaped, e.g. dc0521d3-55fe-269b-fa00-b647310d760f */
const TOKEN_PATTERN = /^[A-Za-z0-9-]{8,64}$/;

export type PayFastApiResult =
  | { ok: true }
  | {
      ok: false;
      /**
       * not_configured — merchant id or passphrase missing
       * invalid_token  — token is not a PayFast subscription token
       * network        — request failed or timed out; outcome unknown
       * rejected       — PayFast answered, but did not confirm the action
       */
      reason: "not_configured" | "invalid_token" | "network" | "rejected";
      /** HTTP status when PayFast answered */
      status?: number;
      /** Short diagnostic for logs — never shown to sellers */
      detail?: string;
    };

interface PayFastApiDeps {
  /** HTTP client — injected in tests so the live API is never called */
  fetch?: typeof fetch;
  now?: () => Date;
  config?: PayFastConfig;
}

/**
 * PHP `urlencode()` equivalent. PayFast builds its side of the
 * signature in PHP, so the encoding has to match byte for byte:
 * spaces become "+", and ! ' ( ) * ~ are percent-encoded
 * (encodeURIComponent leaves those six alone).
 */
export function phpUrlEncode(value: string): string {
  return encodeURIComponent(value)
    .replace(/[!'()*~]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)
    .replace(/%20/g, "+");
}

/**
 * Signature for PayFast REST API requests.
 *
 * `vars` is every header, body and query-string variable being sent
 * (except `signature` itself and the sandbox `testing` flag).
 */
export function buildPayFastApiSignature(
  vars: Record<string, string>,
  passphrase: string,
): string {
  const all: Record<string, string> = { ...vars, passphrase };
  const paramString = Object.keys(all)
    .filter((key) => key !== "signature" && key !== "testing" && all[key] !== "")
    .sort()
    .map((key) => `${key}=${phpUrlEncode(all[key]!)}`)
    .join("&");

  return crypto.createHash("md5").update(paramString).digest("hex");
}

/**
 * Timestamp in the documented format, YYYY-MM-DDTHH:MM:SS+02:00.
 * Always expressed in South African time (UTC+2, no daylight saving),
 * which is also what PayFast assumes when the offset is left out.
 */
export function payfastApiTimestamp(now: Date = new Date()): string {
  const sast = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  return `${sast.toISOString().slice(0, 19)}+02:00`;
}

/**
 * Cancel a recurring subscription at PayFast.
 *
 * Resolves `{ ok: true }` ONLY when PayFast explicitly confirms the
 * cancellation. Every other outcome — bad config, network error,
 * timeout, non-200, a 200 without `response: true` — is a failure,
 * because the caller is about to tell a seller they will not be
 * charged again and that has to be true.
 */
export async function cancelPayFastSubscription(
  token: string,
  deps: PayFastApiDeps = {},
): Promise<PayFastApiResult> {
  if (!TOKEN_PATTERN.test(token)) {
    return { ok: false, reason: "invalid_token" };
  }

  let config: PayFastConfig;
  try {
    config = deps.config ?? getPayFastConfig();
  } catch (error) {
    return { ok: false, reason: "not_configured", detail: errorMessage(error) };
  }

  const passphrase = config.passphrase.trim();
  if (!config.merchantId || !passphrase) {
    return {
      ok: false,
      reason: "not_configured",
      detail: "PAYFAST_MERCHANT_ID and PAYFAST_PASSPHRASE are both required for the PayFast API.",
    };
  }

  const headers: Record<string, string> = {
    "merchant-id": config.merchantId,
    version: PAYFAST_API_VERSION,
    timestamp: payfastApiTimestamp(deps.now?.() ?? new Date()),
  };
  headers["signature"] = buildPayFastApiSignature(headers, passphrase);

  const url =
    `${PAYFAST_API_BASE_URL}/subscriptions/${encodeURIComponent(token)}/cancel` +
    (config.sandbox ? "?testing=true" : "");

  const doFetch = deps.fetch ?? fetch;

  let response: Response;
  try {
    response = await doFetch(url, {
      method: "PUT",
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    return { ok: false, reason: "network", detail: errorMessage(error) };
  }

  const raw = await response.text().catch(() => "");
  const body = parseJson(raw);

  const confirmed =
    response.status === 200 &&
    body?.status === "success" &&
    isRecord(body.data) &&
    body.data["response"] === true;

  if (confirmed) return { ok: true };

  return {
    ok: false,
    reason: "rejected",
    status: response.status,
    detail: describeFailure(body, raw),
  };
}

// ── Helpers ──────────────────────────────────────────────────

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseJson(raw: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** PayFast's reason for refusing, trimmed for logs. */
function describeFailure(body: Record<string, unknown> | null, raw: string): string {
  if (body && isRecord(body.data)) {
    const { message, response } = body.data;
    if (typeof message === "string" && message) return message.slice(0, 200);
    if (typeof response === "string" && response) return response.slice(0, 200);
  }
  if (body && typeof body.status === "string") return body.status.slice(0, 200);
  return raw.slice(0, 200);
}
