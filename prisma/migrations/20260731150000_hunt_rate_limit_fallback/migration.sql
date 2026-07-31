-- Privacy-safe PostgreSQL limiter for HUNT creation.
-- keyHash stores only an HMAC-SHA-256 digest; raw identifiers are never stored.

CREATE TYPE "HuntRateLimitScope" AS ENUM (
  'DEVICE',
  'NETWORK'
);

CREATE TABLE "HuntRateLimitBucket" (
  "id" TEXT NOT NULL,
  "scope" "HuntRateLimitScope" NOT NULL,
  "keyHash" CHAR(64) NOT NULL,
  "windowStart" TIMESTAMP(3) NOT NULL,
  "windowEnd" TIMESTAMP(3) NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "HuntRateLimitBucket_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "HuntRateLimitBucket_attempts_check" CHECK ("attempts" > 0),
  CONSTRAINT "HuntRateLimitBucket_window_check"
    CHECK ("windowEnd" > "windowStart")
);

CREATE UNIQUE INDEX "HuntRateLimitBucket_scope_keyHash_windowStart_key"
  ON "HuntRateLimitBucket"("scope", "keyHash", "windowStart");

CREATE INDEX "HuntRateLimitBucket_windowEnd_idx"
  ON "HuntRateLimitBucket"("windowEnd");
