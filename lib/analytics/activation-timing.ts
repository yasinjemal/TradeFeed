export interface ActivationTimingPair {
  startedAt: Date;
  completedAt: Date | null | undefined;
}

/**
 * Return the median elapsed time in hours for completed, forward-moving pairs.
 * Invalid clocks and incomplete milestones are excluded instead of skewing the
 * operational activation metric.
 */
export function medianElapsedHours(
  pairs: readonly ActivationTimingPair[],
): { medianHours: number | null; sampleSize: number } {
  const elapsedHours = pairs
    .flatMap(({ startedAt, completedAt }) => {
      if (!completedAt) return [];
      const elapsedMs = completedAt.getTime() - startedAt.getTime();
      return Number.isFinite(elapsedMs) && elapsedMs >= 0
        ? [elapsedMs / (60 * 60 * 1000)]
        : [];
    })
    .sort((a, b) => a - b);

  if (elapsedHours.length === 0) {
    return { medianHours: null, sampleSize: 0 };
  }

  const midpoint = Math.floor(elapsedHours.length / 2);
  const median =
    elapsedHours.length % 2 === 0
      ? (elapsedHours[midpoint - 1]! + elapsedHours[midpoint]!) / 2
      : elapsedHours[midpoint]!;

  return {
    medianHours: Math.round(median * 10) / 10,
    sampleSize: elapsedHours.length,
  };
}
