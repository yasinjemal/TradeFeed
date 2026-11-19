// ============================================================
// Unit tests — PayFast REST API client (subscription cancel)
// ============================================================
// The HTTP client is always a mock. Nothing in this file can reach
// PayFast: the global fetch is replaced with one that throws.
//
// The expected request shape comes from PayFast's documentation
// (https://developers.payfast.co.za/api — "Signature generation
// steps" and "Cancel a subscription"), not from our implementation.
// ============================================================

import { describe, test, before, after } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

import {
  buildPayFastApiSignature,
  cancelPayFastSubscription,
  payfastApiTimestamp,
  phpUrlEncode,
} from "@/lib/payfast-api";
import type { PayFastConfig } from "@/lib/payfast";

const TOKEN = "dc0521d3-55fe-269b-fa00-b647310d760f"; // the token used in PayFast's docs
const PASSPHRASE = "jt7NOE43FZPn"; // PayFast's public sandbox passphrase
const NOW = new Date("2026-11-19T20:10:05Z"); // 22:10:05 in South Africa

const LIVE: PayFastConfig = {
  merchantId: "10000100",
  merchantKey: "46f0cd694581a",
  passphrase: PASSPHRASE,
  sandbox: false,
};
const SANDBOX: PayFastConfig = { ...LIVE, sandbox: true };

const md5 = (s: string) => crypto.createHash("md5").update(s).digest("hex");

interface Call {
  url: string;
  method: string | undefined;
  headers: Record<string, string>;
  hasBody: boolean;
}

/** A fake fetch that records the request and returns a canned response. */
function mockFetch(status: number, body: unknown) {
  const calls: Call[] = [];
  const fn = (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({
      url: String(input),
      method: init?.method,
      headers: { ...(init?.headers as Record<string, string>) },
      hasBody: init?.body != null,
    });
    const text = typeof body === "string" ? body : JSON.stringify(body);
    return new Response(text, { status });
  }) as typeof fetch;
  return { fn, calls };
}

const SUCCESS = { code: 200, status: "success", data: { response: true } };

// ── Safety net: no test may touch the network ────────────────

const realFetch = globalThis.fetch;
before(() => {
  globalThis.fetch = (async () => {
    throw new Error("A test tried to call the real network");
  }) as typeof fetch;
});
after(() => {
  globalThis.fetch = realFetch;
});

// ── Signature ────────────────────────────────────────────────

describe("buildPayFastApiSignature", () => {
  test("hashes every variable plus the passphrase, sorted alphabetically", () => {
    const signature = buildPayFastApiSignature(
      // deliberately out of order
      { version: "v1", timestamp: "2026-11-19T22:10:05+02:00", "merchant-id": "10000100" },
      PASSPHRASE,
    );
    // Docs: "merchant-id=10000100&passphrase=passphrase&..&version=v1"
    const canonical =
      "merchant-id=10000100&passphrase=jt7NOE43FZPn&timestamp=2026-11-19T22%3A10%3A05%2B02%3A00&version=v1";
    assert.equal(signature, md5(canonical));
    assert.match(signature, /^[0-9a-f]{32}$/, "lower-case MD5, as the docs require");
  });

  test("leaves out the sandbox `testing` flag and any `signature` value", () => {
    const base = { "merchant-id": "10000100", version: "v1", timestamp: "2026-11-19T22:10:05+02:00" };
    assert.equal(
      buildPayFastApiSignature({ ...base, testing: "true", signature: "ignored" }, PASSPHRASE),
      buildPayFastApiSignature(base, PASSPHRASE),
    );
  });

  test("includes body variables in the same sorted string", () => {
    const signature = buildPayFastApiSignature(
      { "merchant-id": "10000100", version: "v1", timestamp: "2026-11-19T22:10:05", cycles: "2" },
      "secret",
    );
    assert.equal(
      signature,
      md5("cycles=2&merchant-id=10000100&passphrase=secret&timestamp=2026-11-19T22%3A10%3A05&version=v1"),
    );
  });

  test("is not the checkout signature: a different passphrase gives a different hash", () => {
    const vars = { "merchant-id": "10000100", version: "v1", timestamp: "2026-11-19T22:10:05+02:00" };
    assert.notEqual(buildPayFastApiSignature(vars, "one"), buildPayFastApiSignature(vars, "two"));
  });
});

describe("phpUrlEncode", () => {
  test("matches PHP urlencode(): spaces become +, and ! ' ( ) * ~ are escaped", () => {
    assert.equal(phpUrlEncode("a b"), "a+b");
    assert.equal(phpUrlEncode("!'()*~"), "%21%27%28%29%2A%7E");
    assert.equal(phpUrlEncode("2026-11-19T22:10:05+02:00"), "2026-11-19T22%3A10%3A05%2B02%3A00");
    assert.equal(phpUrlEncode("safe-chars_1.2"), "safe-chars_1.2");
  });
});

describe("payfastApiTimestamp", () => {
  test("uses the documented format in South African time", () => {
    assert.equal(payfastApiTimestamp(NOW), "2026-11-19T22:10:05+02:00");
  });

  test("rolls the date over at SA midnight, not UTC midnight", () => {
    assert.equal(payfastApiTimestamp(new Date("2026-12-31T23:30:00Z")), "2027-01-01T01:30:00+02:00");
  });
});

// ── Cancel request ───────────────────────────────────────────

describe("cancelPayFastSubscription — the request", () => {
  test("live: PUT /subscriptions/{token}/cancel with the four documented headers", async () => {
    const { fn, calls } = mockFetch(200, SUCCESS);

    const result = await cancelPayFastSubscription(TOKEN, { fetch: fn, now: () => NOW, config: LIVE });

    assert.deepEqual(result, { ok: true });
    assert.equal(calls.length, 1);
    const call = calls[0]!;
    assert.equal(call.url, `https://api.payfast.co.za/subscriptions/${TOKEN}/cancel`);
    assert.equal(call.method, "PUT");
    assert.equal(call.hasBody, false);
    assert.deepEqual(Object.keys(call.headers).sort(), ["merchant-id", "signature", "timestamp", "version"]);
    assert.equal(call.headers["merchant-id"], "10000100");
    assert.equal(call.headers["version"], "v1");
    assert.equal(call.headers["timestamp"], "2026-11-19T22:10:05+02:00");
    assert.equal(
      call.headers["signature"],
      md5("merchant-id=10000100&passphrase=jt7NOE43FZPn&timestamp=2026-11-19T22%3A10%3A05%2B02%3A00&version=v1"),
    );
  });

  test("sandbox: same request with ?testing=true, and the flag is not signed", async () => {
    const live = mockFetch(200, SUCCESS);
    const sandbox = mockFetch(200, SUCCESS);

    await cancelPayFastSubscription(TOKEN, { fetch: live.fn, now: () => NOW, config: LIVE });
    await cancelPayFastSubscription(TOKEN, { fetch: sandbox.fn, now: () => NOW, config: SANDBOX });

    assert.equal(sandbox.calls[0]!.url, `https://api.payfast.co.za/subscriptions/${TOKEN}/cancel?testing=true`);
    assert.equal(sandbox.calls[0]!.headers["signature"], live.calls[0]!.headers["signature"]);
  });

  test("never sends the merchant key or the passphrase", async () => {
    const { fn, calls } = mockFetch(200, SUCCESS);
    await cancelPayFastSubscription(TOKEN, { fetch: fn, now: () => NOW, config: LIVE });

    const sent = JSON.stringify(calls[0]);
    assert.ok(!sent.includes(LIVE.merchantKey), "merchant key leaked into the request");
    assert.ok(!sent.includes(PASSPHRASE), "passphrase leaked into the request");
  });
});

// ── Cancel outcome ───────────────────────────────────────────

describe("cancelPayFastSubscription — the outcome", () => {
  test("ok only when PayFast explicitly confirms", async () => {
    const { fn } = mockFetch(200, SUCCESS);
    assert.deepEqual(
      await cancelPayFastSubscription(TOKEN, { fetch: fn, now: () => NOW, config: LIVE }),
      { ok: true },
    );
  });

  test("HTTP 200 with response:false is NOT a cancellation", async () => {
    const { fn } = mockFetch(200, { code: 200, status: "success", data: { response: false } });
    const result = await cancelPayFastSubscription(TOKEN, { fetch: fn, config: LIVE });
    assert.equal(result.ok, false);
    assert.equal(!result.ok && result.reason, "rejected");
  });

  test("HTTP 200 with an unexpected body is NOT a cancellation", async () => {
    for (const body of ["", "OK", { status: "success" }, { code: 200, status: "failed", data: { response: true } }]) {
      const { fn } = mockFetch(200, body);
      const result = await cancelPayFastSubscription(TOKEN, { fetch: fn, config: LIVE });
      assert.equal(result.ok, false, `accepted: ${JSON.stringify(body)}`);
    }
  });

  test("401 from PayFast is reported with its message", async () => {
    const { fn } = mockFetch(401, {
      code: 401,
      status: "failed",
      data: { response: false, message: "Merchant authorisation failed" },
    });
    const result = await cancelPayFastSubscription(TOKEN, { fetch: fn, config: LIVE });
    assert.deepEqual(result, {
      ok: false,
      reason: "rejected",
      status: 401,
      detail: "Merchant authorisation failed",
    });
  });

  test("a 500 HTML error page is a failure, not a crash", async () => {
    const { fn } = mockFetch(500, "<html><body>Application Error</body></html>");
    const result = await cancelPayFastSubscription(TOKEN, { fetch: fn, config: LIVE });
    assert.equal(result.ok, false);
    assert.equal(!result.ok && result.status, 500);
  });

  test("a network failure or timeout is a failure", async () => {
    const failing = (async () => {
      throw new Error("fetch failed");
    }) as typeof fetch;
    const result = await cancelPayFastSubscription(TOKEN, { fetch: failing, config: LIVE });
    assert.deepEqual(result, { ok: false, reason: "network", detail: "fetch failed" });
  });

  test("without a passphrase nothing is sent — the API requires one", async () => {
    const { fn, calls } = mockFetch(200, SUCCESS);
    const result = await cancelPayFastSubscription(TOKEN, {
      fetch: fn,
      config: { ...LIVE, passphrase: "  " },
    });
    assert.equal(result.ok, false);
    assert.equal(!result.ok && result.reason, "not_configured");
    assert.equal(calls.length, 0);
  });

  test("without a merchant id nothing is sent", async () => {
    const { fn, calls } = mockFetch(200, SUCCESS);
    const result = await cancelPayFastSubscription(TOKEN, { fetch: fn, config: { ...LIVE, merchantId: "" } });
    assert.equal(!result.ok && result.reason, "not_configured");
    assert.equal(calls.length, 0);
  });

  test("a value that is not a subscription token never reaches the URL", async () => {
    for (const bad of ["", "../../refunds", "abc/def", "token?testing=true", "x".repeat(100)]) {
      const { fn, calls } = mockFetch(200, SUCCESS);
      const result = await cancelPayFastSubscription(bad, { fetch: fn, config: LIVE });
      assert.deepEqual(result, { ok: false, reason: "invalid_token" }, `accepted: ${bad}`);
      assert.equal(calls.length, 0);
    }
  });
});
