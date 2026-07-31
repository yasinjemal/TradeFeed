CREATE TYPE "EmailMarketingConsentStatus" AS ENUM (
  'UNKNOWN',
  'OPTED_IN',
  'OPTED_OUT'
);

CREATE TYPE "EmailSuppressionReason" AS ENUM (
  'UNSUBSCRIBED',
  'HARD_BOUNCE',
  'COMPLAINT',
  'PROVIDER_SUPPRESSED',
  'NCC_OPT_OUT',
  'INVALID_ADDRESS',
  'ADMIN'
);

CREATE TYPE "EmailMarketingCampaignKind" AS ENUM (
  'SELLER_REENGAGEMENT',
  'FEATURE_ANNOUNCEMENT',
  'CONSENT_REQUEST',
  'OTHER'
);

CREATE TYPE "EmailMarketingCampaignStatus" AS ENUM (
  'DRAFT',
  'APPROVED',
  'RUNNING',
  'PAUSED',
  'COMPLETED',
  'FAILED',
  'CANCELLED'
);

CREATE TYPE "EmailMarketingRecipientStatus" AS ENUM (
  'PENDING',
  'PROCESSING',
  'SENT',
  'DELIVERED',
  'SUPPRESSED',
  'BOUNCED',
  'COMPLAINED',
  'FAILED',
  'CANCELLED'
);

CREATE TABLE "EmailMarketingPreference" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "status" "EmailMarketingConsentStatus" NOT NULL DEFAULT 'UNKNOWN',
  "consentSource" TEXT,
  "consentVersion" TEXT,
  "consentRequestedAt" TIMESTAMP(3),
  "consentedAt" TIMESTAMP(3),
  "optedOutAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "EmailMarketingPreference_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EmailSuppression" (
  "id" TEXT NOT NULL,
  "normalizedEmailHash" CHAR(64) NOT NULL,
  "reason" "EmailSuppressionReason" NOT NULL,
  "source" TEXT,
  "providerEventId" TEXT,
  "suppressedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "releasedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "EmailSuppression_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EmailMarketingCampaign" (
  "id" TEXT NOT NULL,
  "campaignKey" TEXT NOT NULL,
  "kind" "EmailMarketingCampaignKind" NOT NULL,
  "status" "EmailMarketingCampaignStatus" NOT NULL DEFAULT 'DRAFT',
  "name" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "templateHash" CHAR(64) NOT NULL,
  "audienceDefinition" JSONB NOT NULL,
  "createdById" TEXT NOT NULL,
  "approvedById" TEXT,
  "approvedAt" TIMESTAMP(3),
  "startedAt" TIMESTAMP(3),
  "pausedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "failedAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "eligibleCount" INTEGER NOT NULL DEFAULT 0,
  "recipientCount" INTEGER NOT NULL DEFAULT 0,
  "suppressedCount" INTEGER NOT NULL DEFAULT 0,
  "sentCount" INTEGER NOT NULL DEFAULT 0,
  "deliveredCount" INTEGER NOT NULL DEFAULT 0,
  "failedCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "EmailMarketingCampaign_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EmailMarketingCampaignRecipient" (
  "id" TEXT NOT NULL,
  "campaignId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "shopId" TEXT,
  "normalizedEmailHash" CHAR(64) NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "status" "EmailMarketingRecipientStatus" NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "providerMessageId" TEXT,
  "lastAttemptAt" TIMESTAMP(3),
  "nextRetryAt" TIMESTAMP(3),
  "lastError" TEXT,
  "sentAt" TIMESTAMP(3),
  "deliveredAt" TIMESTAMP(3),
  "failedAt" TIMESTAMP(3),
  "suppressedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "EmailMarketingCampaignRecipient_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EmailMarketingPreference_userId_key"
  ON "EmailMarketingPreference"("userId");

CREATE INDEX "EmailMarketingPreference_status_idx"
  ON "EmailMarketingPreference"("status");

CREATE UNIQUE INDEX "EmailSuppression_providerEventId_key"
  ON "EmailSuppression"("providerEventId");

CREATE UNIQUE INDEX "EmailSuppression_normalizedEmailHash_reason_key"
  ON "EmailSuppression"("normalizedEmailHash", "reason");

CREATE INDEX "EmailSuppression_normalizedEmailHash_releasedAt_idx"
  ON "EmailSuppression"("normalizedEmailHash", "releasedAt");

CREATE UNIQUE INDEX "EmailMarketingCampaign_campaignKey_key"
  ON "EmailMarketingCampaign"("campaignKey");

CREATE INDEX "EmailMarketingCampaign_status_createdAt_idx"
  ON "EmailMarketingCampaign"("status", "createdAt");

CREATE INDEX "EmailMarketingCampaign_kind_createdAt_idx"
  ON "EmailMarketingCampaign"("kind", "createdAt");

CREATE INDEX "EmailMarketingCampaign_createdById_idx"
  ON "EmailMarketingCampaign"("createdById");

CREATE INDEX "EmailMarketingCampaign_approvedById_idx"
  ON "EmailMarketingCampaign"("approvedById");

CREATE UNIQUE INDEX "EmailMarketingCampaignRecipient_idempotencyKey_key"
  ON "EmailMarketingCampaignRecipient"("idempotencyKey");

CREATE UNIQUE INDEX "EmailMarketingCampaignRecipient_providerMessageId_key"
  ON "EmailMarketingCampaignRecipient"("providerMessageId");

CREATE UNIQUE INDEX "EmailMarketingCampaignRecipient_campaignId_userId_key"
  ON "EmailMarketingCampaignRecipient"("campaignId", "userId");

CREATE UNIQUE INDEX "EmailMarketingCampaignRecipient_campaignId_normalizedEmailHash_key"
  ON "EmailMarketingCampaignRecipient"("campaignId", "normalizedEmailHash");

CREATE INDEX "EmailMarketingCampaignRecipient_campaignId_status_nextRetryAt_idx"
  ON "EmailMarketingCampaignRecipient"("campaignId", "status", "nextRetryAt");

CREATE INDEX "EmailMarketingCampaignRecipient_userId_createdAt_idx"
  ON "EmailMarketingCampaignRecipient"("userId", "createdAt");

CREATE INDEX "EmailMarketingCampaignRecipient_shopId_idx"
  ON "EmailMarketingCampaignRecipient"("shopId");

ALTER TABLE "EmailMarketingPreference"
  ADD CONSTRAINT "EmailMarketingPreference_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EmailMarketingCampaign"
  ADD CONSTRAINT "EmailMarketingCampaign_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "EmailMarketingCampaign"
  ADD CONSTRAINT "EmailMarketingCampaign_approvedById_fkey"
  FOREIGN KEY ("approvedById") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "EmailMarketingCampaignRecipient"
  ADD CONSTRAINT "EmailMarketingCampaignRecipient_campaignId_fkey"
  FOREIGN KEY ("campaignId") REFERENCES "EmailMarketingCampaign"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EmailMarketingCampaignRecipient"
  ADD CONSTRAINT "EmailMarketingCampaignRecipient_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
