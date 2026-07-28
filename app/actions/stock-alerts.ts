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
import { getOrCreateBuyerFeatureId } from "@/lib/buyer/feature-identity";
import { normalizeToE164, whatsappLoginSchema } from "@/lib/validation/auth";

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

  const parsedPhone = whatsappLoginSchema.safeParse({ phoneNumber: data.phone });
  if (!parsedPhone.success) {
    return { success: false, error: "Enter a valid South African WhatsApp number" };
  }
  const phone = normalizeToE164(parsedPhone.data.phoneNumber);

  try {
    const product = await db.product.findFirst({
      where: {
        id: data.productId,
        shopId: data.shopId,
        isActive: true,
        shop: { isActive: true },
      },
      select: {
        id: true,
        name: true,
        shopId: true,
        variants: { where: { isActive: true }, select: { stock: true } },
      },
    });
    if (!product) return { success: false, error: "Product not found" };
    const inStock = product.variants.some((variant) => variant.stock > 0);
    const visitorId = userId ? null : await getOrCreateBuyerFeatureId();

    // Upsert: create wishlist entry with notifyPhone, or update existing
    if (userId) {
      await db.buyerProfile.upsert({
        where: { clerkId: userId },
        create: { clerkId: userId },
        update: {},
      });
      await db.wishlistItem.upsert({
        where: { productId_userId: { productId: product.id, userId } },
        create: {
          productId: product.id,
          shopId: product.shopId,
          productName: product.name,
          userId,
          notifyPhone: phone,
          restockNotifiedAt: inStock ? new Date() : null,
        },
        update: {
          notifyPhone: phone,
          productName: product.name,
          restockNotifiedAt: inStock ? new Date() : null,
        },
      });
    } else if (visitorId) {
      await db.wishlistItem.upsert({
        where: { productId_visitorId: { productId: product.id, visitorId } },
        create: {
          productId: product.id,
          shopId: product.shopId,
          productName: product.name,
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
 * Returns buyer phone numbers — restricted to members of the shop.
 */
export async function getRestockAlertsAction(shopId: string) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return [];

  const membership = await db.shopUser.findFirst({
    where: { shopId, user: { clerkId } },
    select: { id: true },
  });
  if (!membership) return [];

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
