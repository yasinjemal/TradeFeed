"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getOrCreateBuyerProfile } from "@/lib/db/buyers";
import { markAllBuyerNotificationsRead, markBuyerNotificationRead } from "@/lib/db/buyer-notifications";
import { db } from "@/lib/db";

const preferencesSchema = z.object({ orderUpdates: z.boolean(), restockAlerts: z.boolean(), shopUpdates: z.boolean() });

async function buyerOrNull() {
  const { userId } = await auth();
  return userId ? getOrCreateBuyerProfile(userId) : null;
}

export async function markBuyerNotificationReadAction(notificationId: string) {
  const buyer = await buyerOrNull();
  if (!buyer) return { success: false };
  await markBuyerNotificationRead(buyer.id, notificationId);
  revalidatePath("/me/notifications");
  return { success: true };
}

export async function markAllBuyerNotificationsReadAction() {
  const buyer = await buyerOrNull();
  if (!buyer) return { success: false };
  await markAllBuyerNotificationsRead(buyer.id);
  revalidatePath("/me/notifications");
  return { success: true };
}

export async function updateBuyerNotificationPreferencesAction(input: unknown) {
  const buyer = await buyerOrNull();
  const parsed = preferencesSchema.safeParse(input);
  if (!buyer || !parsed.success) return { success: false };
  await db.buyerProfile.update({ where: { id: buyer.id }, data: parsed.data });
  revalidatePath("/me/notifications");
  return { success: true };
}
