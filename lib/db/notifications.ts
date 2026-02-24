// ============================================================
// Data Access — Notification Preferences
// ============================================================

import { db } from "@/lib/db";

export interface NotificationPrefs {
  orderNotifications: boolean;
  lowStockAlerts: boolean;
  reviewNotifications: boolean;
  lowStockThreshold: number;
  notificationEmail: string | null;
}

/**
 * Get notification preferences for a shop (or defaults).
 */
export async function getNotificationPrefs(shopId: string): Promise<NotificationPrefs> {
  const prefs = await db.notificationPreference.findUnique({
    where: { shopId },
  });

  if (!prefs) {
    return {
      orderNotifications: true,
      lowStockAlerts: true,
      reviewNotifications: true,
      lowStockThreshold: 5,
      notificationEmail: null,
    };
  }

  return {
    orderNotifications: prefs.orderNotifications,
    lowStockAlerts: prefs.lowStockAlerts,
    reviewNotifications: prefs.reviewNotifications,
    lowStockThreshold: prefs.lowStockThreshold,
    notificationEmail: prefs.notificationEmail,
  };
}

/**
 * Update notification preferences (upsert).
 */
export async function updateNotificationPrefs(
  shopId: string,
  input: Partial<NotificationPrefs>,
) {
  return db.notificationPreference.upsert({
    where: { shopId },
    create: {
      shopId,
      orderNotifications: input.orderNotifications ?? true,
      lowStockAlerts: input.lowStockAlerts ?? true,
      reviewNotifications: input.reviewNotifications ?? true,
      lowStockThreshold: input.lowStockThreshold ?? 5,
      notificationEmail: input.notificationEmail ?? null,
    },
    update: {
      ...(input.orderNotifications !== undefined && {
        orderNotifications: input.orderNotifications,
      }),
      ...(input.lowStockAlerts !== undefined && {
        lowStockAlerts: input.lowStockAlerts,
      }),
      ...(input.reviewNotifications !== undefined && {
        reviewNotifications: input.reviewNotifications,
      }),
      ...(input.lowStockThreshold !== undefined && {
        lowStockThreshold: input.lowStockThreshold,
      }),
      ...(input.notificationEmail !== undefined && {
        notificationEmail: input.notificationEmail || null,
      }),
    },
  });
}

/**
 * Get low-stock variants for a shop.
 */
export async function getLowStockVariants(shopId: string, threshold?: number) {
  const prefs = await getNotificationPrefs(shopId);
  const limit = threshold ?? prefs.lowStockThreshold;

  return db.productVariant.findMany({
    where: {
      product: { shopId, isActive: true },
      isActive: true,
      stock: { lte: limit },
    },
    include: {
      product: {
        select: { id: true, name: true, option1Label: true, option2Label: true },
      },
    },
    orderBy: { stock: "asc" },
  });
}
