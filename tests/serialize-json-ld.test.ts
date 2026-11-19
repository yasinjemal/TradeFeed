// ============================================================
// Tests — JSON-LD serialisation
// ============================================================
// The serialiser must keep user-supplied text from closing the
// <script type="application/ld+json"> block it is written into,
// without changing the data a crawler reads back.
// ============================================================

import test from "node:test";
import assert from "node:assert/strict";
import { serializeJsonLd } from "../lib/seo/serialize-json-ld";

test("serializeJsonLd: output never contains a raw '<'", () => {
  const out = serializeJsonLd({
    "@type": "Review",
    reviewBody: "</script><script>alert(1)</script>",
    author: { "@type": "Person", name: "<img src=x onerror=alert(1)>" },
  });
  assert.equal(out.includes("<"), false);
  assert.equal(out.toLowerCase().includes("</script"), false);
});

test("serializeJsonLd: a closing tag split across two fields cannot reassemble", () => {
  // Per-field tag stripping would miss this; escaping every '<' does not.
  const out = serializeJsonLd({ name: "</script ", reviewBody: "><img src=x onerror=alert(1) " });
  assert.equal(out.includes("<"), false);
});

test("serializeJsonLd: HTML comment and script openers are neutralised", () => {
  const out = serializeJsonLd({ description: "<!-- <script> -->" });
  assert.equal(out.includes("<!--"), false);
  assert.equal(out.includes("<script"), false);
});

test("serializeJsonLd: parses back to exactly the original data", () => {
  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Size < 10 & > 5 — 'quoted' \"double\"",
    offers: { price: 199.99, priceCurrency: "ZAR" },
    review: [{ reviewBody: "I <3 this </script> shirt" }],
    nothing: null,
  };
  assert.deepEqual(JSON.parse(serializeJsonLd(data)), data);
});

test("serializeJsonLd: data without '<' is byte-identical to JSON.stringify", () => {
  const data = { "@type": "Organization", name: "TradeFeed", sameAs: ["https://tradefeed.co.za"] };
  assert.equal(serializeJsonLd(data), JSON.stringify(data));
});

test("serializeJsonLd: undefined serialises to null instead of throwing", () => {
  assert.equal(serializeJsonLd(undefined), "null");
});
