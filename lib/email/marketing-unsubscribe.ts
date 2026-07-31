import { db } from "@/lib/db";

export const EMAIL_MARKETING_HMAC_SECRET_ENV =
  "EMAIL_MARKETING_HMAC_SECRET" as const;

const MIN_SECRET_BYTES = 32;
const EMAIL_HASH_PATTERN = /^[a-f0-9]{64}$/;
const SOURCE_PATTERN = /^[a-z0-9][a-z0-9_.:-]{0,63}$/;

interface MarketingUnsubscribeTransaction {
  emailSuppression: {
    upsert(args: {
      where: {
        normalizedEmailHash_reason: {
          normalizedEmailHash: string;
          reason: "UNSUBSCRIBED";
        };
      };
      create: {
        normalizedEmailHash: string;
        reason: "UNSUBSCRIBED";
        source: string;
        suppressedAt: Date;
      };
      update: {
        source: string;
        suppressedAt: Date;
        releasedAt: null;
      };
    }): Promise<unknown>;
  };
  emailMarketingCampaignRecipient: {
    findMany(args: {
      where: { normalizedEmailHash: string };
      select: { userId: true };
      distinct: ["userId"];
    }): Promise<Array<{ userId: string }>>;
  };
  emailMarketingPreference: {
    upsert(args: {
      where: { userId: string };
      create: {
        userId: string;
        status: "OPTED_OUT";
        optedOutAt: Date;
      };
      update: {
        status: "OPTED_OUT";
        optedOutAt: Date;
      };
    }): Promise<unknown>;
  };
}

export interface MarketingUnsubscribeDatabase {
  $transaction<T>(
    callback: (transaction: MarketingUnsubscribeTransaction) => Promise<T>,
  ): Promise<T>;
}

export interface ApplyMarketingUnsubscribeInput {
  emailHash: string;
  source: "email_unsubscribe_form" | "rfc8058_one_click";
  now?: Date;
}

export interface ApplyMarketingUnsubscribeResult {
  preferenceCount: number;
}

/**
 * Resolve the shared campaign/unsubscribe secret without falling back to a
 * database URL or another purpose's key. Missing and weak secrets fail closed.
 */
export function getEmailMarketingHmacSecret(
  environment: Record<string, string | undefined> = process.env,
): string | null {
  const secret = environment[EMAIL_MARKETING_HMAC_SECRET_ENV]?.trim();

  if (
    !secret ||
    Buffer.byteLength(secret, "utf8") < MIN_SECRET_BYTES
  ) {
    return null;
  }

  return secret;
}

function assertApplyInput(input: ApplyMarketingUnsubscribeInput): Date {
  if (!EMAIL_HASH_PATTERN.test(input.emailHash)) {
    throw new TypeError("emailHash must be a lowercase SHA-256 digest.");
  }

  if (!SOURCE_PATTERN.test(input.source)) {
    throw new TypeError("source is invalid.");
  }

  const now = input.now ?? new Date();
  if (!Number.isFinite(now.getTime())) {
    throw new TypeError("now must be a valid Date.");
  }

  return now;
}

/**
 * Activate an address-level unsubscribe and opt out every known account that
 * was previously resolved to the same campaign-recipient digest.
 *
 * The digest is the only address identity accepted here. Raw email addresses
 * never reach this persistence path.
 */
export async function applyMarketingUnsubscribe(
  input: ApplyMarketingUnsubscribeInput,
  database: MarketingUnsubscribeDatabase =
    db as unknown as MarketingUnsubscribeDatabase,
): Promise<ApplyMarketingUnsubscribeResult> {
  const now = assertApplyInput(input);

  return database.$transaction(async (transaction) => {
    await transaction.emailSuppression.upsert({
      where: {
        normalizedEmailHash_reason: {
          normalizedEmailHash: input.emailHash,
          reason: "UNSUBSCRIBED",
        },
      },
      create: {
        normalizedEmailHash: input.emailHash,
        reason: "UNSUBSCRIBED",
        source: input.source,
        suppressedAt: now,
      },
      update: {
        source: input.source,
        suppressedAt: now,
        releasedAt: null,
      },
    });

    const matchingRecipients =
      await transaction.emailMarketingCampaignRecipient.findMany({
        where: { normalizedEmailHash: input.emailHash },
        select: { userId: true },
        distinct: ["userId"],
      });
    const userIds = [
      ...new Set(
        matchingRecipients
          .map(({ userId }) => userId)
          .filter((userId) => userId.length > 0),
      ),
    ];

    for (const userId of userIds) {
      await transaction.emailMarketingPreference.upsert({
        where: { userId },
        create: {
          userId,
          status: "OPTED_OUT",
          optedOutAt: now,
        },
        update: {
          status: "OPTED_OUT",
          optedOutAt: now,
        },
      });
    }

    return { preferenceCount: userIds.length };
  });
}
