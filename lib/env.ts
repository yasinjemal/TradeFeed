// ============================================================
// Environment Validation — Fail-fast on missing config
// ============================================================
// Validates ALL required environment variables at import time
// using Zod. If any are missing, the process crashes with a
// clear error message — no more silent "" fallbacks in prod.
//
// Import this module in root layout or instrumentation hook
// to catch misconfigs before they reach users.
// ============================================================

import { z } from "zod/v4";

// ── Schema ────────────────────────────────────────────────

const envSchema = z.object({
  // Database
  DATABASE_URL: z.url("DATABASE_URL must be a valid connection string"),

  // Next.js
  NEXT_PUBLIC_APP_URL: z.string().min(1, "NEXT_PUBLIC_APP_URL is required"),

  // Clerk Auth
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1, "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required"),
  CLERK_SECRET_KEY: z.string().min(1, "CLERK_SECRET_KEY is required"),

  // Optional — but validated if present
  CLERK_WEBHOOK_SECRET: z.string().optional(),
  UPLOADTHING_TOKEN: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  ADMIN_USER_IDS: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  CRON_SECRET: z.string().optional(),

  // PayFast — required in production, optional in dev
  PAYFAST_MERCHANT_ID: z.string().optional(),
  PAYFAST_MERCHANT_KEY: z.string().optional(),
  PAYFAST_PASSPHRASE: z.string().optional(),

  // Node
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

// ── Validate ──────────────────────────────────────────────

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "\n❌ Invalid environment variables:\n",
    parsed.error.issues
      .map((i) => `  • ${i.path.join(".")}: ${i.message}`)
      .join("\n"),
    "\n"
  );
  // In production, crash early. In dev/test, warn but continue.
  if (process.env.NODE_ENV === "production") {
    throw new Error("Missing required environment variables. See log above.");
  }
}

/**
 * Type-safe, validated environment variables.
 * Use `env.DATABASE_URL` instead of `process.env.DATABASE_URL`.
 */
export const env = parsed.data ?? (process.env as unknown as z.infer<typeof envSchema>);

// ── Production guards for critical integrations ───────────

/**
 * Assert PayFast credentials are configured.
 * Call this before building a checkout URL.
 */
export function requirePayFastConfig() {
  if (!env.PAYFAST_MERCHANT_ID || !env.PAYFAST_MERCHANT_KEY) {
    throw new Error(
      "PayFast is not configured. Set PAYFAST_MERCHANT_ID and PAYFAST_MERCHANT_KEY."
    );
  }
  return {
    merchantId: env.PAYFAST_MERCHANT_ID,
    merchantKey: env.PAYFAST_MERCHANT_KEY,
    passphrase: env.PAYFAST_PASSPHRASE ?? "",
  };
}

/**
 * Assert Clerk webhook secret is configured.
 * Call this at the top of the webhook handler.
 */
export function requireClerkWebhookSecret(): string {
  if (!env.CLERK_WEBHOOK_SECRET) {
    throw new Error(
      "CLERK_WEBHOOK_SECRET is not set. Webhook signature verification is disabled."
    );
  }
  return env.CLERK_WEBHOOK_SECRET;
}

/**
 * Assert CRON_SECRET is configured.
 * Call this at the top of cron route handlers.
 */
export function requireCronSecret(): string {
  if (!env.CRON_SECRET) {
    throw new Error(
      "CRON_SECRET is not set. Cron endpoint is unprotected."
    );
  }
  return env.CRON_SECRET;
}
