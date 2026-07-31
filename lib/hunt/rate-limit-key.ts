import { createHmac } from "node:crypto";
import { isIP } from "node:net";

export const HUNT_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1_000;
export const HUNT_DEVICE_ATTEMPT_LIMIT = 6;
export const HUNT_NETWORK_ATTEMPT_LIMIT = 30;

export type HuntRateLimitKeyScope = "DEVICE" | "NETWORK";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface HuntRateLimitEnvironment {
  RATE_LIMIT_HASH_SECRET?: string;
  DATABASE_URL?: string;
}

export interface HuntRateLimitWindow {
  windowStart: Date;
  windowEnd: Date;
}

/**
 * Use the dedicated key when configured. DATABASE_URL is already a
 * deployment secret and provides a stable fallback without persisting it.
 */
export function resolveHuntRateLimitSecret(
  suppliedEnvironment?: HuntRateLimitEnvironment,
): string | null {
  const environment = suppliedEnvironment ?? {
    RATE_LIMIT_HASH_SECRET: process.env.RATE_LIMIT_HASH_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
  };
  const dedicatedSecret = environment.RATE_LIMIT_HASH_SECRET?.trim();
  if (dedicatedSecret && dedicatedSecret.length >= 32) {
    return dedicatedSecret;
  }

  const databaseUrl = environment.DATABASE_URL?.trim();
  return databaseUrl || null;
}

export function normalizeHuntDeviceIdentifier(
  value: string | null | undefined,
): string | null {
  const candidate = value?.trim();
  return candidate && UUID_PATTERN.test(candidate)
    ? candidate.toLowerCase()
    : null;
}

/**
 * Reject missing, placeholder and malformed network values. In particular,
 * callers must never create one shared bucket for the literal "unknown".
 */
export function normalizeHuntNetworkIdentifier(
  value: string | null | undefined,
): string | null {
  const candidate = value?.split(",")[0]?.trim().toLowerCase();
  if (
    !candidate ||
    candidate === "unknown" ||
    candidate === "null" ||
    candidate === "undefined" ||
    isIP(candidate) === 0
  ) {
    return null;
  }
  return candidate;
}

export function createHuntRateLimitKeyHash(
  scope: HuntRateLimitKeyScope,
  identifier: string,
  secret: string,
): string {
  const normalizedIdentifier = identifier.trim();
  if (!normalizedIdentifier) {
    throw new Error("A rate-limit identifier is required.");
  }
  if (!secret) {
    throw new Error("A rate-limit hashing secret is required.");
  }

  return createHmac("sha256", secret)
    .update(`tradefeed:hunt-create:v1:${scope}:${normalizedIdentifier}`)
    .digest("hex");
}

export function getHuntRateLimitWindow(
  now = new Date(),
): HuntRateLimitWindow {
  const timestamp = now.getTime();
  if (!Number.isFinite(timestamp)) {
    throw new RangeError("A valid rate-limit timestamp is required.");
  }

  const windowStartMs =
    Math.floor(timestamp / HUNT_RATE_LIMIT_WINDOW_MS) *
    HUNT_RATE_LIMIT_WINDOW_MS;
  return {
    windowStart: new Date(windowStartMs),
    windowEnd: new Date(windowStartMs + HUNT_RATE_LIMIT_WINDOW_MS),
  };
}
