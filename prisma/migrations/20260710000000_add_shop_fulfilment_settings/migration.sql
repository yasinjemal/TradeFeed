-- Per-shop delivery, collection, and customer-care settings.
-- Defaults preserve the existing buyer experience for current sellers.
ALTER TABLE "Shop"
  ADD COLUMN "deliveryEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "collectionEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "dispatchWindow" TEXT NOT NULL DEFAULT '1-2 business days',
  ADD COLUMN "deliveryNote" TEXT,
  ADD COLUMN "returnPolicy" TEXT;
