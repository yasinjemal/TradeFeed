// ============================================================
// Stage mode — the seller profile's density ladder
// ============================================================
// 90 of 116 live shops hold two products or fewer. A grid with
// one item looks broken; a plinth with one item looks curated.
// So the inventory block changes SHAPE at 1, 2, 3 and 8 rather
// than simply getting shorter.
//
// Pure, server-side, no measurement — no ResizeObserver, no
// client branch, so the first paint is already correct.
// ============================================================

export type TfStageMode =
  | "ask" // 0 products — no product-shaped container at all
  | "plinth" // 1 — one flagship at full width
  | "diptych" // 2 — a deliberate pair
  | "rail" // 3–7 — scroll-snap rail
  | "grid" // 8–19 — the full grid, chrome finally justified
  | "grid-dense"; // 20+ — grid plus sticky filters

export function resolveStageMode(productCount: number): TfStageMode {
  if (productCount <= 0) return "ask";
  if (productCount === 1) return "plinth";
  if (productCount === 2) return "diptych";
  if (productCount <= 7) return "rail";
  if (productCount <= 19) return "grid";
  return "grid-dense";
}

/**
 * Search, sort and category pills mount ONLY from 8 products up.
 * One product with a search box above it screams that nine are
 * missing. This is the whole sparse-data thesis.
 */
export function stageShowsBrowseChrome(mode: TfStageMode): boolean {
  return mode === "grid" || mode === "grid-dense";
}

/** The Ask Dock earns its place only while there is little to browse. */
export function stageShowsAskDock(mode: TfStageMode): boolean {
  return mode === "ask" || mode === "plinth" || mode === "diptych";
}

/**
 * Proof sits ABOVE inventory while inventory is thin, and BELOW it
 * once there is real stock — because then the stock is the proof.
 */
export function stageProofPlacement(mode: TfStageMode): "above" | "below" {
  return stageShowsAskDock(mode) ? "above" : "below";
}

// ── Nameplate ───────────────────────────────────────────────

/**
 * Character count is a blunt proxy for render width, but it is the
 * only one available on the server. Long names step down one stop
 * so a two-line clamp can never become three.
 */
export function resolveNameplateScale(name: string): "lg" | "md" | "sm" {
  const n = name.trim().length;
  if (n <= 14) return "lg";
  if (n <= 22) return "md";
  return "sm";
}

const MONOGRAM_MIN = 3;
const MONOGRAM_MAX = 11;

function initialsOf(name: string): string {
  const words = name
    .trim()
    .split(/\s+/)
    .filter((w) => /[a-z0-9]/i.test(w));
  const letters = words
    .slice(0, 3)
    .map((w) => w[0] ?? "")
    .join("");
  return letters.toUpperCase();
}

/**
 * The ghost word behind the nameplate. Derived, never seller-typed —
 * free text at 100px is UGC at hero scale and needs moderation first.
 *
 * Order: dominant category -> city -> first word of the shop name.
 *
 * A candidate equal to the shop name is REJECTED, because the ghost
 * exists to add a second fact behind the first. "RUT" ghosted behind
 * "RUT" reads as a rendering fault, not a design. When nothing adds
 * anything, this returns null and the hero renders no mark at all —
 * a clean nameplate beats a doubled one.
 */
export function resolveMonogramWord(
  shopName: string,
  dominantCategory?: string | null,
  city?: string | null,
): string | null {
  const name = shopName.trim().toUpperCase();
  const candidates = [dominantCategory, city, shopName.trim().split(/\s+/)[0]];

  for (const raw of candidates) {
    if (!raw) continue;
    const word = raw.trim().replace(/[^A-Za-z0-9 ]/g, "").toUpperCase();
    if (word.length < MONOGRAM_MIN || word.length > MONOGRAM_MAX) continue;
    if (word === name) continue; // adds nothing
    return word;
  }

  const initials = initialsOf(shopName);
  if (initials.length >= 2 && initials !== name) return initials;
  return null;
}

/** Most common category among the seller's products, by count. */
export function dominantCategoryName(
  products: { categoryName: string | null }[],
): string | null {
  const counts = new Map<string, number>();
  for (const p of products) {
    if (!p.categoryName) continue;
    counts.set(p.categoryName, (counts.get(p.categoryName) ?? 0) + 1);
  }
  let best: string | null = null;
  let bestCount = 0;
  for (const [name, count] of counts) {
    if (count > bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}
