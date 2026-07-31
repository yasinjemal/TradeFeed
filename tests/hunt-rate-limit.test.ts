import assert from "node:assert/strict";
import test from "node:test";

import {
  HUNT_DEVICE_ATTEMPT_LIMIT,
  HUNT_NETWORK_ATTEMPT_LIMIT,
  HUNT_RATE_LIMIT_WINDOW_MS,
  createHuntRateLimitKeyHash,
  getHuntRateLimitWindow,
  normalizeHuntDeviceIdentifier,
  normalizeHuntNetworkIdentifier,
  resolveHuntRateLimitSecret,
} from "@/lib/hunt/rate-limit-key";

test("HUNT fallback limits are six per device and thirty per network each hour", () => {
  assert.equal(HUNT_DEVICE_ATTEMPT_LIMIT, 6);
  assert.equal(HUNT_NETWORK_ATTEMPT_LIMIT, 30);
  assert.equal(HUNT_RATE_LIMIT_WINDOW_MS, 60 * 60 * 1_000);
});

test("HUNT rate-limit HMACs are deterministic, scoped and opaque", () => {
  const identifier = "c5b6137d-29b7-4ca8-a07a-c6f02e84af57";
  const secret = "a-production-grade-secret-with-32-characters";
  const first = createHuntRateLimitKeyHash(
    "DEVICE",
    identifier,
    secret,
  );
  const repeated = createHuntRateLimitKeyHash(
    "DEVICE",
    identifier,
    secret,
  );
  const network = createHuntRateLimitKeyHash(
    "NETWORK",
    identifier,
    secret,
  );
  const otherSecret = createHuntRateLimitKeyHash(
    "DEVICE",
    identifier,
    `${secret}-different`,
  );

  assert.equal(first, repeated);
  assert.match(first, /^[0-9a-f]{64}$/);
  assert.equal(first.includes(identifier), false);
  assert.notEqual(first, network);
  assert.notEqual(first, otherSecret);
});

test("HUNT rate-limit secret prefers a valid dedicated secret then DATABASE_URL", () => {
  const dedicated = "d".repeat(32);
  const databaseUrl = "postgresql://private-user:private-pass@db/example";

  assert.equal(
    resolveHuntRateLimitSecret({
      RATE_LIMIT_HASH_SECRET: dedicated,
      DATABASE_URL: databaseUrl,
    }),
    dedicated,
  );
  assert.equal(
    resolveHuntRateLimitSecret({
      RATE_LIMIT_HASH_SECRET: "too-short",
      DATABASE_URL: databaseUrl,
    }),
    databaseUrl,
  );
  assert.equal(resolveHuntRateLimitSecret({}), null);
});

test("HUNT device keys accept UUIDs only and normalize their case", () => {
  const uppercase = "C5B6137D-29B7-4CA8-A07A-C6F02E84AF57";
  assert.equal(
    normalizeHuntDeviceIdentifier(uppercase),
    uppercase.toLowerCase(),
  );
  assert.equal(normalizeHuntDeviceIdentifier("unknown"), null);
  assert.equal(normalizeHuntDeviceIdentifier("shared-device"), null);
  assert.equal(normalizeHuntDeviceIdentifier(""), null);
});

test("HUNT network keys skip unknown or malformed values", () => {
  assert.equal(normalizeHuntNetworkIdentifier(null), null);
  assert.equal(normalizeHuntNetworkIdentifier("unknown"), null);
  assert.equal(normalizeHuntNetworkIdentifier("UNDEFINED"), null);
  assert.equal(normalizeHuntNetworkIdentifier("not-an-ip"), null);
  assert.equal(
    normalizeHuntNetworkIdentifier("196.25.1.10, 10.0.0.1"),
    "196.25.1.10",
  );
  assert.equal(
    normalizeHuntNetworkIdentifier("2001:DB8::1"),
    "2001:db8::1",
  );
});

test("HUNT fallback uses stable UTC-aligned fixed windows", () => {
  const { windowStart, windowEnd } = getHuntRateLimitWindow(
    new Date("2026-07-31T14:37:42.123Z"),
  );
  assert.equal(windowStart.toISOString(), "2026-07-31T14:00:00.000Z");
  assert.equal(windowEnd.toISOString(), "2026-07-31T15:00:00.000Z");

  assert.throws(
    () => getHuntRateLimitWindow(new Date(Number.NaN)),
    /valid rate-limit timestamp/,
  );
});
