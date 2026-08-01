import { createHash } from "node:crypto";

import { db } from "@/lib/db";
import {
  createMarketingEmailHash,
  normalizeCampaignRecipientEmail,
} from "@/lib/db/marketing-email-campaigns";

export const LEGACY_SELLER_ACCOUNT_REMINDER_CAMPAIGN_KEY =
  "legacy-seller-account-reminder-v1" as const;
export const LEGACY_SELLER_ACCOUNT_REMINDER_NAME =
  "Legacy seller account reminder" as const;

const CAMPAIGN_KIND = "OTHER" as const;
const CAMPAIGN_STATUS_DRAFT = "DRAFT" as const;
const RECIPIENT_STATUS_PENDING = "PENDING" as const;
const MIN_HMAC_SECRET_BYTES = 32;
const SHA_256_PATTERN = /^[a-f0-9]{64}$/;

type CampaignStatus =
  | "DRAFT"
  | "APPROVED"
  | "RUNNING"
  | "PAUSED"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export interface AccountReminderOwnerCandidate {
  userId: string;
  email: string;
  isBanned: boolean;
  marketingPreferenceStatus:
    | "UNKNOWN"
    | "OPTED_IN"
    | "OPTED_OUT"
    | null;
  shopId: string;
  shopCreatedAt: Date;
  shopUpdatedAt: Date;
}

export interface PriorAccountReminderRecipient {
  userId: string;
  normalizedEmailHash: string;
}

export interface AccountReminderAudienceCounts {
  ownerMemberships: number;
  uniqueOwners: number;
  duplicateShopMemberships: number;
  eligible: number;
  excluded: {
    banned: number;
    invalidEmail: number;
    duplicateEmail: number;
    optedOut: number;
    activeSuppression: number;
    priorReminder: number;
  };
}

export interface AccountReminderAudiencePreview {
  campaignKey: typeof LEGACY_SELLER_ACCOUNT_REMINDER_CAMPAIGN_KEY;
  generatedAt: string;
  counts: AccountReminderAudienceCounts;
}

interface PreparedAccountReminderRecipient {
  userId: string;
  shopId: string;
  normalizedEmailHash: string;
  idempotencyKey: string;
}

interface PreparedAccountReminderAudience {
  preview: AccountReminderAudiencePreview;
  recipients: PreparedAccountReminderRecipient[];
}

interface AccountReminderShopRecord {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  users: Array<{
    user: {
      id: string;
      email: string;
      isBanned: boolean;
      emailMarketingPreference: {
        status: "UNKNOWN" | "OPTED_IN" | "OPTED_OUT";
      } | null;
    };
  }>;
}

interface AccountReminderCampaignRecord {
  id: string;
  campaignKey: string;
  kind: string;
  status: CampaignStatus;
  subject: string;
  templateHash: string;
}

interface AccountReminderCampaignTransaction {
  shop: {
    findMany(args: Record<string, unknown>): Promise<AccountReminderShopRecord[]>;
  };
  emailSuppression: {
    findMany(
      args: Record<string, unknown>,
    ): Promise<Array<{ normalizedEmailHash: string }>>;
  };
  emailMarketingCampaignRecipient: {
    findMany(
      args: Record<string, unknown>,
    ): Promise<PriorAccountReminderRecipient[]>;
    createMany(args: {
      data: Array<{
        campaignId: string;
        userId: string;
        shopId: string;
        normalizedEmailHash: string;
        idempotencyKey: string;
        status: typeof RECIPIENT_STATUS_PENDING;
      }>;
      skipDuplicates: true;
    }): Promise<{ count: number }>;
    count(args: Record<string, unknown>): Promise<number>;
  };
  emailMarketingCampaign: {
    upsert(args: {
      where: {
        campaignKey: typeof LEGACY_SELLER_ACCOUNT_REMINDER_CAMPAIGN_KEY;
      };
      create: {
        campaignKey: typeof LEGACY_SELLER_ACCOUNT_REMINDER_CAMPAIGN_KEY;
        kind: typeof CAMPAIGN_KIND;
        status: typeof CAMPAIGN_STATUS_DRAFT;
        name: typeof LEGACY_SELLER_ACCOUNT_REMINDER_NAME;
        subject: string;
        templateHash: string;
        audienceDefinition: Record<string, unknown>;
        createdById: string;
        eligibleCount: number;
        recipientCount: number;
        suppressedCount: number;
      };
      update: Record<string, never>;
      select: {
        id: true;
        campaignKey: true;
        kind: true;
        status: true;
        subject: true;
        templateHash: true;
      };
    }): Promise<AccountReminderCampaignRecord>;
    update(args: {
      where: { id: string };
      data: {
        audienceDefinition: Record<string, unknown>;
        eligibleCount: number;
        recipientCount: number;
        suppressedCount: number;
      };
    }): Promise<unknown>;
  };
}

export interface AccountReminderCampaignDatabase {
  $transaction<T>(
    callback: (
      transaction: AccountReminderCampaignTransaction,
    ) => Promise<T>,
    options?: { isolationLevel: "RepeatableRead" },
  ): Promise<T>;
}

export interface PrepareAccountReminderCampaignInput {
  createdById: string;
  subject: string;
  templateHash: string;
  hmacSecret: string;
  now?: Date;
}

export interface PrepareAccountReminderCampaignResult {
  campaignId: string;
  campaignKey: typeof LEGACY_SELLER_ACCOUNT_REMINDER_CAMPAIGN_KEY;
  status: CampaignStatus;
  audienceFrozen: boolean;
  createdRecipientCount: number;
  recipientCount: number;
  preview: AccountReminderAudiencePreview;
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function compareRepresentativeShop(
  left: AccountReminderOwnerCandidate,
  right: AccountReminderOwnerCandidate,
): number {
  const updatedDifference =
    right.shopUpdatedAt.getTime() -
    left.shopUpdatedAt.getTime();
  if (updatedDifference !== 0) return updatedDifference;

  const createdDifference =
    right.shopCreatedAt.getTime() -
    left.shopCreatedAt.getTime();
  if (createdDifference !== 0) return createdDifference;

  return compareText(left.shopId, right.shopId);
}

function assertValidDate(value: Date, field: string): void {
  if (
    !(value instanceof Date) ||
    !Number.isFinite(value.getTime())
  ) {
    throw new TypeError(`${field} must be a valid Date.`);
  }
}

function assertCandidate(candidate: AccountReminderOwnerCandidate): void {
  if (!candidate.userId.trim() || !candidate.shopId.trim()) {
    throw new TypeError(
      "Account reminder candidates require user and shop IDs.",
    );
  }

  assertValidDate(candidate.shopCreatedAt, "shopCreatedAt");
  assertValidDate(candidate.shopUpdatedAt, "shopUpdatedAt");
}

function assertStrongHmacSecret(secret: string): string {
  const normalized = secret.trim();
  if (Buffer.byteLength(normalized, "utf8") < MIN_HMAC_SECRET_BYTES) {
    throw new RangeError(
      "EMAIL_MARKETING_HMAC_SECRET must contain at least 32 bytes.",
    );
  }
  return normalized;
}

function chooseUniqueOwners(
  candidates: AccountReminderOwnerCandidate[],
): AccountReminderOwnerCandidate[] {
  const membershipsByUser = new Map<
    string,
    AccountReminderOwnerCandidate[]
  >();

  for (const candidate of candidates) {
    assertCandidate(candidate);
    const memberships = membershipsByUser.get(candidate.userId);
    if (memberships) {
      memberships.push(candidate);
    } else {
      membershipsByUser.set(candidate.userId, [candidate]);
    }
  }

  return [...membershipsByUser.entries()]
    .sort(([leftUserId], [rightUserId]) =>
      compareText(leftUserId, rightUserId),
    )
    .map(([, memberships]) =>
      [...memberships].sort(compareRepresentativeShop)[0]!,
    );
}

/**
 * The provider idempotency identity contains neither the user ID nor address
 * digest. It is stable for the fixed campaign and one TradeFeed user.
 */
export function createAccountReminderIdempotencyKey(
  userId: string,
): string {
  const normalizedUserId = userId.trim();
  if (!normalizedUserId) {
    throw new TypeError("userId is required.");
  }

  const digest = createHash("sha256")
    .update(
      `${LEGACY_SELLER_ACCOUNT_REMINDER_CAMPAIGN_KEY}\0${normalizedUserId}`,
      "utf8",
    )
    .digest("hex");

  return `tf-account-reminder-v1:${digest}`;
}

function prepareAccountReminderAudience(
  candidates: AccountReminderOwnerCandidate[],
  activeSuppressionHashes: ReadonlySet<string>,
  priorRecipients: PriorAccountReminderRecipient[],
  hmacSecret: string,
  now: Date,
): PreparedAccountReminderAudience {
  const normalizedHmacSecret = assertStrongHmacSecret(hmacSecret);
  assertValidDate(now, "now");

  const uniqueOwners = chooseUniqueOwners(candidates);
  const prepared = uniqueOwners.map((candidate) => {
    if (candidate.isBanned) {
      return {
        candidate,
        normalizedEmailHash: null,
        invalidEmail: false,
      };
    }

    try {
      const normalizedEmail = normalizeCampaignRecipientEmail(
        candidate.email,
      );
      return {
        candidate,
        normalizedEmailHash: createMarketingEmailHash(
          normalizedEmail,
          normalizedHmacSecret,
        ),
        invalidEmail: false,
      };
    } catch {
      return {
        candidate,
        normalizedEmailHash: null,
        invalidEmail: true,
      };
    }
  });

  const emailHashCounts = new Map<string, number>();
  for (const item of prepared) {
    if (!item.normalizedEmailHash) continue;
    emailHashCounts.set(
      item.normalizedEmailHash,
      (emailHashCounts.get(item.normalizedEmailHash) ?? 0) + 1,
    );
  }

  const normalizedSuppressions = new Set(
    [...activeSuppressionHashes].map((hash) => hash.trim()),
  );
  const priorUserIds = new Set(
    priorRecipients.map(({ userId }) => userId),
  );
  const priorEmailHashes = new Set(
    priorRecipients.map(({ normalizedEmailHash }) =>
      normalizedEmailHash.trim(),
    ),
  );

  const counts: AccountReminderAudienceCounts = {
    ownerMemberships: candidates.length,
    uniqueOwners: uniqueOwners.length,
    duplicateShopMemberships:
      candidates.length - uniqueOwners.length,
    eligible: 0,
    excluded: {
      banned: 0,
      invalidEmail: 0,
      duplicateEmail: 0,
      optedOut: 0,
      activeSuppression: 0,
      priorReminder: 0,
    },
  };
  const recipients: PreparedAccountReminderRecipient[] = [];

  for (const item of prepared) {
    const { candidate, normalizedEmailHash, invalidEmail } = item;

    if (candidate.isBanned) {
      counts.excluded.banned += 1;
      continue;
    }
    if (invalidEmail || !normalizedEmailHash) {
      counts.excluded.invalidEmail += 1;
      continue;
    }
    if ((emailHashCounts.get(normalizedEmailHash) ?? 0) > 1) {
      counts.excluded.duplicateEmail += 1;
      continue;
    }
    if (candidate.marketingPreferenceStatus === "OPTED_OUT") {
      counts.excluded.optedOut += 1;
      continue;
    }
    if (normalizedSuppressions.has(normalizedEmailHash)) {
      counts.excluded.activeSuppression += 1;
      continue;
    }
    if (
      priorUserIds.has(candidate.userId) ||
      priorEmailHashes.has(normalizedEmailHash)
    ) {
      counts.excluded.priorReminder += 1;
      continue;
    }

    counts.eligible += 1;
    recipients.push({
      userId: candidate.userId,
      shopId: candidate.shopId,
      normalizedEmailHash,
      idempotencyKey: createAccountReminderIdempotencyKey(
        candidate.userId,
      ),
    });
  }

  const reconciledOwners =
    counts.eligible +
    Object.values(counts.excluded).reduce(
      (total, count) => total + count,
      0,
    );
  if (reconciledOwners !== counts.uniqueOwners) {
    throw new Error(
      "Account reminder audience counts did not reconcile.",
    );
  }

  return {
    preview: {
      campaignKey:
        LEGACY_SELLER_ACCOUNT_REMINDER_CAMPAIGN_KEY,
      generatedAt: now.toISOString(),
      counts,
    },
    recipients,
  };
}

/**
 * Build a PII-free aggregate preview from an already loaded snapshot.
 *
 * Case-insensitive address collisions are all excluded instead of assigning a
 * shared mailbox to an arbitrary account.
 */
export function buildLegacySellerAccountReminderPreview(
  candidates: AccountReminderOwnerCandidate[],
  activeSuppressionHashes: ReadonlySet<string>,
  priorRecipients: PriorAccountReminderRecipient[],
  hmacSecret: string,
  now: Date,
): AccountReminderAudiencePreview {
  return prepareAccountReminderAudience(
    candidates,
    activeSuppressionHashes,
    priorRecipients,
    hmacSecret,
    now,
  ).preview;
}

function ownerCandidatesFromShops(
  shops: AccountReminderShopRecord[],
): AccountReminderOwnerCandidate[] {
  const candidates: AccountReminderOwnerCandidate[] = [];

  for (const shop of shops) {
    for (const membership of shop.users) {
      candidates.push({
        userId: membership.user.id,
        email: membership.user.email,
        isBanned: membership.user.isBanned,
        marketingPreferenceStatus:
          membership.user.emailMarketingPreference?.status ??
          null,
        shopId: shop.id,
        shopCreatedAt: shop.createdAt,
        shopUpdatedAt: shop.updatedAt,
      });
    }
  }

  return candidates;
}

function candidateEmailHashes(
  candidates: AccountReminderOwnerCandidate[],
  hmacSecret: string,
): string[] {
  const hashes = new Set<string>();

  for (const candidate of chooseUniqueOwners(candidates)) {
    if (candidate.isBanned) continue;
    try {
      hashes.add(
        createMarketingEmailHash(
          normalizeCampaignRecipientEmail(candidate.email),
          hmacSecret,
        ),
      );
    } catch {
      // The aggregate builder classifies malformed legacy addresses.
    }
  }

  return [...hashes].sort(compareText);
}

async function loadAccountReminderAudience(
  transaction: AccountReminderCampaignTransaction,
  hmacSecret: string,
  now: Date,
): Promise<PreparedAccountReminderAudience> {
  const shops = await transaction.shop.findMany({
    where: { isActive: true },
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
      users: {
        where: { role: "OWNER" },
        select: {
          user: {
            select: {
              id: true,
              email: true,
              isBanned: true,
              emailMarketingPreference: {
                select: { status: true },
              },
            },
          },
        },
      },
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });
  const candidates = ownerCandidatesFromShops(shops);
  const emailHashes = candidateEmailHashes(
    candidates,
    hmacSecret,
  );

  const suppressions =
    emailHashes.length === 0
      ? []
      : await transaction.emailSuppression.findMany({
          where: {
            normalizedEmailHash: { in: emailHashes },
            releasedAt: null,
          },
          select: { normalizedEmailHash: true },
        });

  const priorRecipients =
    await transaction.emailMarketingCampaignRecipient.findMany({
      where: {
        campaign: {
          campaignKey:
            LEGACY_SELLER_ACCOUNT_REMINDER_CAMPAIGN_KEY,
          kind: CAMPAIGN_KIND,
        },
      },
      select: {
        userId: true,
        normalizedEmailHash: true,
      },
    });

  return prepareAccountReminderAudience(
    candidates,
    new Set(
      suppressions.map(({ normalizedEmailHash }) =>
        normalizedEmailHash.trim(),
      ),
    ),
    priorRecipients,
    hmacSecret,
    now,
  );
}

/**
 * Return aggregate audience counts without leaking account or address
 * identities from the persistence layer.
 */
export async function getLegacySellerAccountReminderPreview(
  input: {
    hmacSecret: string;
    now?: Date;
  },
  database: AccountReminderCampaignDatabase =
    db as unknown as AccountReminderCampaignDatabase,
): Promise<AccountReminderAudiencePreview> {
  const hmacSecret = assertStrongHmacSecret(input.hmacSecret);
  const now = input.now ?? new Date();
  assertValidDate(now, "now");

  return database.$transaction(
    async (transaction) =>
      (
        await loadAccountReminderAudience(
          transaction,
          hmacSecret,
          now,
        )
      ).preview,
    { isolationLevel: "RepeatableRead" },
  );
}

function validatePrepareInput(
  input: PrepareAccountReminderCampaignInput,
): {
  createdById: string;
  subject: string;
  templateHash: string;
  hmacSecret: string;
  now: Date;
} {
  const createdById = input.createdById.trim();
  if (!createdById) {
    throw new TypeError("createdById is required.");
  }

  const subject = input.subject.trim();
  if (!subject) {
    throw new TypeError("subject is required.");
  }

  const templateHash = input.templateHash.trim().toLowerCase();
  if (!SHA_256_PATTERN.test(templateHash)) {
    throw new TypeError(
      "templateHash must be a lowercase SHA-256 digest.",
    );
  }

  const now = input.now ?? new Date();
  assertValidDate(now, "now");

  return {
    createdById,
    subject,
    templateHash,
    hmacSecret: assertStrongHmacSecret(input.hmacSecret),
    now,
  };
}

function campaignAudienceDefinition(
  preview: AccountReminderAudiencePreview,
): Record<string, unknown> {
  return {
    version: 1,
    type: "legacy_active_seller_account_reminder",
    campaignKey: LEGACY_SELLER_ACCOUNT_REMINDER_CAMPAIGN_KEY,
    preparedAt: preview.generatedAt,
    rules: {
      activeShopsOnly: true,
      ownerRoleOnly: true,
      bannedUsersExcluded: true,
      malformedEmailsExcluded: true,
      sharedNormalizedEmailsExcluded: true,
      optedOutUsersExcluded: true,
      activeSuppressionsExcluded: true,
      anyPriorRecipientExcluded: true,
      representativeShopOrder: [
        "updatedAt_desc",
        "createdAt_desc",
        "id_asc",
      ],
    },
    counts: preview.counts,
    rawEmailsStored: false,
  };
}

/**
 * Create or reuse the one fixed reminder campaign and reserve its recipients.
 *
 * Repeated draft preparation is idempotent: campaign/recipient unique keys
 * and `skipDuplicates` reuse reservations. Once the campaign leaves DRAFT,
 * its audience is frozen and this function cannot append recipients.
 * Actual provider delivery deliberately lives outside this module.
 */
export async function prepareLegacySellerAccountReminderCampaign(
  input: PrepareAccountReminderCampaignInput,
  database: AccountReminderCampaignDatabase =
    db as unknown as AccountReminderCampaignDatabase,
): Promise<PrepareAccountReminderCampaignResult> {
  const validated = validatePrepareInput(input);

  return database.$transaction(
    async (transaction) => {
      const audience = await loadAccountReminderAudience(
        transaction,
        validated.hmacSecret,
        validated.now,
      );
      const audienceDefinition = campaignAudienceDefinition(
        audience.preview,
      );

      const campaign =
        await transaction.emailMarketingCampaign.upsert({
          where: {
            campaignKey:
              LEGACY_SELLER_ACCOUNT_REMINDER_CAMPAIGN_KEY,
          },
          create: {
            campaignKey:
              LEGACY_SELLER_ACCOUNT_REMINDER_CAMPAIGN_KEY,
            kind: CAMPAIGN_KIND,
            status: CAMPAIGN_STATUS_DRAFT,
            name: LEGACY_SELLER_ACCOUNT_REMINDER_NAME,
            subject: validated.subject,
            templateHash: validated.templateHash,
            audienceDefinition,
            createdById: validated.createdById,
            eligibleCount: 0,
            recipientCount: 0,
            suppressedCount:
              audience.preview.counts.excluded
                .activeSuppression,
          },
          update: {},
          select: {
            id: true,
            campaignKey: true,
            kind: true,
            status: true,
            subject: true,
            templateHash: true,
          },
        });

      if (
        campaign.campaignKey !==
          LEGACY_SELLER_ACCOUNT_REMINDER_CAMPAIGN_KEY ||
        campaign.kind !== CAMPAIGN_KIND
      ) {
        throw new Error(
          "The fixed account reminder campaign key has incompatible metadata.",
        );
      }
      if (
        campaign.subject !== validated.subject ||
        campaign.templateHash.trim() !== validated.templateHash
      ) {
        throw new Error(
          "The fixed account reminder campaign already uses different approved content.",
        );
      }

      if (campaign.status !== CAMPAIGN_STATUS_DRAFT) {
        const recipientCount =
          await transaction.emailMarketingCampaignRecipient.count({
            where: { campaignId: campaign.id },
          });
        return {
          campaignId: campaign.id,
          campaignKey:
            LEGACY_SELLER_ACCOUNT_REMINDER_CAMPAIGN_KEY,
          status: campaign.status,
          audienceFrozen: true,
          createdRecipientCount: 0,
          recipientCount,
          preview: audience.preview,
        };
      }

      const created =
        audience.recipients.length === 0
          ? { count: 0 }
          : await transaction.emailMarketingCampaignRecipient.createMany(
              {
                data: audience.recipients.map((recipient) => ({
                  campaignId: campaign.id,
                  userId: recipient.userId,
                  shopId: recipient.shopId,
                  normalizedEmailHash:
                    recipient.normalizedEmailHash,
                  idempotencyKey: recipient.idempotencyKey,
                  status: RECIPIENT_STATUS_PENDING,
                })),
                skipDuplicates: true,
              },
            );
      const recipientCount =
        await transaction.emailMarketingCampaignRecipient.count({
          where: { campaignId: campaign.id },
        });

      await transaction.emailMarketingCampaign.update({
        where: { id: campaign.id },
        data: {
          audienceDefinition,
          eligibleCount: recipientCount,
          recipientCount,
          suppressedCount:
            audience.preview.counts.excluded.activeSuppression,
        },
      });

      return {
        campaignId: campaign.id,
        campaignKey:
          LEGACY_SELLER_ACCOUNT_REMINDER_CAMPAIGN_KEY,
        status: campaign.status,
        audienceFrozen: false,
        createdRecipientCount: created.count,
        recipientCount,
        preview: audience.preview,
      };
    },
    { isolationLevel: "RepeatableRead" },
  );
}
