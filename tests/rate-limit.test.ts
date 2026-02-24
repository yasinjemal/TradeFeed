import test from "node:test";
import assert from "node:assert/strict";
import { rateLimit } from "@/lib/rate-limit";

test("rateLimit blocks requests over the configured limit", () => {
  const key = `test-limit-${Date.now()}`;
  const first = rateLimit(key, 2, 60_000);
  const second = rateLimit(key, 2, 60_000);
  const third = rateLimit(key, 2, 60_000);

  assert.equal(first.allowed, true);
  assert.equal(second.allowed, true);
  assert.equal(third.allowed, false);
  assert.equal(third.remaining, 0);
});

test("rateLimit resets after the window expires", async () => {
  const key = `test-reset-${Date.now()}`;
  const one = rateLimit(key, 1, 20);
  const two = rateLimit(key, 1, 20);
  assert.equal(one.allowed, true);
  assert.equal(two.allowed, false);

  await new Promise((resolve) => setTimeout(resolve, 25));
  const three = rateLimit(key, 1, 20);
  assert.equal(three.allowed, true);
});
