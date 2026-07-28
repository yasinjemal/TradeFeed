ALTER TABLE "OnboardingEvent"
ADD COLUMN "dedupeKey" TEXT;

CREATE UNIQUE INDEX "OnboardingEvent_dedupeKey_key"
ON "OnboardingEvent"("dedupeKey");
