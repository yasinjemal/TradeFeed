import { db } from "@/lib/db";

/**
 * Register a new wholesale buyer application.
 * Returns the created record or null if phone already registered.
 */
export async function registerWholesaleBuyer(input: {
  phone: string;
  businessName: string;
  contactName: string;
  email?: string;
  vatNumber?: string;
  registrationNumber?: string;
  city?: string;
  province?: string;
}) {
  const existing = await db.wholesaleBuyer.findUnique({
    where: { phone: input.phone },
    select: { id: true, status: true },
  });

  if (existing) {
    return { alreadyExists: true, status: existing.status };
  }

  return db.wholesaleBuyer.create({
    data: {
      phone: input.phone,
      businessName: input.businessName,
      contactName: input.contactName,
      email: input.email || null,
      vatNumber: input.vatNumber || null,
      registrationNumber: input.registrationNumber || null,
      city: input.city || null,
      province: input.province || null,
    },
  });
}

/**
 * Check wholesale buyer status by phone number.
 */
export async function getWholesaleBuyerByPhone(phone: string) {
  return db.wholesaleBuyer.findUnique({
    where: { phone },
    select: {
      id: true,
      phone: true,
      businessName: true,
      contactName: true,
      status: true,
      verifiedAt: true,
      rejectedReason: true,
    },
  });
}

/**
 * Get all wholesale buyer applications for admin review.
 */
export async function getWholesaleBuyers(filter?: {
  status?: "PENDING" | "VERIFIED" | "REJECTED";
  page?: number;
  pageSize?: number;
}) {
  const { status, page = 1, pageSize = 20 } = filter ?? {};

  const where = status ? { status } : {};

  const [buyers, total] = await Promise.all([
    db.wholesaleBuyer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.wholesaleBuyer.count({ where }),
  ]);

  return { buyers, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

/**
 * Admin: approve a wholesale buyer application.
 */
export async function approveWholesaleBuyer(buyerId: string) {
  return db.wholesaleBuyer.update({
    where: { id: buyerId },
    data: {
      status: "VERIFIED",
      verifiedAt: new Date(),
      rejectedReason: null,
    },
  });
}

/**
 * Admin: reject a wholesale buyer application.
 */
export async function rejectWholesaleBuyer(buyerId: string, reason: string) {
  return db.wholesaleBuyer.update({
    where: { id: buyerId },
    data: {
      status: "REJECTED",
      rejectedReason: reason,
      verifiedAt: null,
    },
  });
}

/**
 * Check if a phone number belongs to a verified wholesale buyer.
 */
export async function isVerifiedWholesaleBuyer(phone: string): Promise<boolean> {
  const buyer = await db.wholesaleBuyer.findUnique({
    where: { phone },
    select: { status: true },
  });
  return buyer?.status === "VERIFIED";
}
