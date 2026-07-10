ALTER TABLE "BuyerProfile"
  ADD COLUMN "orderUpdates" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "restockAlerts" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "shopUpdates" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE "BuyerNotification" (
  "id" TEXT NOT NULL,
  "buyerId" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "href" TEXT,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BuyerNotification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BuyerNotification_buyerId_createdAt_idx" ON "BuyerNotification"("buyerId", "createdAt");
CREATE INDEX "BuyerNotification_buyerId_readAt_idx" ON "BuyerNotification"("buyerId", "readAt");
ALTER TABLE "BuyerNotification" ADD CONSTRAINT "BuyerNotification_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "BuyerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
