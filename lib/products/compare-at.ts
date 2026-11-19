// ============================================================
// Compare-at ("was") price — the one rule
// ============================================================
// A seller may give an option a "was" price. Buyers see it
// crossed out next to the real price, with the saving as a
// percentage. This file is the single place that decides
// whether a was-price is shown, so the seller's preview, the
// catalogue card and the product page can never disagree.
//
// No server-only imports: used by client components too.
// ============================================================

/** What a buyer is shown when a was-price applies. Same unit as the inputs. */
export interface SaleDisplay {
  compareAt: number;
  /** Whole percent saved, 1–99. */
  percentOff: number;
}

/**
 * Decide whether a was-price is shown.
 *
 * It counts only when it is above the price the buyer actually pays
 * and the saving is at least 1% once rounded. Anything else (no
 * was-price, a was-price at or below the price, a price that was
 * later raised past it) shows the plain price.
 *
 * Unit-agnostic: pass both values in cents, or both in rands.
 */
export function resolveSale(
  price: number,
  compareAt: number | null | undefined,
): SaleDisplay | null {
  if (compareAt == null || !Number.isFinite(compareAt) || !Number.isFinite(price)) return null;
  if (price <= 0 || compareAt <= price) return null;

  const percentOff = Math.min(99, Math.round(((compareAt - price) / compareAt) * 100));
  if (percentOff < 1) return null;
  return { compareAt, percentOff };
}

/** Shown when a was-price field does not hold a plain rand amount. */
export const WAS_PRICE_FORMAT_MESSAGE = "Enter the was-price in rands, for example 199.99";

/**
 * Why a was-price cannot be saved with this price, in words for the
 * seller, or null when it is fine. A was-price that would not be shown
 * is refused rather than stored and silently ignored. Both in cents.
 */
export function wasPriceProblem(priceCents: number, compareAtCents: number): string | null {
  if (compareAtCents <= priceCents) {
    return "The was-price must be higher than the price. Leave it empty if there is no saving.";
  }
  if (!resolveSale(priceCents, compareAtCents)) {
    return "The saving is under 1%, so buyers would not see it. Leave the was-price empty.";
  }
  return null;
}

const MAX_RANDS = 999_999;

/**
 * Read a rand amount a seller typed ("199", "199.99", "199,99")
 * as cents. Returns null for anything else, so a typo is reported
 * instead of being quietly read as a different number.
 */
export function randsToCents(raw: string): number | null {
  const value = raw.trim();
  if (!/^\d+(?:[.,]\d+)?$/.test(value)) return null;
  const rands = Number.parseFloat(value.replace(",", "."));
  if (!Number.isFinite(rands) || rands <= 0 || rands > MAX_RANDS) return null;
  return Math.round(rands * 100);
}
