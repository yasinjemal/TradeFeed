// ============================================================
// Integration tests — cross-tenant isolation
// ============================================================
// Verifies that the ShopUser membership table enforces tenant
// isolation: a user without a ShopUser record for a given shop
// cannot obtain access, and the DB-level unique constraint
// prevents duplicate memberships.
//
// REQUIRES: DATABASE_URL in environment.
// SKIPS:    Automatically when DATABASE_URL is not set.
//
// Run with: npm test
// Run integration only: DATABASE_URL=... npm test
// ============================================================

import { describe, test, before, after } from "node:test";
import assert from "node:assert/strict";

const RUN = !!process.env.DATABASE_URL;
const SKIP_REASON = "DATABASE_URL not set — skipping integration tests";

// Use a timestamp-based suffix so parallel runs don't collide.
const SUFFIX = Date.now().toString(36);

describe(
  "cross-tenant isolation — ShopUser membership enforcement",
  { skip: RUN ? false : SKIP_REASON },
  () => {
    // Lazy-import so Prisma doesn't try to connect when DATABASE_URL is absent.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let db: any;

    let userA: { id: string };
    let userB: { id: string };
    let shop: { id: string };

    before(async () => {
      const mod = await import("@/lib/db");
      db = mod.db;

      // Create two isolated users and one shop.
      [userA, userB] = await Promise.all([
        db.user.create({
          data: { clerkId: `test_clerk_a_${SUFFIX}`, email: `user_a_${SUFFIX}@test.example` },
          select: { id: true },
        }),
        db.user.create({
          data: { clerkId: `test_clerk_b_${SUFFIX}`, email: `user_b_${SUFFIX}@test.example` },
          select: { id: true },
        }),
      ]);

      shop = await db.shop.create({
        data: {
          name: `Test Shop ${SUFFIX}`,
          slug: `test-shop-${SUFFIX}`,
          whatsappNumber: "+27000000000",
        },
        select: { id: true },
      });

      // Only user A is a member (OWNER).
      await db.shopUser.create({
        data: { userId: userA.id, shopId: shop.id, role: "OWNER" },
      });
    });

    after(async () => {
      // Delete in dependency order.
      await db.shopUser.deleteMany({ where: { shopId: shop.id } });
      await db.shop.delete({ where: { id: shop.id } });
      await db.user.deleteMany({ where: { id: { in: [userA.id, userB.id] } } });
    });

    // ── Core isolation invariants ─────────────────────────────

    test("user A (member) — ShopUser record exists with OWNER role", async () => {
      const membership = await db.shopUser.findUnique({
        where: { userId_shopId: { userId: userA.id, shopId: shop.id } },
        select: { role: true },
      });
      assert.notEqual(membership, null);
      assert.equal(membership.role, "OWNER");
    });

    test("user B (non-member) — ShopUser lookup returns null → access denied", async () => {
      // This is the exact query requireShopAccess() uses.
      // null here means the auth gatekeeper returns null → no shop mutation proceeds.
      const membership = await db.shopUser.findUnique({
        where: { userId_shopId: { userId: userB.id, shopId: shop.id } },
        select: { role: true },
      });
      assert.equal(membership, null, "Non-member must not have a ShopUser record");
    });

    test("user B cannot be found as a member of ANY shop they did not join", async () => {
      const memberships = await db.shopUser.findMany({
        where: { userId: userB.id },
      });
      assert.equal(memberships.length, 0);
    });

    // ── Unique constraint prevents privilege escalation ───────

    test("DB unique constraint rejects duplicate membership for the same user+shop", async () => {
      await assert.rejects(
        () =>
          db.shopUser.create({
            data: { userId: userA.id, shopId: shop.id, role: "STAFF" },
          }),
        // Prisma throws a P2002 (unique constraint violation) error.
        (err: unknown) => {
          const e = err as { code?: string; message?: string };
          const isUnique = e.code === "P2002" || e.message?.toLowerCase().includes("unique");
          assert.ok(isUnique, `Expected unique constraint error, got: ${e.code ?? e.message}`);
          return true;
        }
      );
    });

    // ── Membership scoping ────────────────────────────────────

    test("adding user B to a DIFFERENT shop does not grant access to shop A", async () => {
      // Create a second shop and make user B its owner.
      const shopB = await db.shop.create({
        data: {
          name: `Test Shop B ${SUFFIX}`,
          slug: `test-shop-b-${SUFFIX}`,
          whatsappNumber: "+27000000001",
        },
        select: { id: true },
      });

      await db.shopUser.create({
        data: { userId: userB.id, shopId: shopB.id, role: "OWNER" },
      });

      // User B is still not a member of shop A.
      const crossTenantCheck = await db.shopUser.findUnique({
        where: { userId_shopId: { userId: userB.id, shopId: shop.id } },
      });
      assert.equal(crossTenantCheck, null, "Membership in shop B must not grant access to shop A");

      // Clean up the extra shop.
      await db.shopUser.deleteMany({ where: { shopId: shopB.id } });
      await db.shop.delete({ where: { id: shopB.id } });
    });
  }
);
