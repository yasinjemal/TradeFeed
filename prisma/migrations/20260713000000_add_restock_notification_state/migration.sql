-- AddColumn
ALTER TABLE "WishlistItem" ADD COLUMN "restockNotifiedAt" TIMESTAMP(3);

-- Existing saves for products that are currently available are considered
-- already acknowledged. Only products currently at zero stock remain armed.
UPDATE "WishlistItem" AS wishlist
SET "restockNotifiedAt" = CURRENT_TIMESTAMP
WHERE EXISTS (
  SELECT 1
  FROM "ProductVariant" AS variant
  WHERE variant."productId" = wishlist."productId"
    AND variant."isActive" = true
    AND variant."stock" > 0
);

-- CreateIndex
CREATE INDEX "WishlistItem_productId_restockNotifiedAt_idx" ON "WishlistItem"("productId", "restockNotifiedAt");
