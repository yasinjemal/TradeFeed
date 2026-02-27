// ============================================================
// Component — Orders Dashboard
// ============================================================
// Rich order management for sellers:
// - Stats overview (total, pending, revenue)
// - Status filter tabs
// - Order cards with status management
// - Expandable order details
// ============================================================

"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { updateOrderStatusAction } from "@/app/actions/orders";
import type { OrderStatus } from "@prisma/client";
import { ExportButtons } from "@/components/export/export-buttons";
import { IllustrationNoOrders } from "@/components/ui/illustrations";
import {
  generateCsv,
  downloadFile,
  printReport,
  formatRandsPlain,
  formatDate,
} from "@/lib/export/reports";

// ── Types ────────────────────────────────────────────────────

interface OrderItem {
  id: string;
  productName: string;
  option1Label: string;
  option1Value: string;
  option2Label: string;
  option2Value: string | null;
  priceInCents: number;
  quantity: number;
}

interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  buyerName: string | null;
  buyerPhone: string | null;
  buyerNote: string | null;
  deliveryAddress: string | null;
  deliveryCity: string | null;
  deliveryProvince: string | null;
  deliveryPostalCode: string | null;
  totalCents: number;
  itemCount: number;
  items: OrderItem[];
  createdAt: string;
}

interface OrderStats {
  total: number;
  pending: number;
  confirmed: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  revenueCents: number;
}

interface OrdersDashboardProps {
  orders: Order[];
  stats: OrderStats;
  shopSlug: string;
  currentStatus?: string;
}

// ── Status Config ────────────────────────────────────────────

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string; icon: string; bg: string }
> = {
  PENDING: {
    label: "Pending",
    color: "text-amber-700",
    icon: "⏳",
    bg: "bg-amber-50 border-amber-200",
  },
  CONFIRMED: {
    label: "Confirmed",
    color: "text-blue-700",
    icon: "✅",
    bg: "bg-blue-50 border-blue-200",
  },
  SHIPPED: {
    label: "Shipped",
    color: "text-purple-700",
    icon: "📦",
    bg: "bg-purple-50 border-purple-200",
  },
  DELIVERED: {
    label: "Delivered",
    color: "text-emerald-700",
    icon: "🎉",
    bg: "bg-emerald-50 border-emerald-200",
  },
  CANCELLED: {
    label: "Cancelled",
    color: "text-red-700",
    icon: "❌",
    bg: "bg-red-50 border-red-200",
  },
};

const STATUS_ACTIONS: Record<OrderStatus, { label: string; status: OrderStatus }[]> = {
  PENDING: [
    { label: "Confirm Order", status: "CONFIRMED" },
    { label: "Cancel", status: "CANCELLED" },
  ],
  CONFIRMED: [
    { label: "Mark Shipped", status: "SHIPPED" },
    { label: "Cancel", status: "CANCELLED" },
  ],
  SHIPPED: [{ label: "Mark Delivered", status: "DELIVERED" }],
  DELIVERED: [],
  CANCELLED: [],
};

// ── Tabs ─────────────────────────────────────────────────────

const TABS = [
  { label: "All", value: undefined, icon: "📋" },
  { label: "Pending", value: "PENDING", icon: "⏳" },
  { label: "Confirmed", value: "CONFIRMED", icon: "✅" },
  { label: "Shipped", value: "SHIPPED", icon: "📦" },
  { label: "Delivered", value: "DELIVERED", icon: "🎉" },
  { label: "Cancelled", value: "CANCELLED", icon: "❌" },
] as const;

// ── Main Component ───────────────────────────────────────────

export function OrdersDashboard({
  orders,
  stats,
  shopSlug,
  currentStatus,
}: OrdersDashboardProps) {
  const router = useRouter();

  // ── Export Handlers ──────────────────────────────────
  const handleExportCsv = useCallback(() => {
    const csv = generateCsv(
      [
        { key: "orderNumber", label: "Order #" },
        { key: "date", label: "Date" },
        { key: "status", label: "Status" },
        { key: "buyerName", label: "Buyer" },
        { key: "buyerPhone", label: "Phone" },
        { key: "deliveryAddress", label: "Delivery Address" },
        { key: "deliveryCity", label: "City" },
        { key: "deliveryProvince", label: "Province" },
        { key: "itemCount", label: "Items" },
        { key: "total", label: "Total (ZAR)" },
        { key: "itemDetails", label: "Item Details" },
      ],
      orders.map((o) => ({
        orderNumber: o.orderNumber,
        date: formatDate(o.createdAt),
        status: o.status,
        buyerName: o.buyerName ?? "",
        buyerPhone: o.buyerPhone ?? "",
        deliveryAddress: o.deliveryAddress ?? "",
        deliveryCity: o.deliveryCity ?? "",
        deliveryProvince: o.deliveryProvince ?? "",
        itemCount: o.itemCount,
        total: (o.totalCents / 100).toFixed(2),
        itemDetails: o.items
          .map((i) => `${i.productName} (${i.option1Value}${i.option2Value ? "/" + i.option2Value : ""}) x${i.quantity}`)
          .join("; "),
      })),
    );
    const suffix = currentStatus ? `-${currentStatus.toLowerCase()}` : "";
    downloadFile(csv, `tradefeed-orders${suffix}-${new Date().toISOString().slice(0, 10)}.csv`);
  }, [orders, currentStatus]);

  const handleExportPdf = useCallback(() => {
    const statusLabel = currentStatus ? currentStatus.charAt(0) + currentStatus.slice(1).toLowerCase() : "All";
    const summaryHtml = `
      <div class="summary-grid">
        <div class="summary-card"><div class="label">Total Orders</div><div class="value">${stats.total}</div></div>
        <div class="summary-card"><div class="label">Pending</div><div class="value">${stats.pending}</div></div>
        <div class="summary-card"><div class="label">Revenue</div><div class="value">${formatRandsPlain(stats.revenueCents)}</div></div>
        <div class="summary-card"><div class="label">Delivered</div><div class="value">${stats.delivered}</div></div>
      </div>
    `;
    const tableRows = orders
      .map(
        (o) => `
          <tr>
            <td class="font-bold">${o.orderNumber}</td>
            <td>${formatDate(o.createdAt)}</td>
            <td>${o.status}</td>
            <td>${o.buyerName ?? "—"}</td>
            <td>${o.deliveryCity ?? "—"}</td>
            <td class="text-center">${o.itemCount}</td>
            <td class="text-right font-bold">${formatRandsPlain(o.totalCents)}</td>
          </tr>`,
      )
      .join("");

    printReport(`Orders Report — ${statusLabel}`, `
      <h1>Orders Report — ${statusLabel}</h1>
      ${summaryHtml}
      <h2>${orders.length} Orders</h2>
      <table>
        <thead>
          <tr>
            <th>Order #</th>
            <th>Date</th>
            <th>Status</th>
            <th>Buyer</th>
            <th>City</th>
            <th class="text-center">Items</th>
            <th class="text-right">Total</th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>
    `);
  }, [orders, stats, currentStatus]);

  return (
    <div className="space-y-6">
      {/* ── Export Buttons ────────────────────────────── */}
      <div className="flex justify-end">
        <ExportButtons onExportCsv={handleExportCsv} onExportPdf={handleExportPdf} />
      </div>

      {/* ── Stats Cards ──────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Total Orders"
          value={stats.total.toString()}
          icon="📋"
        />
        <StatCard
          label="Pending"
          value={stats.pending.toString()}
          icon="⏳"
          highlight={stats.pending > 0}
        />
        <StatCard
          label="Revenue"
          value={`R ${(stats.revenueCents / 100).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`}
          icon="💰"
        />
        <StatCard
          label="Delivered"
          value={stats.delivered.toString()}
          icon="🎉"
        />
      </div>

      {/* ── Status Filter Tabs ───────────────────────── */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((tab) => {
          const isActive = currentStatus === tab.value;
          const count =
            tab.value === undefined
              ? stats.total
              : stats[tab.value.toLowerCase() as keyof OrderStats];
          return (
            <button
              key={tab.label}
              onClick={() => {
                const url = tab.value
                  ? `/dashboard/${shopSlug}/orders?status=${tab.value}`
                  : `/dashboard/${shopSlug}/orders`;
                router.push(url);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors
                ${
                  isActive
                    ? "bg-stone-900 text-white"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              <span
                className={`text-xs px-1.5 rounded-full ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-stone-200 text-stone-500"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Order List ───────────────────────────────── */}
      {orders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-stone-200">
          <IllustrationNoOrders className="w-36 h-36 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-stone-700">No orders yet</h3>
          <p className="text-sm text-stone-500 mt-1">
            {currentStatus
              ? `No ${currentStatus.toLowerCase()} orders found.`
              : "Orders will appear here when buyers checkout via WhatsApp."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              shopSlug={shopSlug}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Stat Card ────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  highlight,
}: {
  label: string;
  value: string;
  icon: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        highlight
          ? "bg-amber-50 border-amber-200"
          : "bg-white border-stone-200"
      }`}
    >
      <div className="flex items-center gap-2 text-sm text-stone-500 mb-1">
        <span>{icon}</span>
        <span>{label}</span>
      </div>
      <div className="text-xl font-bold text-stone-900">{value}</div>
    </div>
  );
}

// ── Order Card ───────────────────────────────────────────────

function OrderCard({
  order,
  shopSlug,
}: {
  order: Order;
  shopSlug: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const config = STATUS_CONFIG[order.status];
  const actions = STATUS_ACTIONS[order.status];
  const orderDate = new Date(order.createdAt).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  function handleStatusChange(newStatus: OrderStatus) {
    setError(null);
    startTransition(async () => {
      const result = await updateOrderStatusAction(shopSlug, order.id, newStatus);
      if (!result.success) {
        setError(result.error ?? "Failed to update status.");
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className={`rounded-xl border bg-white overflow-hidden transition-shadow hover:shadow-sm ${isPending ? "opacity-60" : ""}`}>
      {/* ── Header Row ──────────────────────────────── */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center gap-4 text-left"
      >
        {/* Order number & date */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-stone-900 text-sm">
              {order.orderNumber}
            </span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${config.color}`}>
              {config.icon} {config.label}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-stone-500">
            <span>{orderDate}</span>
            {order.buyerName && <span>• {order.buyerName}</span>}
            <span>• {order.itemCount} item{order.itemCount !== 1 ? "s" : ""}</span>
          </div>
        </div>

        {/* Total */}
        <div className="text-right">
          <div className="font-bold text-stone-900">
            R {(order.totalCents / 100).toFixed(2)}
          </div>
        </div>

        {/* Expand arrow */}
        <svg
          className={`w-4 h-4 text-stone-400 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* ── Expanded Details ─────────────────────────── */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-stone-100 pt-3 space-y-3">
          {/* Line Items */}
          <div className="space-y-2">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between text-sm"
              >
                <div>
                  <span className="font-medium text-stone-800">
                    {item.quantity}× {item.productName}
                  </span>
                  <div className="text-xs text-stone-500">
                    {item.option1Label}: {item.option1Value}
                    {item.option2Value && ` | ${item.option2Label}: ${item.option2Value}`}
                  </div>
                </div>
                <span className="text-stone-700 font-medium">
                  R {((item.priceInCents * item.quantity) / 100).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* Buyer info */}
          {(order.buyerPhone || order.buyerNote || order.deliveryAddress) && (
            <div className="text-xs text-stone-500 space-y-1 bg-stone-50 rounded-lg p-3">
              {order.buyerPhone && (
                <div>
                  📱 <a href={`https://wa.me/${order.buyerPhone.replace("+", "")}`} className="text-emerald-600 hover:underline">{order.buyerPhone}</a>
                </div>
              )}
              {order.buyerNote && <div>📝 {order.buyerNote}</div>}
              {order.deliveryAddress && (
                <div>
                  📍 {order.deliveryAddress}
                  {order.deliveryCity ? `, ${order.deliveryCity}` : ""}
                  {order.deliveryProvince ? `, ${order.deliveryProvince}` : ""}
                  {order.deliveryPostalCode ? ` ${order.deliveryPostalCode}` : ""}
                </div>
              )}
            </div>
          )}

          {/* Status Actions */}
          {actions.length > 0 && (
            <div className="flex gap-2 pt-1">
              {actions.map((action) => (
                <button
                  key={action.status}
                  onClick={() => handleStatusChange(action.status)}
                  disabled={isPending}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                    ${
                      action.status === "CANCELLED"
                        ? "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
                        : "bg-emerald-600 text-white hover:bg-emerald-700"
                    }
                    ${isPending ? "opacity-50 cursor-not-allowed" : ""}
                  `}
                >
                  {isPending ? "Updating..." : action.label}
                </button>
              ))}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
