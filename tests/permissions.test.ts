// ============================================================
// Tests — Role Permission Matrix + Action Enforcement Wiring
// ============================================================
// The permission matrix is the security boundary for multi-staff
// shops: STAFF is fulfilment-only, MANAGER runs the shop, OWNER
// owns billing/team. These tests pin the matrix so a refactor
// can't silently re-open the "any member can do anything" hole.
// ============================================================

import test from "node:test";
import assert from "node:assert/strict";
import { hasPermission, type Permission } from "@/lib/auth/permissions";
import { createProductAction, type ProductActionDeps } from "@/app/actions/product";

const ALL_PERMISSIONS: Permission[] = [
  "catalog:manage",
  "orders:update",
  "orders:finance",
  "reviews:moderate",
  "settings:manage",
  "billing:manage",
  "team:manage",
  "activity:view",
];

test("OWNER has every permission", () => {
  for (const p of ALL_PERMISSIONS) {
    assert.equal(hasPermission("OWNER", p), true, `OWNER should have ${p}`);
  }
});

test("MANAGER runs the shop but cannot touch billing or team", () => {
  const granted: Permission[] = [
    "catalog:manage",
    "orders:update",
    "orders:finance",
    "reviews:moderate",
    "settings:manage",
    "activity:view",
  ];
  for (const p of granted) {
    assert.equal(hasPermission("MANAGER", p), true, `MANAGER should have ${p}`);
  }
  assert.equal(hasPermission("MANAGER", "billing:manage"), false);
  assert.equal(hasPermission("MANAGER", "team:manage"), false);
});

test("STAFF can only update orders", () => {
  assert.equal(hasPermission("STAFF", "orders:update"), true);
  for (const p of ALL_PERMISSIONS.filter((p) => p !== "orders:update")) {
    assert.equal(hasPermission("STAFF", p), false, `STAFF should NOT have ${p}`);
  }
});

test("unknown roles get no permissions (defensive against DB drift)", () => {
  for (const p of ALL_PERMISSIONS) {
    assert.equal(hasPermission("SUPERADMIN", p), false);
    assert.equal(hasPermission("", p), false);
  }
});

// ── Enforcement wiring ──────────────────────────────────────
// Product actions must request catalog:manage from the auth
// gatekeeper — passing no permission would mean any member
// (including view-only STAFF) could mutate the catalog.

test("createProductAction requests catalog:manage from the gatekeeper", async () => {
  let requestedPermission: string | undefined;

  const deps = {
    requireShopAccess: async (_slug: string, permission?: Permission) => {
      requestedPermission = permission;
      return { shopId: "shop_1", userId: "user_1", role: "OWNER" };
    },
    createProduct: async () => ({ id: "prod_1" }),
    revalidatePath: () => {},
    redirect: () => {},
    checkProductLimit: async () => ({ allowed: true, current: 1, limit: 10 }),
  } as unknown as ProductActionDeps;

  const form = new FormData();
  form.set("name", "Product Name");

  await createProductAction("shop-slug", null, form, deps);
  assert.equal(requestedPermission, "catalog:manage");
});

test("createProductAction denies when the gatekeeper rejects the role", async () => {
  const deps = {
    // Simulates requireShopAccess for a STAFF member: membership exists
    // but the required permission is missing, so the gatekeeper returns null.
    requireShopAccess: async (_slug: string, permission?: Permission) =>
      permission && !hasPermission("STAFF", permission)
        ? null
        : { shopId: "shop_1", userId: "user_1", role: "STAFF" },
    createProduct: async () => {
      throw new Error("createProduct must not be reached for STAFF");
    },
    revalidatePath: () => {},
    redirect: () => {},
    checkProductLimit: async () => ({ allowed: true, current: 1, limit: 10 }),
  } as unknown as ProductActionDeps;

  const form = new FormData();
  form.set("name", "Product Name");

  const result = await createProductAction("shop-slug", null, form, deps);
  assert.equal(result.success, false);
  assert.equal(result.error, "Shop not found or access denied.");
});
