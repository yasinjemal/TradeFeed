// Read-only: asserts the seller profile's density ladder against the
// SERVER-RENDERED HTML of real shops — which is what a buyer on a cold
// load actually receives, before any JS runs.
//
// Usage: npx tsx scripts/verify-seller-profile.ts http://localhost:3077

const BASE = process.argv[2] ?? "http://localhost:3077";

interface Rung {
  slug: string;
  n: number;
  expect: {
    inventory: "none" | "plinth" | "diptych" | "rail" | "grid";
    askDock: boolean;
    browseChrome: boolean;
  };
}

const RUNGS: Rung[] = [
  { slug: "digital-book", n: 0, expect: { inventory: "none", askDock: true, browseChrome: false } },
  { slug: "rt", n: 1, expect: { inventory: "plinth", askDock: true, browseChrome: false } },
  { slug: "health-wealth-happiness-store", n: 2, expect: { inventory: "diptych", askDock: true, browseChrome: false } },
  { slug: "mube-business-as-usual", n: 7, expect: { inventory: "rail", askDock: false, browseChrome: false } },
  { slug: "trendys-cosmetic-store", n: 16, expect: { inventory: "grid", askDock: false, browseChrome: true } },
  { slug: "man-corner", n: 46, expect: { inventory: "grid", askDock: false, browseChrome: true } },
];

let failures = 0;

function check(label: string, actual: unknown, expected: unknown) {
  const ok = actual === expected;
  if (!ok) failures += 1;
  console.log(`  ${ok ? "ok  " : "FAIL"} ${label}: ${String(actual)}${ok ? "" : ` (expected ${String(expected)})`}`);
}

async function main() {
  for (const rung of RUNGS) {
    const res = await fetch(`${BASE}/catalog/${rung.slug}`);
    const html = await res.text();

    console.log(`\n${rung.slug} — ${rung.n} product${rung.n === 1 ? "" : "s"} (${res.status})`);

    // The ladder
    check("plinth present", html.includes("tf-plinth"), rung.expect.inventory === "plinth");
    // The Proof Rail also wears .tf-rail, so match the product rail by
    // what only it has: a rail that is NOT the counter-shadow rail.
    const productRailClass = /class="[^"]*tf-rail tf-nudge[^"]*"/g;
    const hasProductRail = (html.match(productRailClass) ?? []).some(
      (cls) => !cls.includes("tf-counter-rail"),
    );
    check("product rail present", hasProductRail, rung.expect.inventory === "rail");
    check(
      "search input present",
      /type="search"/.test(html),
      rung.expect.browseChrome,
    );
    check("ask dock present", html.includes("Looking for something?"), rung.expect.askDock);

    // Invariants that hold on EVERY rung
    check("sticky order CTA present", /bottom-\[3\.5rem\]/.test(html), true);
    check("nameplate present", html.includes("font-tf-hero"), true);
    check("promise dock present", html.includes("tf-rule-row"), true);
    check("no zero-count string", /\b0 products?\b/i.test(html), false);
    check(
      "no unconfirmed dispatch default published",
      html.includes("1-2 business days") && !html.includes("Ask about delivery"),
      false,
    );
    // POPIA: the PLATFORM must never render the seller's number as
    // visible text. Two things are deliberately out of scope:
    //   - JSON-LD contact data and the offline-cache payload, which sit
    //     inside <script> and predate this work;
    //   - the seller's own About copy. Some sellers type their number
    //     into their marketing text themselves. That is their words and
    //     their choice; silently stripping it would mangle seller copy.
    const storyStart = html.indexOf('aria-label="About ');
    const storyEnd = html.indexOf('id="shop-reviews"');
    const chrome =
      storyStart !== -1 && storyEnd > storyStart
        ? html.slice(0, storyStart) + html.slice(storyEnd)
        : html;
    const visible = chrome
      .replace(/<script[\s\S]*?<\/script>/g, "")
      .replace(/<[^>]+>/g, " ");
    const visibleNumbers = visible.match(/\+?27\d{7,}/g) ?? [];
    check("seller number never printed by the platform", visibleNumbers.length, 0);
  }

  console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("ERR:", (e as Error).message);
  process.exit(1);
});
