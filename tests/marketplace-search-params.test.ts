import test from "node:test";
import assert from "node:assert/strict";
import { buildMarketplaceSearchParams } from "@/lib/marketplace/search-params";

test("buildMarketplaceSearchParams merges updates and resets page by default", () => {
  const next = buildMarketplaceSearchParams(
    "search=hoodie&page=3&sort=newest",
    { sort: "price_asc", province: "Gauteng" }
  );

  const params = new URLSearchParams(next);
  assert.equal(params.get("search"), "hoodie");
  assert.equal(params.get("sort"), "price_asc");
  assert.equal(params.get("province"), "Gauteng");
  assert.equal(params.get("page"), null);
});

test("buildMarketplaceSearchParams preserves page when explicitly set", () => {
  const next = buildMarketplaceSearchParams("search=hoodie&page=3", {
    page: "4",
  });
  const params = new URLSearchParams(next);
  assert.equal(params.get("page"), "4");
});

test("buildMarketplaceSearchParams removes keys when value is undefined or empty", () => {
  const next = buildMarketplaceSearchParams("search=hoodie&province=Gauteng", {
    search: "",
    province: undefined,
  });
  const params = new URLSearchParams(next);
  assert.equal(params.get("search"), null);
  assert.equal(params.get("province"), null);
});
