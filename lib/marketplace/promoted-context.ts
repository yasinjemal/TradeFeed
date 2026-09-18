/** Paid placements must not bypass a buyer's filters or explicit sort order. */
export function allowDiscoveryPromotions(filters: {
  search?: string; category?: string; parentCategory?: string;
  province?: string; city?: string; minPrice?: number; maxPrice?: number;
  verifiedOnly?: boolean; sortBy?: string;
}): boolean {
  return !filters.search && !filters.category && !filters.parentCategory &&
    !filters.province && !filters.city && filters.minPrice == null &&
    filters.maxPrice == null && !filters.verifiedOnly &&
    (!filters.sortBy || filters.sortBy === "quality");
}
