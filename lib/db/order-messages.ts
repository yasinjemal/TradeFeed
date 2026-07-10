import { db } from "@/lib/db";

const threadSelect = {
  id: true,
  orderNumber: true,
  status: true,
  buyerClerkId: true,
  buyerName: true,
  shopId: true,
  shop: { select: { name: true, slug: true, logoUrl: true } },
  messages: {
    orderBy: { createdAt: "asc" as const },
    select: {
      id: true,
      senderType: true,
      senderName: true,
      body: true,
      readAt: true,
      createdAt: true,
    },
  },
};

export function getBuyerOrderThread(orderId: string, buyerClerkId: string) {
  return db.order.findFirst({
    where: { id: orderId, buyerClerkId, deletedAt: null },
    select: threadSelect,
  });
}

export function getSellerOrderThread(orderId: string, shopId: string) {
  return db.order.findFirst({
    where: { id: orderId, shopId, deletedAt: null },
    select: threadSelect,
  });
}

export function getShopUnreadMessageCount(shopId: string) {
  return db.orderMessage.count({
    where: { shopId, senderType: "BUYER", readAt: null },
  });
}
