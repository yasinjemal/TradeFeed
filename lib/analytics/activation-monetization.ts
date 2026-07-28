import { medianElapsedHours } from "@/lib/analytics/activation-timing";

export interface ShopMonetizationJourney {
  upgradeViewedAt: Date | null | undefined;
  subscriptionStartedAt: Date | null | undefined;
  authoritativePaid?: boolean;
}

export interface ActivationMonetizationStats {
  upgradeViewed: number;
  subscriptionStarted: number;
  convertedAfterView: number;
  conversionRate: number;
  medianHoursFromUpgradeView: number | null;
  medianSampleSize: number;
  authoritativePaidShops: number;
  missingStartEvents: number;
  eventCoverageRate: number;
  reconciliationStatus: "healthy" | "attention";
}

/**
 * Summarize unique, shop-scoped upgrade journeys.
 *
 * A paid start only counts as a view-to-paid conversion when it happened at
 * or after that shop's first recorded upgrade view. Starts without a recorded
 * view remain visible in the paid-start total without inflating conversion.
 */
export function calculateActivationMonetization(
  journeys: readonly ShopMonetizationJourney[],
): ActivationMonetizationStats {
  const upgradeViewed = journeys.filter(
    ({ upgradeViewedAt }) => Boolean(upgradeViewedAt),
  ).length;
  const subscriptionStarted = journeys.filter(
    ({ subscriptionStartedAt }) => Boolean(subscriptionStartedAt),
  ).length;
  const convertedJourneys = journeys.filter(
    ({ upgradeViewedAt, subscriptionStartedAt }) =>
      Boolean(
        upgradeViewedAt &&
          subscriptionStartedAt &&
          subscriptionStartedAt.getTime() >= upgradeViewedAt.getTime(),
      ),
  );
  const convertedAfterView = convertedJourneys.length;
  const conversionRate =
    upgradeViewed > 0
      ? Math.round((convertedAfterView / upgradeViewed) * 100)
      : 0;
  const conversionTiming = medianElapsedHours(
    convertedJourneys.map(({ upgradeViewedAt, subscriptionStartedAt }) => ({
      startedAt: upgradeViewedAt!,
      completedAt: subscriptionStartedAt,
    })),
  );
  const authoritativePaidShops = journeys.filter(
    ({ authoritativePaid }) => authoritativePaid === true,
  ).length;
  const missingStartEvents = journeys.filter(
    ({ authoritativePaid, subscriptionStartedAt }) =>
      authoritativePaid === true && !subscriptionStartedAt,
  ).length;
  const eventCoverageRate =
    authoritativePaidShops > 0
      ? Math.round(
          ((authoritativePaidShops - missingStartEvents) /
            authoritativePaidShops) *
            100,
        )
      : 100;

  return {
    upgradeViewed,
    subscriptionStarted,
    convertedAfterView,
    conversionRate,
    medianHoursFromUpgradeView: conversionTiming.medianHours,
    medianSampleSize: conversionTiming.sampleSize,
    authoritativePaidShops,
    missingStartEvents,
    eventCoverageRate,
    reconciliationStatus: missingStartEvents === 0 ? "healthy" : "attention",
  };
}
