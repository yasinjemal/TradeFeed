-- AlterTable
ALTER TABLE "Shop" ADD COLUMN     "aboutText" TEXT,
ADD COLUMN     "address" TEXT,
ADD COLUMN     "bannerUrl" TEXT,
ADD COLUMN     "businessHours" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "facebook" TEXT,
ADD COLUMN     "instagram" TEXT,
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "province" TEXT,
ADD COLUMN     "tiktok" TEXT,
ADD COLUMN     "website" TEXT;
