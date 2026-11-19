import test from "node:test";
import assert from "node:assert/strict";

import {
  buildProofRail,
  PROOF_RAIL_MAX,
  PROOF_RAIL_MIN,
  type ProofRailInput,
} from "@/lib/seller/proof-ladder";

/** The median live shop: no logo, no banner, no about, no products. */
function bareShop(overrides: Partial<ProofRailInput> = {}): ProofRailInput {
  return {
    shopName: "Thandi's Corner",
    city: null,
    province: null,
    memberSinceYear: null,
    aboutText: null,
    tagline: null,
    deliveryEnabled: true,
    collectionEnabled: true,
    fulfilmentConfirmed: false,
    ordersFulfilled: null,
    reviews: [],
    gallery: [],
    hoursSummary: null,
    ...overrides,
  };
}

const sellerFacts = (cards: { kind: string }[]) =>
  cards.filter((c) => c.kind !== "safe" && c.kind !== "more");

test("an empty shop renders no rail rather than a thin one", () => {
  assert.deepEqual(buildProofRail(bareShop()), []);
});

test("one or two honest facts still render nothing — never 1-2 cards", () => {
  const oneFact = buildProofRail(bareShop({ memberSinceYear: 2024 }));
  assert.deepEqual(oneFact, []);

  const twoFacts = buildProofRail(
    bareShop({ memberSinceYear: 2024, city: "Soweto" }),
  );
  assert.deepEqual(twoFacts, []);
});

test("the platform safety card can never be one of only two cards", () => {
  const cards = buildProofRail(bareShop({ memberSinceYear: 2024, city: "Soweto" }));
  assert.equal(cards.length, 0, "safe must not pad a two-fact shop to three");
});

test("three real facts open the rail, with safe appended", () => {
  const cards = buildProofRail(
    bareShop({
      memberSinceYear: 2024,
      city: "Soweto",
      tagline: "Sneakers and streetwear, delivered across Gauteng.",
    }),
  );
  assert.ok(sellerFacts(cards).length >= PROOF_RAIL_MIN);
  assert.equal(cards.at(-1)?.kind, "safe");
});

test("cards are ordered by persuasive weight", () => {
  const cards = buildProofRail(
    bareShop({
      memberSinceYear: 2024,
      city: "Soweto",
      tagline: "Sneakers and streetwear.",
      ordersFulfilled: 127,
      hoursSummary: "Mon–Sat 9:00–17:00",
      reviews: [
        { id: "r1", comment: "Fast delivery, exactly as pictured.", buyerName: "Sipho", rating: 5 },
      ],
      gallery: [{ id: "g1", url: "https://cdn/1.jpg", caption: null, isVideo: false }],
    }),
  );
  const order = cards.map((c) => c.kind);
  assert.equal(order[0], "review");
  assert.equal(order[1], "photo");
  assert.ok(order.indexOf("stat") < order.indexOf("place"));
  assert.ok(order.indexOf("place") < order.indexOf("quote"));
  assert.ok(order.indexOf("quote") < order.indexOf("hours"));
});

test("no card is emitted without a fact behind it", () => {
  const cards = buildProofRail(
    bareShop({
      memberSinceYear: 2024,
      city: "Soweto",
      tagline: "Sneakers.",
      ordersFulfilled: 0,
      aboutText: "   ",
      reviews: [{ id: "r1", comment: "   ", buyerName: null, rating: 5 }],
      gallery: [{ id: "g1", url: "", caption: null, isVideo: false }],
    }),
  );
  assert.equal(cards.some((c) => c.kind === "review"), false, "blank review excluded");
  assert.equal(cards.some((c) => c.kind === "photo"), false, "blank photo URL excluded");
  assert.equal(
    cards.some((c) => c.kind === "stat" && c.id === "orders"),
    false,
    "zero orders is not a stat",
  );
});

test("province stands in when a shop never picked a city", () => {
  const cards = buildProofRail(
    bareShop({ memberSinceYear: 2024, province: "Gauteng", tagline: "Sneakers." }),
  );
  const place = cards.find((c) => c.kind === "place");
  assert.equal(place?.kind === "place" && place.city, "Gauteng");
});

test("a city always wins over the province", () => {
  const cards = buildProofRail(
    bareShop({
      memberSinceYear: 2024,
      city: "Soweto",
      province: "Gauteng",
      tagline: "Sneakers.",
    }),
  );
  const place = cards.find((c) => c.kind === "place");
  assert.equal(place?.kind === "place" && place.city, "Soweto");
});

test("fulfilment mode is withheld until the seller confirmed it", () => {
  const unconfirmed = buildProofRail(
    bareShop({ memberSinceYear: 2024, city: "Soweto", tagline: "Sneakers." }),
  );
  const place = unconfirmed.find((c) => c.kind === "place");
  assert.equal(place?.kind === "place" && place.mode, null);

  const confirmed = buildProofRail(
    bareShop({
      memberSinceYear: 2024,
      city: "Soweto",
      tagline: "Sneakers.",
      fulfilmentConfirmed: true,
    }),
  );
  const confirmedPlace = confirmed.find((c) => c.kind === "place");
  assert.equal(confirmedPlace?.kind === "place" && confirmedPlace.mode, "both");
});

test("video gallery items never become still proof cards", () => {
  const cards = buildProofRail(
    bareShop({
      memberSinceYear: 2024,
      city: "Soweto",
      tagline: "Sneakers.",
      gallery: [{ id: "v1", url: "https://cdn/clip.mp4", caption: null, isVideo: true }],
    }),
  );
  assert.equal(cards.some((c) => c.kind === "photo"), false);
});

test("the same fact is never shown twice", () => {
  const cards = buildProofRail(
    bareShop({
      memberSinceYear: 2024,
      city: "Soweto",
      tagline: "Sneakers.",
      aboutText: "A longer story about the shop.",
      ordersFulfilled: 40,
      hoursSummary: "Mon–Sat",
      reviews: [
        { id: "r1", comment: "Great", buyerName: "A", rating: 5 },
        { id: "r2", comment: "Good", buyerName: "B", rating: 4 },
      ],
      gallery: [
        { id: "g1", url: "https://cdn/1.jpg", caption: null, isVideo: false },
        { id: "g2", url: "https://cdn/2.jpg", caption: null, isVideo: false },
      ],
    }),
  );
  // Cards are keyed by kind plus their own discriminator, so two
  // different stats (orders, since) are two facts, not a duplicate.
  const keys = cards.map((c) => ("id" in c ? `${c.kind}:${c.id}` : c.kind));
  assert.equal(new Set(keys).size, keys.length, `duplicate fact in ${keys.join(", ")}`);
});

test("the rail never becomes an infinite scroller", () => {
  const cards = buildProofRail(
    bareShop({
      memberSinceYear: 2024,
      city: "Soweto",
      tagline: "Sneakers.",
      aboutText: "Story.",
      ordersFulfilled: 99,
      hoursSummary: "Mon–Sat",
      reviews: [
        { id: "r1", comment: "Great", buyerName: "A", rating: 5 },
        { id: "r2", comment: "Good", buyerName: "B", rating: 4 },
        { id: "r3", comment: "Fine", buyerName: "C", rating: 4 },
      ],
      gallery: Array.from({ length: 9 }, (_, i) => ({
        id: `g${i}`,
        url: `https://cdn/${i}.jpg`,
        caption: null,
        isVideo: false,
      })),
      moreCount: 12,
      moreHref: "/catalog/thandi",
    }),
  );
  assert.ok(cards.length <= PROOF_RAIL_MAX + 1, `got ${cards.length} cards`);
  assert.equal(cards.at(-1)?.kind, "more");
  assert.equal(cards.filter((c) => c.kind === "review").length, 2, "reviews capped at 2");
});

test("long quotes are clipped, not wrapped forever", () => {
  const long = "x".repeat(400);
  const cards = buildProofRail(
    bareShop({ memberSinceYear: 2024, city: "Soweto", tagline: long }),
  );
  const quote = cards.find((c) => c.kind === "quote");
  assert.ok(quote?.kind === "quote" && quote.text.length <= 150);
});
