// ============================================================
// Server Actions — Stock Alerts
// ============================================================
// Allows buyers to subscribe to back-in-stock notifications
// for out-of-stock products. When stock is replenished, the
// seller's dashboard shows pending alerts with WhatsApp links.
// ============================================================

"use server";

import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { createHash } from "crypto";

async function getVisitorId(): Promise<string> {
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const ua = hdrs.get("user-agent") ?? "unknown";
  return createHash("sha256").update(`${ip}:${ua}`).digest("hex").slice(0, 16);
}

/**
 * Subscribe to back-in-stock alert for a product.
 * Stores the buyer's WhatsApp number on their wishlist entry.
 */
export async function subscribeRestockAlertAction(data: {
  productId: string;
  shopId: string;
  productName: string;
  phone: string;
}) {
  const { userId } = await auth();
  const visitorId = userId ? null : await getVisitorId();

  // Normalize phone
  const phone = data.phone.replace(/\s+/g, "").replace(/^0/, "+27");

  try {
    // Upsert: create wishlist entry with notifyPhone, or update existing
    if (userId) {
      await db.wishlistItem.upsert({
        where: { productId_userId: { productId: data.productId, userId } },
        create: {
          productId: data.productId,
          shopId: data.shopId,
          productName: data.productName,
          userId,
          notifyPhone: phone,
        },
        update: { notifyPhone: phone, productName: data.productName },
      });
    } else if (visitorId) {
      await db.wishlistItem.upsert({
        where: { productId_visitorId: { productId: data.productId, visitorId } },
        create: {
          productId: data.productId,
          shopId: data.shopId,
          productName: data.productName,
          visitorId,
          notifyPhone: phone,
        },
        update: { notifyPhone: phone, productName: data.productName },
      });
    }

    return { success: true };
  } catch {
    return { success: false, error: "Failed to subscribe to alert" };
  }
}

/**
 * Get pending restock alerts for a shop's products.
 * Used by the seller's dashboard to see which buyers want notifications.
 */
export async function getRestockAlertsAction(shopId: string) {
  const alerts = await db.wishlistItem.findMany({
    where: {
      shopId,
      notifyPhone: { not: null },
    },
    select: {
      productId: true,
      productName: true,
      notifyPhone: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return alerts;
}
