ALTER TABLE "Order"
  ADD COLUMN "stockReservedAt" TIMESTAMP(3),
  ADD COLUMN "reservationExpiresAt" TIMESTAMP(3),
  ADD COLUMN "stockReleasedAt" TIMESTAMP(3),
  ADD COLUMN "paymentReviewRequired" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "checkoutKey" TEXT,
  ADD COLUMN "checkoutFingerprint" TEXT;
CREATE UNIQUE INDEX "Order_checkoutKey_key" ON "Order"("checkoutKey");
CREATE INDEX "Order_status_reservationExpiresAt_idx" ON "Order"("status", "reservationExpiresAt");
