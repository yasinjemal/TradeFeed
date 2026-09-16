CREATE TABLE "SupportCase" ("id" TEXT NOT NULL, "orderId" TEXT NOT NULL, "category" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'OPEN', "buyerClerkId" TEXT, "guestTokenHash" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "SupportCase_pkey" PRIMARY KEY ("id"));
CREATE TABLE "SupportCaseMessage" ("id" TEXT NOT NULL, "caseId" TEXT NOT NULL, "actor" TEXT NOT NULL, "actorId" TEXT, "body" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "SupportCaseMessage_pkey" PRIMARY KEY ("id"));
CREATE INDEX "SupportCase_status_updatedAt_idx" ON "SupportCase"("status", "updatedAt");
CREATE INDEX "SupportCase_orderId_idx" ON "SupportCase"("orderId");
CREATE INDEX "SupportCaseMessage_caseId_createdAt_idx" ON "SupportCaseMessage"("caseId", "createdAt");
ALTER TABLE "SupportCase" ADD CONSTRAINT "SupportCase_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SupportCaseMessage" ADD CONSTRAINT "SupportCaseMessage_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "SupportCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
