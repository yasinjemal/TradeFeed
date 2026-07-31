import {
  Prisma,
  type HuntEventActor,
  type HuntEventType,
  type HuntOfferMatchType,
  type HuntReportReason,
  type HuntSellerRouteStatus,
} from "@prisma/client";

import { db } from "@/lib/db";
import {
  isHuntPublicTextSafe,
  type HuntAdminDismissReportFields,
  type HuntAdminOfferFields,
  type HuntAdminRouteFields,
  type HuntAdminWithdrawOfferFields,
  type HuntSellerPreferenceFields,
} from "@/lib/validation/hunt";

const HUNT_OPERATION_RETENTION_MS = 180 * 24 * 60 * 60 * 1_000;
const HUNT_TRANSACTION_ATTEMPTS = 3;
const CURRENT_SELLER_CONSENT_SOURCE =
  "ADMIN_CONFIRMED_ANON_OFFER_PUBLICATION";

function operationPurgeAfter(now = new Date()): Date {
  return new Date(now.getTime() + HUNT_OPERATION_RETENTION_MS);
}

async function runSerializableHuntOperation<T>(
  operation: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  for (let attempt = 1; attempt <= HUNT_TRANSACTION_ATTEMPTS; attempt += 1) {
    try {
      return await db.$transaction(operation, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error) {
      const canRetry =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2034" &&
        attempt < HUNT_TRANSACTION_ATTEMPTS;
      if (!canRetry) throw error;
    }
  }

  throw new Error("HUNT transaction retry limit reached.");
}

export async function recordHuntEvent(input: {
  huntId?: string | null;
  offerId?: string | null;
  type: HuntEventType;
  actor: HuntEventActor;
  visitorId?: string | null;
  source?: string | null;
  dedupeKey?: string | null;
  purgeAfter?: Date | null;
}) {
  return db.huntEvent.upsert({
    where: {
      dedupeKey: input.dedupeKey ?? `event-${crypto.randomUUID()}`,
    },
    create: {
      huntId: input.huntId ?? null,
      offerId: input.offerId ?? null,
      type: input.type,
      actor: input.actor,
      visitorId: input.visitorId?.slice(0, 64) ?? null,
      source: input.source?.slice(0, 80) ?? null,
      dedupeKey: input.dedupeKey ?? null,
      purgeAfter: input.purgeAfter ?? null,
    },
    update: {},
  });
}

export async function recordPublicHuntShare(input: {
  slug: string;
  visitorId: string;
  source: string;
}) {
  const hunt = await db.hunt.findFirst({
    where: {
      slug: input.slug,
      moderationStatus: "APPROVED",
      status: { in: ["LIVE", "FOUND", "CLOSED", "EXPIRED"] },
    },
    select: { id: true },
  });
  if (!hunt) return null;

  return recordHuntEvent({
    huntId: hunt.id,
    type: "SHARED",
    actor: "BUYER",
    visitorId: input.visitorId,
    source: input.source,
    purgeAfter: operationPurgeAfter(),
  });
}

export async function getHuntAdminQueue(options?: {
  status?: "LIVE" | "FOUND" | "CLOSED" | "REJECTED" | "EXPIRED";
  limit?: number;
}) {
  const limit = Math.min(Math.max(options?.limit ?? 50, 1), 100);
  return db.hunt.findMany({
    where: options?.status ? { status: options.status } : undefined,
    select: {
      id: true,
      slug: true,
      status: true,
      moderationStatus: true,
      fulfillmentStatus: true,
      publicTitle: true,
      publicDescription: true,
      publicImageUrl: true,
      publicImageKey: true,
      category: true,
      desiredVariant: true,
      desiredColor: true,
      matchPreference: true,
      maxBudgetCents: true,
      city: true,
      province: true,
      publishedAt: true,
      expiresAt: true,
      resolvedAt: true,
      handoffAt: true,
      fulfilledAt: true,
      selectedOfferId: true,
      privateData: {
        select: {
          buyerName: true,
          whatsappNumber: true,
          rawRequestText: true,
          purgeAfter: true,
          huntUpdatesConsentAt: true,
        },
      },
      offers: {
        select: {
          id: true,
          shopId: true,
          status: true,
          matchType: true,
          publicProductName: true,
          publicDescription: true,
          publicVariant: true,
          publicDeliveryEstimate: true,
          publicProofUrl: true,
          publicProofCapturedAt: true,
          priceCents: true,
          quantityAvailable: true,
          publicSellerNameSnapshot: true,
          publicSellerVerifiedSnapshot: true,
          sellerWhatsappSnapshot: true,
          publishedAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
      sellerRoutes: {
        select: {
          id: true,
          shopId: true,
          status: true,
          note: true,
          routedAt: true,
          contactedAt: true,
          respondedAt: true,
          shop: {
            select: {
              name: true,
              slug: true,
              whatsappNumber: true,
              isVerified: true,
            },
          },
        },
        orderBy: { routedAt: "desc" },
      },
      reports: {
        where: { status: { in: ["OPEN", "REVIEWING"] } },
        select: {
          id: true,
          reason: true,
          details: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      },
      _count: {
        select: {
          participants: true,
          offers: true,
          reports: true,
        },
      },
    },
    orderBy: [
      { reports: { _count: "desc" } },
      { status: "asc" },
      { publishedAt: "desc" },
    ],
    take: limit,
  });
}

export async function getHuntSellerRoster() {
  return db.shop.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      city: true,
      province: true,
      whatsappNumber: true,
      isVerified: true,
      logoUrl: true,
      huntSellerPreference: {
        select: {
          isOptedIn: true,
          cities: true,
          categories: true,
          consentedAt: true,
          consentSource: true,
          consentedBy: true,
          pausedAt: true,
        },
      },
    },
    orderBy: [{ isVerified: "desc" }, { name: "asc" }],
  });
}

export async function saveHuntSellerPreference(
  input: HuntSellerPreferenceFields,
  adminId: string,
) {
  const now = new Date();
  const shop = await db.shop.findFirst({
    where: { id: input.shopId, isActive: true },
    select: {
      id: true,
      name: true,
      huntSellerPreference: {
        select: {
          isOptedIn: true,
          consentedAt: true,
          consentSource: true,
          consentedBy: true,
        },
      },
    },
  });
  if (!shop) throw new Error("Active seller not found.");
  const isNewConsent =
    input.isOptedIn &&
    (!shop.huntSellerPreference?.isOptedIn ||
      shop.huntSellerPreference.consentSource !==
        CURRENT_SELLER_CONSENT_SOURCE);

  const preference = await db.huntSellerPreference.upsert({
    where: { shopId: input.shopId },
    create: {
      shopId: input.shopId,
      isOptedIn: input.isOptedIn,
      cities: input.cities,
      categories: input.categories,
      consentedAt: input.isOptedIn ? now : null,
      consentSource: input.isOptedIn
        ? CURRENT_SELLER_CONSENT_SOURCE
        : null,
      consentedBy: input.isOptedIn ? adminId : null,
      pausedAt: input.isOptedIn ? null : now,
    },
    update: {
      isOptedIn: input.isOptedIn,
      cities: input.cities,
      categories: input.categories,
      consentedAt: isNewConsent
        ? now
        : shop.huntSellerPreference?.consentedAt,
      consentSource: isNewConsent
        ? CURRENT_SELLER_CONSENT_SOURCE
        : shop.huntSellerPreference?.consentSource,
      consentedBy: isNewConsent
        ? adminId
        : shop.huntSellerPreference?.consentedBy,
      pausedAt: input.isOptedIn ? null : now,
    },
  });

  return {
    shop: { id: shop.id, name: shop.name },
    preference,
  };
}

function sellerMatchesHunt(input: {
  huntCity: string;
  huntCategory: string | null;
  cities: string[];
  categories: string[];
}): boolean {
  const cityMatches =
    input.cities.length === 0 ||
    input.cities.some(
      (city) => city.toLowerCase() === input.huntCity.toLowerCase(),
    );
  const categoryMatches =
    input.categories.length === 0 ||
    (input.huntCategory != null &&
      input.categories.some(
        (category) =>
          category.toLowerCase() === input.huntCategory?.toLowerCase(),
      ));
  return cityMatches && categoryMatches;
}

export async function routeHuntToSeller(
  input: HuntAdminRouteFields,
  adminId: string,
) {
  return db.$transaction(async (tx) => {
    const [hunt, shop] = await Promise.all([
      tx.hunt.findFirst({
        where: {
          id: input.huntId,
          status: "LIVE",
          moderationStatus: "APPROVED",
          expiresAt: { gt: new Date() },
        },
        select: {
          id: true,
          slug: true,
          publicTitle: true,
          publicDescription: true,
          category: true,
          desiredVariant: true,
          maxBudgetCents: true,
          city: true,
        },
      }),
      tx.shop.findFirst({
        where: { id: input.shopId, isActive: true },
        select: {
          id: true,
          name: true,
          whatsappNumber: true,
          huntSellerPreference: {
            select: {
              isOptedIn: true,
              pausedAt: true,
              cities: true,
              categories: true,
              consentedAt: true,
              consentSource: true,
            },
          },
        },
      }),
    ]);

    if (!hunt) throw new Error("This Hunt is not accepting seller routes.");
    if (
      !shop?.huntSellerPreference?.isOptedIn ||
      shop.huntSellerPreference.pausedAt ||
      !shop.huntSellerPreference.consentedAt ||
      shop.huntSellerPreference.consentSource !==
        CURRENT_SELLER_CONSENT_SOURCE
    ) {
      throw new Error(
        "This seller has not provided the current HUNT routing and anonymous-publication consent.",
      );
    }
    if (
      !sellerMatchesHunt({
        huntCity: hunt.city,
        huntCategory: hunt.category,
        cities: shop.huntSellerPreference.cities,
        categories: shop.huntSellerPreference.categories,
      })
    ) {
      throw new Error("This Hunt is outside the seller's opted-in coverage.");
    }

    const route = await tx.huntSellerRoute.upsert({
      where: {
        huntId_shopId: { huntId: hunt.id, shopId: shop.id },
      },
      create: {
        huntId: hunt.id,
        shopId: shop.id,
        routedBy: adminId,
        note: input.note ?? null,
      },
      update: {
        status: "ROUTED",
        routedBy: adminId,
        note: input.note ?? null,
        routedAt: new Date(),
        contactedAt: null,
        respondedAt: null,
        declinedAt: null,
      },
    });

    await tx.huntEvent.create({
      data: {
        huntId: hunt.id,
        type: "SELLER_ROUTED",
        actor: "ADMIN",
        source: "concierge",
        dedupeKey: `route:${route.id}:${route.routedAt.toISOString()}`,
        purgeAfter: operationPurgeAfter(),
      },
    });

    return { route, hunt, shop };
  });
}

export async function updateHuntSellerRouteStatus(
  routeId: string,
  status: HuntSellerRouteStatus,
) {
  const now = new Date();
  return db.huntSellerRoute.update({
    where: { id: routeId },
    data: {
      status,
      contactedAt: status === "CONTACTED" ? now : undefined,
      respondedAt: status === "RESPONDED" ? now : undefined,
      declinedAt: status === "DECLINED" ? now : undefined,
    },
  });
}

export async function publishHuntOffer(
  input: HuntAdminOfferFields,
  adminId: string,
) {
  return db.$transaction(async (tx) => {
    const route = await tx.huntSellerRoute.findFirst({
      where: {
        huntId: input.huntId,
        shopId: input.shopId,
        status: { notIn: ["DECLINED", "CANCELLED"] },
        hunt: {
          status: "LIVE",
          moderationStatus: "APPROVED",
          expiresAt: { gt: new Date() },
        },
        shop: {
          isActive: true,
          huntSellerPreference: {
            is: {
              isOptedIn: true,
              pausedAt: null,
              consentedAt: { not: null },
              consentSource: CURRENT_SELLER_CONSENT_SOURCE,
            },
          },
        },
      },
      select: {
        id: true,
        huntId: true,
        hunt: {
          select: {
            matchPreference: true,
          },
        },
        shop: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            isVerified: true,
            whatsappNumber: true,
          },
        },
      },
    });
    if (!route) {
      throw new Error("Route this Hunt to an opted-in seller first.");
    }
    if (
      route.hunt.matchPreference === "EXACT_ONLY" &&
      input.matchType !== "EXACT"
    ) {
      throw new Error("This buyer requested an exact match only.");
    }
    if (!route.shop.whatsappNumber.replace(/\D/g, "")) {
      throw new Error("This seller does not have a usable WhatsApp number.");
    }
    if (!isHuntPublicTextSafe(route.shop.name)) {
      throw new Error(
        "The seller display name contains contact details or markup and cannot be published on HUNT.",
      );
    }

    const now = new Date();
    const offer = await tx.huntOffer.upsert({
      where: {
        huntId_shopId: {
          huntId: input.huntId,
          shopId: input.shopId,
        },
      },
      create: {
        huntId: input.huntId,
        shopId: input.shopId,
        status: "PUBLISHED",
        matchType: input.matchType as HuntOfferMatchType,
        publicProductName: input.publicProductName,
        publicDescription: input.publicDescription ?? null,
        publicVariant: input.publicVariant ?? null,
        publicDeliveryEstimate: input.publicDeliveryEstimate,
        publicProofUrl: input.publicProofUrl ?? null,
        publicProofCapturedAt: input.publicProofCapturedAt ?? null,
        priceCents: input.priceCents,
        quantityAvailable: input.quantityAvailable ?? null,
        publicSellerNameSnapshot: route.shop.name,
        publicShopSlugSnapshot: route.shop.slug,
        publicSellerLogoUrlSnapshot: route.shop.logoUrl,
        publicSellerVerifiedSnapshot: route.shop.isVerified,
        sellerWhatsappSnapshot: route.shop.whatsappNumber,
        privateDataPurgeAfter: operationPurgeAfter(now),
        publishedAt: now,
      },
      update: {
        status: "PUBLISHED",
        matchType: input.matchType as HuntOfferMatchType,
        publicProductName: input.publicProductName,
        publicDescription: input.publicDescription ?? null,
        publicVariant: input.publicVariant ?? null,
        publicDeliveryEstimate: input.publicDeliveryEstimate,
        publicProofUrl: input.publicProofUrl ?? null,
        publicProofCapturedAt: input.publicProofCapturedAt ?? null,
        priceCents: input.priceCents,
        quantityAvailable: input.quantityAvailable ?? null,
        publicSellerNameSnapshot: route.shop.name,
        publicShopSlugSnapshot: route.shop.slug,
        publicSellerLogoUrlSnapshot: route.shop.logoUrl,
        publicSellerVerifiedSnapshot: route.shop.isVerified,
        sellerWhatsappSnapshot: route.shop.whatsappNumber,
        privateDataPurgeAfter: operationPurgeAfter(now),
        publishedAt: now,
        withdrawnAt: null,
      },
    });

    await Promise.all([
      tx.huntSellerRoute.update({
        where: { id: route.id },
        data: { status: "RESPONDED", respondedAt: now },
      }),
      tx.huntEvent.create({
        data: {
          huntId: input.huntId,
          offerId: offer.id,
          type: "OFFER_PUBLISHED",
          actor: "ADMIN",
          source: adminId.slice(0, 80),
          dedupeKey: `offer-published:${offer.id}:${now.toISOString()}`,
          purgeAfter: operationPurgeAfter(now),
        },
      }),
      tx.huntEvent.create({
        data: {
          huntId: input.huntId,
          offerId: offer.id,
          type: "SELLER_RESPONDED",
          actor: "SELLER",
          source: "public-offer-consent:whatsapp",
          dedupeKey: `seller-response-consent:${offer.id}:${now.toISOString()}`,
          purgeAfter: operationPurgeAfter(now),
        },
      }),
    ]);

    return offer;
  });
}

export async function withdrawHuntOffer(
  input: HuntAdminWithdrawOfferFields,
  adminId: string,
) {
  return runSerializableHuntOperation(async (tx) => {
    const offer = await tx.huntOffer.findFirst({
      where: {
        id: input.offerId,
        status: "PUBLISHED",
      },
      select: {
        id: true,
        huntId: true,
        publicProductName: true,
        hunt: {
          select: {
            slug: true,
            publicTitle: true,
            selectedOfferId: true,
          },
        },
      },
    });
    if (!offer) {
      throw new Error(
        "This offer is unavailable or already selected; take down the Hunt if the selected offer is unsafe.",
      );
    }
    if (offer.hunt.selectedOfferId === offer.id) {
      throw new Error(
        "A selected offer cannot be withdrawn; take down the Hunt if it is unsafe.",
      );
    }

    const now = new Date();
    const result = await tx.huntOffer.updateMany({
      where: { id: offer.id, status: "PUBLISHED" },
      data: { status: "WITHDRAWN", withdrawnAt: now },
    });
    if (result.count !== 1) throw new Error("This offer is no longer publishable.");

    await tx.huntEvent.create({
      data: {
        huntId: offer.huntId,
        offerId: offer.id,
        type: "OFFER_WITHDRAWN",
        actor: "ADMIN",
        source: adminId.slice(0, 80),
        purgeAfter: operationPurgeAfter(now),
      },
    });
    return offer;
  });
}

export async function dismissHuntReport(
  input: HuntAdminDismissReportFields,
  adminId: string,
) {
  return runSerializableHuntOperation(async (tx) => {
    const report = await tx.huntReport.findFirst({
      where: {
        id: input.reportId,
        status: { in: ["OPEN", "REVIEWING"] },
      },
      select: {
        id: true,
        huntId: true,
        hunt: {
          select: {
            slug: true,
            publicTitle: true,
          },
        },
      },
    });
    if (!report) throw new Error("This report is no longer open.");

    const result = await tx.huntReport.updateMany({
      where: {
        id: report.id,
        status: { in: ["OPEN", "REVIEWING"] },
      },
      data: {
        status: "DISMISSED",
        reviewedBy: adminId,
        reviewedAt: new Date(),
        resolutionNote: input.resolutionNote,
      },
    });
    if (result.count !== 1) {
      throw new Error("This report is no longer open.");
    }
    return report;
  });
}

export async function selectHuntOfferForOwner(input: {
  huntSlug: string;
  offerId: string;
  ownerFeatureId: string;
}) {
  return runSerializableHuntOperation(async (tx) => {
    const eligibilityCheckedAt = new Date();
    const hunt = await tx.hunt.findFirst({
      where: {
        slug: input.huntSlug,
        moderationStatus: "APPROVED",
        OR: [
          {
            status: "LIVE",
            expiresAt: { gt: eligibilityCheckedAt },
            selectedOfferId: null,
            fulfillmentStatus: "NONE",
          },
          {
            status: "FOUND",
            selectedOfferId: input.offerId,
          },
        ],
        privateData: { is: { ownerFeatureId: input.ownerFeatureId } },
      },
      select: {
        id: true,
        slug: true,
        status: true,
        publicTitle: true,
        desiredVariant: true,
        selectedOfferId: true,
      },
    });
    if (!hunt) {
      throw new Error(
        "This Hunt is unavailable, expired, or you are not its creator.",
      );
    }
    if (hunt.selectedOfferId && hunt.selectedOfferId !== input.offerId) {
      throw new Error("A different offer has already been selected.");
    }

    const offer = await tx.huntOffer.findFirst({
      where: {
        id: input.offerId,
        huntId: hunt.id,
        status: "PUBLISHED",
        sellerWhatsappSnapshot: { not: null },
      },
      select: {
        id: true,
        publicProductName: true,
        publicVariant: true,
        publicDeliveryEstimate: true,
        priceCents: true,
        sellerWhatsappSnapshot: true,
        shop: {
          select: { name: true },
        },
      },
    });
    if (!offer?.sellerWhatsappSnapshot) {
      throw new Error("This offer is no longer available.");
    }

    // Re-opening the already selected seller must be idempotent. In particular,
    // never regress FULFILLED to HANDOFF_SENT or rewrite the first handoff time.
    if (hunt.selectedOfferId === offer.id) {
      return { hunt, offer };
    }

    const now = new Date();
    const selection = await tx.hunt.updateMany({
      where: {
        id: hunt.id,
        status: "LIVE",
        expiresAt: { gt: now },
        selectedOfferId: null,
        fulfillmentStatus: "NONE",
      },
      data: {
        selectedOfferId: offer.id,
        status: "FOUND",
        resolvedAt: now,
        fulfillmentStatus: "HANDOFF_SENT",
        handoffAt: now,
      },
    });
    if (selection.count !== 1) {
      throw new Error("A different offer has already been selected.");
    }

    await Promise.all([
      tx.huntEvent.upsert({
        where: { dedupeKey: `offer-selected:${hunt.id}` },
        create: {
          huntId: hunt.id,
          offerId: offer.id,
          type: "OFFER_SELECTED",
          actor: "BUYER",
          visitorId: input.ownerFeatureId,
          dedupeKey: `offer-selected:${hunt.id}`,
          purgeAfter: operationPurgeAfter(now),
        },
        update: {},
      }),
      tx.huntEvent.upsert({
        where: { dedupeKey: `whatsapp-handoff:${hunt.id}` },
        create: {
          huntId: hunt.id,
          offerId: offer.id,
          type: "WHATSAPP_HANDOFF",
          actor: "BUYER",
          visitorId: input.ownerFeatureId,
          dedupeKey: `whatsapp-handoff:${hunt.id}`,
          purgeAfter: operationPurgeAfter(now),
        },
        update: {},
      }),
    ]);

    return { hunt, offer };
  });
}

export async function closeHuntForOwner(
  slug: string,
  ownerFeatureId: string,
) {
  return db.$transaction(async (tx) => {
    const hunt = await tx.hunt.findFirst({
      where: {
        slug,
        status: "LIVE",
        privateData: { is: { ownerFeatureId } },
      },
      select: { id: true },
    });
    if (!hunt) throw new Error("This Hunt cannot be closed.");

    const result = await tx.hunt.updateMany({
      where: { id: hunt.id, status: "LIVE" },
      data: { status: "CLOSED", resolvedAt: new Date() },
    });
    if (result.count !== 1) throw new Error("This Hunt cannot be closed.");
    await tx.huntEvent.create({
      data: {
        huntId: hunt.id,
        type: "CLOSED",
        actor: "BUYER",
        visitorId: ownerFeatureId,
        dedupeKey: `owner-close:${hunt.id}`,
        purgeAfter: operationPurgeAfter(),
      },
    });
    return { id: hunt.id, slug };
  });
}

export async function submitHuntReport(input: {
  huntSlug: string;
  reason: HuntReportReason;
  details?: string;
  reporterFeatureId: string;
}) {
  const hunt = await db.hunt.findFirst({
    where: {
      slug: input.huntSlug,
      moderationStatus: "APPROVED",
      status: { in: ["LIVE", "FOUND", "CLOSED", "EXPIRED"] },
    },
    select: { id: true },
  });
  if (!hunt) throw new Error("Hunt not found.");

  const report = await db.huntReport.upsert({
    where: {
      huntId_reporterFeatureId: {
        huntId: hunt.id,
        reporterFeatureId: input.reporterFeatureId,
      },
    },
    create: {
      huntId: hunt.id,
      reason: input.reason,
      details: input.details ?? null,
      reporterFeatureId: input.reporterFeatureId,
      purgeAfter: operationPurgeAfter(),
    },
    update: {
      reason: input.reason,
      details: input.details ?? null,
      status: "OPEN",
      reviewedBy: null,
      reviewedAt: null,
      resolutionNote: null,
    },
  });

  await db.huntEvent.upsert({
    where: { dedupeKey: `report:${report.id}` },
    create: {
      huntId: hunt.id,
      type: "REPORTED",
      actor: "BUYER",
      visitorId: input.reporterFeatureId,
      dedupeKey: `report:${report.id}`,
      purgeAfter: operationPurgeAfter(),
    },
    update: {},
  });
  return report;
}

export async function adminCloseHunt(huntId: string, adminId: string) {
  return db.$transaction(async (tx) => {
    const hunt = await tx.hunt.findFirst({
      where: { id: huntId, status: { in: ["LIVE", "FOUND"] } },
      select: { id: true, slug: true, publicTitle: true },
    });
    if (!hunt) throw new Error("Only a live or found Hunt can be closed.");

    const result = await tx.hunt.updateMany({
      where: { id: huntId, status: { in: ["LIVE", "FOUND"] } },
      data: { status: "CLOSED", resolvedAt: new Date() },
    });
    if (result.count !== 1) {
      throw new Error("Only a live or found Hunt can be closed.");
    }
    await tx.huntEvent.create({
      data: {
        huntId,
        type: "CLOSED",
        actor: "ADMIN",
        source: adminId.slice(0, 80),
        purgeAfter: operationPurgeAfter(),
      },
    });
    return hunt;
  });
}

export async function takeDownHunt(input: {
  huntId: string;
  reportId?: string;
  reason: string;
  adminId: string;
}) {
  return runSerializableHuntOperation(async (tx) => {
    if (input.reportId) {
      const linkedReport = await tx.huntReport.findFirst({
        where: { id: input.reportId, huntId: input.huntId },
        select: { id: true },
      });
      if (!linkedReport) {
        throw new Error("The selected report does not belong to this Hunt.");
      }
    }

    const hunt = await tx.hunt.update({
      where: { id: input.huntId },
      data: {
        status: "REJECTED",
        moderationStatus: "REJECTED",
        resolvedAt: new Date(),
      },
      select: {
        id: true,
        slug: true,
        publicTitle: true,
        publicImageKey: true,
      },
    });
    await tx.huntTakedown.create({
      data: {
        huntId: hunt.id,
        reportId: input.reportId ?? null,
        action: "HIDDEN",
        reason: input.reason,
        actorId: input.adminId,
      },
    });
    if (hunt.publicImageKey) {
      await tx.huntMediaDeletionJob.upsert({
        where: { fileKey: hunt.publicImageKey },
        create: {
          fileKey: hunt.publicImageKey,
          reason: "hunt-takedown",
        },
        update: {
          reason: "hunt-takedown",
          nextAttemptAt: new Date(),
        },
      });
    }
    if (input.reportId) {
      await tx.huntReport.update({
        where: { id: input.reportId },
        data: {
          status: "ACTIONED",
          reviewedBy: input.adminId,
          reviewedAt: new Date(),
          resolutionNote: input.reason,
        },
      });
    }
    await tx.huntEvent.create({
      data: {
        huntId: hunt.id,
        type: "TAKEN_DOWN",
        actor: "ADMIN",
        source: input.adminId.slice(0, 80),
        purgeAfter: operationPurgeAfter(),
      },
    });
    return hunt;
  });
}

export async function markHuntFulfilled(huntId: string, adminId: string) {
  return db.$transaction(async (tx) => {
    const now = new Date();
    const hunt = await tx.hunt.findFirst({
      where: {
        id: huntId,
        status: "FOUND",
        selectedOfferId: { not: null },
        fulfillmentStatus: "HANDOFF_SENT",
      },
      select: { id: true, slug: true, publicTitle: true },
    });
    if (!hunt) {
      throw new Error(
        "A buyer-selected offer and WhatsApp handoff are required before fulfilment.",
      );
    }

    const result = await tx.hunt.updateMany({
      where: {
        id: huntId,
        status: "FOUND",
        selectedOfferId: { not: null },
        fulfillmentStatus: "HANDOFF_SENT",
      },
      data: {
        status: "FOUND",
        fulfillmentStatus: "FULFILLED",
        fulfilledAt: now,
        resolvedAt: now,
      },
    });
    if (result.count !== 1) {
      throw new Error(
        "A buyer-selected offer and WhatsApp handoff are required before fulfilment.",
      );
    }
    await tx.huntEvent.upsert({
      where: { dedupeKey: `fulfilled:${hunt.id}` },
      create: {
        huntId: hunt.id,
        type: "FULFILLED",
        actor: "ADMIN",
        source: adminId.slice(0, 80),
        dedupeKey: `fulfilled:${hunt.id}`,
        purgeAfter: operationPurgeAfter(now),
      },
      update: {},
    });
    return hunt;
  });
}
