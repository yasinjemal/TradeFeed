// ============================================================
// Page — Admin Orders (/admin/orders)
// ============================================================
// Cross-tenant order oversight — view all orders, stats, export.
// ============================================================

import { getAdminOrders, getOrderStats } from "@/lib/db/admin-orders";
import { AdminOrderList } from "@/components/admin/admin-order-list";

interface AdminOrdersPageProps {
  searchParams: Promise<{ search?: string; page?: string; status?: string }>;
}

export default async function AdminOrdersPage({ searchParams }: AdminOrdersPageProps) {
  const params = await searchParams;
  const search = params.search || "";
  const page = parseInt(params.page || "1", 10);
  const status = params.status || "all";

  const [orderData, stats] = await Promise.all([
    getAdminOrders({ search, page, status: status as string }),
    getOrderStats(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Order Management</h1>
        <p className="text-stone-500 text-sm mt-1">
          Cross-tenant order oversight — monitor orders across all shops.
        </p>
      </div>

      <AdminOrderList
        orders={orderData.orders}
        total={orderData.total}
        page={orderData.page}
        totalPages={orderData.totalPages}
        stats={stats}
        currentSearch={search}
        currentStatus={status}
      />
    </div>
  );
}
