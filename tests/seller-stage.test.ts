import test from "node:test";
import assert from "node:assert/strict";

import {
  dominantCategoryName,
  resolveMonogramWord,
  resolveNameplateScale,
  resolveStageMode,
  stageProofPlacement,
  stageShowsAskDock,
  stageShowsBrowseChrome,
} from "@/lib/seller/stage-mode";

test("density ladder changes shape at 1, 2, 3, 8 and 20", () => {
  assert.equal(resolveStageMode(0), "ask");
  assert.equal(resolveStageMode(1), "plinth");
  assert.equal(resolveStageMode(2), "diptych");
  assert.equal(resolveStageMode(3), "rail");
  assert.equal(resolveStageMode(7), "rail");
  assert.equal(resolveStageMode(8), "grid");
  assert.equal(resolveStageMode(19), "grid");
  assert.equal(resolveStageMode(20), "grid-dense");
  assert.equal(resolveStageMode(400), "grid-dense");
});

test("negative or nonsense counts fall back to the zero rung", () => {
  assert.equal(resolveStageMode(-1), "ask");
});

test("browse chrome never mounts below eight products", () => {
  for (const n of [0, 1, 2, 3, 5, 7]) {
    assert.equal(
      stageShowsBrowseChrome(resolveStageMode(n)),
      false,
      `search/sort must not render at ${n} products`,
    );
  }
  for (const n of [8, 19, 20, 99]) {
    assert.equal(stageShowsBrowseChrome(resolveStageMode(n)), true);
  }
});

test("ask dock covers exactly the rungs with nothing to browse", () => {
  assert.deepEqual(
    [0, 1, 2, 3, 8].map((n) => stageShowsAskDock(resolveStageMode(n))),
    [true, true, true, false, false],
  );
});

test("proof moves below inventory once there is real stock", () => {
  assert.equal(stageProofPlacement(resolveStageMode(2)), "above");
  assert.equal(stageProofPlacement(resolveStageMode(3)), "below");
});

test("nameplate steps down for long shop names", () => {
  assert.equal(resolveNameplateScale("Thandi"), "lg");
  assert.equal(resolveNameplateScale("Man Corner"), "lg");
  assert.equal(resolveNameplateScale("Fstea by Daphney"), "md");
  assert.equal(resolveNameplateScale("Soweto Streetwear & Sneaker Exchange"), "sm");
});

test("monogram prefers the dominant category, then city, then the name", () => {
  assert.equal(resolveMonogramWord("Man Corner", "Sneakers", "Soweto"), "SNEAKERS");
  assert.equal(resolveMonogramWord("Man Corner", null, "Soweto"), "SOWETO");
  assert.equal(resolveMonogramWord("Man Corner", null, null), "MAN");
});

test("monogram rejects words outside 3-11 characters", () => {
  // 15 chars once punctuation is stripped — too long for the hero mark
  assert.equal(resolveMonogramWord("Kay Boutique", "Home & Furniture", null), "KAY");
  // 2 chars — too short
  assert.equal(resolveMonogramWord("Zola Trading", "TV", null), "ZOLA");
});

test("the ghost never repeats the nameplate it sits behind", () => {
  // A one-word shop: the first word IS the whole name, so it adds
  // nothing and must not render as a doubled headline.
  assert.equal(resolveMonogramWord("RUT", null, null), null);
  // ...unless another fact is available to ghost instead.
  assert.equal(resolveMonogramWord("RUT", null, "Johannesburg"), null);
  assert.equal(resolveMonogramWord("RUT", "Sneakers", null), "SNEAKERS");
  assert.equal(resolveMonogramWord("RUT", null, "Soweto"), "SOWETO");
});

test("monogram handles hostile input without throwing", () => {
  assert.equal(resolveMonogramWord("K", null, null), null);
  assert.equal(resolveMonogramWord("A B", null, null), "AB");
  assert.equal(resolveMonogramWord("   ", null, null), null);
  assert.equal(resolveMonogramWord("玉", null, null), null);
});

test("dominant category is the modal one, null when none", () => {
  assert.equal(
    dominantCategoryName([
      { categoryName: "Sneakers" },
      { categoryName: "Shirts" },
      { categoryName: "Sneakers" },
    ]),
    "Sneakers",
  );
  assert.equal(dominantCategoryName([{ categoryName: null }]), null);
  assert.equal(dominantCategoryName([]), null);
});
