import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { normalizeCampaignRecipientEmail, resolveMarketingEmailSafetyLocks } from "@/lib/db/marketing-email-campaigns";
import { createMarketingEmailHash, createMarketingUnsubscribeToken } from "@/lib/email/marketing-preferences";
import { sellerMilestoneTargetsShop } from "@/lib/analytics/seller-lifecycle";
import { ASSISTANCE_VERSION, ASSISTANCE_WEEK_MS, chooseSellerAssistance, assistanceFingerprint, assistanceOutcome, type AssistanceSnapshot } from "@/lib/email/seller-assistance-policy";
import { sellerAssistanceEmail } from "@/lib/email/templates/seller-assistance";
import { sendEmail } from "@/lib/email/resend";
import { SITE_URL, SUPPORT_EMAIL } from "@/lib/config/site";
import { ASSISTANCE_CONSENT_VERSION } from "@/lib/email/assistance-consent";

type Database = Prisma.TransactionClient;
const campaignPrefix = `${ASSISTANCE_VERSION}:`;

export function assistanceDeliveryLocks() {
  const locks = resolveMarketingEmailSafetyLocks({
    EMAIL_MARKETING_HMAC_SECRET: process.env.EMAIL_MARKETING_HMAC_SECRET,
    EMAIL_MARKETING_PROVIDER_READY: process.env.EMAIL_MARKETING_PROVIDER_READY,
    EMAIL_MARKETING_NCC_CLEANSED_AT: process.env.EMAIL_MARKETING_NCC_CLEANSED_AT,
    EMAIL_MARKETING_SEND_ENABLED: process.env.EMAIL_MARKETING_SEND_ENABLED,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
  }, new Date());
  const blockers: string[] = [...locks.blockers];
  if (process.env.SELLER_ASSISTANCE_SEND_ENABLED !== "true") blockers.push("assistance_send_disabled");
  if (!process.env.RESEND_WEBHOOK_SECRET) blockers.push("resend_webhook_secret_missing");
  return { previewAllowed: locks.hmacReady, sendAllowed: blockers.length === 0, blockers };
}

function reviewHash(snapshot: AssistanceSnapshot, emailHash: string) {
  const sample = sellerAssistanceEmail(snapshot, `${SITE_URL}/email/unsubscribe?token=preview`);
  return createHash("sha256").update(JSON.stringify({ snapshot, sample, emailHash })).digest("hex");
}

async function ownerState(userId: string, shopId: string, database: Database = db) {
  const member = await database.shopUser.findFirst({
    where: { userId, shopId, role: "OWNER" },
    include: {
      user: { include: { emailMarketingPreference: true } },
      shop: { include: { products: { include: { images: { select: { url: true } }, variants: { select: { isActive: true, priceInCents: true, stock: true } } } } } },
    },
  });
  if (!member) return null;
  const events = await database.onboardingEvent.findMany({ where: { userId, step: "catalog_shared" }, select: { metadata: true } });
  const shared = events.some((event) => sellerMilestoneTargetsShop(event.metadata, member.shop.slug, member.shop.id));
  return { member, shared };
}

/** All eligibility is recomputed here, in preview, approval and immediately before delivery. */
async function candidate(userId: string, shopId: string, now: Date, database: Database = db, ignoreRecipientId?: string) {
  const state = await ownerState(userId, shopId, database);
  if (!state || state.member.user.isBanned || state.member.user.emailMarketingPreference?.status !== "OPTED_IN") return null;
  if (state.member.user.emailMarketingPreference.consentVersion !== ASSISTANCE_CONSENT_VERSION) return null;
  const { member, shared } = state;
  const decision = chooseSellerAssistance(member.shop, shared, now);
  if (!decision) return null;
  let email: string;
  try { email = normalizeCampaignRecipientEmail(member.user.email); } catch { return null; }
  const emailHash = createMarketingEmailHash(email, process.env.EMAIL_MARKETING_HMAC_SECRET!);
  const snapshot: AssistanceSnapshot = { version: ASSISTANCE_VERSION, shopId, shopSlug: member.shop.slug, shopName: member.shop.name, decision };
  const key = `${campaignPrefix}${emailHash}:${assistanceFingerprint(snapshot)}`;
  const [suppression, otherAccounts, recent, previous] = await Promise.all([
    database.emailSuppression.findFirst({ where: { normalizedEmailHash: emailHash, releasedAt: null }, select: { id: true } }),
    database.user.count({ where: { id: { not: userId }, email: { equals: email, mode: "insensitive" } } }),
    database.emailMarketingCampaignRecipient.findFirst({
      where: {
        ...(ignoreRecipientId ? { id: { not: ignoreRecipientId } } : {}),
        OR: [{ normalizedEmailHash: emailHash }, { userId }],
        AND: [{ OR: [
          { sentAt: { gt: new Date(now.getTime() - ASSISTANCE_WEEK_MS) } },
          { lastAttemptAt: { gt: new Date(now.getTime() - ASSISTANCE_WEEK_MS) } },
          { status: "PROCESSING" },
          { status: "PENDING", campaign: { status: { in: ["APPROVED", "RUNNING"] } } },
        ] }],
      }, select: { id: true },
    }),
    database.emailMarketingCampaignRecipient.findFirst({ where: { campaign: { campaignKey: key }, ...(ignoreRecipientId ? { id: { not: ignoreRecipientId } } : {}) }, select: { id: true } }),
  ]);
  if (suppression || otherAccounts > 0 || recent || previous) return null;
  return { userId, shopId, email, emailHash, snapshot, key, fingerprint: reviewHash(snapshot, emailHash) };
}

export async function getSellerAssistanceReview() {
  const locks = assistanceDeliveryLocks();
  const history = await db.emailMarketingCampaignRecipient.findMany({
    where: { campaign: { campaignKey: { startsWith: campaignPrefix } } },
    orderBy: { createdAt: "desc" }, take: 50, include: { campaign: true },
  });
  const historyRows = await Promise.all(history.map(async (row) => {
    const snapshot = row.campaign.audienceDefinition as unknown as AssistanceSnapshot;
    const state = row.shopId && row.sentAt ? await ownerState(row.userId, row.shopId) : null;
    return { id: row.id, campaignId: row.campaignId, shopName: snapshot.shopName, kind: snapshot.decision.kind, status: row.status, sentAt: row.sentAt?.toISOString() ?? null, deliveredAt: row.deliveredAt?.toISOString() ?? null, resolved: Boolean(state && assistanceOutcome(snapshot, state.member.shop, state.shared)) };
  }));
  const suggestions = [];
  let examined = 0;
  if (locks.previewAllowed) {
    const members = await db.shopUser.findMany({
      where: { role: "OWNER", shop: { isActive: true }, user: { isBanned: false, emailMarketingPreference: { status: "OPTED_IN", consentVersion: ASSISTANCE_CONSENT_VERSION } } },
      orderBy: { shop: { createdAt: "desc" } }, take: 500, select: { userId: true, shopId: true },
    });
    const emails = new Set<string>();
    for (let offset = 0; offset < members.length && suggestions.length < 20; offset += 10) {
      const batch = members.slice(offset, offset + 10);
      examined += batch.length;
      const results = await Promise.all(batch.map((member) => candidate(member.userId, member.shopId, new Date())));
      for (const item of results) {
        if (!item || emails.has(item.emailHash) || suggestions.length === 20) continue;
        emails.add(item.emailHash);
        const sample = sellerAssistanceEmail(item.snapshot, `${SITE_URL}/email/unsubscribe?token=preview`);
        suggestions.push({ userId: item.userId, shopId: item.shopId, shopName: item.snapshot.shopName, email: item.email, fingerprint: item.fingerprint, decision: item.snapshot.decision, subject: sample.subject, text: sample.text });
      }
    }
  }
  return { locks, suggestions, history: historyRows, examined };
}

export async function approveSellerAssistance(adminId: string, userId: string, shopId: string, fingerprint: string) {
  if (!assistanceDeliveryLocks().previewAllowed) throw new Error("Configure the marketing HMAC secret before approving email.");
  const initial = await candidate(userId, shopId, new Date());
  if (!initial || initial.fingerprint !== fingerprint) throw new Error("The situation or message changed. Refresh and review it again.");
  return db.$transaction(async (tx) => {
    // Serialize assistance reservations across shops/accounts sharing an address.
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${initial.emailHash}))::text AS locked`;
    const current = await candidate(userId, shopId, new Date(), tx);
    if (!current || current.emailHash !== initial.emailHash || current.fingerprint !== fingerprint) throw new Error("This email is no longer eligible. Refresh the queue.");
    return tx.emailMarketingCampaign.create({
      data: {
        campaignKey: current.key, kind: "SELLER_REENGAGEMENT", status: "APPROVED",
        name: `${ASSISTANCE_VERSION}: ${current.snapshot.decision.kind}`,
        subject: sellerAssistanceEmail(current.snapshot, "preview").subject,
        templateHash: current.fingerprint, audienceDefinition: current.snapshot as unknown as Prisma.InputJsonValue,
        createdById: adminId, approvedById: adminId, approvedAt: new Date(), eligibleCount: 1, recipientCount: 1,
        recipients: { create: { userId, shopId, normalizedEmailHash: current.emailHash, idempotencyKey: current.key } },
      }, select: { id: true },
    });
  });
}

export async function cancelSellerAssistance(campaignId: string) {
  return db.$transaction(async (tx) => {
    const cancelled = await tx.emailMarketingCampaignRecipient.updateMany({
      where: { campaignId, status: "PENDING", campaign: { campaignKey: { startsWith: campaignPrefix } } },
      data: { status: "CANCELLED", lastError: "Cancelled by admin before delivery." },
    });
    if (cancelled.count) await tx.emailMarketingCampaign.update({ where: { id: campaignId }, data: { status: "CANCELLED", cancelledAt: new Date() } });
    return cancelled.count;
  });
}

async function suppressStale(id: string, campaignId: string) {
  await db.$transaction([
    db.emailMarketingCampaignRecipient.updateMany({ where: { id, status: { in: ["PENDING", "PROCESSING"] } }, data: { status: "SUPPRESSED", suppressedAt: new Date(), lastError: "Eligibility, reviewed content or seller situation changed." } }),
    db.emailMarketingCampaign.update({ where: { id: campaignId }, data: { status: "COMPLETED", completedAt: new Date(), suppressedCount: 1 } }),
  ]);
}

/** Sends only individually approved messages. PROCESSING/FAILED are never retried
 * automatically: an interrupted provider call has an unknown outcome. */
export async function deliverApprovedSellerAssistance(send: typeof sendEmail = sendEmail) {
  const locks = assistanceDeliveryLocks();
  if (!locks.sendAllowed) return { sent: 0, skipped: 0, failed: 0, blockers: locks.blockers };
  const rows = await db.emailMarketingCampaignRecipient.findMany({ where: { status: "PENDING", campaign: { campaignKey: { startsWith: campaignPrefix }, status: "APPROVED", approvedAt: { not: null }, approvedById: { not: null } } }, include: { campaign: true }, orderBy: { createdAt: "asc" }, take: 10 });
  let sent = 0, skipped = 0, failed = 0;
  for (const row of rows) {
    if (!assistanceDeliveryLocks().sendAllowed) break;
    const claimed = await db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${row.normalizedEmailHash}))::text AS locked`;
      return tx.emailMarketingCampaignRecipient.updateMany({ where: { id: row.id, status: "PENDING", campaign: { status: "APPROVED" } }, data: { status: "PROCESSING", attempts: { increment: 1 }, lastAttemptAt: new Date() } });
    });
    if (!claimed.count) continue;
    try {
      const current = row.shopId ? await candidate(row.userId, row.shopId, new Date(), db, row.id) : null;
      if (!current || current.emailHash !== row.normalizedEmailHash || current.fingerprint !== row.campaign.templateHash) {
        await suppressStale(row.id, row.campaignId); skipped++; continue;
      }
      // Re-read consent and suppressions as part of candidate() above. Rendering is
      // deterministic and bound to the admin's reviewed template hash.
      const token = createMarketingUnsubscribeToken({ email: current.email, secret: process.env.EMAIL_MARKETING_HMAC_SECRET!, issuedAt: row.createdAt });
      const base = SITE_URL.replace(/\/$/, "");
      const message = sellerAssistanceEmail(current.snapshot, `${base}/email/unsubscribe?token=${encodeURIComponent(token)}`);
      const result = await send({ to: current.email, ...message, replyTo: SUPPORT_EMAIL, idempotencyKey: row.idempotencyKey,
        headers: { "List-Unsubscribe": `<${base}/api/email/unsubscribe?token=${encodeURIComponent(token)}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
        tags: [{ name: "category", value: "seller_assistance" }, { name: "recipient_id", value: row.id }],
      });
      if (!result.success || !("id" in result) || !result.id) throw new Error("Provider acceptance was not confirmed.");
      await db.$transaction([
        db.emailMarketingCampaignRecipient.updateMany({ where: { id: row.id, status: "PROCESSING" }, data: { status: "SENT", sentAt: new Date(), providerMessageId: result.id } }),
        db.emailMarketingCampaign.update({ where: { id: row.campaignId }, data: { status: "COMPLETED", completedAt: new Date(), sentCount: 1 } }),
      ]);
      sent++;
    } catch {
      // Keep uncertain attempts out of the retry queue, even after provider
      // idempotency keys expire. Never store raw provider errors/recipient data.
      await db.emailMarketingCampaignRecipient.updateMany({ where: { id: row.id, status: "PROCESSING" }, data: { status: "FAILED", failedAt: new Date(), lastError: "Delivery outcome needs provider reconciliation. Do not automatically retry." } });
      await db.emailMarketingCampaign.update({ where: { id: row.campaignId }, data: { status: "FAILED", failedAt: new Date(), failedCount: 1 } });
      failed++;
    }
  }
  return { sent, skipped, failed, blockers: [] as string[] };
}
