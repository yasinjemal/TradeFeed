import test from "node:test";
import assert from "node:assert/strict";
import { chooseSellerAssistance, assistanceListingIssues, assistanceOutcome, ASSISTANCE_VERSION, type AssistanceProduct, type AssistanceShop, type AssistanceSnapshot } from "@/lib/email/seller-assistance-policy";
import { sellerAssistanceEmail } from "@/lib/email/templates/seller-assistance";

const now = new Date("2026-09-16T12:00:00Z");
const old = new Date("2026-09-12T12:00:00Z");
const product: AssistanceProduct = { id: "p1", name: "Blue dress", createdAt: old, updatedAt: old, isActive: true, isFlagged: false, description: "A blue cotton dress with short sleeves and a relaxed fit.", globalCategoryId: "category", images: [{ url: "https://example.com/photo.jpg" }], variants: [{ isActive: true, stock: 2, priceInCents: 10000 }] };
const shop: AssistanceShop = { id: "shop", name: "Thandi's shop", slug: "thandi", createdAt: old, isActive: true, products: [] };

test("first-product help waits 48 hours, excludes disabled shops and saved drafts", () => {
  assert.equal(chooseSellerAssistance(shop, false, now)?.kind, "first_product");
  assert.equal(chooseSellerAssistance({ ...shop, createdAt: new Date(now.getTime() - 48 * 3600000 + 1) }, false, now), null);
  assert.equal(chooseSellerAssistance({ ...shop, isActive: false }, false, now), null);
  assert.equal(chooseSellerAssistance({ ...shop, products: [{ ...product, isActive: false, images: [] }] }, false, now), null);
});

test("incomplete help links to the affected product and waits after edits", () => {
  const incomplete = { ...product, images: [] };
  const decision = chooseSellerAssistance({ ...shop, products: [incomplete] }, false, now)!;
  assert.equal(decision.kind, "incomplete_listing");
  assert.deepEqual(decision.issues, ["a clear product photo"]);
  assert.equal(decision.actionPath, "/dashboard/thandi/products/p1");
  assert.equal(chooseSellerAssistance({ ...shop, products: [{ ...incomplete, updatedAt: now }] }, false, now), null);
  assert.equal(chooseSellerAssistance({ ...shop, products: [{ ...incomplete, isFlagged: true }] }, false, now), null);
});

test("stock-only gaps do not trigger nagging emails", () => {
  assert.equal(chooseSellerAssistance({ ...shop, products: [{ ...product, variants: [{ isActive: true, stock: 0, priceInCents: 10000 }] }] }, false, now), null);
});

test("share help requires three ready listings and stops after a tracked share", () => {
  const ready = { ...shop, products: [product, { ...product, id: "p2" }, { ...product, id: "p3" }] };
  assert.equal(chooseSellerAssistance(ready, false, now)?.kind, "share_catalogue");
  assert.equal(chooseSellerAssistance(ready, true, now), null);
  assert.equal(chooseSellerAssistance({ ...ready, products: ready.products.slice(0, 2) }, false, now), null);
  assert.equal(chooseSellerAssistance({ ...ready, products: [product, product, { ...product, updatedAt: now }] }, false, now), null);
});

test("readiness requires a usable image, category, description and purchasable option", () => {
  assert.deepEqual(assistanceListingIssues(product), []);
  assert.ok(assistanceListingIssues({ ...product, description: "", globalCategoryId: null, images: [{ url: " " }], variants: [] }).length >= 4);
});

test("email escapes seller content and keeps one specific action and an unsubscribe", () => {
  const snapshot: AssistanceSnapshot = { version: ASSISTANCE_VERSION, shopId: shop.id, shopSlug: shop.slug, shopName: '<script>alert("x")</script>', decision: chooseSellerAssistance(shop, false, now)! };
  const email = sellerAssistanceEmail(snapshot, "https://tradefeed.co.za/email/unsubscribe?token=test");
  assert.ok(!email.html.includes("<script>"));
  assert.ok(email.html.includes("&lt;script&gt;"));
  assert.match(email.text, /products\/new\?ai=true/);
  assert.match(email.text, /opted in/);
  assert.match(email.text, /Unsubscribe:/);
  assert.equal(assistanceOutcome(snapshot, { ...shop, products: [product] }, false), true);
  assert.equal(assistanceOutcome(snapshot, { ...shop, isActive: false, products: [product] }, false), false);
});
