import { Prisma, type HuntMatchPreference, type HuntStatus } from "@prisma/client";

import { db } from "@/lib/db";
import { generateHuntSlug } from "@/lib/hunt/slug";

/**
 * The only offer shape allowed on public surfaces. In particular this omits
 * shopId, seller identity, proof media, sellerWhatsappSnapshot and
 * privateDataPurgeAfter.
 */
export const publicHuntOfferSelect = {
  id: true,
  matchType: true,
  publicProductName: true,
  publicDescription: true,
  publicVariant: true,
  publicDeliveryEstimate: true,
  priceCents: true,
  quantityAvailable: true,
  publicSellerVerifiedSnapshot: true,
  publishedAt: true,
} satisfies Prisma.HuntOfferSelect;

export const publicHuntSelect = {
  id: true,
  slug: true,
  status: true,
  publicTitle: true,
  publicDescription: true,
  publicImageUrl: true,
  category: true,
  desiredVariant: true,
  desiredColor: true,
  style: true,
  matchPreference: true,
  maxBudgetCents: true,
  city: true,
  province: true,
  publishedAt: true,
  expiresAt: true,
  resolvedAt: true,
  fulfillmentStatus: true,
  handoffAt: true,
  fulfilledAt: true,
  seoApprovedAt: true,
  _count: { select: { participants: true } },
} satisfies Prisma.HuntSelect;

export interface CreateHuntRecordInput {
  publicTitle: string;
  publicDescription: string;
  publicImageUrl: string;
  publicImageKey: string | null;
  category: string;
  desiredVariant: string | null;
  desiredColor: string | null;
  style: string | null;
  matchPreference: HuntMatchPreference;
  maxBudgetCents: number;
  city: string;
  province: string;
  aiConfidence: number;
  ownerFeatureId: string;
  whatsappNumber: string;
  buyerName: string | null;
  rawRequestText: string;
  consentAt: Date;
  expiresAt: Date;
  purgeAfter: Date;
}

export class HuntDailyLimitError extends Error {
  constructor() {
    super("This WhatsApp number already started three Hunts today.");
    this.name = "HuntDailyLimitError";
  }
}

export class HuntDeviceDailyLimitError extends Error {
  constructor() {
    super("This browser already started three Hunts today.");
    this.name = "HuntDeviceDailyLimitError";
  }
}

export async function createHuntRecord(input: CreateHuntRecordInput) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await db.$transaction(
        async (tx) => {
          const since = new Date(
            input.consentAt.getTime() - 24 * 60 * 60 * 1_000,
          );
          const [recentPhoneHunts, recentDeviceHunts] = await Promise.all([
            tx.huntPrivateData.count({
              where: {
                whatsappNumber: input.whatsappNumber,
                createdAt: { gte: since },
              },
            }),
            tx.huntPrivateData.count({
              where: {
                ownerFeatureId: input.ownerFeatureId,
                createdAt: { gte: since },
              },
            }),
          ]);
          if (recentPhoneHunts >= 3) throw new HuntDailyLimitError();
          if (recentDeviceHunts >= 3) throw new HuntDeviceDailyLimitError();

          return tx.hunt.create({
            data: {
              slug: generateHuntSlug(input.publicTitle),
              status: "LIVE",
              moderationStatus: "APPROVED",
              publicTitle: input.publicTitle,
              publicDescription: input.publicDescription,
              publicImageUrl: input.publicImageUrl,
              publicImageKey: input.publicImageKey,
              category: input.category,
              desiredVariant: input.desiredVariant,
              desiredColor: input.desiredColor,
              style: input.style,
              matchPreference: input.matchPreference,
              maxBudgetCents: input.maxBudgetCents,
              city: input.city,
              province: input.province,
              aiConfidence: input.aiConfidence,
              expiresAt: input.expiresAt,
              privateData: {
                create: {
                  ownerFeatureId: input.ownerFeatureId,
                  whatsappNumber: input.whatsappNumber,
                  buyerName: input.buyerName,
                  rawRequestText: input.rawRequestText,
                  huntUpdatesConsentAt: input.consentAt,
                  publicImageConsentAt: input.consentAt,
                  termsAcceptedAt: input.consentAt,
                  purgeAfter: input.purgeAfter,
                },
              },
              participants: {
                create: { visitorId: input.ownerFeatureId },
              },
              events: {
                create: {
                  type: "CREATED",
                  actor: "BUYER",
                  visitorId: input.ownerFeatureId,
                  purgeAfter: input.purgeAfter,
                },
              },
            },
            select: { id: true, slug: true },
          });
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      );
    } catch (error) {
      if (
        error instanceof HuntDailyLimitError ||
        error instanceof HuntDeviceDailyLimitError
      ) {
        throw error;
      }
      const retryable =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === "P2002" || error.code === "P2034");
      if (!retryable || attempt === 2) throw error;
    }
  }

  throw new Error("Unable to create Hunt");
}

export type PublicHuntOffer = Prisma.HuntOfferGetPayload<{
  select: typeof publicHuntOfferSelect;
}>;

type PublicHuntBase = Prisma.HuntGetPayload<{
  select: typeof publicHuntSelect;
}>;

export type PublicHunt = PublicHuntBase & {
  offers: PublicHuntOffer[];
  selectedOffer: PublicHuntOffer | null;
  viewerJoined: boolean;
  viewerIsOwner: boolean;
};

export function derivePublicHuntStatus(
  status: HuntStatus,
  expiresAt: Date,
  now = new Date(),
): HuntStatus {
  if (status === "LIVE" && expiresAt <= now) return "EXPIRED";
  return status;
}

export async function getPublicHuntBySlug(
  slug: string,
  viewerFeatureId?: string | null,
): Promise<PublicHunt | null> {
  const hunt = await db.hunt.findFirst({
    where: {
      slug,
      moderationStatus: "APPROVED",
      status: { in: ["LIVE", "FOUND", "CLOSED", "EXPIRED"] },
    },
    select: {
      ...publicHuntSelect,
      offers: {
        where: { status: "PUBLISHED" },
        select: publicHuntOfferSelect,
        orderBy: [{ priceCents: "asc" }, { publishedAt: "asc" }],
      },
      selectedOffer: {
        select: {
          status: true,
          ...publicHuntOfferSelect,
        },
      },
      // Used only for the equality check below and removed from the result.
      privateData: {
        select: { ownerFeatureId: true },
      },
      participants: viewerFeatureId
        ? {
            where: { visitorId: viewerFeatureId },
            select: { id: true },
            take: 1,
          }
        : {
            where: { id: "__never__" },
            select: { id: true },
            take: 1,
          },
    },
  });

  if (!hunt) return null;
  const { participants, privateData, selectedOffer, ...publicData } = hunt;
  const publicSelectedOffer =
    selectedOffer?.status === "PUBLISHED"
      ? (() => {
          const { status: _status, ...offer } = selectedOffer;
          return offer;
        })()
      : null;

  return {
    ...publicData,
    status: derivePublicHuntStatus(hunt.status, hunt.expiresAt),
    selectedOffer: publicSelectedOffer,
    viewerJoined: participants.length > 0,
    viewerIsOwner:
      Boolean(viewerFeatureId) &&
      privateData?.ownerFeatureId === viewerFeatureId,
  };
}

export async function getRecentPublicHunts(limit = 6) {
  return db.hunt.findMany({
    where: {
      status: "LIVE",
      moderationStatus: "APPROVED",
      expiresAt: { gt: new Date() },
    },
    select: publicHuntSelect,
    orderBy: { publishedAt: "desc" },
    take: Math.min(Math.max(limit, 1), 12),
  });
}

export async function countRecentHuntsForPhone(
  whatsappNumber: string,
  since: Date,
): Promise<number> {
  return db.huntPrivateData.count({
    where: {
      whatsappNumber,
      createdAt: { gte: since },
    },
  });
}

export async function countRecentHuntsForOwnerFeatureId(
  ownerFeatureId: string,
  since: Date,
): Promise<number> {
  return db.huntPrivateData.count({
    where: {
      ownerFeatureId,
      createdAt: { gte: since },
    },
  });
}

export async function joinPublicHunt(slug: string, visitorId: string) {
  return db.$transaction(async (tx) => {
    const hunt = await tx.hunt.findFirst({
      where: {
        slug,
        status: "LIVE",
        moderationStatus: "APPROVED",
        expiresAt: { gt: new Date() },
      },
      select: { id: true },
    });
    if (!hunt) return null;

    await tx.huntParticipant.upsert({
      where: {
        huntId_visitorId: {
          huntId: hunt.id,
          visitorId,
        },
      },
      create: {
        huntId: hunt.id,
        visitorId,
      },
      update: {},
    });

    await tx.huntEvent.upsert({
      where: {
        dedupeKey: `hunt-join:${hunt.id}:${visitorId}`,
      },
      create: {
        huntId: hunt.id,
        type: "JOINED",
        actor: "BUYER",
        visitorId,
        dedupeKey: `hunt-join:${hunt.id}:${visitorId}`,
      },
      update: {},
    });

    const participantCount = await tx.huntParticipant.count({
      where: { huntId: hunt.id },
    });
    return { participantCount };
  });
}
