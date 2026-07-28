import test from "node:test";
import assert from "node:assert/strict";

import { calculateActivationMonetization } from "@/lib/analytics/activation-monetization";

const hour = 60 * 60 * 1000;
const viewedAt = new Date("2026-01-01T00:00:00.000Z");

test("summarizes unique shop upgrade journeys and median conversion time", () => {
  assert.deepEqual(
    calculateActivationMonetization([
      {
        upgradeViewedAt: viewedAt,
        subscriptionStartedAt: new Date(viewedAt.getTime() + hour),
        authoritativePaid: true,
      },
      {
        upgradeViewedAt: viewedAt,
        subscriptionStartedAt: new Date(viewedAt.getTime() + 3 * hour),
        authoritativePaid: true,
      },
      {
        upgradeViewedAt: viewedAt,
        subscriptionStartedAt: null,
        authoritativePaid: true,
      },
      {
        upgradeViewedAt: null,
        subscriptionStartedAt: new Date(viewedAt.getTime() + hour),
      },
    ]),
    {
      upgradeViewed: 3,
      subscriptionStarted: 3,
      convertedAfterView: 2,
      conversionRate: 67,
      medianHoursFromUpgradeView: 2,
      medianSampleSize: 2,
      authoritativePaidShops: 3,
      missingStartEvents: 1,
      eventCoverageRate: 67,
      reconciliationStatus: "attention",
    },
  );
});

test("does not count a paid start before the first upgrade view as conversion", () => {
  assert.deepEqual(
    calculateActivationMonetization([
      {
        upgradeViewedAt: viewedAt,
        subscriptionStartedAt: new Date(viewedAt.getTime() - hour),
      },
    ]),
    {
      upgradeViewed: 1,
      subscriptionStarted: 1,
      convertedAfterView: 0,
      conversionRate: 0,
      medianHoursFromUpgradeView: null,
      medianSampleSize: 0,
      authoritativePaidShops: 0,
      missingStartEvents: 0,
      eventCoverageRate: 100,
      reconciliationStatus: "healthy",
    },
  );
});

test("returns zeroed metrics when the cohort has no upgrade views", () => {
  assert.deepEqual(calculateActivationMonetization([]), {
    upgradeViewed: 0,
    subscriptionStarted: 0,
    convertedAfterView: 0,
    conversionRate: 0,
    medianHoursFromUpgradeView: null,
    medianSampleSize: 0,
    authoritativePaidShops: 0,
    missingStartEvents: 0,
    eventCoverageRate: 100,
    reconciliationStatus: "healthy",
  });
});

test("reconciles recorded paid starts against durable subscription state", () => {
  const paidAt = new Date(viewedAt.getTime() + hour);
  assert.deepEqual(
    calculateActivationMonetization([
      {
        upgradeViewedAt: viewedAt,
        subscriptionStartedAt: paidAt,
        authoritativePaid: true,
      },
      {
        upgradeViewedAt: null,
        subscriptionStartedAt: null,
        authoritativePaid: true,
      },
    ]),
    {
      upgradeViewed: 1,
      subscriptionStarted: 1,
      convertedAfterView: 1,
      conversionRate: 100,
      medianHoursFromUpgradeView: 1,
      medianSampleSize: 1,
      authoritativePaidShops: 2,
      missingStartEvents: 1,
      eventCoverageRate: 50,
      reconciliationStatus: "attention",
    },
  );
});
