"use server";
import { randomBytes } from "node:crypto";
import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { checkRateLimit, getActionClientIp } from "@/lib/rate-limit-upstash";
import { supportCaseAccess, supportTokenHash } from "@/lib/support/access";
import { matchesCheckoutProof } from "@/lib/support/checkout-proof";
const bodySchema = z.string().trim().min(10).max(4000);
const normalizePhone = (value: string) =>
  value.replace(/\D/g, "").replace(/^0/, "27");
export async function createSupportCaseAction(
  _previous: { error?: string },
  form: FormData,
): Promise<{ error?: string }> {
  const limit = await checkRateLimit(
    "message",
    "support:" + (await getActionClientIp()),
  );
  if (!limit.allowed)
    return { error: "Please wait before opening another case." };
  const parsed = z
    .object({
      orderNumber: z.string().trim().min(1).max(80),
      phone: z.string().max(30),
      category: z.enum([
        "DELIVERY",
        "RETURN",
        "DAMAGED_ITEM",
        "PAYMENT",
        "CANCELLATION",
        "OTHER",
      ]),
      body: bodySchema,
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return {
      error:
        "Enter your order number and a description of at least 10 characters.",
    };
  const { userId } = await auth();
  const order = await db.order.findUnique({
    where: { orderNumber: parsed.data.orderNumber.toUpperCase() },
    select: { id: true, orderNumber: true, checkoutKey: true, buyerClerkId: true, buyerPhone: true, deletedAt: true },
  });
  const checkoutProof = order && matchesCheckoutProof(order.checkoutKey,
    (await cookies()).get(`tf_checkout_${order.orderNumber}`)?.value);
  if (
    !order ||
    order.deletedAt ||
    (!checkoutProof && !(userId && order.buyerClerkId === userId) &&
      !(
        order.buyerPhone &&
        normalizePhone(order.buyerPhone) ===
          normalizePhone(parsed.data.phone) &&
        normalizePhone(parsed.data.phone).length >= 11
      ))
  )
    return {
      error:
        "We could not verify those order details. Use the phone number entered at checkout, or email support@tradefeed.co.za for help.",
    };
  const token = randomBytes(32).toString("hex");
  const record = await db.supportCase.create({
    data: {
      orderId: order.id,
      category: parsed.data.category,
      buyerClerkId: order.buyerClerkId,
      guestTokenHash: supportTokenHash(token),
      messages: {
        create: { actor: "BUYER", actorId: userId, body: parsed.data.body },
      },
    },
  });
  (await cookies()).set("tf_support_" + record.id, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect("/support/cases/" + record.id);
}
export async function replySupportCaseAction(form: FormData): Promise<void> {
  const id = z.string().min(1).max(80).parse(form.get("id"));
  const access = await supportCaseAccess(id);
  if (!access) throw new Error("Case not found or access denied.");
  const limit = await checkRateLimit(
    "message",
    "support-reply:" + (access.actorId ?? (await getActionClientIp())),
  );
  if (!limit.allowed) throw new Error("Please wait before replying again.");
  const body = bodySchema.parse(form.get("body"));
  const status =
    access.actor === "ADMIN"
      ? z
          .enum(["OPEN", "WAITING_BUYER", "WAITING_SELLER", "RESOLVED"])
          .parse(form.get("status"))
      : "OPEN";
  await db.$transaction(async (tx) => {
    await tx.supportCase.update({
      where: { id },
      data: {
        status,
        messages: {
          create: { actor: access.actor, actorId: access.actorId, body },
        },
      },
    });
    if (access.actor === "ADMIN") {
      const admin = await tx.user.findUniqueOrThrow({
        where: { clerkId: access.actorId! },
      });
      await tx.adminAuditLog.create({
        data: {
          adminId: admin.id,
          adminEmail: admin.email,
          action: "SUPPORT_CASE_UPDATED",
          entityType: "SupportCase",
          entityId: id,
          details: JSON.stringify({ status }),
        },
      });
    }
  });
  revalidatePath("/support/cases/" + id);
  revalidatePath("/admin/support");
}
