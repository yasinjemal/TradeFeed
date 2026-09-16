ALTER TABLE "Product" ADD COLUMN "discoveryGraceUntil" TIMESTAMP(3);
UPDATE "Product" SET "discoveryGraceUntil" = CURRENT_TIMESTAMP + INTERVAL '30 days';
