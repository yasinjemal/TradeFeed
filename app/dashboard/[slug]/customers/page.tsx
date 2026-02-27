// ============================================================
// Page — Customer CRM Dashboard
// ============================================================
// Shows sellers their customer base aggregated from orders:
// - Total unique customers
// - Repeat buyer count
// - Customer list with order count, total spent, last order
// - Restock alert subscribers
// ============================================================

import { db } from "@/lib/db";
import { getShopBySlug } from "@/lib/db/shops";
import { notFound } from "next/navigation";
import { formatZAR } from "@/types";
import type { Metadata } from "next";
import { IllustrationNoCustomers } from "@/components/ui/illustrations";

interface CustomersPageProps {
  params: Promise<{ slug: string }>;
}

export const metadata: Metadata = {
  title: "Customers",
};

export default async function CustomersPage({ params }: CustomersPageProps) {
  const { slug } = await params;
  const shop = await getShopBySlug(slug);
  if (!shop) notFound();

  // Aggregate customers from orders (group by buyerPhone)
  const [customerData, restockAlerts] = await Promise.all([
    db.order.findMany({
      where: { shopId: shop.id, buyerPhone: { not: null } },
      select: {
        buyerName: true,
        buyerPhone: true,
        totalCents: true,
        createdAt: true,
        marketingConsent: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    db.wishlistItem.findMany({
      where: { shopId: shop.id, notifyPhone: { not: null } },
      select: {
        productName: true,
        notifyPhone: true,
        productId: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Group orders by phone
  const customerMap = new Map<
    string,
    {
      name: string | null;
      phone: string;
      orderCount: number;
      totalSpent: number;
      lastOrder: Date;
      marketingConsent: boolean;
    }
  >();

  for (const order of customerData) {
    if (!order.buyerPhone) continue;
    const existing = customerMap.get(order.buyerPhone);
    if (existing) {
      existing.orderCount += 1;
      existing.totalSpent += order.totalCents;
      if (order.createdAt > existing.lastOrder) {
        existing.lastOrder = order.createdAt;
        if (order.buyerName) existing.name = order.buyerName;
      }
      if (order.marketingConsent) existing.marketingConsent = true;
    } else {
      customerMap.set(order.buyerPhone, {
        name: order.buyerName,
        phone: order.buyerPhone,
        orderCount: 1,
        totalSpent: order.totalCents,
        lastOrder: order.createdAt,
        marketingConsent: order.marketingConsent,
      });
    }
  }

  const customers = Array.from(customerMap.values()).sort(
    (a, b) => b.orderCount - a.orderCount || b.totalSpent - a.totalSpent,
  );

  const totalCustomers = customers.length;
  const repeatBuyers = customers.filter((c) => c.orderCount > 1).length;
  const consentedCustomers = customers.filter((c) => c.marketingConsent).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-stone-800 sm:text-xl">
          👥 Customers
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Your customer base from order history
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-2xl font-bold text-stone-800">{totalCustomers}</p>
          <p className="text-xs text-stone-500">Total customers</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-2xl font-bold text-emerald-600">{repeatBuyers}</p>
          <p className="text-xs text-stone-500">Repeat buyers</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-2xl font-bold text-blue-600">{consentedCustomers}</p>
          <p className="text-xs text-stone-500">Opted in updates</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-2xl font-bold text-amber-600">{restockAlerts.length}</p>
          <p className="text-xs text-stone-500">Restock alerts</p>
        </div>
      </div>

      {/* Customer Table */}
      {customers.length > 0 ? (
        <div className="rounded-xl border border-stone-200 bg-white">
          <div className="border-b border-stone-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-stone-700">Customer List</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 text-left text-xs font-medium text-stone-500">
                  <th className="px-4 py-2.5">Customer</th>
                  <th className="px-4 py-2.5">Orders</th>
                  <th className="px-4 py-2.5">Total Spent</th>
                  <th className="px-4 py-2.5 hidden sm:table-cell">Last Order</th>
                  <th className="px-4 py-2.5 hidden sm:table-cell">Consent</th>
                  <th className="px-4 py-2.5">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {customers.map((customer) => {
                  const waUrl = `https://wa.me/${customer.phone.replace(/[^0-9+]/g, "")}`;
                  return (
                    <tr key={customer.phone} className="hover:bg-stone-50/50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-stone-800">
                          {customer.name || "—"}
                        </p>
                        <p className="text-xs text-stone-400">{customer.phone}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${customer.orderCount > 1 ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-stone-600"}`}>
                          {customer.orderCount}
                          {customer.orderCount > 1 && " 🔁"}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-stone-700">
                        {formatZAR(customer.totalSpent)}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell text-stone-500">
                        {customer.lastOrder.toLocaleDateString("en-ZA", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        {customer.marketingConsent ? (
                          <span className="text-emerald-600 text-xs">✅ Yes</span>
                        ) : (
                          <span className="text-stone-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
                        >
                          💬 Chat
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-stone-200 bg-white p-8 text-center">
          <IllustrationNoCustomers className="w-36 h-36 mx-auto mb-3" />
          <p className="mt-2 text-sm font-medium text-stone-600">No customers yet</p>
          <p className="mt-1 text-xs text-stone-400">
            Customers will appear here once you receive orders with buyer info
          </p>
        </div>
      )}

      {/* Restock Alerts */}
      {restockAlerts.length > 0 && (
        <div className="rounded-xl border border-stone-200 bg-white">
          <div className="border-b border-stone-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-stone-700">🔔 Restock Alert Subscribers</h2>
            <p className="text-xs text-stone-400 mt-0.5">Buyers waiting for out-of-stock items</p>
          </div>
          <div className="divide-y divide-stone-50">
            {restockAlerts.map((alert, i) => {
              const waUrl = `https://wa.me/${(alert.notifyPhone ?? "").replace(/[^0-9+]/g, "")}?text=${encodeURIComponent(`Hi! ${alert.productName ?? "Your item"} is back in stock. Check it out!`)}`;
              return (
                <div key={`${alert.productId}-${alert.notifyPhone}-${i}`} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-stone-700">{alert.productName ?? "Unknown product"}</p>
                    <p className="text-xs text-stone-400">{alert.notifyPhone}</p>
                  </div>
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-100"
                  >
                    📲 Notify
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
