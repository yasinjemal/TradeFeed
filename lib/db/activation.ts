// ============================================================
// Data Access — Signup-cohort activation funnel
// ============================================================
// Every conversion step starts with a User created in the selected period.
// Durable Shop/Product/Subscription state owns irreversible milestones;
// explicit seller events own share/upgrade milestones; consented,
// non-owner AnalyticsEvent rows own buyer-view and WhatsApp intent signals.
// ============================================================

import { db } from "@/lib/db";
import {
  calculateActivationMonetization,
  type ActivationMonetizationStats,
} from "@/lib/analytics/activation-monetization";
import { medianElapsedHours } from "@/lib/analytics/activation-timing";
import { sellerMilestoneTargetsShop } from "@/lib/analytics/seller-lifecycle";
import { ACTIVATION_BUYER_VIEW_FILTER } from "@/lib/analytics/visitor";
import { hasPaidEntitlement } from "@/lib/billing/subscription-status";

export type FunnelPeriod = "7d" | "30d" | "all";

export interface FunnelStep {
  key: string;
  label: string;
  description: string;
  count: number;
  pctOfTop: number;
  pctOfPrev: number;
}

export interface RecentSeller {
  shopId: string;
  shopName: string;
  shopSlug: string;
  city: string | null;
  ownerName: string | null;
  createdAt: Date;
  productCount: number;
  hasBuyerView: boolean;
  hasWhatsAppIntent: boolean;
  stage:
    | "shop_created"
    | "product_added"
    | "catalog_shared"
    | "first_buyer_view"
    | "first_whatsapp_intent";
  isActive: boolean;
}

export interface ActivationTimingMetric {
  key: string;
  label: string;
  medianHours: number | null;
  sampleSize: number;
}

export interface ActivationCohortWeek {
  weekStart: Date;
  signups: number;
  shopCreated: number;
  productAdded: number;
  catalogShared: number;
  buyerView: number;
  whatsappIntent: number;
  paidStarted: number;
}

export interface ProductActivationSource {
  source: "WEB" | "WHATSAPP" | "CSV" | "API" | "IMPORT";
  aiGenerated: boolean;
  sellers: number;
}

export interface ActivationStats {
  period: FunnelPeriod;
  periodStart: Date;
  activeSellers: number;
  funnel: FunnelStep[];
  timing: ActivationTimingMetric[];
  cohorts: ActivationCohortWeek[];
  productSources: ProductActivationSource[];
  monetization: ActivationMonetizationStats;
  recentSellers: RecentSeller[];
}

interface CohortJourney {
  userId: string;
  signupAt: Date;
  shopCreatedAt?: Date;
  firstProductAt?: Date;
  firstProductSource?: ProductActivationSource["source"];
  firstProductAiGenerated?: boolean;
  catalogSharedAt?: Date;
  firstBuyerViewAt?: Date;
  firstWhatsAppIntentAt?: Date;
  subscriptionStartedAt?: Date;
}

function getPeriodStart(period: FunnelPeriod): Date {
  if (period === "7d") return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  if (period === "30d") return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  return new Date(0);
}

function earlier(
  current: Date | undefined,
  candidate: Date | null | undefined,
): Date | undefined {
  if (!candidate) return current;
  return !current || candidate < current ? candidate : current;
}

function startOfUtcWeek(value: Date): Date {
  const result = new Date(
    Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()),
  );
  const daysSinceMonday = (result.getUTCDay() + 6) % 7;
  result.setUTCDate(result.getUTCDate() - daysSinceMonday);
  return result;
}

function isForward(
  startedAt: Date | undefined,
  completedAt: Date | undefined,
): boolean {
  return Boolean(
    startedAt &&
      completedAt &&
      completedAt.getTime() >= startedAt.getTime(),
  );
}

export async function getActivationStats(
  period: FunnelPeriod = "30d",
): Promise<ActivationStats> {
  const periodStart = getPeriodStart(period);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    allViewRows,
    recentViewRows,
    allIntentRows,
    cohortUsers,
    cohortShops,
  ] = await Promise.all([
    db.analyticsEvent.groupBy({
      by: ["shopId"],
      where: ACTIVATION_BUYER_VIEW_FILTER,
      _min: { createdAt: true },
    }),
    db.analyticsEvent.groupBy({
      by: ["shopId"],
      where: {
        ...ACTIVATION_BUYER_VIEW_FILTER,
        createdAt: { gte: thirtyDaysAgo },
      },
    }),
    db.analyticsEvent.groupBy({
      by: ["shopId"],
      where: {
        type: { in: ["WHATSAPP_CLICK", "WHATSAPP_CHECKOUT"] },
        visitorId: { not: null },
      },
      _min: { createdAt: true },
    }),
    db.user.findMany({
      where: { createdAt: { gte: periodStart } },
      select: { id: true, createdAt: true },
    }),
    db.shop.findMany({
      where: {
        isActive: true,
        users: {
          some: {
            role: "OWNER",
            user: { createdAt: { gte: periodStart } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        city: true,
        createdAt: true,
        products: {
          where: { isActive: true },
          orderBy: { createdAt: "asc" },
          take: 1,
          select: {
            createdAt: true,
            source: true,
            aiGenerated: true,
          },
        },
        _count: {
          select: { products: { where: { isActive: true } } },
        },
        subscription: {
          select: {
            status: true,
            currentPeriodEnd: true,
            plan: { select: { slug: true } },
          },
        },
        users: {
          where: { role: "OWNER" },
          select: {
            user: {
              select: {
                id: true,
                createdAt: true,
                firstName: true,
                lastName: true,
                onboardingEvents: {
                  where: {
                    step: {
                      in: [
                        "catalog_shared",
                        "upgrade_viewed",
                        "subscription_started",
                      ],
                    },
                  },
                  orderBy: { createdAt: "asc" },
                  select: {
                    step: true,
                    createdAt: true,
                    metadata: true,
                  },
                },
              },
            },
          },
        },
      },
    }),
  ]);

  const firstViewAtByShop = new Map(
    allViewRows.flatMap((row) =>
      row._min?.createdAt
        ? [[row.shopId, row._min.createdAt] as const]
        : [],
    ),
  );
  const firstIntentAtByShop = new Map(
    allIntentRows.flatMap((row) =>
      row._min?.createdAt
        ? [[row.shopId, row._min.createdAt] as const]
        : [],
    ),
  );
  const shopIdsWithRecentView = new Set(
    recentViewRows.map((row) => row.shopId),
  );

  const catalogSharedAtByShop = new Map<string, Date>();
  const upgradeViewedAtByShop = new Map<string, Date>();
  const subscriptionStartedAtByShop = new Map<string, Date>();

  for (const shop of cohortShops) {
    for (const event of shop.users.flatMap(
      ({ user }) => user.onboardingEvents,
    )) {
      if (!sellerMilestoneTargetsShop(event.metadata, shop.slug, shop.id)) {
        continue;
      }

      const target =
        event.step === "catalog_shared"
          ? catalogSharedAtByShop
          : event.step === "upgrade_viewed"
            ? upgradeViewedAtByShop
            : event.step === "subscription_started"
              ? subscriptionStartedAtByShop
              : null;
      if (target) {
        target.set(shop.id, earlier(target.get(shop.id), event.createdAt)!);
      }
    }
  }

  // GroupBy _min gives the first event ever, which can predate the seller's
  // share. Fetch the cohort's bounded event rows so sequential funnel steps
  // use the first qualifying event at or after the prior milestone.
  const cohortShopIds = cohortShops.map((shop) => shop.id);
  const [viewEvents, intentEvents] = await Promise.all([
    db.analyticsEvent.findMany({
      where: {
        shopId: { in: cohortShopIds },
        ...ACTIVATION_BUYER_VIEW_FILTER,
      },
      orderBy: { createdAt: "asc" },
      select: { shopId: true, createdAt: true },
    }),
    db.analyticsEvent.findMany({
      where: {
        shopId: { in: cohortShopIds },
        type: { in: ["WHATSAPP_CLICK", "WHATSAPP_CHECKOUT"] },
        visitorId: { not: null },
      },
      orderBy: { createdAt: "asc" },
      select: { shopId: true, createdAt: true },
    }),
  ]);
  const firstViewAfterShareByShop = new Map<string, Date>();
  for (const event of viewEvents) {
    const sharedAt = catalogSharedAtByShop.get(event.shopId);
    if (
      sharedAt &&
      event.createdAt >= sharedAt &&
      !firstViewAfterShareByShop.has(event.shopId)
    ) {
      firstViewAfterShareByShop.set(event.shopId, event.createdAt);
    }
  }
  const firstIntentAfterViewByShop = new Map<string, Date>();
  for (const event of intentEvents) {
    const viewedAt = firstViewAfterShareByShop.get(event.shopId);
    if (
      viewedAt &&
      event.createdAt >= viewedAt &&
      !firstIntentAfterViewByShop.has(event.shopId)
    ) {
      firstIntentAfterViewByShop.set(event.shopId, event.createdAt);
    }
  }

  const journeys = new Map<string, CohortJourney>(
    cohortUsers.map((user) => [
      user.id,
      { userId: user.id, signupAt: user.createdAt },
    ]),
  );

  for (const shop of cohortShops) {
    for (const { user } of shop.users) {
      const journey = journeys.get(user.id);
      // A later-added owner did not create this shop and must not be credited
      // with pre-signup activation.
      if (!journey || shop.createdAt < journey.signupAt) continue;

      journey.shopCreatedAt = earlier(journey.shopCreatedAt, shop.createdAt);

      const firstProduct = shop.products[0];
      if (
        firstProduct &&
        (!journey.firstProductAt ||
          firstProduct.createdAt < journey.firstProductAt)
      ) {
        journey.firstProductAt = firstProduct.createdAt;
        journey.firstProductSource = firstProduct.source;
        journey.firstProductAiGenerated = firstProduct.aiGenerated;
      }

      journey.catalogSharedAt = earlier(
        journey.catalogSharedAt,
        catalogSharedAtByShop.get(shop.id),
      );
      journey.firstBuyerViewAt = earlier(
        journey.firstBuyerViewAt,
        firstViewAfterShareByShop.get(shop.id),
      );
      journey.firstWhatsAppIntentAt = earlier(
        journey.firstWhatsAppIntentAt,
        firstIntentAfterViewByShop.get(shop.id),
      );
      journey.subscriptionStartedAt = earlier(
        journey.subscriptionStartedAt,
        subscriptionStartedAtByShop.get(shop.id),
      );
    }
  }

  const journeyRows = [...journeys.values()];
  const reachedShop = (journey: CohortJourney) =>
    isForward(journey.signupAt, journey.shopCreatedAt);
  const reachedProduct = (journey: CohortJourney) =>
    reachedShop(journey) &&
    isForward(journey.shopCreatedAt, journey.firstProductAt);
  const reachedShare = (journey: CohortJourney) =>
    reachedProduct(journey) &&
    isForward(journey.firstProductAt, journey.catalogSharedAt);
  const reachedView = (journey: CohortJourney) =>
    reachedShare(journey) &&
    isForward(journey.catalogSharedAt, journey.firstBuyerViewAt);
  const reachedIntent = (journey: CohortJourney) =>
    reachedView(journey) &&
    isForward(journey.firstBuyerViewAt, journey.firstWhatsAppIntentAt);

  const stepValues: [string, string, string, number][] = [
    ["signups", "Signups", "New user registrations", journeyRows.length],
    [
      "shop_created",
      "Shop Created",
      "Signup created an active shop",
      journeyRows.filter(reachedShop).length,
    ],
    [
      "product_added",
      "Product Added",
      "Published at least one product",
      journeyRows.filter(reachedProduct).length,
    ],
    [
      "catalog_shared",
      "Catalog Shared",
      "Shared after first product",
      journeyRows.filter(reachedShare).length,
    ],
    [
      "first_buyer_view",
      "First Buyer View",
      "Identified buyer viewed after share",
      journeyRows.filter(reachedView).length,
    ],
    [
      "first_whatsapp_intent",
      "WhatsApp Intent",
      "Identified buyer tapped after a view",
      journeyRows.filter(reachedIntent).length,
    ],
  ];

  const signups = journeyRows.length;
  const funnel: FunnelStep[] = stepValues.map(
    ([key, label, description, count], index) => ({
      key,
      label,
      description,
      count,
      pctOfTop: signups > 0 ? Math.round((count / signups) * 100) : 0,
      pctOfPrev:
        index === 0
          ? 100
          : stepValues[index - 1]![3] > 0
            ? Math.round((count / stepValues[index - 1]![3]) * 100)
            : 0,
    }),
  );

  const timingDefinitions = [
    {
      key: "shop_created",
      label: "Signup to shop",
      completedAt: (journey: CohortJourney) => journey.shopCreatedAt,
    },
    {
      key: "first_product",
      label: "Signup to first product",
      completedAt: (journey: CohortJourney) => journey.firstProductAt,
    },
    {
      key: "catalog_shared",
      label: "Signup to catalog share",
      completedAt: (journey: CohortJourney) => journey.catalogSharedAt,
    },
    {
      key: "first_buyer_view",
      label: "Signup to first buyer view",
      completedAt: (journey: CohortJourney) => journey.firstBuyerViewAt,
    },
  ] as const;

  const timing: ActivationTimingMetric[] = timingDefinitions.map(
    ({ key, label, completedAt }) => ({
      key,
      label,
      ...medianElapsedHours(
        journeyRows.map((journey) => ({
          startedAt: journey.signupAt,
          completedAt: completedAt(journey),
        })),
      ),
    }),
  );

  const cohortMap = new Map<string, ActivationCohortWeek>();
  for (const journey of journeyRows) {
    const weekStart = startOfUtcWeek(journey.signupAt);
    const key = weekStart.toISOString();
    const cohort =
      cohortMap.get(key) ??
      {
        weekStart,
        signups: 0,
        shopCreated: 0,
        productAdded: 0,
        catalogShared: 0,
        buyerView: 0,
        whatsappIntent: 0,
        paidStarted: 0,
      };
    cohort.signups += 1;
    if (reachedShop(journey)) cohort.shopCreated += 1;
    if (reachedProduct(journey)) cohort.productAdded += 1;
    if (reachedShare(journey)) cohort.catalogShared += 1;
    if (reachedView(journey)) cohort.buyerView += 1;
    if (reachedIntent(journey)) cohort.whatsappIntent += 1;
    if (isForward(journey.signupAt, journey.subscriptionStartedAt)) {
      cohort.paidStarted += 1;
    }
    cohortMap.set(key, cohort);
  }
  const cohorts = [...cohortMap.values()]
    .sort((a, b) => b.weekStart.getTime() - a.weekStart.getTime())
    .slice(0, 12);

  const sourceMap = new Map<string, ProductActivationSource>();
  for (const journey of journeyRows.filter(reachedProduct)) {
    if (!journey.firstProductSource) continue;
    const aiGenerated = journey.firstProductAiGenerated === true;
    const key = `${journey.firstProductSource}:${aiGenerated}`;
    const current = sourceMap.get(key);
    sourceMap.set(key, {
      source: journey.firstProductSource,
      aiGenerated,
      sellers: (current?.sellers ?? 0) + 1,
    });
  }
  const productSources = [...sourceMap.values()].sort(
    (a, b) => b.sellers - a.sellers,
  );

  const monetization = calculateActivationMonetization(
    cohortShops.map((shop) => ({
      upgradeViewedAt: upgradeViewedAtByShop.get(shop.id),
      subscriptionStartedAt: subscriptionStartedAtByShop.get(shop.id),
      authoritativePaid: hasPaidEntitlement(shop.subscription),
    })),
  );

  const shopsWithRecentView = await db.shop.findMany({
    where: {
      isActive: true,
      id: { in: [...shopIdsWithRecentView] },
    },
    select: {
      _count: {
        select: { products: { where: { isActive: true } } },
      },
    },
  });
  const activeSellers = shopsWithRecentView.filter(
    (shop) => shop._count.products >= 3,
  ).length;

  const recentSellers: RecentSeller[] = cohortShops
    .flatMap((shop) => {
      const owner = shop.users
        .map(({ user }) => user)
        .filter(
          (user) =>
            journeys.has(user.id) && user.createdAt <= shop.createdAt,
        )
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];
      if (!owner) return [];

      const hasBuyerView = firstViewAtByShop.has(shop.id);
      const hasWhatsAppIntent = firstIntentAtByShop.has(shop.id);
      const hasShared = catalogSharedAtByShop.has(shop.id);
      const hasProduct = shop._count.products > 0;
      const stage: RecentSeller["stage"] = hasWhatsAppIntent
        ? "first_whatsapp_intent"
        : hasBuyerView
          ? "first_buyer_view"
          : hasShared
            ? "catalog_shared"
            : hasProduct
              ? "product_added"
              : "shop_created";

      return [
        {
          shopId: shop.id,
          shopName: shop.name,
          shopSlug: shop.slug,
          city: shop.city,
          ownerName:
            [owner.firstName, owner.lastName].filter(Boolean).join(" ") ||
            null,
          createdAt: owner.createdAt,
          productCount: shop._count.products,
          hasBuyerView,
          hasWhatsAppIntent,
          stage,
          isActive:
            shop._count.products >= 3 &&
            shopIdsWithRecentView.has(shop.id),
        },
      ];
    })
    .slice(0, 25);

  return {
    period,
    periodStart,
    activeSellers,
    funnel,
    timing,
    cohorts,
    productSources,
    monetization,
    recentSellers,
  };
}
