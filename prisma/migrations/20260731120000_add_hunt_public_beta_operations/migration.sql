-- TradeFeed HUNT public-beta operations.
-- Adds seller opt-in/routing, public-safe offers, fulfilment state,
-- funnel telemetry, reporting, and an immutable takedown audit trail.

CREATE TYPE "HuntFulfillmentStatus" AS ENUM (
  'NONE',
  'OFFER_SELECTED',
  'HANDOFF_SENT',
  'FULFILLED'
);

CREATE TYPE "HuntOfferStatus" AS ENUM (
  'DRAFT',
  'PUBLISHED',
  'WITHDRAWN',
  'REJECTED'
);

CREATE TYPE "HuntOfferMatchType" AS ENUM (
  'EXACT',
  'SIMILAR',
  'UNCERTAIN'
);

CREATE TYPE "HuntSellerRouteStatus" AS ENUM (
  'ROUTED',
  'CONTACTED',
  'RESPONDED',
  'DECLINED',
  'CANCELLED'
);

CREATE TYPE "HuntEventType" AS ENUM (
  'VIEWED',
  'CREATE_STARTED',
  'CREATED',
  'SHARED',
  'JOINED',
  'SELLER_ROUTED',
  'SELLER_RESPONDED',
  'OFFER_PUBLISHED',
  'OFFER_WITHDRAWN',
  'OFFER_SELECTED',
  'WHATSAPP_HANDOFF',
  'FULFILLED',
  'CLOSED',
  'REPORTED',
  'TAKEN_DOWN'
);

CREATE TYPE "HuntEventActor" AS ENUM (
  'BUYER',
  'SELLER',
  'ADMIN',
  'SYSTEM'
);

CREATE TYPE "HuntReportReason" AS ENUM (
  'SCAM_OR_FRAUD',
  'PROHIBITED_ITEM',
  'COPYRIGHT_OR_TRADEMARK',
  'PRIVACY',
  'MISLEADING',
  'SPAM',
  'OTHER'
);

CREATE TYPE "HuntReportStatus" AS ENUM (
  'OPEN',
  'REVIEWING',
  'ACTIONED',
  'DISMISSED'
);

CREATE TYPE "HuntTakedownAction" AS ENUM (
  'HIDDEN',
  'RESTORED'
);

ALTER TABLE "Hunt"
  ADD COLUMN "fulfillmentStatus" "HuntFulfillmentStatus" NOT NULL DEFAULT 'NONE',
  ADD COLUMN "selectedOfferId" TEXT,
  ADD COLUMN "handoffAt" TIMESTAMP(3),
  ADD COLUMN "fulfilledAt" TIMESTAMP(3);

CREATE TABLE "HuntOffer" (
  "id" TEXT NOT NULL,
  "huntId" TEXT NOT NULL,
  "shopId" TEXT NOT NULL,
  "status" "HuntOfferStatus" NOT NULL DEFAULT 'DRAFT',
  "matchType" "HuntOfferMatchType" NOT NULL,
  "publicProductName" TEXT NOT NULL,
  "publicDescription" TEXT,
  "publicVariant" TEXT,
  "publicDeliveryEstimate" TEXT NOT NULL,
  "publicProofUrl" TEXT,
  "publicProofCapturedAt" TIMESTAMP(3),
  "priceCents" INTEGER NOT NULL,
  "quantityAvailable" INTEGER,
  "publicSellerNameSnapshot" TEXT NOT NULL,
  "publicShopSlugSnapshot" TEXT NOT NULL,
  "publicSellerLogoUrlSnapshot" TEXT,
  "publicSellerVerifiedSnapshot" BOOLEAN NOT NULL DEFAULT false,
  "sellerWhatsappSnapshot" TEXT,
  "privateDataPurgeAfter" TIMESTAMP(3) NOT NULL,
  "publishedAt" TIMESTAMP(3),
  "withdrawnAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "HuntOffer_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "HuntOffer_priceCents_check" CHECK ("priceCents" > 0),
  CONSTRAINT "HuntOffer_quantityAvailable_check"
    CHECK ("quantityAvailable" IS NULL OR "quantityAvailable" > 0)
);

CREATE TABLE "HuntSellerPreference" (
  "id" TEXT NOT NULL,
  "shopId" TEXT NOT NULL,
  "isOptedIn" BOOLEAN NOT NULL DEFAULT false,
  "cities" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "categories" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "consentedAt" TIMESTAMP(3),
  "consentSource" TEXT,
  "consentedBy" TEXT,
  "pausedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "HuntSellerPreference_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HuntSellerRoute" (
  "id" TEXT NOT NULL,
  "huntId" TEXT NOT NULL,
  "shopId" TEXT NOT NULL,
  "status" "HuntSellerRouteStatus" NOT NULL DEFAULT 'ROUTED',
  "routedBy" TEXT NOT NULL,
  "note" TEXT,
  "routedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "contactedAt" TIMESTAMP(3),
  "respondedAt" TIMESTAMP(3),
  "declinedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "HuntSellerRoute_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HuntEvent" (
  "id" TEXT NOT NULL,
  "huntId" TEXT,
  "offerId" TEXT,
  "type" "HuntEventType" NOT NULL,
  "actor" "HuntEventActor" NOT NULL,
  "visitorId" TEXT,
  "source" TEXT,
  "dedupeKey" TEXT,
  "purgeAfter" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "HuntEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HuntReport" (
  "id" TEXT NOT NULL,
  "huntId" TEXT NOT NULL,
  "reason" "HuntReportReason" NOT NULL,
  "details" TEXT,
  "status" "HuntReportStatus" NOT NULL DEFAULT 'OPEN',
  "reporterFeatureId" TEXT,
  "purgeAfter" TIMESTAMP(3) NOT NULL,
  "reviewedBy" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "resolutionNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "HuntReport_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HuntTakedown" (
  "id" TEXT NOT NULL,
  "huntId" TEXT NOT NULL,
  "reportId" TEXT,
  "action" "HuntTakedownAction" NOT NULL,
  "reason" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "HuntTakedown_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HuntMediaDeletionJob" (
  "id" TEXT NOT NULL,
  "fileKey" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "lastError" TEXT,
  "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "HuntMediaDeletionJob_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Hunt_selectedOfferId_key"
  ON "Hunt"("selectedOfferId");

CREATE INDEX "HuntPrivateData_whatsappNumber_createdAt_idx"
  ON "HuntPrivateData"("whatsappNumber", "createdAt");

CREATE UNIQUE INDEX "HuntOffer_huntId_shopId_key"
  ON "HuntOffer"("huntId", "shopId");
CREATE INDEX "HuntOffer_huntId_status_publishedAt_idx"
  ON "HuntOffer"("huntId", "status", "publishedAt");
CREATE INDEX "HuntOffer_shopId_status_createdAt_idx"
  ON "HuntOffer"("shopId", "status", "createdAt");
CREATE INDEX "HuntOffer_status_publishedAt_idx"
  ON "HuntOffer"("status", "publishedAt");
CREATE INDEX "HuntOffer_privateDataPurgeAfter_idx"
  ON "HuntOffer"("privateDataPurgeAfter");

CREATE UNIQUE INDEX "HuntSellerPreference_shopId_key"
  ON "HuntSellerPreference"("shopId");
CREATE INDEX "HuntSellerPreference_isOptedIn_pausedAt_idx"
  ON "HuntSellerPreference"("isOptedIn", "pausedAt");

CREATE UNIQUE INDEX "HuntSellerRoute_huntId_shopId_key"
  ON "HuntSellerRoute"("huntId", "shopId");
CREATE INDEX "HuntSellerRoute_huntId_status_routedAt_idx"
  ON "HuntSellerRoute"("huntId", "status", "routedAt");
CREATE INDEX "HuntSellerRoute_shopId_status_routedAt_idx"
  ON "HuntSellerRoute"("shopId", "status", "routedAt");

CREATE UNIQUE INDEX "HuntEvent_dedupeKey_key"
  ON "HuntEvent"("dedupeKey");
CREATE INDEX "HuntEvent_huntId_type_createdAt_idx"
  ON "HuntEvent"("huntId", "type", "createdAt");
CREATE INDEX "HuntEvent_offerId_type_createdAt_idx"
  ON "HuntEvent"("offerId", "type", "createdAt");
CREATE INDEX "HuntEvent_type_createdAt_idx"
  ON "HuntEvent"("type", "createdAt");
CREATE INDEX "HuntEvent_visitorId_createdAt_idx"
  ON "HuntEvent"("visitorId", "createdAt");
CREATE INDEX "HuntEvent_purgeAfter_idx"
  ON "HuntEvent"("purgeAfter");

CREATE UNIQUE INDEX "HuntReport_huntId_reporterFeatureId_key"
  ON "HuntReport"("huntId", "reporterFeatureId");
CREATE INDEX "HuntReport_status_createdAt_idx"
  ON "HuntReport"("status", "createdAt");
CREATE INDEX "HuntReport_huntId_status_createdAt_idx"
  ON "HuntReport"("huntId", "status", "createdAt");
CREATE INDEX "HuntReport_purgeAfter_idx"
  ON "HuntReport"("purgeAfter");

CREATE INDEX "HuntTakedown_huntId_createdAt_idx"
  ON "HuntTakedown"("huntId", "createdAt");
CREATE INDEX "HuntTakedown_reportId_createdAt_idx"
  ON "HuntTakedown"("reportId", "createdAt");

CREATE UNIQUE INDEX "HuntMediaDeletionJob_fileKey_key"
  ON "HuntMediaDeletionJob"("fileKey");
CREATE INDEX "HuntMediaDeletionJob_nextAttemptAt_createdAt_idx"
  ON "HuntMediaDeletionJob"("nextAttemptAt", "createdAt");

ALTER TABLE "HuntOffer"
  ADD CONSTRAINT "HuntOffer_huntId_fkey"
  FOREIGN KEY ("huntId") REFERENCES "Hunt"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HuntOffer"
  ADD CONSTRAINT "HuntOffer_shopId_fkey"
  FOREIGN KEY ("shopId") REFERENCES "Shop"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Hunt"
  ADD CONSTRAINT "Hunt_selectedOfferId_fkey"
  FOREIGN KEY ("selectedOfferId") REFERENCES "HuntOffer"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "HuntSellerPreference"
  ADD CONSTRAINT "HuntSellerPreference_shopId_fkey"
  FOREIGN KEY ("shopId") REFERENCES "Shop"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HuntSellerRoute"
  ADD CONSTRAINT "HuntSellerRoute_huntId_fkey"
  FOREIGN KEY ("huntId") REFERENCES "Hunt"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HuntSellerRoute"
  ADD CONSTRAINT "HuntSellerRoute_shopId_fkey"
  FOREIGN KEY ("shopId") REFERENCES "Shop"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HuntEvent"
  ADD CONSTRAINT "HuntEvent_huntId_fkey"
  FOREIGN KEY ("huntId") REFERENCES "Hunt"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HuntEvent"
  ADD CONSTRAINT "HuntEvent_offerId_fkey"
  FOREIGN KEY ("offerId") REFERENCES "HuntOffer"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "HuntReport"
  ADD CONSTRAINT "HuntReport_huntId_fkey"
  FOREIGN KEY ("huntId") REFERENCES "Hunt"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HuntTakedown"
  ADD CONSTRAINT "HuntTakedown_huntId_fkey"
  FOREIGN KEY ("huntId") REFERENCES "Hunt"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HuntTakedown"
  ADD CONSTRAINT "HuntTakedown_reportId_fkey"
  FOREIGN KEY ("reportId") REFERENCES "HuntReport"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
