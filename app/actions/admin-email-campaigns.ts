"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/admin";
import { logAdminAction } from "@/lib/db/admin-audit";
import {
  getLegacySellerAccountReminderPreview,
  prepareLegacySellerAccountReminderCampaign,
} from "@/lib/db/account-reminder-campaign";
import {
  buildSafeMarketingEmailSample,
  getSellerMarketingAudiencePreview,
  normalizeCampaignRecipientEmail,
  resolveMarketingEmailSafetyLocks,
  type MarketingEmailSafetyLocks,
  type SafeMarketingEmailSample,
  type SellerMarketingAudiencePreview,
} from "@/lib/db/marketing-email-campaigns";
import {
  ACCOUNT_REMINDER_CONFIRMATION,
  ACCOUNT_REMINDER_MAX_RECIPIENTS,
  accountReminderTemplateHash,
  buildAccountReminderPreviewEmail,
  deliverLegacySellerAccountReminder,
  getAccountReminderCampaignState,
} from "@/lib/email/account-reminder-delivery";
import { sendEmail } from "@/lib/email/resend";
import { SUPPORT_EMAIL } from "@/lib/config/site";
import {
  ACCOUNT_REMINDER_EMAIL_SUBJECT,
} from "@/lib/email/templates/account-reminder";
import type { ReengagementSegment } from "@/lib/email/templates/reengagement";

interface MarketingPreviewInput {
  segment?: ReengagementSegment;
  customMessage?: string;
}

interface MarketingCampaignPreview {
  locks: MarketingEmailSafetyLocks;
  audience: SellerMarketingAudiencePreview;
  sample: SafeMarketingEmailSample;
}

export interface ReengagementCampaignPreview {
  providerReady: boolean;
  registryReady: boolean;
  sendingEnabled: boolean;
  canSend: boolean;
  potentialOwners: number;
  explicitOptIns: number;
  unknownConsent: number;
  readyToSend: number;
  optedOut: number;
  suppressed: number;
  invalidOrBanned: number;
  deduplicated: number;
  subject: string;
  preheader: string;
  sampleHtml: string;
  sampleText: string;
}

export interface AccountReminderCampaignPreview {
  providerReady: boolean;
  hmacReady: boolean;
  canSend: boolean;
  campaignStatus:
    | "NOT_STARTED"
    | "DRAFT"
    | "APPROVED"
    | "RUNNING"
    | "PAUSED"
    | "COMPLETED"
    | "FAILED"
    | "CANCELLED";
  potentialOwners: number;
  readyToSend: number;
  alreadyReservedOrSent: number;
  optedOut: number;
  suppressed: number;
  invalidOrBanned: number;
  sharedEmailAccounts: number;
  duplicateShopMemberships: number;
  campaignRecipientCount: number;
  providerAcceptedCount: number;
  finalSkippedCount: number;
  failedCount: number;
  maxRecipients: number;
  subject: string;
  preheader: string;
  sampleHtml: string;
  sampleText: string;
}

type AccountReminderActionResult =
  | {
      success: true;
      message: string;
      acceptedCount: number;
      skippedCount: number;
    }
  | {
      success: false;
      error: string;
    };

type MarketingPreviewActionResult =
  | {
      success: true;
      preview: MarketingCampaignPreview;
    }
  | {
      success: false;
      error: string;
      locks?: MarketingEmailSafetyLocks;
    };

type MarketingTestEmailActionResult =
  | {
      success: true;
      message: string;
      providerMessageId?: string;
      locks: MarketingEmailSafetyLocks;
    }
  | {
      success: false;
      error: string;
      locks?: MarketingEmailSafetyLocks;
    };

function currentMarketingEmailConfig() {
  return {
    EMAIL_MARKETING_HMAC_SECRET:
      process.env.EMAIL_MARKETING_HMAC_SECRET,
    EMAIL_MARKETING_PROVIDER_READY:
      process.env.EMAIL_MARKETING_PROVIDER_READY,
    EMAIL_MARKETING_NCC_CLEANSED_AT:
      process.env.EMAIL_MARKETING_NCC_CLEANSED_AT,
    EMAIL_MARKETING_SEND_ENABLED:
      process.env.EMAIL_MARKETING_SEND_ENABLED,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
  };
}

function parsePreviewInput(
  input: MarketingPreviewInput | undefined,
): MarketingPreviewInput {
  if (input === undefined) return {};
  if (
    typeof input !== "object" ||
    input === null ||
    Array.isArray(input)
  ) {
    throw new TypeError("Invalid campaign preview.");
  }

  const segment = input.segment;
  if (
    segment !== undefined &&
    segment !== "zero" &&
    segment !== "starter" &&
    segment !== "stale" &&
    segment !== "active"
  ) {
    throw new TypeError("Invalid campaign segment.");
  }
  if (
    input.customMessage !== undefined &&
    typeof input.customMessage !== "string"
  ) {
    throw new TypeError("Invalid custom message.");
  }

  return {
    segment,
    customMessage: input.customMessage,
  };
}

function internalTestIdempotencyKey(input: {
  adminId: string;
  sample: SafeMarketingEmailSample;
  now: Date;
}): string {
  const fiveMinuteBucket = Math.floor(
    input.now.getTime() / (5 * 60 * 1_000),
  );
  const fingerprint = createHash("sha256")
    .update(input.sample.subject, "utf8")
    .update("\0", "utf8")
    .update(input.sample.html, "utf8")
    .digest("hex")
    .slice(0, 24);

  return [
    "marketing-preview-test",
    input.adminId,
    fingerprint,
    String(fiveMinuteBucket),
  ].join("/");
}

/**
 * Admin-only preview. It performs a repeatable-read count, returns no
 * recipient records, and renders the sample with fixed non-PII identities.
 */
export async function previewSellerMarketingCampaignAction(
  input?: MarketingPreviewInput,
): Promise<MarketingPreviewActionResult> {
  let locks: MarketingEmailSafetyLocks | undefined;

  try {
    await requireAdmin();
    const parsed = parsePreviewInput(input);
    const now = new Date();
    const config = currentMarketingEmailConfig();
    locks = resolveMarketingEmailSafetyLocks(config, now);

    if (!locks.hmacReady) {
      return {
        success: false,
        error:
          "Campaign preview is locked until the marketing HMAC secret is configured.",
        locks,
      };
    }

    const hmacSecret =
      config.EMAIL_MARKETING_HMAC_SECRET?.trim();
    if (!hmacSecret) {
      return {
        success: false,
        error:
          "Campaign preview is locked until the marketing HMAC secret is configured.",
        locks,
      };
    }

    const [audience, sample] = await Promise.all([
      getSellerMarketingAudiencePreview({
        hmacSecret,
        now,
      }),
      Promise.resolve(buildSafeMarketingEmailSample(parsed)),
    ]);

    return {
      success: true,
      preview: {
        locks,
        audience,
        sample,
      },
    };
  } catch (error) {
    console.error(
      "[previewSellerMarketingCampaignAction] Failed:",
      error,
    );
    return {
      success: false,
      error: "Unable to prepare the marketing campaign preview.",
      locks,
    };
  }
}

/**
 * Send the fixed preview solely to the authenticated platform admin.
 *
 * There is intentionally no recipient parameter and no bulk-send action in
 * this module. NCC and customer-send locks remain visible but are not needed
 * for this internal test message.
 */
export async function sendSellerMarketingTestEmailAction(
  input?: MarketingPreviewInput,
): Promise<MarketingTestEmailActionResult> {
  let locks: MarketingEmailSafetyLocks | undefined;

  try {
    const admin = await requireAdmin();
    const parsed = parsePreviewInput(input);
    const now = new Date();
    const config = currentMarketingEmailConfig();
    locks = resolveMarketingEmailSafetyLocks(config, now);

    if (!locks.testSendAllowed) {
      return {
        success: false,
        error:
          "Test email is locked until the marketing HMAC and provider-readiness configuration are complete.",
        locks,
      };
    }

    // Fail closed if the authenticated admin record contains an invalid
    // address. The caller can never supply or override the recipient.
    const adminEmail = normalizeCampaignRecipientEmail(
      admin.email,
    );
    const sample = buildSafeMarketingEmailSample(parsed);
    const idempotencyKey = internalTestIdempotencyKey({
      adminId: admin.id,
      sample,
      now,
    });
    const result = await sendEmail({
      to: adminEmail,
      subject: `[TEST - NO CUSTOMER SEND] ${sample.subject}`,
      html: sample.html,
      text: sample.text,
      replyTo: SUPPORT_EMAIL,
      headers: {
        "X-TradeFeed-Message-Type":
          "internal-marketing-preview-test",
      },
      tags: [
        {
          name: "category",
          value: "marketing_preview_test",
        },
      ],
      idempotencyKey,
    });

    if (!result.success) {
      return {
        success: false,
        error: "The email provider rejected the admin test email.",
        locks,
      };
    }

    await logAdminAction({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "EMAIL_MARKETING_TEST_SENT",
      entityType: "email_marketing_preview",
      entityId: idempotencyKey,
      entityName: sample.segment,
      details: {
        providerMessageId:
          "id" in result ? result.id ?? null : null,
        customerSendAllowed: locks.customerSendAllowed,
      },
    });

    return {
      success: true,
      message:
        "The preview was sent only to your administrator email.",
      providerMessageId:
        "id" in result ? result.id : undefined,
      locks,
    };
  } catch (error) {
    console.error(
      "[sendSellerMarketingTestEmailAction] Failed:",
      error,
    );
    return {
      success: false,
      error: "Unable to send the administrator test email.",
      locks,
    };
  }
}

/**
 * Compatibility facade consumed by the activation console. It intentionally
 * flattens only aggregate counts and the fixed-identity sample.
 */
export async function getReengagementCampaignPreviewAction(): Promise<
  | {
      success: true;
      preview: ReengagementCampaignPreview;
    }
  | {
      success: false;
      error: string;
    }
> {
  const result =
    await previewSellerMarketingCampaignAction();
  if (!result.success) {
    return {
      success: false,
      error: result.error,
    };
  }

  const { locks, audience, sample } = result.preview;
  const { counts } = audience;

  return {
    success: true,
    preview: {
      providerReady: locks.providerReady,
      registryReady: locks.nccCleansingFresh,
      sendingEnabled: locks.customerSendEnabled,
      // No customer-delivery worker exists yet. Keep the UI locked even when
      // infrastructure flags are configured; approval and recipient
      // snapshotting must be implemented before this can become true.
      canSend: false,
      potentialOwners: counts.uniqueOwners,
      explicitOptIns: counts.explicitOptIns,
      unknownConsent: counts.excluded.consentUnknown,
      readyToSend: counts.eligible,
      optedOut: counts.excluded.optedOut,
      suppressed: counts.excluded.activeSuppression,
      invalidOrBanned:
        counts.excluded.invalidEmail +
        counts.excluded.banned,
      deduplicated:
        counts.duplicateShopMemberships +
        counts.excluded.duplicateEmail,
      subject: sample.subject,
      preheader: sample.preheader,
      sampleHtml: sample.html,
      sampleText: sample.text,
    },
  };
}

export async function sendReengagementTestAction(): Promise<
  MarketingTestEmailActionResult
> {
  return sendSellerMarketingTestEmailAction();
}

function accountReminderConfiguration(): {
  hmacSecret: string | null;
  hmacReady: boolean;
  providerReady: boolean;
} {
  const hmacSecret =
    process.env.EMAIL_MARKETING_HMAC_SECRET?.trim() ?? "";
  const hmacReady =
    Buffer.byteLength(hmacSecret, "utf8") >= 32;
  const providerReady =
    process.env.EMAIL_MARKETING_PROVIDER_READY === "true" &&
    Boolean(process.env.RESEND_API_KEY?.trim());

  return {
    hmacSecret: hmacReady ? hmacSecret : null,
    hmacReady,
    providerReady,
  };
}

function accountReminderTestIdempotencyKey(input: {
  adminId: string;
  subject: string;
  html: string;
  now: Date;
}): string {
  const fiveMinuteBucket = Math.floor(
    input.now.getTime() / (5 * 60 * 1_000),
  );
  const fingerprint = createHash("sha256")
    .update(input.subject, "utf8")
    .update("\0", "utf8")
    .update(input.html, "utf8")
    .digest("hex")
    .slice(0, 24);

  return [
    "account-reminder-preview-test",
    input.adminId,
    fingerprint,
    String(fiveMinuteBucket),
  ].join("/");
}

/**
 * Admin-only aggregate preview for the immutable once-only account reminder.
 * UNKNOWN consent remains eligible because this is factual account copy, not
 * product news. Explicit opt-outs and all suppression records still win.
 */
export async function getAccountReminderCampaignPreviewAction(): Promise<
  | {
      success: true;
      preview: AccountReminderCampaignPreview;
    }
  | {
      success: false;
      error: string;
    }
> {
  try {
    await requireAdmin();
    const configuration = accountReminderConfiguration();
    if (!configuration.hmacSecret) {
      return {
        success: false,
        error:
          "The account reminder is unavailable until its security secret is configured.",
      };
    }

    const [audience, campaignState] = await Promise.all([
      getLegacySellerAccountReminderPreview({
        hmacSecret: configuration.hmacSecret,
      }),
      getAccountReminderCampaignState(),
    ]);
    const sample = buildAccountReminderPreviewEmail();
    const { counts } = audience;
    const readyToSend =
      campaignState.status === "NOT_STARTED"
        ? counts.eligible
        : campaignState.status === "DRAFT"
          ? campaignState.pendingCount
          : 0;
    const campaignCanStart =
      campaignState.status === "NOT_STARTED" ||
      campaignState.status === "DRAFT";

    return {
      success: true,
      preview: {
        providerReady: configuration.providerReady,
        hmacReady: configuration.hmacReady,
        canSend:
          configuration.providerReady &&
          campaignCanStart &&
          readyToSend >= 1 &&
          readyToSend <= ACCOUNT_REMINDER_MAX_RECIPIENTS,
        campaignStatus: campaignState.status,
        potentialOwners: counts.uniqueOwners,
        readyToSend,
        alreadyReservedOrSent: Math.max(
          counts.excluded.priorReminder,
          campaignState.recipientCount,
        ),
        optedOut: counts.excluded.optedOut,
        suppressed: counts.excluded.activeSuppression,
        invalidOrBanned:
          counts.excluded.invalidEmail +
          counts.excluded.banned,
        sharedEmailAccounts: counts.excluded.duplicateEmail,
        duplicateShopMemberships:
          counts.duplicateShopMemberships,
        campaignRecipientCount:
          campaignState.recipientCount,
        providerAcceptedCount:
          campaignState.acceptedCount,
        finalSkippedCount:
          campaignState.suppressedCount,
        failedCount: campaignState.failedCount,
        maxRecipients: ACCOUNT_REMINDER_MAX_RECIPIENTS,
        subject: sample.subject,
        preheader: sample.preheader,
        sampleHtml: sample.html,
        sampleText: sample.text,
      },
    };
  } catch (error) {
    console.error(
      "[getAccountReminderCampaignPreviewAction] Failed:",
      error,
    );
    return {
      success: false,
      error:
        "Unable to prepare the one-time account reminder preview.",
    };
  }
}

/**
 * Send the factual preview only to the authenticated platform admin.
 */
export async function sendAccountReminderTestAction(): Promise<
  MarketingTestEmailActionResult
> {
  try {
    const admin = await requireAdmin();
    const configuration = accountReminderConfiguration();
    const locks = resolveMarketingEmailSafetyLocks(
      currentMarketingEmailConfig(),
      new Date(),
    );

    if (
      !configuration.hmacReady ||
      !configuration.providerReady
    ) {
      return {
        success: false,
        error:
          "The admin test is unavailable until the email provider and security secret are ready.",
        locks,
      };
    }

    const adminEmail = normalizeCampaignRecipientEmail(
      admin.email,
    );
    const sample = buildAccountReminderPreviewEmail();
    const now = new Date();
    const idempotencyKey =
      accountReminderTestIdempotencyKey({
        adminId: admin.id,
        subject: sample.subject,
        html: sample.html,
        now,
      });
    const result = await sendEmail({
      to: adminEmail,
      subject: `[TEST - NO CUSTOMER SEND] ${sample.subject}`,
      html: sample.html,
      text: sample.text,
      replyTo: SUPPORT_EMAIL,
      headers: {
        "X-TradeFeed-Message-Type":
          "internal-account-reminder-preview-test",
      },
      tags: [
        {
          name: "category",
          value: "account_reminder_test",
        },
      ],
      idempotencyKey,
    });

    if (!result.success) {
      return {
        success: false,
        error:
          "The email provider rejected the administrator test.",
        locks,
      };
    }

    await logAdminAction({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "ACCOUNT_REMINDER_TEST_SENT",
      entityType: "email_account_reminder_preview",
      entityId: idempotencyKey,
      entityName: "Legacy seller account reminder",
      details: {
        providerMessageId:
          "id" in result ? result.id ?? null : null,
        customerSend: false,
      },
    });

    return {
      success: true,
      message:
        "The account-reminder preview was sent only to your administrator email.",
      providerMessageId:
        "id" in result ? result.id : undefined,
      locks,
    };
  } catch (error) {
    console.error(
      "[sendAccountReminderTestAction] Failed:",
      error,
    );
    return {
      success: false,
      error:
        "Unable to send the administrator account-reminder test.",
    };
  }
}

/**
 * Prepare and submit exactly one personalized batch. The literal
 * confirmation and fresh expected count make stale or accidental clicks fail
 * before recipient reservation.
 */
export async function sendAccountReminderOnceAction(input: {
  confirmation: string;
  expectedCount: number;
}): Promise<AccountReminderActionResult> {
  let admin:
    | Awaited<ReturnType<typeof requireAdmin>>
    | undefined;

  try {
    admin = await requireAdmin();
    if (
      !input ||
      typeof input !== "object" ||
      input.confirmation !==
        ACCOUNT_REMINDER_CONFIRMATION ||
      !Number.isSafeInteger(input.expectedCount)
    ) {
      return {
        success: false,
        error:
          "Review the audience and confirm the one-time send first.",
      };
    }

    const configuration = accountReminderConfiguration();
    if (
      !configuration.hmacSecret ||
      !configuration.providerReady
    ) {
      return {
        success: false,
        error:
          "The email provider or account-reminder security configuration is not ready.",
      };
    }
    if (
      input.expectedCount < 1 ||
      input.expectedCount >
        ACCOUNT_REMINDER_MAX_RECIPIENTS
    ) {
      return {
        success: false,
        error:
          `The one-time batch must contain between 1 and ${ACCOUNT_REMINDER_MAX_RECIPIENTS} recipients.`,
      };
    }

    const [freshAudience, campaignState] =
      await Promise.all([
        getLegacySellerAccountReminderPreview({
          hmacSecret: configuration.hmacSecret,
        }),
        getAccountReminderCampaignState(),
      ]);
    const freshReadyCount =
      campaignState.status === "NOT_STARTED"
        ? freshAudience.counts.eligible
        : campaignState.status === "DRAFT"
          ? campaignState.pendingCount
          : 0;

    if (
      campaignState.status !== "NOT_STARTED" &&
      campaignState.status !== "DRAFT"
    ) {
      return {
        success: false,
        error:
          `This one-time campaign is already ${campaignState.status.toLowerCase()} and cannot run again.`,
      };
    }
    if (freshReadyCount !== input.expectedCount) {
      return {
        success: false,
        error:
          `The ready audience changed from ${input.expectedCount} to ${freshReadyCount}. Refresh and review it again.`,
      };
    }

    const prepared =
      await prepareLegacySellerAccountReminderCampaign({
        createdById: admin.id,
        subject: ACCOUNT_REMINDER_EMAIL_SUBJECT,
        templateHash: accountReminderTemplateHash(),
        hmacSecret: configuration.hmacSecret,
      });
    if (
      prepared.status !== "DRAFT" ||
      prepared.recipientCount !== input.expectedCount
    ) {
      return {
        success: false,
        error:
          `The frozen audience contains ${prepared.recipientCount} accounts, not ${input.expectedCount}. Refresh and confirm the new count.`,
      };
    }

    await logAdminAction({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "ACCOUNT_REMINDER_ONCE_APPROVED",
      entityType: "email_marketing_campaign",
      entityId: prepared.campaignId,
      entityName: "Legacy seller account reminder",
      details: {
        expectedCount: input.expectedCount,
        templateHash: accountReminderTemplateHash(),
        onceOnly: true,
      },
    });

    const delivery =
      await deliverLegacySellerAccountReminder({
        adminId: admin.id,
        expectedCount: input.expectedCount,
        hmacSecret: configuration.hmacSecret,
      });

    await logAdminAction({
      adminId: admin.id,
      adminEmail: admin.email,
      action:
        "ACCOUNT_REMINDER_PROVIDER_BATCH_ACCEPTED",
      entityType: "email_marketing_campaign",
      entityId: delivery.campaignId,
      entityName: "Legacy seller account reminder",
      details: {
        acceptedCount: delivery.acceptedCount,
        skippedCount: delivery.skippedCount,
        providerAcceptedNotDelivered: true,
      },
    });

    revalidatePath("/admin/activation");
    return {
      success: true,
      message:
        `The provider accepted ${delivery.acceptedCount} one-time account reminder${delivery.acceptedCount === 1 ? "" : "s"}.` +
        (delivery.skippedCount > 0
          ? ` ${delivery.skippedCount} changed or suppressed account${delivery.skippedCount === 1 ? " was" : "s were"} skipped.`
          : ""),
      acceptedCount: delivery.acceptedCount,
      skippedCount: delivery.skippedCount,
    };
  } catch (error) {
    console.error(
      "[sendAccountReminderOnceAction] Failed:",
      error,
    );

    if (admin) {
      try {
        const campaignState =
          await getAccountReminderCampaignState();
        await logAdminAction({
          adminId: admin.id,
          adminEmail: admin.email,
          action: "ACCOUNT_REMINDER_SEND_FAILED",
          entityType: "email_marketing_campaign",
          entityId:
            campaignState.campaignId ??
            "legacy-seller-account-reminder-v1",
          entityName: "Legacy seller account reminder",
          details: {
            status: campaignState.status,
            expectedCount:
              typeof input?.expectedCount === "number"
                ? input.expectedCount
                : null,
          },
        });
      } catch (auditError) {
        console.error(
          "[sendAccountReminderOnceAction] Failure audit could not be written:",
          auditError,
        );
      }
    }

    return {
      success: false,
      error:
        error instanceof Error &&
        !error.message.includes("@")
          ? error.message
          : "The one-time account reminder could not be completed.",
    };
  }
}
