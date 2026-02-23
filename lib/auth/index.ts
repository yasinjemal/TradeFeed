// ============================================================
// Auth Helpers — Centralized (Phase 3: Clerk)
// ============================================================
// All auth logic lives here. Server actions and pages import from
// this single module. No direct Clerk imports elsewhere.
//
// EXPORTS:
//   getCurrentUser()     — Get DB user from Clerk session (nullable)
//   requireAuth()        — Same but throws if not authenticated
//   requireShopAccess()  — Verify user belongs to shop + return context
//
// HOW IT WORKS:
//   1. Clerk middleware protects routes (middleware.ts)
//   2. auth() from Clerk returns the current session's userId (clerkId)
//   3. We look up the DB User by clerkId
//   4. For shop access, we also check ShopUser membership
//
// WHY CENTRALIZED:
//   - Single swap point (was getDevUserId, now Clerk)
//   - All server actions & pages import from here
//   - Easy to test, easy to audit
// ============================================================

import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

// ============================================================
// Types
// ============================================================

export type AuthUser = {
  id: string;          // Internal DB user ID (cuid)
  clerkId: string;     // Clerk's user ID
  email: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
};

export type ShopAccess = {
  userId: string;      // Internal DB user ID
  shopId: string;      // Internal DB shop ID
  role: string;        // ShopUser role (OWNER, MANAGER, STAFF)
};

// ============================================================
// getCurrentUser — nullable, safe for optional auth checks
// ============================================================

/**
 * Get the current authenticated user from Clerk + DB.
 *
 * WHAT: Reads Clerk session → looks up DB user by clerkId.
 * RETURNS: AuthUser or null if not signed in / not in DB.
 *
 * USE FOR: Optional auth checks (e.g., showing user-specific UI).
 * For required auth, use requireAuth() instead.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const { userId: clerkId } = await auth();

  if (!clerkId) return null;

  const user = await db.user.findUnique({
    where: { clerkId },
    select: {
      id: true,
      clerkId: true,
      email: true,
      firstName: true,
      lastName: true,
      imageUrl: true,
    },
  });

  return user;
}

// ============================================================
// requireAuth — throws if not authenticated
// ============================================================

/**
 * Require authentication. Throws if user is not signed in.
 *
 * WHAT: Same as getCurrentUser() but guarantees a user or throws.
 * WHY: Server actions and protected pages should fail fast.
 *
 * If the user is signed in via Clerk but doesn't exist in our DB yet,
 * we auto-create them (handles race condition where webhook hasn't
 * fired yet but user already has a session).
 */
export async function requireAuth(): Promise<AuthUser> {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    throw new Error("Unauthorized: Not signed in.");
  }

  // Try to find existing DB user
  let user = await db.user.findUnique({
    where: { clerkId },
    select: {
      id: true,
      clerkId: true,
      email: true,
      firstName: true,
      lastName: true,
      imageUrl: true,
    },
  });

  // If not in DB yet (webhook race condition), create from Clerk data
  if (!user) {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      throw new Error("Unauthorized: Clerk session invalid.");
    }

    const primaryEmail = clerkUser.emailAddresses.find(
      (e) => e.id === clerkUser.primaryEmailAddressId
    )?.emailAddress;

    if (!primaryEmail) {
      throw new Error("Unauthorized: No email address.");
    }

    user = await db.user.create({
      data: {
        clerkId,
        email: primaryEmail,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        imageUrl: clerkUser.imageUrl,
      },
      select: {
        id: true,
        clerkId: true,
        email: true,
        firstName: true,
        lastName: true,
        imageUrl: true,
      },
    });
  }

  return user;
}

// ============================================================
// requireShopAccess — verify user belongs to shop
// ============================================================

/**
 * Verify the current user has access to a specific shop.
 *
 * WHAT: requireAuth() + check ShopUser membership for the given shop slug.
 * RETURNS: { userId, shopId, role } or null if no access.
 *
 * MULTI-TENANT: This is THE gatekeeper. Every shop mutation must go through this.
 * Checks the ShopUser join table to verify membership.
 */
export async function requireShopAccess(
  shopSlug: string
): Promise<ShopAccess | null> {
  const user = await requireAuth();

  // Resolve shop from slug
  const shop = await db.shop.findUnique({
    where: { slug: shopSlug },
    select: { id: true },
  });

  if (!shop) return null;

  // Check membership
  const membership = await db.shopUser.findUnique({
    where: {
      userId_shopId: { userId: user.id, shopId: shop.id },
    },
    select: { role: true },
  });

  if (!membership) return null;

  return {
    userId: user.id,
    shopId: shop.id,
    role: membership.role,
  };
}
