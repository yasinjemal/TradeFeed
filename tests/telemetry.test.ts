import test from "node:test";
import assert from "node:assert/strict";
import { reportRateLimitEvent, reportError } from "@/lib/telemetry";

test("reportRateLimitEvent logs without throwing", () => {
  // Should not throw even when Sentry is not configured
  assert.doesNotThrow(() => {
    reportRateLimitEvent("catalog", "127.0.0.1", 60);
  });
});

test("reportRateLimitEvent accepts both route groups", () => {
  assert.doesNotThrow(() => {
    reportRateLimitEvent("api", "test-key", 30);
  });
  assert.doesNotThrow(() => {
    reportRateLimitEvent("catalog", "test-key", 60);
  });
});

test("reportError handles Error objects", async () => {
  // Should resolve without throwing
  await assert.doesNotReject(async () => {
    await reportError("test-context", new Error("test error"), {
      userId: "u_123",
    });
  });
});

test("reportError handles non-Error objects", async () => {
  await assert.doesNotReject(async () => {
    await reportError("test-context", "string error");
  });
  await assert.doesNotReject(async () => {
    await reportError("test-context", { code: 500, msg: "fail" });
  });
  await assert.doesNotReject(async () => {
    await reportError("test-context", null);
  });
});

test("reportError works with empty meta", async () => {
  await assert.doesNotReject(async () => {
    await reportError("bare-context", new Error("no meta"));
  });
});
