ALTER TABLE "Shop"
ADD COLUMN "locationProvider" TEXT,
ADD COLUMN "locationGeocodedAt" TIMESTAMP(3),
ADD COLUMN "locationPublishedAt" TIMESTAMP(3);
