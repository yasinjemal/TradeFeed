import test from "node:test";
import assert from "node:assert/strict";

import { getClientIpFromHeaders } from "@/lib/rate-limit-upstash";

test("client IP extraction prefers the platform forwarding chain", () => {
  const headers = new Headers({
    "x-forwarded-for": "196.25.1.10, 10.0.0.1",
    "x-real-ip": "196.25.1.11",
  });

  assert.equal(getClientIpFromHeaders(headers), "196.25.1.10");
});

test("client IP extraction uses bounded platform fallbacks", () => {
  assert.equal(
    getClientIpFromHeaders(new Headers({ "x-real-ip": "2001:db8::1" })),
    "2001:db8::1",
  );
  assert.equal(
    getClientIpFromHeaders(
      new Headers({ "cf-connecting-ip": "102.132.96.35" }),
    ),
    "102.132.96.35",
  );
});

test("missing or malformed client IP headers stay unknown", () => {
  assert.equal(getClientIpFromHeaders(new Headers()), "unknown");
  assert.equal(
    getClientIpFromHeaders(
      new Headers({ "x-forwarded-for": "attacker-controlled-value" }),
    ),
    "unknown",
  );
  assert.equal(
    getClientIpFromHeaders(
      new Headers({ "x-forwarded-for": "999.999.999.999" }),
    ),
    "unknown",
  );
});
