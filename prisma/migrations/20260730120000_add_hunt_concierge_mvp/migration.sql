-- TradeFeed HUNT concierge MVP.
-- Public request data is structurally separated from buyer PII.

CREATE TYPE "HuntStatus" AS ENUM (
  'LIVE',
  'FOUND',
  'CLOSED',
  'REJECTED',
  'EXPIRED'
);

CREATE TYPE "HuntModerationStatus" AS ENUM (
  'APPROVED',
  'REVIEW_REQUIRED',
  'REJECTED'
);

CREATE TYPE "HuntMatchPreference" AS ENUM (
  'EXACT_ONLY',
  'SIMILAR_OK'
);

CREATE TABLE "Hunt" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "status" "HuntStatus" NOT NULL DEFAULT 'LIVE',
  "moderationStatus" "HuntModerationStatus" NOT NULL DEFAULT 'APPROVED',
  "publicTitle" TEXT NOT NULL,
  "publicDescription" TEXT NOT NULL,
  "publicImageUrl" TEXT NOT NULL,
  "publicImageKey" TEXT,
  "category" TEXT,
  "desiredVariant" TEXT,
  "desiredColor" TEXT,
  "style" TEXT,
  "matchPreference" "HuntMatchPreference" NOT NULL DEFAULT 'SIMILAR_OK',
  "maxBudgetCents" INTEGER,
  "city" TEXT NOT NULL,
  "province" TEXT,
  "aiConfidence" DOUBLE PRECISION,
  "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "resolvedAt" TIMESTAMP(3),
  "seoApprovedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Hunt_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Hunt_maxBudgetCents_check"
    CHECK ("maxBudgetCents" IS NULL OR "maxBudgetCents" > 0)
);

CREATE TABLE "HuntPrivateData" (
  "id" TEXT NOT NULL,
  "huntId" TEXT NOT NULL,
  "ownerFeatureId" TEXT NOT NULL,
  "whatsappNumber" TEXT NOT NULL,
  "buyerName" TEXT,
  "rawRequestText" TEXT NOT NULL,
  "huntUpdatesConsentAt" TIMESTAMP(3) NOT NULL,
  "publicImageConsentAt" TIMESTAMP(3) NOT NULL,
  "termsAcceptedAt" TIMESTAMP(3) NOT NULL,
  "purgeAfter" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "HuntPrivateData_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HuntParticipant" (
  "id" TEXT NOT NULL,
  "huntId" TEXT NOT NULL,
  "visitorId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "HuntParticipant_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Hunt_slug_key" ON "Hunt"("slug");
CREATE INDEX "Hunt_status_publishedAt_idx" ON "Hunt"("status", "publishedAt");
CREATE INDEX "Hunt_status_expiresAt_idx" ON "Hunt"("status", "expiresAt");
CREATE INDEX "Hunt_moderationStatus_status_createdAt_idx"
  ON "Hunt"("moderationStatus", "status", "createdAt");
CREATE INDEX "Hunt_city_status_createdAt_idx"
  ON "Hunt"("city", "status", "createdAt");
CREATE INDEX "Hunt_category_status_createdAt_idx"
  ON "Hunt"("category", "status", "createdAt");

CREATE UNIQUE INDEX "HuntPrivateData_huntId_key"
  ON "HuntPrivateData"("huntId");
CREATE INDEX "HuntPrivateData_ownerFeatureId_createdAt_idx"
  ON "HuntPrivateData"("ownerFeatureId", "createdAt");
CREATE INDEX "HuntPrivateData_purgeAfter_idx"
  ON "HuntPrivateData"("purgeAfter");

CREATE UNIQUE INDEX "HuntParticipant_huntId_visitorId_key"
  ON "HuntParticipant"("huntId", "visitorId");
CREATE INDEX "HuntParticipant_visitorId_createdAt_idx"
  ON "HuntParticipant"("visitorId", "createdAt");
CREATE INDEX "HuntParticipant_huntId_createdAt_idx"
  ON "HuntParticipant"("huntId", "createdAt");

ALTER TABLE "HuntPrivateData"
  ADD CONSTRAINT "HuntPrivateData_huntId_fkey"
  FOREIGN KEY ("huntId") REFERENCES "Hunt"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HuntParticipant"
  ADD CONSTRAINT "HuntParticipant_huntId_fkey"
  FOREIGN KEY ("huntId") REFERENCES "Hunt"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
