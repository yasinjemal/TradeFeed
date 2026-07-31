"use server";

import { createHash } from "node:crypto";
import { requireAdmin } from "@/lib/auth/admin";
import { logAdminAction } from "@/lib/db/admin-audit";
import {
  buildSafeMarketingEmailSample,
  getSellerMarketingAudiencePreview,
  normalizeCampaignRecipientEmail,
  resolveMarketingEmailSafetyLocks,
  type MarketingEmailSafetyLocks,
  type SafeMarketingEmailSample,
  type SellerMarketingAudiencePreview,
} from "@/lib/db/marketing-email-campaigns";
import { sendEmail } from "@/lib/email/resend";
import { SUPPORT_EMAIL } from "@/lib/config/site";
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
