import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

// The Shelf stands products on a surface at every density rung.
//
// These tests exist because the first cut of it shipped a bug that no
// type, lint or visual check could see: .tf-shelf-settle was put on the
// same <li> that .tf-stagger > * already styles. That selector carries
//
//     animation: tf-autoshow 0s 1.6s forwards;
//
// which is the failsafe that reveals a card if the IntersectionObserver
// never fires. An `animation:` shorthand on the same element silently
// replaces it, so a browser whose observer never ran would have left
// every product at opacity 0 — an empty shop, on the page whose whole
// job is to prove the seller has stock.

const root = process.cwd();
const read = (p: string) => readFileSync(path.join(root, p), "utf8");

const globals = read("app/globals.css");

/** Components that render a product into a shelf slot. */
const SLOT_FILES = [
  "components/tf/storefront/tf-product-grid.tsx",
  "components/tf/profile/tf-product-rail.tsx",
  "components/tf/profile/tf-diptych.tsx",
];

test("the settle never shares an element with a stagger child", () => {
  // .tf-stagger > * targets the direct children of a TfReveal stagger
  // group, which in every one of these components is the <li>. So the
  // settle must never appear on an <li> tag.
  for (const file of SLOT_FILES) {
    const source = read(file);
    const offenders = source
      .split("\n")
      .filter((line) => /<li\b/.test(line) && line.includes("tf-shelf-settle"));
    assert.deepEqual(
      offenders,
      [],
      `${file} puts tf-shelf-settle on an <li>. That <li> is a .tf-stagger child, ` +
        "whose animation shorthand carries the tf-autoshow reveal failsafe — " +
        "setting animation here drops it and can leave products invisible. " +
        "Put the settle on a wrapper inside the <li> instead.",
    );
  }
});

test("the stagger failsafe is still declared", () => {
  // If this ever stops being an animation, the test above is guarding
  // a rule that no longer exists and should be revisited rather than
  // silently passing.
  assert.match(
    globals,
    /\.tf-stagger > \*\s*\{[^}]*animation:\s*tf-autoshow/,
    "tf-stagger children no longer carry the tf-autoshow failsafe",
  );
});

test("the shelf itself survives reduced motion and old browsers", () => {
  // The plank and the contact shadow are the part that says "on a
  // surface". They are deliberately plain geometry, declared OUTSIDE
  // any prefers-reduced-motion or @supports gate, so a cheap phone and
  // a reduced-motion viewer still get a shelf — just not a moving one.
  // Located by regex, not by literal whitespace: prettier reformats this
  // file and an exact-indentation match made this test fail on a change
  // that was purely cosmetic.
  const gate = /@media \(prefers-reduced-motion: no-preference\)\s*\{\s*@supports \(animation-timeline: view\(\)\)/.exec(
    globals,
  );
  assert.ok(gate, "the shelf motion layer is no longer gated as expected");
  const motionGate = gate.index;

  const base = globals.slice(0, motionGate);
  for (const rule of [".tf-shelf::before", ".tf-shelf-contact"]) {
    assert.ok(
      base.includes(rule),
      `${rule} must be declared outside the motion gate — it is the static shelf`,
    );
  }
});

test("the motion layer is gated on both support and preference", () => {
  // Scroll-driven CSS is an enhancement. Its absence must cost the
  // settle and the parallax, never the shelf.
  for (const cls of ["tf-shelf-settle", "tf-shelf-parallax", "tf-shelf-parallax-x"]) {
    const at = globals.indexOf(`.${cls} {`);
    assert.ok(at > -1, `.${cls} is missing`);
    const before = globals.slice(0, at);
    const openedMotion = before.lastIndexOf("@media (prefers-reduced-motion: no-preference)");
    const openedSupports = before.lastIndexOf("@supports (animation-timeline: view())");
    assert.ok(
      openedMotion > -1 && openedSupports > openedMotion,
      `.${cls} must sit inside @media(prefers-reduced-motion: no-preference) > @supports(animation-timeline)`,
    );
  }
});

test("the shelf is opt-in, so the live storefront is unchanged", () => {
  // TfStorefrontGrid renders on the legacy TF storefront, which is on
  // in production. The shelf must only appear where it is asked for.
  const grid = read("components/tf/storefront/tf-product-grid.tsx");
  assert.match(grid, /shelf\s*=\s*false/, "the grid's shelf prop must default to off");

  const inventory = read("components/tf/profile/tf-inventory-block.tsx");
  assert.match(inventory, /shelf/, "the profile's inventory block should opt in to the shelf");

  const storefront = read("components/tf/storefront/tf-storefront.tsx");
  assert.ok(
    !/shelf/.test(storefront),
    "tf-storefront.tsx must not opt in — it is the live buyer surface",
  );
});

test("the shelf has a dark-mode treatment", () => {
  // Ink at 18% is invisible on a dark surface, and a stone-300 plank
  // would glare. Both are re-weighted under .dark.
  for (const rule of [".dark .tf-shelf::before", ".dark .tf-shelf::after"]) {
    assert.ok(globals.includes(rule), `${rule} is missing — the shelf would break in dark mode`);
  }
});
