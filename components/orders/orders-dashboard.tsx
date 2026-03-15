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
import { updateOrderStatusAction, createOrderPaymentLinkAction, shipOrderAction } from "@/app/actions/orders";
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
  paymentRequestedAt?: string | null;
  paidAt?: string | null;
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
  // Shipping fields
  shippingMethod?: string | null;
  shippingCostCents?: number | null;
  courierName?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  estimatedDelivery?: string | null;
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
  const [paymentLinkPending, setPaymentLinkPending] = useState(false);
  const [paymentLinkMessage, setPaymentLinkMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showShipForm, setShowShipForm] = useState(false);
  const [shipCourier, setShipCourier] = useState("");
  const [shipTracking, setShipTracking] = useState("");
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

  async function handleGetPaymentLink() {
    setError(null);
    setPaymentLinkMessage(null);
    setPaymentLinkPending(true);
    try {
      const result = await createOrderPaymentLinkAction(shopSlug, order.id);
      if (!result.success || !result.paymentUrl) {
        setError(result.error ?? "Failed to create payment link.");
        return;
      }
      // Build buyer-friendly payment page URL
      const appUrl = window.location.origin;
      const buyerPayUrl = `${appUrl}/pay/${encodeURIComponent(order.orderNumber)}`;
      try {
        await navigator.clipboard.writeText(buyerPayUrl);
        setPaymentLinkMessage("Link copied!");
      } catch {
        setPaymentLinkMessage("Payment link ready.");
      }
      router.refresh();
    } finally {
      setPaymentLinkPending(false);
    }
  }

  function handleShipOrder() {
    setError(null);
    startTransition(async () => {
      const result = await shipOrderAction(shopSlug, order.id, shipCourier || undefined, shipTracking || undefined);
      if (!result.success) {
        setError(result.error ?? "Failed to ship order.");
      } else {
        setShowShipForm(false);
        router.refresh();
      }
    });
  }

  // Build WhatsApp payment message
  const buyerPayUrl = typeof window !== "undefined"
    ? `${window.location.origin}/pay/${encodeURIComponent(order.orderNumber)}`
    : `/pay/${encodeURIComponent(order.orderNumber)}`;
  const formatRand = (cents: number) => `R${(cents / 100).toFixed(2)}`;
  const waPaymentMessage = `Hi${order.buyerName ? ` ${order.buyerName}` : ""}! 🛍️\n\nYour order *${order.orderNumber}* (${formatRand(order.totalCents)}) is ready for payment.\n\nPay securely here:\n${buyerPayUrl}\n\nThank you! — TradeFeed`;
  const buyerWaNumber = order.buyerPhone?.replace(/[^0-9]/g, "") ?? "";
  const waPaymentLink = buyerWaNumber
    ? `https://wa.me/${buyerWaNumber}?text=${encodeURIComponent(waPaymentMessage)}`
    : `https://wa.me/?text=${encodeURIComponent(waPaymentMessage)}`;

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

          {/* Payment link (for non-cancelled orders, show until paid) */}
          {order.status !== "CANCELLED" && !order.paidAt && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleGetPaymentLink}
                disabled={paymentLinkPending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 transition-colors disabled:opacity-50"
              >
                {paymentLinkPending ? (
                  "Creating link..."
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5h6" />
                    </svg>
                    Copy payment link
                  </>
                )}
              </button>
              <a
                href={waPaymentLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  // Also trigger the server action to mark payment requested
                  if (!order.paymentRequestedAt) {
                    handleGetPaymentLink();
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-500 transition-colors shadow-sm"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Send to buyer
              </a>
              {order.paymentRequestedAt && (
                <span className="text-xs text-stone-500">Payment link sent</span>
              )}
            </div>
          )}
          {order.paidAt && (
            <div className="flex items-center gap-1.5 pt-1">
              <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-emerald-600 font-semibold">Payment received</p>
            </div>
          )}

          {/* Shipping / Tracking Info */}
          {(order.status === "SHIPPED" || order.status === "DELIVERED") && order.courierName && (
            <div className="text-xs text-stone-600 bg-blue-50 border border-blue-100 rounded-lg p-3 space-y-1">
              <div className="font-medium text-blue-800">📦 Shipping Details</div>
              <div>Courier: <span className="font-medium">{order.courierName}</span></div>
              {order.trackingNumber && <div>Tracking: <span className="font-mono">{order.trackingNumber}</span></div>}
              {order.shippedAt && <div>Shipped: {new Date(order.shippedAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}</div>}
              {order.deliveredAt && <div>Delivered: {new Date(order.deliveredAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}</div>}
              {order.estimatedDelivery && !order.deliveredAt && <div>ETA: {new Date(order.estimatedDelivery).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}</div>}
              {order.trackingUrl && (
                <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:underline font-medium mt-1">
                  Track package →
                </a>
              )}
            </div>
          )}
          {order.shippingCostCents != null && order.shippingCostCents > 0 && (
            <div className="text-xs text-stone-500">
              Shipping cost: R{(order.shippingCostCents / 100).toFixed(2)}
              {order.shippingMethod === "COLLECTION" && " (Collection)"}
              {order.shippingMethod === "PLATFORM_COURIER" && " (Platform courier)"}
            </div>
          )}

          {/* Status Actions */}
          {actions.length > 0 && (
            <div className="space-y-2 pt-1">
              {/* Ship form for CONFIRMED orders instead of plain "Mark Shipped" */}
              {order.status === "CONFIRMED" && (
                <>
                  {!showShipForm ? (
                    <button
                      onClick={() => setShowShipForm(true)}
                      disabled={isPending}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors ${isPending ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      📦 Ship Order
                    </button>
                  ) : (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
                      <div className="text-sm font-medium text-blue-800">Shipping Details</div>
                      <input
                        type="text"
                        placeholder="Courier name (e.g. The Courier Guy)"
                        value={shipCourier}
                        onChange={(e) => setShipCourier(e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border border-blue-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Tracking number (optional)"
                        value={shipTracking}
                        onChange={(e) => setShipTracking(e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border border-blue-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleShipOrder}
                          disabled={isPending}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors ${isPending ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          {isPending ? "Shipping..." : "Confirm Shipment"}
                        </button>
                        <button
                          onClick={() => setShowShipForm(false)}
                          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-stone-100 text-stone-700 hover:bg-stone-200 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
              {/* Other action buttons (Cancel, etc.) — skip "Mark Shipped" which is replaced by ship form */}
              <div className="flex gap-2">
                {actions
                  .filter((action) => !(order.status === "CONFIRMED" && action.status === "SHIPPED"))
                  .map((action) => (
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
            </div>
          )}

          {/* Payment link success message */}
          {paymentLinkMessage && (
            <p className="text-xs text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2">
              {paymentLinkMessage}
            </p>
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
