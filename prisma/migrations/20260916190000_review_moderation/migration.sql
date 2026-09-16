ALTER TABLE "Review" ALTER COLUMN "isApproved" SET DEFAULT false;
ALTER TABLE "Review" ADD COLUMN "reportedAt" TIMESTAMP(3), ADD COLUMN "moderatedAt" TIMESTAMP(3), ADD COLUMN "moderationReason" TEXT;
