// ============================================================
// Rate Limiter — In-Memory Sliding Window
// ============================================================
// Lightweight rate limiting for public routes. No external
// dependencies — uses a Map with TTL cleanup.
//
// LIMITS:
// - Catalog pages: 60 requests/minute per IP
// - API routes: 30 requests/minute per IP
//
// WHY IN-MEMORY:
// - Zero-config, no Upstash/Redis needed for MVP
// - Resets on deploy (acceptable for early stage)
// - Can upgrade to Upstash Ratelimit when scaling
//
// PRODUCTION NOTE:
// Replace with @upstash/ratelimit + @upstash/redis when
// deploying to serverless (Vercel) where memory isn't shared.
// ============================================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 60 seconds
let cleanupInterval: ReturnType<typeof setInterval> | null = null;

function startCleanup() {
  if (cleanupInterval) return;
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (entry.resetAt <= now) {
        store.delete(key);
      }
    }
  }, 60_000);
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check and consume a rate limit token.
 *
 * @param key - Unique identifier (usually IP + route prefix)
 * @param limit - Maximum requests allowed in the window
 * @param windowMs - Time window in milliseconds
 */
export function rateLimit(
  key: string,
  limit: number = 60,
  windowMs: number = 60_000,
): RateLimitResult {
  startCleanup();

  const now = Date.now();
  const entry = store.get(key);

  // No entry or window expired — create fresh
  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  // Within window — check limit
  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  // Increment and allow
  entry.count++;
  return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}

/**
 * Extract a rate limit key from request headers.
 * Uses X-Forwarded-For (Vercel/proxy) or falls back to a generic key.
 */
export function getRateLimitKey(request: Request, prefix: string): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";
  return `${prefix}:${ip}`;
}
