// ============================================================
// Dev Auth Helper
// ============================================================
// Temporary auth helper for Phase 2 (no Clerk yet).
// Returns the first user in the database (the seeded dev user).
//
// PHASE 3: This entire file gets replaced by Clerk integration.
// We isolate it here so the swap is clean — one file change.
//
// WARNING: This is NOT secure. It's dev-only.
// ============================================================

import { db } from "@/lib/db";

/**
 * Get the dev user ID for testing.
 *
 * WHAT: Returns the first user in the DB (seeded dev user).
 * WHY: We need a userId to create shops. No auth in Phase 2.
 *
 * PHASE 3 REPLACEMENT:
 *   import { currentUser } from "@clerk/nextjs/server";
 *   const user = await currentUser();
 *   return user?.id;
 */
export async function getDevUserId(): Promise<string | null> {
  const user = await db.user.findFirst({
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });

  return user?.id ?? null;
}
