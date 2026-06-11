// ============================================================
// Catalogue Import — CSV Rows → Draft Seeds (pure, Flow C)
// ============================================================
// Folds the existing CSV columns into the shared review grid.
// Consecutive rows with the same product name are grouped into
// one draft (one row per size is the common CSV shape).
// No AI needed — the spreadsheet IS the structured data.
// ============================================================

import type { CsvRow } from "@/lib/csv/parser";

export interface CsvDraftSeed {
  title: string;
  description: string | null;
  priceMinCents: number | null;
  sizes: string[];
  colours: string[];
  rowErrors: string[];
}

const MAX_ITEMS = 50;

function parsePriceCell(value: string | undefined): number | null {
  if (!value) return null;
  const cleaned = value.replace(/[rR,\s]/g, "");
  const parsed = parseFloat(cleaned);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  const cents = Math.round(parsed * 100);
  return cents >= 100 && cents <= 100_000_000 ? cents : null;
}

/**
 * Map auto-mapped CSV rows into draft seeds, grouping rows that
 * share a product name (case-insensitive) into one draft with
 * multiple sizes. Mapping = { csvHeader → ourColumn } from
 * autoMapColumns(); rows are raw CsvRow keyed by csv header.
 */
export function csvRowsToDraftSeeds(
  rows: CsvRow[],
  mapping: Record<string, string>
): CsvDraftSeed[] {
  // Invert: ourColumn → csvHeader
  const col: Record<string, string> = {};
  for (const [header, our] of Object.entries(mapping)) col[our] = header;

  const get = (row: CsvRow, our: string): string =>
    (col[our] !== undefined ? row[col[our]!] : undefined)?.trim() ?? "";

  const byName = new Map<string, CsvDraftSeed>();

  for (const row of rows) {
    const name = get(row, "name");
    if (!name) continue;

    const key = name.toLowerCase();
    const price = parsePriceCell(get(row, "price"));
    const size = get(row, "size");
    const colour = get(row, "color");
    const description = get(row, "description");

    const existing = byName.get(key);
    if (existing) {
      if (size && !existing.sizes.includes(size)) existing.sizes.push(size);
      if (colour && !existing.colours.includes(colour)) existing.colours.push(colour);
      // First non-null price wins; flag mismatches
      if (price !== null && existing.priceMinCents !== null && price !== existing.priceMinCents) {
        if (!existing.rowErrors.includes("mixed_prices")) existing.rowErrors.push("mixed_prices");
      }
      if (price !== null && existing.priceMinCents === null) existing.priceMinCents = price;
    } else {
      if (byName.size >= MAX_ITEMS) break;
      byName.set(key, {
        title: name.slice(0, 200),
        description: description ? description.slice(0, 2000) : null,
        priceMinCents: price,
        sizes: size ? [size] : [],
        colours: colour ? [colour] : [],
        rowErrors: [],
      });
    }
  }

  return [...byName.values()];
}
