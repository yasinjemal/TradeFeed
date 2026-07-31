import "server-only";

import {
  Prisma,
  type HuntRateLimitScope,
} from "@prisma/client";

import { db } from "@/lib/db";
import {
  HUNT_DEVICE_ATTEMPT_LIMIT,
  HUNT_NETWORK_ATTEMPT_LIMIT,
  createHuntRateLimitKeyHash,
  getHuntRateLimitWindow,
  normalizeHuntDeviceIdentifier,
  normalizeHuntNetworkIdentifier,
  resolveHuntRateLimitSecret,
} from "@/lib/hunt/rate-limit-key";

const UNAVAILABLE_RETRY_SECONDS = 60;

export type HuntCreateRateLimitReason =
  | "allowed"
  | "device"
  | "network"
  | "unavailable";

export interface HuntRateLimitDimensionResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
  resetAt: Date;
}

export interface HuntCreateDatabaseRateLimitResult {
  allowed: boolean;
  reason: HuntCreateRateLimitReason;
  retryAfterSeconds: number;
  retryAt: Date | null;
  device: HuntRateLimitDimensionResult | null;
  network: HuntRateLimitDimensionResult | null;
}

export interface CheckHuntCreateDatabaseRateLimitInput {
  deviceId: string;
  ipAddress?: string | null;
  now?: Date;
}

function unavailableResult(now: Date): HuntCreateDatabaseRateLimitResult {
  return {
    allowed: false,
    reason: "unavailable",
    retryAfterSeconds: UNAVAILABLE_RETRY_SECONDS,
    retryAt: new Date(now.getTime() + UNAVAILABLE_RETRY_SECONDS * 1_000),
    device: null,
    network: null,
  };
}

async function consumeFixedWindowBucket(
  tx: Prisma.TransactionClient,
  input: {
    scope: HuntRateLimitScope;
    keyHash: string;
    limit: number;
    windowStart: Date;
    windowEnd: Date;
    now: Date;
  },
): Promise<HuntRateLimitDimensionResult> {
  // PostgreSQL implements this upsert as one INSERT ... ON CONFLICT UPDATE.
  // The increment and returned attempt count are atomic under concurrency.
  const bucket = await tx.huntRateLimitBucket.upsert({
    where: {
      scope_keyHash_windowStart: {
        scope: input.scope,
        keyHash: input.keyHash,
        windowStart: input.windowStart,
      },
    },
    create: {
      scope: input.scope,
      keyHash: input.keyHash,
      windowStart: input.windowStart,
      windowEnd: input.windowEnd,
      attempts: 1,
    },
    update: {
      attempts: { increment: 1 },
    },
    select: {
      attempts: true,
      windowEnd: true,
    },
  });

  const allowed = bucket.attempts <= input.limit;
  const retryAfterSeconds = allowed
    ? 0
    : Math.max(
        1,
        Math.ceil(
          (bucket.windowEnd.getTime() - input.now.getTime()) / 1_000,
        ),
      );

  return {
    allowed,
    limit: input.limit,
    remaining: Math.max(0, input.limit - bucket.attempts),
    retryAfterSeconds,
    resetAt: bucket.windowEnd,
  };
}

/**
 * Privacy-safe, fail-closed limiter for HUNT creation.
 *
 * Raw device and IP values are normalized in memory, HMACed, and discarded
 * before the transaction. A missing/unknown IP skips only the network bucket;
 * an invalid device ID or unavailable secret/database returns "unavailable".
 */
export async function checkHuntCreateDatabaseRateLimit(
  input: CheckHuntCreateDatabaseRateLimitInput,
): Promise<HuntCreateDatabaseRateLimitResult> {
  const now = input.now ?? new Date();
  const deviceId = normalizeHuntDeviceIdentifier(input.deviceId);
  const networkId = normalizeHuntNetworkIdentifier(input.ipAddress);
  const secret = resolveHuntRateLimitSecret();
  if (!deviceId || !secret || !Number.isFinite(now.getTime())) {
    return unavailableResult(
      Number.isFinite(now.getTime()) ? now : new Date(),
    );
  }

  const { windowStart, windowEnd } = getHuntRateLimitWindow(now);
  const deviceKeyHash = createHuntRateLimitKeyHash(
    "DEVICE",
    deviceId,
    secret,
  );
  const networkKeyHash = networkId
    ? createHuntRateLimitKeyHash("NETWORK", networkId, secret)
    : null;

  try {
    return await db.$transaction(async (tx) => {
      const device = await consumeFixedWindowBucket(tx, {
        scope: "DEVICE",
        keyHash: deviceKeyHash,
        limit: HUNT_DEVICE_ATTEMPT_LIMIT,
        windowStart,
        windowEnd,
        now,
      });
      if (!device.allowed) {
        return {
          allowed: false,
          reason: "device",
          retryAfterSeconds: device.retryAfterSeconds,
          retryAt: device.resetAt,
          device,
          network: null,
        };
      }

      const network = networkKeyHash
        ? await consumeFixedWindowBucket(tx, {
            scope: "NETWORK",
            keyHash: networkKeyHash,
            limit: HUNT_NETWORK_ATTEMPT_LIMIT,
            windowStart,
            windowEnd,
            now,
          })
        : null;
      if (network && !network.allowed) {
        return {
          allowed: false,
          reason: "network",
          retryAfterSeconds: network.retryAfterSeconds,
          retryAt: network.resetAt,
          device,
          network,
        };
      }

      return {
        allowed: true,
        reason: "allowed",
        retryAfterSeconds: 0,
        retryAt: null,
        device,
        network,
      };
    });
  } catch {
    // Do not include raw identifiers, SQL parameters or connection details in
    // logs. The action layer can present a temporary-unavailability message.
    console.error("[hunt-rate-limit] PostgreSQL fallback unavailable");
    return unavailableResult(now);
  }
}

export async function cleanupExpiredHuntRateLimitBuckets(
  before = new Date(),
): Promise<number> {
  const result = await db.huntRateLimitBucket.deleteMany({
    where: { windowEnd: { lte: before } },
  });
  return result.count;
}
