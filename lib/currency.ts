/**
 * Display helpers for South African Rand amounts.
 *
 * Product and order values are stored as integer cents. Keep that conversion
 * explicit so a UI cannot accidentally display cents as whole Rand values.
 */
const randNumber = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatZARRands(rands: number): string {
  if (!Number.isFinite(rands)) return "R 0";

  const rounded = Math.round((rands + Number.EPSILON) * 100) / 100;
  return `R ${randNumber.format(rounded)}`;
}

export function formatZARCents(cents: number): string {
  return formatZARRands(cents / 100);
}
