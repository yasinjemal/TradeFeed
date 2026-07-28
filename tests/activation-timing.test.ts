import test from "node:test";
import assert from "node:assert/strict";

import { medianElapsedHours } from "@/lib/analytics/activation-timing";

const hour = 60 * 60 * 1000;
const startedAt = new Date("2026-01-01T00:00:00.000Z");

test("calculates an odd and even median in hours", () => {
  assert.deepEqual(
    medianElapsedHours(
      [1, 3, 10].map((hours) => ({
        startedAt,
        completedAt: new Date(startedAt.getTime() + hours * hour),
      })),
    ),
    { medianHours: 3, sampleSize: 3 },
  );

  assert.deepEqual(
    medianElapsedHours(
      [1, 3].map((hours) => ({
        startedAt,
        completedAt: new Date(startedAt.getTime() + hours * hour),
      })),
    ),
    { medianHours: 2, sampleSize: 2 },
  );
});

test("excludes incomplete and backward milestone pairs", () => {
  assert.deepEqual(
    medianElapsedHours([
      { startedAt, completedAt: null },
      {
        startedAt,
        completedAt: new Date(startedAt.getTime() - hour),
      },
    ]),
    { medianHours: null, sampleSize: 0 },
  );
});
