-- CreateEnum
CREATE TYPE "WhatsAppImportStatus" AS ENUM ('PENDING', 'PROCESSED', 'FAILED');

-- CreateEnum
CREATE TYPE "ProductSource" AS ENUM ('WEB', 'WHATSAPP', 'CSV', 'API');

-- AlterTable — Product source tracking
ALTER TABLE "Product" ADD COLUMN "source" "ProductSource" NOT NULL DEFAULT 'WEB';
ALTER TABLE "Product" ADD COLUMN "aiGenerated" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable — Seller preferences
ALTER TABLE "SellerPreferences" ADD COLUMN "whatsappImportEnabled" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "WhatsAppProductImport" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "imageMediaId" TEXT NOT NULL,
    "captionText" TEXT,
    "status" "WhatsAppImportStatus" NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "productId" TEXT,
    "parsedPrice" INTEGER,
    "parsedSizes" TEXT[],
    "aiProductName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppProductImport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppProductImport_messageId_key" ON "WhatsAppProductImport"("messageId");

-- CreateIndex
CREATE INDEX "WhatsAppProductImport_shopId_createdAt_idx" ON "WhatsAppProductImport"("shopId", "createdAt");

-- CreateIndex
CREATE INDEX "WhatsAppProductImport_status_idx" ON "WhatsAppProductImport"("status");

-- AddForeignKey
ALTER TABLE "WhatsAppProductImport" ADD CONSTRAINT "WhatsAppProductImport_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
