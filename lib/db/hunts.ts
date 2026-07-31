import { Prisma, type HuntMatchPreference, type HuntStatus } from "@prisma/client";

import { db } from "@/lib/db";
import { generateHuntSlug } from "@/lib/hunt/slug";

const publicHuntSelect = {
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

export async function createHuntRecord(input: CreateHuntRecordInput) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await db.hunt.create({
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
        },
        select: { id: true, slug: true },
      });
    } catch (error) {
      const slugCollision =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002";
      if (!slugCollision || attempt === 1) throw error;
    }
  }

  throw new Error("Unable to create Hunt");
}

export type PublicHunt = Prisma.HuntGetPayload<{
  select: typeof publicHuntSelect;
}> & {
  viewerJoined: boolean;
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
  const { participants, ...publicData } = hunt;
  return {
    ...publicData,
    status: derivePublicHuntStatus(hunt.status, hunt.expiresAt),
    viewerJoined: participants.length > 0,
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

    const participantCount = await tx.huntParticipant.count({
      where: { huntId: hunt.id },
    });
    return { participantCount };
  });
}
