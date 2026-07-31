import { db } from "@/lib/db";
import {
  createMarketingEmailHash,
  isMarketingEmailEligible,
  normalizeMarketingCustomCopy,
  normalizeMarketingEmail,
  selectMarketingCampaignSegment,
  type MarketingEmailPreferenceStatus,
} from "@/lib/email/marketing-preferences";
import {
  reengagementEmailHtml,
  reengagementEmailPreheader,
  reengagementEmailSubject,
  reengagementEmailText,
  type ReengagementSegment,
} from "@/lib/email/templates/reengagement";
import { SITE_URL, SUPPORT_EMAIL } from "@/lib/config/site";

export {
  createMarketingEmailHash,
  normalizeMarketingEmail,
} from "@/lib/email/marketing-preferences";

export const NCC_CLEANSING_MAX_AGE_MS = 24 * 60 * 60 * 1_000;

const PREVIEW_SELLER_NAME = "Preview seller";
const PREVIEW_SHOP_NAME = "Preview shop";
const PREVIEW_SHOP_SLUG = "preview-shop";
const PREVIEW_UNSUBSCRIBE_TOKEN = "preview-not-a-live-token";

const ISO_DATE_TIME_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/;

export type MarketingEmailSafetyBlocker =
  | "hmac_secret_missing"
  | "provider_not_ready"
  | "ncc_cleansing_missing_or_stale"
  | "customer_send_disabled";

export interface MarketingEmailSafetyLocks {
  hmacReady: boolean;
  providerReady: boolean;
  nccCleansingFresh: boolean;
  customerSendEnabled: boolean;
  testSendAllowed: boolean;
  customerSendAllowed: boolean;
  nccCleansedAt: string | null;
  nccCleansingExpiresAt: string | null;
  blockers: MarketingEmailSafetyBlocker[];
}

export interface MarketingEmailConfig {
  EMAIL_MARKETING_HMAC_SECRET?: string;
  EMAIL_MARKETING_PROVIDER_READY?: string;
  EMAIL_MARKETING_NCC_CLEANSED_AT?: string;
  EMAIL_MARKETING_SEND_ENABLED?: string;
  RESEND_API_KEY?: string;
}

export interface SellerMarketingOwnerCandidate {
  userId: string;
  email: string;
  isBanned: boolean;
  consentStatus: MarketingEmailPreferenceStatus | null;
  shopId: string;
  shopName: string;
  shopSlug: string;
  shopCreatedAt: Date;
  shopUpdatedAt: Date;
  productCount: number;
  lastProductAt: Date | null;
}

export interface SellerMarketingAudienceCounts {
  ownerMemberships: number;
  uniqueOwners: number;
  duplicateShopMemberships: number;
  explicitOptIns: number;
  eligible: number;
  excluded: {
    banned: number;
    invalidEmail: number;
    duplicateEmail: number;
    consentUnknown: number;
    optedOut: number;
    activeSuppression: number;
  };
  segments: Record<ReengagementSegment, number>;
}

export interface SellerMarketingAudiencePreview {
  generatedAt: string;
  counts: SellerMarketingAudienceCounts;
}

export interface SafeMarketingEmailSample {
  segment: ReengagementSegment;
  subject: string;
  preheader: string;
  html: string;
  text: string;
}

function hasStrongHmacSecret(value: string | undefined): boolean {
  const secret = value?.trim();
  return Boolean(
    secret && Buffer.byteLength(secret, "utf8") >= 32,
  );
}

/**
 * Apply a conservative deliverability check after identity normalization.
 * Clerk normally validates account addresses, but campaign selection must
 * still fail closed if legacy or manually imported data is malformed.
 */
export function normalizeCampaignRecipientEmail(
  email: string,
): string {
  const normalized = normalizeMarketingEmail(email);
  if (normalized.length > 254) {
    throw new TypeError("A deliverable email address is required.");
  }

  const atIndex = normalized.lastIndexOf("@");
  const localPart = normalized.slice(0, atIndex);
  const domain = normalized.slice(atIndex + 1);
  const labels = domain.split(".");
  const validLocalPart =
    localPart.length > 0 &&
    localPart.length <= 64 &&
    !localPart.startsWith(".") &&
    !localPart.endsWith(".") &&
    !localPart.includes("..") &&
    /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+$/i.test(localPart);
  const validDomain =
    domain.length <= 253 &&
    labels.length >= 2 &&
    labels.every(
      (label) =>
        label.length >= 1 &&
        label.length <= 63 &&
        /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(label),
    );

  if (!validLocalPart || !validDomain) {
    throw new TypeError("A deliverable email address is required.");
  }

  return normalized;
}

function parseStrictIsoDateTime(value: string | undefined): Date | null {
  const candidate = value?.trim();
  if (!candidate) return null;

  const match = ISO_DATE_TIME_PATTERN.exec(candidate);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6]);

  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > new Date(Date.UTC(year, month, 0)).getUTCDate() ||
    hour > 23 ||
    minute > 59 ||
    second > 59
  ) {
    return null;
  }

  const timestamp = Date.parse(candidate);
  return Number.isFinite(timestamp) ? new Date(timestamp) : null;
}

/**
 * Resolve every marketing-delivery lock from explicit configuration.
 *
 * No environment is implicitly trusted. Customer delivery requires all four
 * gates, and the NCC cleansing evidence expires after 24 hours. This module
 * deliberately exposes no customer-send function.
 */
export function resolveMarketingEmailSafetyLocks(
  config: MarketingEmailConfig,
  now: Date,
): MarketingEmailSafetyLocks {
  if (
    !(now instanceof Date) ||
    !Number.isFinite(now.getTime())
  ) {
    throw new TypeError("now must be a valid Date.");
  }

  const hmacReady = hasStrongHmacSecret(
    config.EMAIL_MARKETING_HMAC_SECRET,
  );
  const providerReady =
    config.EMAIL_MARKETING_PROVIDER_READY === "true" &&
    Boolean(config.RESEND_API_KEY?.trim());
  const customerSendEnabled =
    config.EMAIL_MARKETING_SEND_ENABLED === "true";

  const nccCleansedAt = parseStrictIsoDateTime(
    config.EMAIL_MARKETING_NCC_CLEANSED_AT,
  );
  const nccAgeMs = nccCleansedAt
    ? now.getTime() - nccCleansedAt.getTime()
    : Number.POSITIVE_INFINITY;
  const nccCleansingFresh =
    nccAgeMs >= 0 && nccAgeMs <= NCC_CLEANSING_MAX_AGE_MS;
  const nccCleansingExpiresAt = nccCleansedAt
    ? new Date(
        nccCleansedAt.getTime() + NCC_CLEANSING_MAX_AGE_MS,
      ).toISOString()
    : null;

  const blockers: MarketingEmailSafetyBlocker[] = [];
  if (!hmacReady) blockers.push("hmac_secret_missing");
  if (!providerReady) blockers.push("provider_not_ready");
  if (!nccCleansingFresh) {
    blockers.push("ncc_cleansing_missing_or_stale");
  }
  if (!customerSendEnabled) blockers.push("customer_send_disabled");

  return {
    hmacReady,
    providerReady,
    nccCleansingFresh,
    customerSendEnabled,
    testSendAllowed: hmacReady && providerReady,
    customerSendAllowed:
      hmacReady &&
      providerReady &&
      nccCleansingFresh &&
      customerSendEnabled,
    nccCleansedAt: nccCleansedAt?.toISOString() ?? null,
    nccCleansingExpiresAt,
    blockers,
  };
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function compareRepresentativeShop(
  left: SellerMarketingOwnerCandidate,
  right: SellerMarketingOwnerCandidate,
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

function assertCandidate(candidate: SellerMarketingOwnerCandidate): void {
  if (!candidate.userId || !candidate.shopId) {
    throw new TypeError("Audience candidates require user and shop IDs.");
  }
  if (
    !(candidate.shopCreatedAt instanceof Date) ||
    !Number.isFinite(candidate.shopCreatedAt.getTime()) ||
    !(candidate.shopUpdatedAt instanceof Date) ||
    !Number.isFinite(candidate.shopUpdatedAt.getTime())
  ) {
    throw new TypeError("Audience candidates require valid shop dates.");
  }
  if (
    !Number.isSafeInteger(candidate.productCount) ||
    candidate.productCount < 0
  ) {
    throw new RangeError(
      "Audience candidate productCount must be a non-negative integer.",
    );
  }
  if (
    candidate.lastProductAt !== null &&
    (!(candidate.lastProductAt instanceof Date) ||
      !Number.isFinite(candidate.lastProductAt.getTime()))
  ) {
    throw new TypeError(
      "Audience candidate lastProductAt must be a valid Date or null.",
    );
  }
}

function chooseUniqueOwners(
  candidates: SellerMarketingOwnerCandidate[],
): SellerMarketingOwnerCandidate[] {
  const byUser = new Map<
    string,
    SellerMarketingOwnerCandidate[]
  >();

  for (const candidate of candidates) {
    assertCandidate(candidate);
    const current = byUser.get(candidate.userId);
    if (current) {
      current.push(candidate);
    } else {
      byUser.set(candidate.userId, [candidate]);
    }
  }

  return [...byUser.entries()]
    .sort(([leftUserId], [rightUserId]) =>
      compareText(leftUserId, rightUserId),
    )
    .map(([, memberships]) =>
      [...memberships].sort(compareRepresentativeShop)[0]!,
    );
}

function segmentForCandidate(
  candidate: SellerMarketingOwnerCandidate,
  now: Date,
): ReengagementSegment {
  const lifecycleSegment = selectMarketingCampaignSegment({
    productCount: candidate.productCount,
    lastProductAt: candidate.lastProductAt,
    now,
  });

  if (lifecycleSegment === "NO_PRODUCTS") return "zero";
  if (lifecycleSegment === "INACTIVE") return "stale";
  if (candidate.productCount < 3) return "starter";
  return "active";
}

/**
 * Build a PII-free, exactly reconciled audience preview from an owner snapshot.
 *
 * Multi-shop owners are represented once using a deterministic shop choice.
 * Ambiguous case-insensitive duplicate addresses are all excluded rather than
 * guessing which account's consent should control the shared mailbox.
 */
export function buildSellerMarketingAudiencePreview(
  candidates: SellerMarketingOwnerCandidate[],
  activeSuppressionHashes: ReadonlySet<string>,
  hmacSecret: string,
  now: Date,
): SellerMarketingAudiencePreview {
  if (!hasStrongHmacSecret(hmacSecret)) {
    throw new RangeError(
      "EMAIL_MARKETING_HMAC_SECRET must contain at least 32 bytes.",
    );
  }
  if (
    !(now instanceof Date) ||
    !Number.isFinite(now.getTime())
  ) {
    throw new TypeError("now must be a valid Date.");
  }
  const normalizedHmacSecret = hmacSecret.trim();

  const uniqueOwners = chooseUniqueOwners(candidates);
  const prepared = uniqueOwners.map((candidate) => {
    if (candidate.isBanned) {
      return {
        candidate,
        emailHash: null,
        invalidEmail: false,
      };
    }

    try {
      return {
        candidate,
        emailHash: createMarketingEmailHash(
          normalizeCampaignRecipientEmail(candidate.email),
          normalizedHmacSecret,
        ),
        invalidEmail: false,
      };
    } catch {
      return {
        candidate,
        emailHash: null,
        invalidEmail: true,
      };
    }
  });

  const hashCounts = new Map<string, number>();
  for (const item of prepared) {
    if (!item.emailHash) continue;
    hashCounts.set(
      item.emailHash,
      (hashCounts.get(item.emailHash) ?? 0) + 1,
    );
  }

  const counts: SellerMarketingAudienceCounts = {
    ownerMemberships: candidates.length,
    uniqueOwners: uniqueOwners.length,
    duplicateShopMemberships:
      candidates.length - uniqueOwners.length,
    explicitOptIns: 0,
    eligible: 0,
    excluded: {
      banned: 0,
      invalidEmail: 0,
      duplicateEmail: 0,
      consentUnknown: 0,
      optedOut: 0,
      activeSuppression: 0,
    },
    segments: {
      zero: 0,
      starter: 0,
      stale: 0,
      active: 0,
    },
  };

  for (const item of prepared) {
    const { candidate, emailHash, invalidEmail } = item;

    if (candidate.isBanned) {
      counts.excluded.banned += 1;
      continue;
    }
    if (invalidEmail || !emailHash) {
      counts.excluded.invalidEmail += 1;
      continue;
    }
    if (isMarketingEmailEligible(candidate.consentStatus)) {
      counts.explicitOptIns += 1;
    }
    if ((hashCounts.get(emailHash) ?? 0) > 1) {
      counts.excluded.duplicateEmail += 1;
      continue;
    }
    if (candidate.consentStatus === "OPTED_OUT") {
      counts.excluded.optedOut += 1;
      continue;
    }
    if (!isMarketingEmailEligible(candidate.consentStatus)) {
      counts.excluded.consentUnknown += 1;
      continue;
    }
    if (activeSuppressionHashes.has(emailHash)) {
      counts.excluded.activeSuppression += 1;
      continue;
    }

    const segment = segmentForCandidate(candidate, now);
    counts.eligible += 1;
    counts.segments[segment] += 1;
  }

  const reconciledOwners =
    counts.eligible +
    Object.values(counts.excluded).reduce(
      (total, value) => total + value,
      0,
    );
  if (reconciledOwners !== counts.uniqueOwners) {
    throw new Error("Marketing audience counts did not reconcile.");
  }

  return {
    generatedAt: now.toISOString(),
    counts,
  };
}

function collectCandidateHashes(
  candidates: SellerMarketingOwnerCandidate[],
  hmacSecret: string,
): string[] {
  const hashes = new Set<string>();
  const normalizedHmacSecret = hmacSecret.trim();

  for (const candidate of chooseUniqueOwners(candidates)) {
    if (candidate.isBanned) continue;
    try {
      hashes.add(
        createMarketingEmailHash(
          normalizeCampaignRecipientEmail(candidate.email),
          normalizedHmacSecret,
        ),
      );
    } catch {
      // Invalid addresses are classified by the pure preview builder.
    }
  }

  return [...hashes].sort(compareText);
}

/**
 * Query a repeatable owner/suppression snapshot and return aggregate counts.
 * No names, email addresses, user IDs, shop IDs or hashes leave this function.
 */
export async function getSellerMarketingAudiencePreview(input: {
  hmacSecret: string;
  now?: Date;
}): Promise<SellerMarketingAudiencePreview> {
  const now = input.now ?? new Date();
  if (!hasStrongHmacSecret(input.hmacSecret)) {
    throw new RangeError(
      "EMAIL_MARKETING_HMAC_SECRET must contain at least 32 bytes.",
    );
  }

  return db.$transaction(
    async (tx) => {
      const shops = await tx.shop.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          slug: true,
          createdAt: true,
          updatedAt: true,
          products: {
            where: { isActive: true },
            orderBy: [
              { updatedAt: "desc" },
              { id: "asc" },
            ],
            take: 1,
            select: { updatedAt: true },
          },
          _count: {
            select: {
              products: {
                where: { isActive: true },
              },
            },
          },
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

      const candidates: SellerMarketingOwnerCandidate[] = [];
      for (const shop of shops) {
        for (const membership of shop.users) {
          candidates.push({
            userId: membership.user.id,
            email: membership.user.email,
            isBanned: membership.user.isBanned,
            consentStatus:
              membership.user.emailMarketingPreference?.status ??
              null,
            shopId: shop.id,
            shopName: shop.name,
            shopSlug: shop.slug,
            shopCreatedAt: shop.createdAt,
            shopUpdatedAt: shop.updatedAt,
            productCount: shop._count.products,
            lastProductAt: shop.products[0]?.updatedAt ?? null,
          });
        }
      }

      const emailHashes = collectCandidateHashes(
        candidates,
        input.hmacSecret.trim(),
      );
      const suppressions =
        emailHashes.length === 0
          ? []
          : await tx.emailSuppression.findMany({
              where: {
                normalizedEmailHash: { in: emailHashes },
                releasedAt: null,
              },
              select: { normalizedEmailHash: true },
            });

      return buildSellerMarketingAudiencePreview(
        candidates,
        new Set(
          suppressions.map((suppression) =>
            suppression.normalizedEmailHash.trim(),
          ),
        ),
        input.hmacSecret.trim(),
        now,
      );
    },
    { isolationLevel: "RepeatableRead" },
  );
}

/**
 * Render a representative email containing only fixed preview identities.
 * Caller-provided copy is normalized and escaped by the template.
 */
export function buildSafeMarketingEmailSample(input?: {
  segment?: ReengagementSegment;
  customMessage?: string | null;
}): SafeMarketingEmailSample {
  const segment = input?.segment ?? "zero";
  if (
    segment !== "zero" &&
    segment !== "starter" &&
    segment !== "stale" &&
    segment !== "active"
  ) {
    throw new TypeError(
      "segment must be zero, starter, stale, or active.",
    );
  }

  const customMessage = normalizeMarketingCustomCopy(
    input?.customMessage,
  );
  const baseUrl = SITE_URL.replace(/\/+$/, "");
  const data = {
    shopName: PREVIEW_SHOP_NAME,
    sellerName: PREVIEW_SELLER_NAME,
    catalogUrl: `${baseUrl}/catalog/${PREVIEW_SHOP_SLUG}`,
    dashboardUrl: `${baseUrl}/dashboard/${PREVIEW_SHOP_SLUG}`,
    huntUrl: `${baseUrl}/hunt`,
    growthUrl: `${baseUrl}/growth`,
    unsubscribeUrl:
      `${baseUrl}/email/unsubscribe?token=${encodeURIComponent(
        PREVIEW_UNSUBSCRIBE_TOKEN,
      )}`,
    senderName: "TradeFeed",
    supportEmail: SUPPORT_EMAIL,
    segment,
    customMessage,
  };

  return {
    segment,
    subject: reengagementEmailSubject(data),
    preheader: reengagementEmailPreheader(data),
    html: reengagementEmailHtml(data),
    text: reengagementEmailText(data),
  };
}
