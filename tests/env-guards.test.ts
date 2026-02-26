import test from "node:test";
import assert from "node:assert/strict";

// env.ts validates process.env at import time. For these tests
// we only exercise the exported guard functions. The module
// itself doesn't crash because NODE_ENV != "production" in tests
// and required vars are set via .env.

test("requirePayFastConfig throws when credentials are missing", async () => {
  // We can test the guard logic by temporarily patching env
  const { env, requirePayFastConfig } = await import("@/lib/env");

  // Store originals
  const origId = env.PAYFAST_MERCHANT_ID;
  const origKey = env.PAYFAST_MERCHANT_KEY;

  try {
    // Clear credentials
    (env as Record<string, unknown>).PAYFAST_MERCHANT_ID = "";
    (env as Record<string, unknown>).PAYFAST_MERCHANT_KEY = "";

    assert.throws(
      () => requirePayFastConfig(),
      { message: /PayFast is not configured/ }
    );
  } finally {
    // Restore
    (env as Record<string, unknown>).PAYFAST_MERCHANT_ID = origId;
    (env as Record<string, unknown>).PAYFAST_MERCHANT_KEY = origKey;
  }
});

test("requirePayFastConfig returns config when credentials are set", async () => {
  const { env, requirePayFastConfig } = await import("@/lib/env");

  const origId = env.PAYFAST_MERCHANT_ID;
  const origKey = env.PAYFAST_MERCHANT_KEY;
  const origPass = env.PAYFAST_PASSPHRASE;

  try {
    (env as Record<string, unknown>).PAYFAST_MERCHANT_ID = "10000100";
    (env as Record<string, unknown>).PAYFAST_MERCHANT_KEY = "abc123";
    (env as Record<string, unknown>).PAYFAST_PASSPHRASE = "secret";

    const config = requirePayFastConfig();
    assert.equal(config.merchantId, "10000100");
    assert.equal(config.merchantKey, "abc123");
    assert.equal(config.passphrase, "secret");
  } finally {
    (env as Record<string, unknown>).PAYFAST_MERCHANT_ID = origId;
    (env as Record<string, unknown>).PAYFAST_MERCHANT_KEY = origKey;
    (env as Record<string, unknown>).PAYFAST_PASSPHRASE = origPass;
  }
});

test("requireClerkWebhookSecret throws when secret is missing", async () => {
  const { env, requireClerkWebhookSecret } = await import("@/lib/env");
  const orig = env.CLERK_WEBHOOK_SECRET;

  try {
    delete (env as Record<string, unknown>).CLERK_WEBHOOK_SECRET;
    assert.throws(
      () => requireClerkWebhookSecret(),
      { message: /CLERK_WEBHOOK_SECRET is not set/ }
    );
  } finally {
    (env as Record<string, unknown>).CLERK_WEBHOOK_SECRET = orig;
  }
});

test("requireCronSecret throws when secret is missing", async () => {
  const { env, requireCronSecret } = await import("@/lib/env");
  const orig = env.CRON_SECRET;

  try {
    delete (env as Record<string, unknown>).CRON_SECRET;
    assert.throws(
      () => requireCronSecret(),
      { message: /CRON_SECRET is not set/ }
    );
  } finally {
    (env as Record<string, unknown>).CRON_SECRET = orig;
  }
});

test("requireCronSecret returns value when set", async () => {
  const { env, requireCronSecret } = await import("@/lib/env");
  const orig = env.CRON_SECRET;

  try {
    (env as Record<string, unknown>).CRON_SECRET = "test-secret-123";
    const result = requireCronSecret();
    assert.equal(result, "test-secret-123");
  } finally {
    (env as Record<string, unknown>).CRON_SECRET = orig;
  }
});
