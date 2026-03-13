// ============================================================
// Rate Limiter — Upstash Redis (Distributed)
// ============================================================
// Replaces the in-memory rate limiter for production use on
// Vercel where each function invocation gets its own memory.
//
// LIMITERS (per IP unless noted):
//   - catalog:   60 req / 60s (middleware — browsing)
//   - api:       30 req / 60s (middleware — API endpoints)
//   - checkout:  10 req / 60s (action — order creation)
//   - review:     3 req / 60s (action — review submission)
//   - analytics: 100 req / 60s (action — event tracking)
//
// FALLBACK:
//   When UPSTASH_REDIS_REST_URL is missing (local dev) the old
//   in-memory limiter is used as a transparent fallback so the
//   app works without Redis running locally.
// ============================================================

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ── Types ───────────────────────────────────────────────────

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;        // epoch ms
  retryAfterSeconds: number;
}

export type LimiterName = "catalog" | "api" | "checkout" | "review" | "analytics";

// ── Config per limiter ──────────────────────────────────────

const LIMITER_CONFIG: Record<LimiterName, { limit: number; windowSeconds: number }> = {
  catalog:   { limit: 60,  windowSeconds: 60 },
  api:       { limit: 30,  windowSeconds: 60 },
  checkout:  { limit: 10,  windowSeconds: 60 },
  review:    { limit: 3,   windowSeconds: 60 },
  analytics: { limit: 100, windowSeconds: 60 },
};

// ── Upstash instances (lazy singleton per limiter) ──────────

let redis: Redis | null = null;
const upstashLimiters = new Map<LimiterName, Ratelimit>();

function getRedis(): Redis | null {
  if (redis) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  redis = new Redis({ url, token });
  return redis;
}

function getUpstashLimiter(name: LimiterName): Ratelimit | null {
  const existing = upstashLimiters.get(name);
  if (existing) return existing;

  const r = getRedis();
  if (!r) return null;

  const cfg = LIMITER_CONFIG[name];
  const limiter = new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(cfg.limit, `${cfg.windowSeconds} s`),
    prefix: `rl:${name}`,
    analytics: true,
  });

  upstashLimiters.set(name, limiter);
  return limiter;
}

// ── In-memory fallback (same logic as lib/rate-limit.ts) ────

interface InMemoryEntry {
  count: number;
  resetAt: number;
}

const memStore = new Map<string, InMemoryEntry>();

function inMemoryLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const entry = memStore.get(key);

  if (!entry || entry.resetAt <= now) {
    memStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs, retryAfterSeconds: 0 };
  }

  if (entry.count >= limit) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, remaining: 0, resetAt: entry.resetAt, retryAfterSeconds: retryAfter };
  }

  entry.count++;
  return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt, retryAfterSeconds: 0 };
}

// ── Public API ──────────────────────────────────────────────

/**
 * Check rate limit for the given limiter + identifier (usually IP).
 * Uses Upstash in production, falls back to in-memory in dev.
 */
export async function checkRateLimit(
  name: LimiterName,
  identifier: string,
): Promise<RateLimitResult> {
  const cfg = LIMITER_CONFIG[name];

  try {
    const upstash = getUpstashLimiter(name);

    // ── Upstash path (production) ─────────────────────────────
    if (upstash) {
      const { success, remaining, reset } = await upstash.limit(identifier);
      const resetAt = reset; // epoch ms
      const retryAfter = success ? 0 : Math.ceil((resetAt - Date.now()) / 1000);
      return { allowed: success, remaining, resetAt, retryAfterSeconds: Math.max(retryAfter, 0) };
    }
  } catch (err) {
    // If Redis is down or misconfigured, fail open — don't block legitimate users
    console.warn(`[rate-limit] Redis error for "${name}", failing open:`, err instanceof Error ? err.message : err);
    return { allowed: true, remaining: cfg.limit, resetAt: Date.now() + cfg.windowSeconds * 1000, retryAfterSeconds: 0 };
  }

  // ── In-memory fallback (local dev / Redis unavailable) ────
  return inMemoryLimit(`${name}:${identifier}`, cfg.limit, cfg.windowSeconds * 1000);
}

/**
 * Extract client IP from request headers.
 * Works for both middleware (Request) and server actions (headers()).
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() ?? "unknown";
}

/**
 * Extract IP in server action context using next/headers.
 * Returns the IP string for use as rate limit identifier.
 */
export async function getActionClientIp(): Promise<string> {
  const { headers } = await import("next/headers");
  const headersList = await headers();
  const forwarded = headersList.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() ?? "unknown";
}
