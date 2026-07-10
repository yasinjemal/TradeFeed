import { db } from "@/lib/db";

type CreateBuyerNotificationInput = {
  buyerId: string;
  kind: "ORDER" | "RESTOCK" | "SHOP_DROP" | "MESSAGE";
  title: string;
  body: string;
  href?: string;
};

/** Add an in-app notification after the caller has checked the buyer's preference. */
export async function createBuyerNotification(input: CreateBuyerNotificationInput) {
  return db.buyerNotification.create({ data: input });
}

export async function getBuyerNotifications(buyerId: string, limit = 50) {
  return db.buyerNotification.findMany({
    where: { buyerId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getBuyerUnreadNotificationCount(buyerId: string) {
  return db.buyerNotification.count({ where: { buyerId, readAt: null } });
}

export async function markBuyerNotificationRead(buyerId: string, notificationId: string) {
  return db.buyerNotification.updateMany({
    where: { id: notificationId, buyerId, readAt: null },
    data: { readAt: new Date() },
  });
}

export async function markAllBuyerNotificationsRead(buyerId: string) {
  return db.buyerNotification.updateMany({ where: { buyerId, readAt: null }, data: { readAt: new Date() } });
}
