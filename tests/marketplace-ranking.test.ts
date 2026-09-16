import test from "node:test";
import assert from "node:assert/strict";
import {
  rankMarketplaceCandidates,
  type RankingCandidate,
} from "@/lib/marketplace/ranking";
const item = (
  id: string,
  extra: Partial<RankingCandidate> = {},
): RankingCandidate => ({
  id,
  name: id,
  createdAt: new Date("2026-01-01"),
  price: 100,
  rating: 0,
  reviews: 0,
  qualityScore: 50,
  activity: 0,
  relevance: 0,
  ...extra,
});
test("title relevance beats unrelated description relevance, without overriding chosen price order", () => {
  const list = [
    item("clothes", { name: "Dress", relevance: 100, price: 20 }),
    item("shoes", { name: "Everyday Sneakers", relevance: 1, price: 80 }),
  ];
  assert.equal(
    rankMarketplaceCandidates(list, "quality", "sneakers")[0]?.id,
    "shoes",
  );
  assert.equal(
    rankMarketplaceCandidates(list, "price_asc", "sneakers")[0]?.id,
    "clothes",
  );
});
test("ratings and prices rank globally before a page is sliced", () => {
  const list = Array.from({ length: 60 }, (_, i) =>
    item(String(i), { price: 60 - i, rating: i === 59 ? 5 : 0 }),
  );
  assert.equal(
    rankMarketplaceCandidates(list, "top_rated").slice(0, 24)[0]?.id,
    "59",
  );
  assert.equal(
    rankMarketplaceCandidates(list, "price_asc").slice(0, 24)[0]?.id,
    "59",
  );
  assert.deepEqual(
    rankMarketplaceCandidates([item("b"), item("a")], "quality").map(
      (i) => i.id,
    ),
    ["a", "b"],
  );
});
