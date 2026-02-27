// ============================================================
// Server Actions — Wishlist (Server-Side Persistence)
// ============================================================
// Syncs wishlist items to the WishlistItem model in Prisma.
// Works for both anonymous visitors (via visitorId) and
// logged-in Clerk users (via userId).
//
// The client-side wishlist context remains the primary UX
// source (instant add/remove), but these actions persist
// the data server-side for analytics, back-in-stock alerts,
// and cross-device sync for logged-in users.
// ============================================================

"use server";

import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { createHash } from "crypto";

/**
 * Generate a stable visitor ID from request headers.
 * Uses a hash of IP + user-agent for anonymous visitors.
 */
async function getVisitorId(): Promise<string> {
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const ua = hdrs.get("user-agent") ?? "unknown";
  return createHash("sha256").update(`${ip}:${ua}`).digest("hex").slice(0, 16);
}

/**
 * Add a product to the server-side wishlist.
 */
export async function addToWishlistAction(data: {
  productId: string;
  shopId: string;
  productName: string;
  imageUrl: string | null;
}) {
  const { userId } = await auth();
  const visitorId = userId ? null : await getVisitorId();

  try {
    await db.wishlistItem.create({
      data: {
        productId: data.productId,
        shopId: data.shopId,
        ...(userId ? { userId } : { visitorId }),
      },
    });
    return { success: true };
  } catch (error: unknown) {
    // Unique constraint violation — already in wishlist
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      return { success: true }; // Idempotent
    }
    return { success: false, error: "Failed to add to wishlist" };
  }
}

/**
 * Remove a product from the server-side wishlist.
 */
export async function removeFromWishlistAction(productId: string) {
  const { userId } = await auth();
  const visitorId = userId ? null : await getVisitorId();

  try {
    if (userId) {
      await db.wishlistItem.deleteMany({
        where: { productId, userId },
      });
    } else if (visitorId) {
      await db.wishlistItem.deleteMany({
        where: { productId, visitorId },
      });
    }
    return { success: true };
  } catch {
    return { success: false, error: "Failed to remove from wishlist" };
  }
}

/**
 * Get all wishlist items for the current user/visitor for a specific shop.
 * Used for initial hydration when a logged-in user visits a catalog.
 */
export async function getWishlistItemsAction(shopId: string) {
  const { userId } = await auth();
  const visitorId = userId ? null : await getVisitorId();

  try {
    const items = await db.wishlistItem.findMany({
      where: {
        shopId,
        ...(userId ? { userId } : { visitorId }),
      },
      select: {
        productId: true,
      },
    });
    return { success: true, productIds: items.map((i) => i.productId) };
  } catch {
    return { success: true, productIds: [] };
  }
}
