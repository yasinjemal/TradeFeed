// ============================================================
// Data Access — Admin Users
// ============================================================
// Cross-tenant user management for platform admins.
// ============================================================

import { db } from "@/lib/db";

export interface AdminUser {
  id: string;
  clerkId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  isBanned: boolean;
  bannedReason: string | null;
  bannedAt: Date | null;
  createdAt: Date;
  shopCount: number;
  shops: { id: string; name: string; slug: string; role: string }[];
}

/**
 * Get all users with search, pagination, and filter.
 */
export async function getAdminUsers(options?: {
  search?: string;
  page?: number;
  limit?: number;
  filter?: "all" | "banned" | "active";
}): Promise<{ users: AdminUser[]; total: number; page: number; totalPages: number }> {
  const { search, page = 1, limit = 20, filter = "all" } = options || {};

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { email: { contains: search, mode: "insensitive" } },
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
      { clerkId: { contains: search, mode: "insensitive" } },
    ];
  }
  if (filter === "banned") where.isBanned = true;
  if (filter === "active") where.isBanned = false;

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      select: {
        id: true,
        clerkId: true,
        email: true,
        firstName: true,
        lastName: true,
        imageUrl: true,
        isBanned: true,
        bannedReason: true,
        bannedAt: true,
        createdAt: true,
        _count: { select: { shops: true } },
        shops: {
          select: {
            role: true,
            shop: { select: { id: true, name: true, slug: true } },
          },
          take: 5,
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.user.count({ where }),
  ]);

  return {
    users: users.map((u) => ({
      id: u.id,
      clerkId: u.clerkId,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      imageUrl: u.imageUrl,
      isBanned: u.isBanned,
      bannedReason: u.bannedReason,
      bannedAt: u.bannedAt,
      createdAt: u.createdAt,
      shopCount: u._count.shops,
      shops: u.shops.map((s) => ({
        id: s.shop.id,
        name: s.shop.name,
        slug: s.shop.slug,
        role: s.role,
      })),
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Ban a user.
 */
export async function banUser(userId: string, reason: string) {
  return db.user.update({
    where: { id: userId },
    data: { isBanned: true, bannedReason: reason, bannedAt: new Date() },
    select: { id: true, email: true, firstName: true, lastName: true },
  });
}

/**
 * Unban a user.
 */
export async function unbanUser(userId: string) {
  return db.user.update({
    where: { id: userId },
    data: { isBanned: false, bannedReason: null, bannedAt: null },
    select: { id: true, email: true, firstName: true, lastName: true },
  });
}
