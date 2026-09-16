import type { EmailBouncedEvent, EmailComplainedEvent, EmailDeliveredEvent } from "resend";
import { db } from "@/lib/db";
import { createMarketingEmailHash } from "@/lib/email/marketing-preferences";

type DeliveryEvent = EmailBouncedEvent | EmailComplainedEvent | EmailDeliveredEvent;

/** Verified provider events only. Repeated and out-of-order events are safe. */
export async function applyAssistanceDeliveryEvent(event: DeliveryEvent) {
  const secret = process.env.EMAIL_MARKETING_HMAC_SECRET;
  if (!secret) throw new Error("Email hashing is unavailable.");
  const taggedId = event.data.tags?.recipient_id;
  const row = await db.emailMarketingCampaignRecipient.findFirst({
    where: { OR: [{ providerMessageId: event.data.email_id }, ...(taggedId ? [{ id: taggedId, attempts: { gt: 0 } }] : [])] },
  });
  if (!row) return;
  // Bind even a signed tag to the original recipient address. Never suppress
  // a different recipient because an unrelated email reused a tag.
  const matches = event.data.to.some((email) => {
    try { return createMarketingEmailHash(email, secret) === row.normalizedEmailHash; } catch { return false; }
  });
  if (!matches || (row.providerMessageId && row.providerMessageId !== event.data.email_id)) return;
  const delivered = event.type === "email.delivered";
  const complaint = event.type === "email.complained";
  const now = new Date();
  await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${row.normalizedEmailHash}))::text AS locked`;
    if (!delivered) {
      const reason = complaint ? "COMPLAINT" : "HARD_BOUNCE";
      await tx.emailSuppression.upsert({
        where: { normalizedEmailHash_reason: { normalizedEmailHash: row.normalizedEmailHash, reason } },
        create: { normalizedEmailHash: row.normalizedEmailHash, reason, source: "resend-webhook", suppressedAt: now },
        update: { source: "resend-webhook", suppressedAt: now, releasedAt: null },
      });
      await tx.emailMarketingCampaignRecipient.updateMany({ where: { normalizedEmailHash: row.normalizedEmailHash, status: "PENDING" }, data: { status: "SUPPRESSED", suppressedAt: now, lastError: "Provider bounce or complaint." } });
    }
    // Delivery may arrive before the send HTTP response. Supply provider ID and
    // acceptance timestamp here too, without letting a late delivery erase a bounce.
    await tx.emailMarketingCampaignRecipient.updateMany({
      where: { id: row.id, status: { notIn: delivered ? ["BOUNCED", "COMPLAINED", "SUPPRESSED", "CANCELLED"] : complaint ? ["CANCELLED"] : ["COMPLAINED", "CANCELLED"] } },
      data: {
        status: delivered ? "DELIVERED" : complaint ? "COMPLAINED" : "BOUNCED",
        providerMessageId: event.data.email_id, sentAt: row.sentAt ?? row.lastAttemptAt ?? now,
        ...(delivered ? { deliveredAt: now } : { suppressedAt: now }),
      },
    });
    const recipients = await tx.emailMarketingCampaignRecipient.findMany({ where: { campaignId: row.campaignId }, select: { status: true, sentAt: true } });
    await tx.emailMarketingCampaign.update({ where: { id: row.campaignId }, data: {
      sentCount: recipients.filter((r) => r.sentAt).length,
      deliveredCount: recipients.filter((r) => r.status === "DELIVERED").length,
    } });
  });
}
