import { createHash } from "node:crypto";

import { db } from "@/lib/db";
import {
  LEGACY_SELLER_ACCOUNT_REMINDER_CAMPAIGN_KEY,
} from "@/lib/db/account-reminder-campaign";
import {
  createMarketingEmailHash,
  normalizeCampaignRecipientEmail,
} from "@/lib/db/marketing-email-campaigns";
import {
  createMarketingUnsubscribeToken,
} from "@/lib/email/marketing-preferences";
import {
  sendEmailBatch,
  type BatchEmailMessage,
} from "@/lib/email/resend";
import {
  ACCOUNT_REMINDER_EMAIL_SUBJECT,
  accountReminderEmailHtml,
  accountReminderEmailPreheader,
  accountReminderEmailText,
} from "@/lib/email/templates/account-reminder";
import {
  SITE_URL,
  SUPPORT_EMAIL,
} from "@/lib/config/site";

export const ACCOUNT_REMINDER_CONFIRMATION =
  "SEND_ACCOUNT_REMINDER_ONCE" as const;
export const ACCOUNT_REMINDER_MAX_RECIPIENTS = 100;

const ACCOUNT_REMINDER_TEMPLATE_ID =
  "legacy-seller-account-reminder-template-v1";

type CampaignStatus =
  | "NOT_STARTED"
  | "DRAFT"
  | "APPROVED"
  | "RUNNING"
  | "PAUSED"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

type RecipientStatus =
  | "PENDING"
  | "PROCESSING"
  | "SENT"
  | "DELIVERED"
  | "SUPPRESSED"
  | "BOUNCED"
  | "COMPLAINED"
  | "FAILED"
  | "CANCELLED";

export interface AccountReminderCampaignState {
  campaignId: string | null;
  status: CampaignStatus;
  recipientCount: number;
  pendingCount: number;
  processingCount: number;
  acceptedCount: number;
  suppressedCount: number;
  failedCount: number;
  completedAt: string | null;
}

export interface AccountReminderDeliveryResult {
  campaignId: string;
  acceptedCount: number;
  skippedCount: number;
  status: "COMPLETED";
}

interface ClaimedRecipient {
  recipientId: string;
  email: string;
  sellerName: string;
  shopName: string;
  shopSlug: string;
}

interface ClaimedBatch {
  campaignId: string;
  claimedAt: Date;
  recipients: ClaimedRecipient[];
  skippedCount: number;
}

function baseSiteUrl(): string {
  return SITE_URL.replace(/\/+$/, "");
}

function sampleTemplateParts(): string[] {
  const sample = {
    sellerName: "Preview seller",
    shopName: "Preview shop",
    continueShopUrl:
      "https://tradefeed.co.za/dashboard/preview-shop",
    stopRemindersUrl:
      "https://tradefeed.co.za/email/unsubscribe?token=preview-token",
    senderName: "TradeFeed",
    supportEmail: SUPPORT_EMAIL,
  };

  return [
    ACCOUNT_REMINDER_TEMPLATE_ID,
    ACCOUNT_REMINDER_EMAIL_SUBJECT,
    accountReminderEmailPreheader(),
    accountReminderEmailHtml(sample),
    accountReminderEmailText(sample),
  ];
}

/**
 * Bind a prepared campaign to the exact fixed template shipped by this build.
 */
export function accountReminderTemplateHash(): string {
  return createHash("sha256")
    .update(sampleTemplateParts().join("\0"), "utf8")
    .digest("hex");
}

export function buildAccountReminderPreviewEmail(): {
  subject: string;
  preheader: string;
  html: string;
  text: string;
} {
  const data = {
    sellerName: "Preview seller",
    shopName: "Preview shop",
    continueShopUrl: `${baseSiteUrl()}/dashboard/preview-shop`,
    stopRemindersUrl:
      `${baseSiteUrl()}/email/unsubscribe?token=preview-not-a-live-token`,
    senderName: "TradeFeed",
    supportEmail: SUPPORT_EMAIL,
  };

  return {
    subject: ACCOUNT_REMINDER_EMAIL_SUBJECT,
    preheader: accountReminderEmailPreheader(),
    html: accountReminderEmailHtml(data),
    text: accountReminderEmailText(data),
  };
}

export async function getAccountReminderCampaignState(): Promise<AccountReminderCampaignState> {
  const campaign = await db.emailMarketingCampaign.findUnique({
    where: {
      campaignKey:
        LEGACY_SELLER_ACCOUNT_REMINDER_CAMPAIGN_KEY,
    },
    select: {
      id: true,
      status: true,
      recipientCount: true,
      completedAt: true,
    },
  });

  if (!campaign) {
    return {
      campaignId: null,
      status: "NOT_STARTED",
      recipientCount: 0,
      pendingCount: 0,
      processingCount: 0,
      acceptedCount: 0,
      suppressedCount: 0,
      failedCount: 0,
      completedAt: null,
    };
  }

  const rows =
    await db.emailMarketingCampaignRecipient.groupBy({
      by: ["status"],
      where: { campaignId: campaign.id },
      _count: { _all: true },
    });
  const counts = new Map<RecipientStatus, number>(
    rows.map((row) => [
      row.status as RecipientStatus,
      row._count._all,
    ]),
  );

  return {
    campaignId: campaign.id,
    status: campaign.status,
    recipientCount: campaign.recipientCount,
    pendingCount: counts.get("PENDING") ?? 0,
    processingCount: counts.get("PROCESSING") ?? 0,
    acceptedCount:
      (counts.get("SENT") ?? 0) +
      (counts.get("DELIVERED") ?? 0),
    suppressedCount:
      (counts.get("SUPPRESSED") ?? 0) +
      (counts.get("CANCELLED") ?? 0),
    failedCount:
      (counts.get("FAILED") ?? 0) +
      (counts.get("BOUNCED") ?? 0) +
      (counts.get("COMPLAINED") ?? 0),
    completedAt: campaign.completedAt?.toISOString() ?? null,
  };
}

function assertDeliveryInput(input: {
  adminId: string;
  expectedCount: number;
  hmacSecret: string;
}): {
  adminId: string;
  expectedCount: number;
  hmacSecret: string;
} {
  const adminId = input.adminId.trim();
  const hmacSecret = input.hmacSecret.trim();

  if (!adminId) {
    throw new TypeError("adminId is required.");
  }
  if (
    !Number.isSafeInteger(input.expectedCount) ||
    input.expectedCount < 1 ||
    input.expectedCount > ACCOUNT_REMINDER_MAX_RECIPIENTS
  ) {
    throw new RangeError(
      `expectedCount must be between 1 and ${ACCOUNT_REMINDER_MAX_RECIPIENTS}.`,
    );
  }
  if (Buffer.byteLength(hmacSecret, "utf8") < 32) {
    throw new RangeError(
      "EMAIL_MARKETING_HMAC_SECRET must contain at least 32 bytes.",
    );
  }

  return {
    adminId,
    expectedCount: input.expectedCount,
    hmacSecret,
  };
}

async function claimAccountReminderBatch(input: {
  adminId: string;
  expectedCount: number;
  hmacSecret: string;
  now: Date;
}): Promise<ClaimedBatch> {
  return db.$transaction(
    async (transaction) => {
      const campaign =
        await transaction.emailMarketingCampaign.findUnique({
          where: {
            campaignKey:
              LEGACY_SELLER_ACCOUNT_REMINDER_CAMPAIGN_KEY,
          },
          select: {
            id: true,
            status: true,
            subject: true,
            templateHash: true,
          },
        });

      if (!campaign) {
        throw new Error(
          "The one-time account reminder has not been prepared.",
        );
      }
      if (campaign.status !== "DRAFT") {
        throw new Error(
          `The one-time account reminder is already ${campaign.status.toLowerCase()}.`,
        );
      }
      if (
        campaign.subject !== ACCOUNT_REMINDER_EMAIL_SUBJECT ||
        campaign.templateHash !== accountReminderTemplateHash()
      ) {
        throw new Error(
          "The prepared account reminder no longer matches the approved template.",
        );
      }

      const recipients =
        await transaction.emailMarketingCampaignRecipient.findMany({
          where: {
            campaignId: campaign.id,
            status: "PENDING",
          },
          orderBy: [{ createdAt: "asc" }, { id: "asc" }],
          select: {
            id: true,
            userId: true,
            shopId: true,
            normalizedEmailHash: true,
            user: {
              select: {
                email: true,
                firstName: true,
                isBanned: true,
                emailMarketingPreference: {
                  select: { status: true },
                },
              },
            },
          },
        });

      if (recipients.length !== input.expectedCount) {
        throw new Error(
          `The ready audience changed from ${input.expectedCount} to ${recipients.length}. Refresh and review it again.`,
        );
      }
      if (
        recipients.length < 1 ||
        recipients.length > ACCOUNT_REMINDER_MAX_RECIPIENTS
      ) {
        throw new Error(
          `The reminder batch must contain between 1 and ${ACCOUNT_REMINDER_MAX_RECIPIENTS} recipients.`,
        );
      }

      const shopIds = [
        ...new Set(
          recipients
            .map((recipient) => recipient.shopId)
            .filter((shopId): shopId is string => Boolean(shopId)),
        ),
      ];
      const shops = await transaction.shop.findMany({
        where: {
          id: { in: shopIds },
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          slug: true,
        },
      });
      const shopsById = new Map(
        shops.map((shop) => [shop.id, shop]),
      );
      const currentHashes = new Set<string>();
      const verified = recipients.map((recipient) => {
        const shop = recipient.shopId
          ? shopsById.get(recipient.shopId)
          : undefined;
        if (
          recipient.user.isBanned ||
          recipient.user.emailMarketingPreference?.status ===
            "OPTED_OUT" ||
          !shop
        ) {
          return {
            recipient,
            shop,
            normalizedEmail: null,
            currentHash: null,
            blockedReason: recipient.user.isBanned
              ? "user_banned"
              : recipient.user.emailMarketingPreference?.status ===
                  "OPTED_OUT"
                ? "user_opted_out"
                : "shop_inactive_or_missing",
          };
        }

        try {
          const normalizedEmail =
            normalizeCampaignRecipientEmail(
              recipient.user.email,
            );
          const currentHash = createMarketingEmailHash(
            normalizedEmail,
            input.hmacSecret,
          );
          currentHashes.add(currentHash);
          return {
            recipient,
            shop,
            normalizedEmail,
            currentHash,
            blockedReason:
              currentHash ===
              recipient.normalizedEmailHash.trim()
                ? null
                : "account_email_changed",
          };
        } catch {
          return {
            recipient,
            shop,
            normalizedEmail: null,
            currentHash: null,
            blockedReason: "invalid_account_email",
          };
        }
      });

      const activeSuppressions =
        currentHashes.size === 0
          ? []
          : await transaction.emailSuppression.findMany({
              where: {
                normalizedEmailHash: {
                  in: [...currentHashes],
                },
                releasedAt: null,
              },
              select: { normalizedEmailHash: true },
            });
      const suppressedHashes = new Set(
        activeSuppressions.map((suppression) =>
          suppression.normalizedEmailHash.trim(),
        ),
      );

      const sendable: ClaimedRecipient[] = [];
      const blocked: Array<{
        id: string;
        status: "SUPPRESSED" | "CANCELLED";
        reason: string;
      }> = [];

      for (const candidate of verified) {
        if (candidate.blockedReason) {
          blocked.push({
            id: candidate.recipient.id,
            status: "CANCELLED",
            reason: candidate.blockedReason,
          });
          continue;
        }
        if (
          !candidate.currentHash ||
          suppressedHashes.has(candidate.currentHash)
        ) {
          blocked.push({
            id: candidate.recipient.id,
            status: "SUPPRESSED",
            reason: "active_email_suppression",
          });
          continue;
        }
        if (!candidate.normalizedEmail || !candidate.shop) {
          blocked.push({
            id: candidate.recipient.id,
            status: "CANCELLED",
            reason: "recipient_context_unavailable",
          });
          continue;
        }

        sendable.push({
          recipientId: candidate.recipient.id,
          email: candidate.normalizedEmail,
          sellerName:
            candidate.recipient.user.firstName?.trim() || "there",
          shopName: candidate.shop.name,
          shopSlug: candidate.shop.slug,
        });
      }

      const campaignClaim =
        await transaction.emailMarketingCampaign.updateMany({
          where: {
            id: campaign.id,
            status: "DRAFT",
          },
          data: {
            status: "RUNNING",
            approvedById: input.adminId,
            approvedAt: input.now,
            startedAt: input.now,
          },
        });
      if (campaignClaim.count !== 1) {
        throw new Error(
          "Another request already claimed this one-time campaign.",
        );
      }

      for (const item of blocked) {
        await transaction.emailMarketingCampaignRecipient.update({
          where: { id: item.id },
          data: {
            status: item.status,
            lastError: item.reason,
            ...(item.status === "SUPPRESSED"
              ? { suppressedAt: input.now }
              : {}),
          },
        });
      }

      if (sendable.length > 0) {
        const claimed =
          await transaction.emailMarketingCampaignRecipient.updateMany(
            {
              where: {
                id: {
                  in: sendable.map(
                    (recipient) => recipient.recipientId,
                  ),
                },
                status: "PENDING",
              },
              data: {
                status: "PROCESSING",
                attempts: { increment: 1 },
                lastAttemptAt: input.now,
                lastError: null,
              },
            },
          );
        if (claimed.count !== sendable.length) {
          throw new Error(
            "The one-time recipient claim was incomplete.",
          );
        }
      }

      return {
        campaignId: campaign.id,
        claimedAt: input.now,
        recipients: sendable,
        skippedCount: blocked.length,
      };
    },
    { isolationLevel: "Serializable" },
  );
}

function buildRecipientMessage(
  recipient: ClaimedRecipient,
  hmacSecret: string,
  issuedAt: Date,
): BatchEmailMessage {
  const unsubscribeToken = createMarketingUnsubscribeToken({
    email: recipient.email,
    secret: hmacSecret,
    issuedAt,
  });
  const unsubscribePageUrl =
    `${baseSiteUrl()}/email/unsubscribe?token=${encodeURIComponent(
      unsubscribeToken,
    )}`;
  const oneClickUnsubscribeUrl =
    `${baseSiteUrl()}/api/email/unsubscribe?token=${encodeURIComponent(
      unsubscribeToken,
    )}`;
  const data = {
    sellerName: recipient.sellerName,
    shopName: recipient.shopName,
    continueShopUrl:
      `${baseSiteUrl()}/dashboard/${encodeURIComponent(
        recipient.shopSlug,
      )}`,
    stopRemindersUrl: unsubscribePageUrl,
    senderName: "TradeFeed",
    supportEmail: SUPPORT_EMAIL,
  };

  return {
    to: recipient.email,
    subject: ACCOUNT_REMINDER_EMAIL_SUBJECT,
    html: accountReminderEmailHtml(data),
    text: accountReminderEmailText(data),
    replyTo: SUPPORT_EMAIL,
    headers: {
      "List-Unsubscribe": `<${oneClickUnsubscribeUrl}>`,
      "List-Unsubscribe-Post":
        "List-Unsubscribe=One-Click",
      "X-TradeFeed-Message-Type":
        "legacy-account-reminder-v1",
    },
    tags: [
      {
        name: "category",
        value: "account_reminder",
      },
      {
        name: "campaign",
        value: "legacy_v1",
      },
    ],
  };
}

async function markBatchFailed(batch: ClaimedBatch): Promise<void> {
  const failedAt = new Date();

  await db.$transaction(async (transaction) => {
    if (batch.recipients.length > 0) {
      await transaction.emailMarketingCampaignRecipient.updateMany({
        where: {
          id: {
            in: batch.recipients.map(
              (recipient) => recipient.recipientId,
            ),
          },
          status: "PROCESSING",
        },
        data: {
          status: "FAILED",
          failedAt,
          lastError:
            "provider_batch_outcome_unknown_no_retry",
          nextRetryAt: null,
        },
      });
    }

    await transaction.emailMarketingCampaign.update({
      where: { id: batch.campaignId },
      data: {
        status: "FAILED",
        failedAt,
        failedCount: batch.recipients.length,
        suppressedCount: batch.skippedCount,
      },
    });
  });
}

async function completeEmptyBatch(
  batch: ClaimedBatch,
): Promise<AccountReminderDeliveryResult> {
  const completedAt = new Date();
  await db.emailMarketingCampaign.update({
    where: { id: batch.campaignId },
    data: {
      status: "COMPLETED",
      completedAt,
      sentCount: 0,
      suppressedCount: batch.skippedCount,
      failedCount: 0,
    },
  });

  return {
    campaignId: batch.campaignId,
    acceptedCount: 0,
    skippedCount: batch.skippedCount,
    status: "COMPLETED",
  };
}

/**
 * Perform the single, non-retryable provider batch for the frozen campaign.
 *
 * A provider/DB ambiguity fails closed: the fixed campaign never returns to
 * DRAFT, so the same audience cannot be sent again by this workflow.
 */
export async function deliverLegacySellerAccountReminder(input: {
  adminId: string;
  expectedCount: number;
  hmacSecret: string;
}): Promise<AccountReminderDeliveryResult> {
  const validated = assertDeliveryInput(input);
  const batch = await claimAccountReminderBatch({
    ...validated,
    now: new Date(),
  });

  if (batch.recipients.length === 0) {
    return completeEmptyBatch(batch);
  }

  const messages = batch.recipients.map((recipient) =>
    buildRecipientMessage(
      recipient,
      validated.hmacSecret,
      batch.claimedAt,
    ),
  );
  const result = await sendEmailBatch(messages, {
    idempotencyKey:
      `tf-account-reminder-v1:${batch.campaignId}`,
  });

  if (
    !result.success ||
    result.fallback ||
    result.ids.length !== batch.recipients.length
  ) {
    await markBatchFailed(batch);
    throw new Error(
      "The email provider did not confirm the complete one-time batch. No automatic retry will occur.",
    );
  }

  const completedAt = new Date();
  try {
    const recipientUpdates = batch.recipients.map(
      (recipient, index) => {
        const providerMessageId = result.ids[index];
        if (!providerMessageId) {
          throw new Error("A provider message ID is missing.");
        }

        return db.emailMarketingCampaignRecipient.update({
          where: { id: recipient.recipientId },
          data: {
            status: "SENT",
            providerMessageId,
            sentAt: completedAt,
            lastError: null,
          },
        });
      },
    );
    await db.$transaction([
      ...recipientUpdates,
      db.emailMarketingCampaign.update({
        where: { id: batch.campaignId },
        data: {
          status: "COMPLETED",
          completedAt,
          sentCount: batch.recipients.length,
          suppressedCount: batch.skippedCount,
          failedCount: 0,
        },
      }),
    ]);
  } catch (error) {
    // The provider already accepted the batch. Never resend on a persistence
    // failure; leave RUNNING/PROCESSING rows for manual reconciliation.
    console.error(
      "[account-reminder] Provider accepted the batch but persistence reconciliation failed.",
    );
    throw new Error(
      "The provider accepted the batch, but TradeFeed could not finish recording every message. Do not send again.",
      { cause: error },
    );
  }

  return {
    campaignId: batch.campaignId,
    acceptedCount: batch.recipients.length,
    skippedCount: batch.skippedCount,
    status: "COMPLETED",
  };
}
