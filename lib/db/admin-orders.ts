// ============================================================
// Data Access — Admin Orders
// ============================================================
// Cross-tenant order management for platform admins.
// ============================================================

import { db } from "@/lib/db";

export interface AdminOrder {
  id: string;
  orderNumber: string;
  status: string;
  totalCents: number;
  itemCount: number;
  buyerName: string | null;
  buyerPhone: string | null;
  createdAt: Date;
  shop: { id: string; name: string; slug: string };
  items: {
    productName: string;
    option1Value: string;
    option2Value: string | null;
    priceInCents: number;
    quantity: number;
  }[];
}

/**
 * Get all orders across shops with search, pagination, and filter.
 */
export async function getAdminOrders(options?: {
  search?: string;
  page?: number;
  limit?: number;
  status?: string;
}): Promise<{ orders: AdminOrder[]; total: number; page: number; totalPages: number }> {
  const { search, page = 1, limit = 20, status } = options || {};

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: "insensitive" } },
      { buyerName: { contains: search, mode: "insensitive" } },
      { buyerPhone: { contains: search, mode: "insensitive" } },
      { shop: { name: { contains: search, mode: "insensitive" } } },
    ];
  }
  if (status && status !== "all") {
    where.status = status;
  }

  const [orders, total] = await Promise.all([
    db.order.findMany({
      where,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        totalCents: true,
        itemCount: true,
        buyerName: true,
        buyerPhone: true,
        createdAt: true,
        shop: { select: { id: true, name: true, slug: true } },
        items: {
          select: {
            productName: true,
            option1Value: true,
            option2Value: true,
            priceInCents: true,
            quantity: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.order.count({ where }),
  ]);

  return { orders, total, page, totalPages: Math.ceil(total / limit) };
}

/**
 * Get order stats for the admin overview.
 */
export async function getOrderStats() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [total, today, thisWeek, thisMonth, pending, totalRevenue] =
    await Promise.all([
      db.order.count(),
      db.order.count({ where: { createdAt: { gte: todayStart } } }),
      db.order.count({ where: { createdAt: { gte: weekAgo } } }),
      db.order.count({ where: { createdAt: { gte: monthAgo } } }),
      db.order.count({ where: { status: "PENDING" } }),
      db.order.aggregate({ _sum: { totalCents: true } }),
    ]);

  return {
    total,
    today,
    thisWeek,
    thisMonth,
    pending,
    totalRevenueCents: totalRevenue._sum.totalCents ?? 0,
  };
}
