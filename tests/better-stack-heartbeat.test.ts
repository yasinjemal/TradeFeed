import assert from "node:assert/strict";
import test from "node:test";

import {
  BETTER_STACK_HEARTBEAT_TIMEOUT_MS,
  deliverBetterStackHeartbeat,
} from "@/lib/monitoring/better-stack-heartbeat-core";

const HEARTBEAT_URL =
  "https://uptime.betterstack.com/api/v1/heartbeat/test-secret-token";

test("sends a success heartbeat to the configured URL", async () => {
  let requestedUrl = "";
  let requestInit: RequestInit | undefined;

  const result = await deliverBetterStackHeartbeat(
    HEARTBEAT_URL,
    "success",
    {
      fetchImpl: async (input, init) => {
        requestedUrl = input.toString();
        requestInit = init;
        return { ok: true, status: 200 };
      },
    },
  );

  assert.deepEqual(result, { outcome: "sent" });
  assert.equal(requestedUrl, HEARTBEAT_URL);
  assert.equal(requestInit?.method, "GET");
  assert.equal(requestInit?.cache, "no-store");
  assert.equal(requestInit?.redirect, "error");
  assert.ok(requestInit?.signal);
});

test("appends /fail for an explicit failure heartbeat", async () => {
  let requestedUrl = "";

  const result = await deliverBetterStackHeartbeat(
    `${HEARTBEAT_URL}/`,
    "failure",
    {
      fetchImpl: async (input) => {
        requestedUrl = input.toString();
        return { ok: true, status: 200 };
      },
    },
  );

  assert.deepEqual(result, { outcome: "sent" });
  assert.equal(requestedUrl, `${HEARTBEAT_URL}/fail`);
});

test("rejects non-canonical heartbeat URLs without making a request", async () => {
  const invalidUrls = [
    "not-a-url",
    "http://uptime.betterstack.com/api/v1/heartbeat/token",
    "https://example.com/api/v1/heartbeat/token",
    "https://uptime.betterstack.com/api/v1/heartbeat/token/fail",
    "https://uptime.betterstack.com/api/v1/heartbeat/token?leak=true",
    "https://uptime.betterstack.com/api/v1/heartbeat/token#fragment",
  ];
  let fetchCalls = 0;

  for (const invalidUrl of invalidUrls) {
    const result = await deliverBetterStackHeartbeat(
      invalidUrl,
      "success",
      {
        fetchImpl: async () => {
          fetchCalls += 1;
          return { ok: true, status: 200 };
        },
      },
    );

    assert.deepEqual(result, { outcome: "invalid-url" });
  }

  assert.equal(fetchCalls, 0);
});

test("returns a bounded HTTP error without exposing the secret URL", async () => {
  const result = await deliverBetterStackHeartbeat(
    HEARTBEAT_URL,
    "success",
    {
      fetchImpl: async () => ({ ok: false, status: 503 }),
    },
  );

  assert.deepEqual(result, { outcome: "http-error", statusCode: 503 });
  assert.doesNotMatch(JSON.stringify(result), /test-secret-token/);
});

test("absorbs network failures so monitoring cannot fail the cron job", async () => {
  await assert.doesNotReject(async () => {
    const result = await deliverBetterStackHeartbeat(
      HEARTBEAT_URL,
      "success",
      {
        fetchImpl: async () => {
          throw new Error(`request failed for ${HEARTBEAT_URL}`);
        },
      },
    );

    assert.deepEqual(result, { outcome: "network-error" });
    assert.doesNotMatch(JSON.stringify(result), /test-secret-token/);
  });
});

test("aborts a stalled heartbeat within the configured short timeout", async () => {
  assert.ok(BETTER_STACK_HEARTBEAT_TIMEOUT_MS <= 1_500);

  const result = await deliverBetterStackHeartbeat(
    HEARTBEAT_URL,
    "success",
    {
      timeoutMs: 10,
      fetchImpl: async (_input, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener(
            "abort",
            () => reject(new Error("aborted")),
            { once: true },
          );
        }),
    },
  );

  assert.deepEqual(result, { outcome: "timeout" });
});
