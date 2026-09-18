import test from "node:test";
import assert from "node:assert/strict";
import { primarySearchMatches } from "@/lib/marketplace/search-intent";
import { buyerOptions, needsSizeConfirmation } from "@/lib/products/buyer-options";
import { matchesCheckoutProof } from "@/lib/support/checkout-proof";
test("guest checkout proof rejects absent, guessed and mismatched capabilities", () => {
  const key = "3e31de04-04a8-4e10-bbe1-5e141f13a188";
  assert.equal(matchesCheckoutProof(key, key), true);
  assert.equal(matchesCheckoutProof(key, "other"), false);
  assert.equal(matchesCheckoutProof(key), false);
  assert.equal(matchesCheckoutProof(null, key), false);
  assert.equal(matchesCheckoutProof("short", "short"), false);
});
test("explicit footwear matches exclude incidental clothing hits before sorting", () => {
  const products = [{name:"Polo and chinos"}, {name:"Everyday Sneakers"}, {name:"Leather sneaker"}];
  assert.deepEqual(primarySearchMatches(products, "sneakers"), products.slice(1));
  assert.deepEqual(primarySearchMatches(products, "sneekers"), products);
  assert.deepEqual(primarySearchMatches(products, ""), products);
});
test("size claims need real options while single-option goods remain orderable", () => {
  const placeholder = [{size:"Default"}];
  assert.equal(needsSizeConfirmation("Polo shirt — S-XXL", placeholder), true);
  assert.equal(needsSizeConfirmation("Shoes size 6-12", placeholder), true);
  assert.equal(needsSizeConfirmation("Gift box", placeholder), false);
  assert.equal(needsSizeConfirmation("Polo S-XXL", [{size:"M"}]), false);
  assert.deepEqual(buyerOptions([...placeholder, {size:"M"}]), [{size:"M"}]);
  assert.deepEqual(buyerOptions(placeholder), placeholder);
});

import { allowDiscoveryPromotions } from "@/lib/marketplace/promoted-context";
test("promotions cannot insert unrelated items into search, location, category or price results", () => {
  assert.equal(allowDiscoveryPromotions({sortBy:"quality"}), true);
  for (const filters of [{search:"sneakers"},{city:"Johannesburg"},{parentCategory:"mens-clothing"},{category:"shoes"},{minPrice:0},{verifiedOnly:true},{sortBy:"price_asc"}]) {
    assert.equal(allowDiscoveryPromotions(filters), false);
  }
});
