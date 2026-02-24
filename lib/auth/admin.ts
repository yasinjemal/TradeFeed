// ============================================================
// Admin Auth — Platform-level admin access
// ============================================================
// Admin users are identified by their Clerk user IDs stored in
// the ADMIN_USER_IDS environment variable (comma-separated).
//
// This is NOT shop-level access (that's requireShopAccess).
// This is PLATFORM admin — for seller verification, platform
// metrics, and cross-tenant management.
//
// WHY env-based:
//   - Simple, no extra DB table needed for MVP
//   - Easy to add/remove admins via env config
//   - Clerk user IDs are stable and unique
// ============================================================

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

/**
 * Get the list of admin Clerk user IDs from env.
 */
function getAdminUserIds(): string[] {
  const raw = process.env.ADMIN_USER_IDS || "";
  return raw
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

/**
 * Check if the current Clerk user is a platform admin.
 * Returns the Clerk user ID if admin, null otherwise.
 */
export async function isAdmin(): Promise<string | null> {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const adminIds = getAdminUserIds();
  if (adminIds.length === 0) return null;

  return adminIds.includes(clerkId) ? clerkId : null;
}

/**
 * Require platform admin access. Throws if not admin.
 * Returns the admin's DB user for audit trails.
 */
export async function requireAdmin() {
  const clerkId = await isAdmin();

  if (!clerkId) {
    throw new Error("Unauthorized: Admin access required.");
  }

  const user = await db.user.findUnique({
    where: { clerkId },
    select: {
      id: true,
      clerkId: true,
      email: true,
      firstName: true,
      lastName: true,
    },
  });

  if (!user) {
    throw new Error("Unauthorized: Admin user not found in database.");
  }

  return user;
}
