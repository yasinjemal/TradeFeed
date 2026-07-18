import test from "node:test";
import assert from "node:assert/strict";
import {
  INDEX_GATES,
  categoryIndexable,
  shopIndexable,
  productIndexable,
  robotsFor,
} from "@/lib/seo/should-index";

test("categoryIndexable gates on minimum product count", () => {
  assert.equal(categoryIndexable({ productCount: 0 }), false);
  assert.equal(
    categoryIndexable({ productCount: INDEX_GATES.category.minProducts - 1 }),
    false,
  );
  assert.equal(
    categoryIndexable({ productCount: INDEX_GATES.category.minProducts }),
    true,
  );
});

test("shopIndexable requires both product count and description length", () => {
  const goodDescription = Array(INDEX_GATES.shop.minDescriptionWords)
    .fill("word")
    .join(" ");

  assert.equal(
    shopIndexable({ productCount: 3, description: goodDescription }),
    true,
  );
  assert.equal(
    shopIndexable({ productCount: 2, description: goodDescription }),
    false,
  );
  assert.equal(
    shopIndexable({ productCount: 3, description: "too short" }),
    false,
  );
  assert.equal(shopIndexable({ productCount: 3, description: null }), false);
});

test("shopIndexable accepts aboutText as an alternative to description", () => {
  const goodDescription = Array(INDEX_GATES.shop.minDescriptionWords)
    .fill("word")
    .join(" ");
  assert.equal(
    shopIndexable({ productCount: 3, description: null, aboutText: goodDescription }),
    true,
  );
});

test("productIndexable requires an image and a long-enough description", () => {
  const goodDescription = Array(INDEX_GATES.product.minDescriptionWords)
    .fill("word")
    .join(" ");

  assert.equal(
    productIndexable({ imageCount: 1, description: goodDescription }),
    true,
  );
  assert.equal(
    productIndexable({ imageCount: 0, description: goodDescription }),
    false,
  );
  assert.equal(productIndexable({ imageCount: 1, description: "thin" }), false);
});

test("robotsFor emits noindex,follow only for non-indexable pages", () => {
  assert.equal(robotsFor(true), undefined);
  assert.deepEqual(robotsFor(false), {
    robots: { index: false, follow: true },
  });
});
