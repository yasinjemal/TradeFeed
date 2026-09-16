export interface RankingCandidate {
  id: string;
  name: string;
  createdAt: Date;
  qualityScore: number;
  price: number;
  rating: number;
  reviews: number;
  activity: number;
  relevance: number;
}

/** Rank the eligible result set before pagination, with a stable final tie-break. */
export function rankMarketplaceCandidates<T extends RankingCandidate>(
  candidates: readonly T[],
  sort: string,
  query = "",
): T[] {
  const words = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  const nameMatch = (item: T) =>
    words.length > 0 &&
    words.every((word) => item.name.toLocaleLowerCase().includes(word));
  return [...candidates].sort((a, b) => {
    let score = 0;
    switch (sort) {
      case "price_asc":
        score = a.price - b.price;
        break;
      case "price_desc":
        score = b.price - a.price;
        break;
      case "newest":
        score = b.createdAt.getTime() - a.createdAt.getTime();
        break;
      case "top_rated":
        score = b.rating - a.rating || b.reviews - a.reviews;
        break;
      case "trending":
      case "popular":
        score = b.activity - a.activity;
        break;
      default:
        score = words.length
          ? Number(nameMatch(b)) - Number(nameMatch(a)) ||
            b.relevance - a.relevance
          : 0;
        score ||= b.qualityScore - a.qualityScore;
    }
    return (
      score ||
      b.createdAt.getTime() - a.createdAt.getTime() ||
      a.id.localeCompare(b.id)
    );
  });
}
