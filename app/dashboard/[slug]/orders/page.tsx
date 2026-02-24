// ============================================================
// Dashboard — Orders Page (Server Component)
// ============================================================
// Shows all orders for the shop with status filters and management.
// ============================================================

import { requireShopAccess } from "@/lib/auth";
import { listOrders, getOrderStats } from "@/lib/db/orders";
import { notFound } from "next/navigation";
import { OrdersDashboard } from "@/components/orders/orders-dashboard";

interface OrdersPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ status?: string }>;
}

export default async function OrdersPage({ params, searchParams }: OrdersPageProps) {
  const { slug } = await params;
  const { status } = await searchParams;

  const access = await requireShopAccess(slug);
  if (!access) notFound();

  // Validate status filter
  const validStatuses = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"] as const;
  const statusFilter = validStatuses.includes(status as typeof validStatuses[number])
    ? (status as typeof validStatuses[number])
    : undefined;

  const [orders, stats] = await Promise.all([
    listOrders(access.shopId, { status: statusFilter, limit: 50 }),
    getOrderStats(access.shopId),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Orders</h1>
        <p className="text-sm text-stone-500 mt-1">
          Track and manage customer orders
        </p>
      </div>

      <OrdersDashboard
        orders={JSON.parse(JSON.stringify(orders))}
        stats={stats}
        shopSlug={slug}
        currentStatus={statusFilter}
      />
    </div>
  );
}
