// ============================================================
// Seller lifecycle milestones
// ============================================================
// Durable business state remains the source of truth for shops,
// products, subscriptions, and orders. These records capture user
// actions that cannot be reconstructed from rows alone (for
// example, sharing a catalogue).
// ============================================================

import { db } from "@/lib/db";

export const SELLER_MILESTONE_STEPS = [
  "started",
  "shop_created",
  "product_created",
  "completed",
  "catalog_shared",
  "upgrade_viewed",
  "subscription_started",
] as const;

export type SellerMilestoneStep = (typeof SELLER_MILESTONE_STEPS)[number];

export const SELLER_MILESTONE_SOURCES = [
  "get-started",
  "create-shop",
  "dashboard",
  "settings",
  "billing",
  "upgrade-page",
  "payfast",
  "manual-upgrade",
  "admin",
] as const;

export type SellerMilestoneSource =
  (typeof SELLER_MILESTONE_SOURCES)[number];

export function isSellerMilestoneSource(
  value: unknown,
): value is SellerMilestoneSource {
  return (
    typeof value === "string" &&
    SELLER_MILESTONE_SOURCES.includes(value as SellerMilestoneSource)
  );
}

export function sellerMilestoneTargetsShop(
  metadata: unknown,
  shopSlug: string,
  shopId?: string,
): boolean {
  if (
    metadata === null ||
    typeof metadata !== "object" ||
    Array.isArray(metadata)
  ) {
    return false;
  }

  const values = metadata as Record<string, unknown>;
  // New records use the immutable shop ID. Fall back to the slug only for
  // older records created before shopId was added to lifecycle metadata.
  if (typeof values.shopId === "string") {
    return Boolean(shopId) && values.shopId === shopId;
  }
  return values.shopSlug === shopSlug;
}

interface RecordSellerMilestoneInput {
  userId: string;
  step: SellerMilestoneStep;
  source: SellerMilestoneSource;
  shopId?: string;
  shopSlug?: string;
  productId?: string;
}

export function buildSellerMilestoneMetadata(
  input: Omit<RecordSellerMilestoneInput, "userId" | "step">,
) {
  return {
    source: input.source,
    ...(input.shopId ? { shopId: input.shopId } : {}),
    ...(input.shopSlug ? { shopSlug: input.shopSlug } : {}),
    ...(input.productId ? { productId: input.productId } : {}),
  };
}

export function buildSellerMilestoneDedupeKey(
  input: Pick<
    RecordSellerMilestoneInput,
    "userId" | "step" | "shopId" | "shopSlug"
  >,
): string {
  return [
    input.userId,
    input.step,
    input.shopId ?? input.shopSlug ?? "global",
  ].join(":");
}

/**
 * Record the first occurrence of a seller milestone.
 *
 * Milestones are intentionally idempotent. UI retries, double taps, and
 * repeated server renders must not inflate activation counts.
 */
export async function recordSellerMilestone(
  input: RecordSellerMilestoneInput,
): Promise<boolean> {
  const existing = await db.onboardingEvent.findFirst({
    where: {
      userId: input.userId,
      step: input.step,
      ...(input.shopId
        ? {
            metadata: {
              path: ["shopId"],
              equals: input.shopId,
            },
          }
        : input.shopSlug
          ? {
              metadata: {
                path: ["shopSlug"],
                equals: input.shopSlug,
              },
            }
        : {}),
    },
    select: { id: true },
  });

  if (existing) return false;

  try {
    await db.onboardingEvent.create({
      data: {
        userId: input.userId,
        step: input.step,
        dedupeKey: buildSellerMilestoneDedupeKey(input),
        metadata: buildSellerMilestoneMetadata(input),
      },
    });
    return true;
  } catch (error) {
    // Concurrent retries can both pass the legacy lookup; the database unique
    // key is the final idempotency boundary.
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return false;
    }
    throw error;
  }
}

export async function recordShopSubscriptionStarted(
  shopId: string,
  source: Extract<
    SellerMilestoneSource,
    "payfast" | "manual-upgrade" | "admin"
  >,
): Promise<boolean> {
  const shop = await db.shop.findUnique({
    where: { id: shopId },
    select: {
      slug: true,
      users: {
        where: { role: "OWNER" },
        take: 1,
        select: { userId: true },
      },
    },
  });
  const ownerId = shop?.users[0]?.userId;
  if (!shop || !ownerId) return false;

  return recordSellerMilestone({
    userId: ownerId,
    step: "subscription_started",
    source,
    shopId,
    shopSlug: shop.slug,
  });
}
