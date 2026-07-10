"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

import { requireShopAccess } from "@/lib/auth";
import { db } from "@/lib/db";
import { getOrCreateBuyerProfile } from "@/lib/db/buyers";
import { parseOrderMessageBody } from "@/lib/messages/order-message-validation";
import { checkRateLimit } from "@/lib/rate-limit-upstash";

type MessageActionResult = {
  success: boolean;
  error?: string;
  message?: {
    id: string;
    senderType: "BUYER" | "SELLER";
    senderName: string;
    body: string;
    readAt: Date | null;
    createdAt: Date;
  };
};

function messageError(parsed: ReturnType<typeof parseOrderMessageBody>) {
  return parsed.success ? null : parsed.error.issues[0]?.message ?? "Invalid message.";
}

export async function sendBuyerOrderMessageAction(orderId: string, input: unknown): Promise<MessageActionResult> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Sign in to message the seller." };

  const parsed = parseOrderMessageBody(input);
  const validationError = messageError(parsed);
  if (!parsed.success) return { success: false, error: validationError ?? undefined };

  const limit = await checkRateLimit("message", `buyer:${userId}`);
  if (!limit.allowed) return { success: false, error: "You’re sending messages too quickly. Please wait a moment." };

  const order = await db.order.findFirst({
    where: { id: orderId, buyerClerkId: userId, deletedAt: null },
    select: { id: true, shopId: true, buyerName: true },
  });
  if (!order) return { success: false, error: "Order not found." };

  const buyer = await getOrCreateBuyerProfile(userId);
  const senderName = buyer.displayName?.trim() || order.buyerName?.trim() || "Buyer";
  const message = await db.orderMessage.create({
    data: {
      orderId: order.id,
      shopId: order.shopId,
      senderType: "BUYER",
      senderId: userId,
      senderName,
      body: parsed.data,
    },
    select: { id: true, senderType: true, senderName: true, body: true, readAt: true, createdAt: true },
  });

  revalidatePath(`/orders/${orderId}/messages`);
  revalidatePath(`/dashboard`);
  return { success: true, message };
}

export async function sendSellerOrderMessageAction(shopSlug: string, orderId: string, input: unknown): Promise<MessageActionResult> {
  const access = await requireShopAccess(shopSlug, "orders:update");
  if (!access) return { success: false, error: "Shop not found or access denied." };

  const parsed = parseOrderMessageBody(input);
  const validationError = messageError(parsed);
  if (!parsed.success) return { success: false, error: validationError ?? undefined };

  const limit = await checkRateLimit("message", `seller:${access.userId}`);
  if (!limit.allowed) return { success: false, error: "You’re sending messages too quickly. Please wait a moment." };

  const [order, seller] = await Promise.all([
    db.order.findFirst({
      where: { id: orderId, shopId: access.shopId, deletedAt: null },
      select: { id: true, orderNumber: true, buyerClerkId: true },
    }),
    db.user.findUnique({
      where: { id: access.userId },
      select: { firstName: true, lastName: true },
    }),
  ]);
  if (!order) return { success: false, error: "Order not found." };

  const senderName = [seller?.firstName, seller?.lastName].filter(Boolean).join(" ") || "Seller";
  const message = await db.orderMessage.create({
    data: {
      orderId: order.id,
      shopId: access.shopId,
      senderType: "SELLER",
      senderId: access.userId,
      senderName,
      body: parsed.data,
    },
    select: { id: true, senderType: true, senderName: true, body: true, readAt: true, createdAt: true },
  });

  if (order.buyerClerkId) {
    const buyer = await db.buyerProfile.findUnique({
      where: { clerkId: order.buyerClerkId },
      select: { id: true },
    });
    if (buyer) {
      await db.buyerNotification.create({
        data: {
          buyerId: buyer.id,
          kind: "MESSAGE",
          title: "New message from the seller",
          body: `${order.orderNumber} · ${parsed.data.slice(0, 120)}`,
          href: `/orders/${order.id}/messages`,
        },
      });
    }
  }

  revalidatePath(`/dashboard/${shopSlug}/orders`);
  revalidatePath(`/dashboard/${shopSlug}/orders/${orderId}/messages`);
  revalidatePath(`/orders/${orderId}/messages`);
  revalidatePath("/me/notifications");
  return { success: true, message };
}

export async function markBuyerOrderMessagesReadAction(orderId: string) {
  const { userId } = await auth();
  if (!userId) return { success: false };

  const order = await db.order.findFirst({
    where: { id: orderId, buyerClerkId: userId, deletedAt: null },
    select: { id: true },
  });
  if (!order) return { success: false };

  await db.orderMessage.updateMany({
    where: { orderId, senderType: "SELLER", readAt: null },
    data: { readAt: new Date() },
  });
  const buyer = await db.buyerProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (buyer) {
    await db.buyerNotification.updateMany({
      where: { buyerId: buyer.id, kind: "MESSAGE", href: `/orders/${orderId}/messages`, readAt: null },
      data: { readAt: new Date() },
    });
  }
  revalidatePath("/me/notifications");
  return { success: true };
}

export async function markSellerOrderMessagesReadAction(shopSlug: string, orderId: string) {
  const access = await requireShopAccess(shopSlug, "orders:update");
  if (!access) return { success: false };

  const order = await db.order.findFirst({
    where: { id: orderId, shopId: access.shopId, deletedAt: null },
    select: { id: true },
  });
  if (!order) return { success: false };

  await db.orderMessage.updateMany({
    where: { orderId, shopId: access.shopId, senderType: "BUYER", readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath(`/dashboard/${shopSlug}/orders`);
  return { success: true };
}
