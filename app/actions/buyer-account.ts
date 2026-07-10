"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { getOrCreateBuyerProfile } from "@/lib/db/buyers";
import { normalizeToE164 } from "@/lib/validation/auth";
import { buyerAddressSchema, buyerProfileSchema } from "@/lib/validation/buyer-account";

async function currentBuyer() {
  const { userId } = await auth();
  return userId ? getOrCreateBuyerProfile(userId) : null;
}

export async function updateBuyerProfileAction(input: unknown) {
  const buyer = await currentBuyer();
  const parsed = buyerProfileSchema.safeParse(input);
  if (!buyer) return { success: false, error: "Sign in to update your profile." };
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Check your details." };

  await db.buyerProfile.update({
    where: { id: buyer.id },
    data: parsed.data,
  });
  revalidatePath("/me");
  revalidatePath("/me/account");
  return { success: true };
}

export async function createBuyerAddressAction(input: unknown) {
  const buyer = await currentBuyer();
  const parsed = buyerAddressSchema.safeParse(input);
  if (!buyer) return { success: false, error: "Sign in to save an address." };
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Check the address." };

  const address = await db.$transaction(async (tx) => {
    const count = await tx.buyerAddress.count({ where: { buyerId: buyer.id } });
    if (count >= 10) throw new Error("ADDRESS_LIMIT");
    const isDefault = parsed.data.isDefault || count === 0;
    if (isDefault) {
      await tx.buyerAddress.updateMany({ where: { buyerId: buyer.id }, data: { isDefault: false } });
    }
    return tx.buyerAddress.create({
      data: {
        ...parsed.data,
        buyerId: buyer.id,
        phone: parsed.data.phone ? normalizeToE164(parsed.data.phone) : null,
        addressLine2: parsed.data.addressLine2 || null,
        deliveryInstructions: parsed.data.deliveryInstructions || null,
        isDefault,
      },
    });
  }).catch((error: unknown) => {
    if (error instanceof Error && error.message === "ADDRESS_LIMIT") return null;
    throw error;
  });

  if (!address) return { success: false, error: "You can save up to 10 addresses." };
  revalidatePath("/me/account");
  return { success: true, address };
}

export async function updateBuyerAddressAction(addressId: string, input: unknown) {
  const buyer = await currentBuyer();
  const parsed = buyerAddressSchema.safeParse(input);
  if (!buyer) return { success: false, error: "Sign in to update an address." };
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Check the address." };

  const existing = await db.buyerAddress.findFirst({ where: { id: addressId, buyerId: buyer.id }, select: { id: true, isDefault: true } });
  if (!existing) return { success: false, error: "Address not found." };

  const address = await db.$transaction(async (tx) => {
    const isDefault = existing.isDefault || parsed.data.isDefault;
    if (isDefault) {
      await tx.buyerAddress.updateMany({ where: { buyerId: buyer.id, id: { not: addressId } }, data: { isDefault: false } });
    }
    return tx.buyerAddress.update({
      where: { id: addressId },
      data: {
        ...parsed.data,
        phone: parsed.data.phone ? normalizeToE164(parsed.data.phone) : null,
        addressLine2: parsed.data.addressLine2 || null,
        deliveryInstructions: parsed.data.deliveryInstructions || null,
        isDefault,
      },
    });
  });
  revalidatePath("/me/account");
  return { success: true, address };
}

export async function setDefaultBuyerAddressAction(addressId: string) {
  const buyer = await currentBuyer();
  if (!buyer) return { success: false, error: "Sign in to update your addresses." };
  const existing = await db.buyerAddress.findFirst({ where: { id: addressId, buyerId: buyer.id }, select: { id: true } });
  if (!existing) return { success: false, error: "Address not found." };

  await db.$transaction([
    db.buyerAddress.updateMany({ where: { buyerId: buyer.id }, data: { isDefault: false } }),
    db.buyerAddress.update({ where: { id: addressId }, data: { isDefault: true } }),
  ]);
  revalidatePath("/me/account");
  return { success: true };
}

export async function deleteBuyerAddressAction(addressId: string) {
  const buyer = await currentBuyer();
  if (!buyer) return { success: false, error: "Sign in to update your addresses." };
  const existing = await db.buyerAddress.findFirst({ where: { id: addressId, buyerId: buyer.id }, select: { id: true, isDefault: true } });
  if (!existing) return { success: false, error: "Address not found." };

  await db.$transaction(async (tx) => {
    await tx.buyerAddress.delete({ where: { id: addressId } });
    if (existing.isDefault) {
      const next = await tx.buyerAddress.findFirst({ where: { buyerId: buyer.id }, orderBy: { updatedAt: "desc" }, select: { id: true } });
      if (next) await tx.buyerAddress.update({ where: { id: next.id }, data: { isDefault: true } });
    }
  });
  revalidatePath("/me/account");
  return { success: true };
}
