// ============================================================
// Proof ladder — evidence, never filler
// ============================================================
// The seller profile must look deliberate at zero products. The
// Proof Rail does that work: every card carries a REAL fact the
// shop already owns — a review, a photo, a city, a join date.
//
// The whole design rests on one invariant, asserted in tests:
//   a card is emitted only when a fact backs it, and if fewer
//   than three honest cards exist the rail returns [] and does
//   not render at all. Padding is never an option.
// ============================================================

export type ProofCard =
  | {
      kind: "review";
      id: string;
      quote: string;
      buyerName: string | null;
      rating: number;
    }
  | { kind: "photo"; id: string; url: string; alt: string }
  | { kind: "stat"; id: string; label: string; value: number; suffix?: string }
  | { kind: "place"; city: string; mode: "collection" | "delivery" | "both" | null }
  | { kind: "quote"; text: string }
  | { kind: "hours"; summary: string }
  | { kind: "safe" }
  | { kind: "more"; count: number; href: string };

export interface ProofRailInput {
  shopName: string;
  city: string | null;
  province: string | null;
  memberSinceYear: number | null;
  aboutText: string | null;
  tagline: string | null;
  deliveryEnabled: boolean;
  collectionEnabled: boolean;
  /** Only pass fulfilment through when the seller actually confirmed it. */
  fulfilmentConfirmed: boolean;
  ordersFulfilled: number | null;
  reviews: { id: string; comment: string | null; buyerName: string | null; rating: number }[];
  gallery: { id: string; url: string; caption: string | null; isVideo: boolean }[];
  hoursSummary: string | null;
  /** Products beyond those shown inline, for the terminal "more" card. */
  moreCount?: number;
  moreHref?: string;
}

/** Minimum honest cards, below which the rail does not render. */
export const PROOF_RAIL_MIN = 3;
/** Hard cap, excluding the terminal "more" card. */
export const PROOF_RAIL_MAX = 8;

const MAX_QUOTE = 150;

function trim(value: string | null | undefined): string | null {
  const v = value?.trim();
  return v ? v : null;
}

function clip(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

/**
 * `safe` is a platform fact, not a seller fact. It may never be one
 * of only two cards, so it carries zero weight toward PROOF_RAIL_MIN.
 */
function isSellerFact(card: ProofCard): boolean {
  return card.kind !== "safe" && card.kind !== "more";
}

export function buildProofRail(input: ProofRailInput): ProofCard[] {
  const cards: ProofCard[] = [];

  // 1. Reviews — the strongest evidence a stranger can offer.
  for (const review of input.reviews) {
    const comment = trim(review.comment);
    if (!comment) continue;
    cards.push({
      kind: "review",
      id: review.id,
      quote: clip(comment, MAX_QUOTE),
      buyerName: trim(review.buyerName),
      rating: review.rating,
    });
    if (cards.length >= 2) break; // at most two reviews on the rail
  }

  // 2. Gallery photos — the shop, the packaging, hands at work.
  //    Video needs a player; the rail stays still, so images only.
  const photos = input.gallery.filter((g) => !g.isVideo && trim(g.url));
  for (const photo of photos.slice(0, 3)) {
    cards.push({
      kind: "photo",
      id: photo.id,
      url: photo.url,
      alt: trim(photo.caption) ?? `${input.shopName} photo`,
    });
  }

  // 3. Hard numbers, only when non-zero.
  if (input.ordersFulfilled != null && input.ordersFulfilled > 0) {
    cards.push({
      kind: "stat",
      id: "orders",
      label: "Orders fulfilled",
      value: input.ordersFulfilled,
    });
  }
  if (input.memberSinceYear != null) {
    cards.push({
      kind: "stat",
      id: "since",
      label: "On TradeFeed since",
      value: input.memberSinceYear,
    });
  }

  // 4. Where you can actually get it — only once the seller said so.
  // The shop IS in Soweto whether or not settings were ever opened —
  // that is an honest fact. What needs confirming is the PROMISE, so
  // the mode label is withheld until the seller confirmed fulfilment.
  // 60 of 116 live shops have a city and 55 a province. Falling back
  // to the province keeps this an honest fact for a shop that only
  // ever picked a region.
  const city = trim(input.city) ?? trim(input.province);
  if (city) {
    const mode: "collection" | "delivery" | "both" | null = !input.fulfilmentConfirmed
      ? null
      : input.deliveryEnabled && input.collectionEnabled
        ? "both"
        : input.collectionEnabled
          ? "collection"
          : input.deliveryEnabled
            ? "delivery"
            : null;
    cards.push({ kind: "place", city, mode });
  }

  // 5. The seller's own words.
  const voice = trim(input.tagline) ?? trim(input.aboutText);
  if (voice) cards.push({ kind: "quote", text: clip(voice, MAX_QUOTE) });

  // 6. Opening hours, when published.
  const hours = trim(input.hoursSummary);
  if (hours) cards.push({ kind: "hours", summary: hours });

  // Below the floor, show nothing rather than something thin.
  if (cards.filter(isSellerFact).length < PROOF_RAIL_MIN) return [];

  const capped = cards.slice(0, PROOF_RAIL_MAX - 1);

  // 7. Platform safety closes the rail.
  capped.push({ kind: "safe" });

  if (input.moreCount && input.moreCount > 0 && input.moreHref) {
    capped.push({ kind: "more", count: input.moreCount, href: input.moreHref });
  }

  return capped;
}
