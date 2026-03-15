"use client";

// ============================================================
// Buyer Order List — Client Component
// ============================================================
// Renders the buyer's order history with expandable cards.
// Each card shows order summary with expand-to-details.
// ============================================================

import { useState } from "react";
import Link from "next/link";
import { formatZAR } from "@/types";

// Minimal type matching the getBuyerOrders() return shape
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

interface BuyerOrder {
  id: string;
  orderNumber: string;
  status: string;
  totalCents: number;
  itemCount: number;
  paidAt: Date | string | null;
  shippingMethod: string;
  courierName: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  shippedAt: Date | string | null;
  deliveredAt: Date | string | null;
  createdAt: Date | string;
  items: OrderItem[];
  shop: {
    name: string;
    slug: string;
    logoUrl: string | null;
  };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: "Pending", color: "text-amber-400", bg: "bg-amber-500/10" },
  CONFIRMED: { label: "Confirmed", color: "text-blue-400", bg: "bg-blue-500/10" },
  SHIPPED: { label: "Shipped", color: "text-purple-400", bg: "bg-purple-500/10" },
  DELIVERED: { label: "Delivered", color: "text-emerald-400", bg: "bg-emerald-500/10" },
  CANCELLED: { label: "Cancelled", color: "text-red-400", bg: "bg-red-500/10" },
};

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function BuyerOrderList({ orders }: { orders: BuyerOrder[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("ALL");

  const filtered =
    filter === "ALL" ? orders : orders.filter((o) => o.status === filter);

  const statusCounts: Record<string, number> = {};
  for (const o of orders) {
    statusCounts[o.status] = (statusCounts[o.status] ?? 0) + 1;
  }

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide">
        <FilterTab
          label="All"
          count={orders.length}
          active={filter === "ALL"}
          onClick={() => setFilter("ALL")}
        />
        {(["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"] as const).map(
          (s) => {
            const cfg = STATUS_CONFIG[s];
            const cnt = statusCounts[s];
            if (!cfg || !cnt || cnt === 0) return null;
            return (
              <FilterTab
                key={s}
                label={cfg.label}
                count={cnt}
                active={filter === s}
                onClick={() => setFilter(s)}
              />
            );
          },
        )}
      </div>

      {/* Order cards */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="text-stone-500 text-sm text-center py-8">
            No orders match this filter.
          </p>
        ) : (
          filtered.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              expanded={expandedId === order.id}
              onToggle={() =>
                setExpandedId(expandedId === order.id ? null : order.id)
              }
            />
          ))
        )}
      </div>
    </div>
  );
}

// ── Filter Tab ────────────────────────────────────────────

function FilterTab({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
        active
          ? "bg-emerald-600/20 text-emerald-400 border border-emerald-600/30"
          : "bg-stone-900/50 text-stone-500 border border-stone-800/30 hover:text-stone-300"
      }`}
    >
      {label}
      <span
        className={`text-[10px] px-1.5 py-0.5 rounded-full ${
          active ? "bg-emerald-600/30" : "bg-stone-800/50"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

// ── Order Card ────────────────────────────────────────────

function OrderCard({
  order,
  expanded,
  onToggle,
}: {
  order: BuyerOrder;
  expanded: boolean;
  onToggle: () => void;
}) {
  const statusCfg = STATUS_CONFIG[order.status] ?? { label: order.status, color: "text-stone-400", bg: "bg-stone-500/10" };

  return (
    <div className="rounded-2xl border border-stone-800/40 bg-stone-900/30 overflow-hidden">
      {/* Summary row — always visible */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-stone-800/20 transition-colors"
      >
        {/* Shop logo */}
        <div className="w-10 h-10 rounded-xl bg-stone-800/60 border border-stone-700/30 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {order.shop.logoUrl ? (
            <img
              src={order.shop.logoUrl}
              alt={order.shop.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-xs font-bold text-stone-500">
              {order.shop.name.charAt(0)}
            </span>
          )}
        </div>

        {/* Order info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-semibold text-stone-200 truncate">
              {order.shop.name}
            </span>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusCfg.bg} ${statusCfg.color}`}
            >
              {statusCfg.label}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-stone-500">
            <span className="font-mono">{order.orderNumber}</span>
            <span>·</span>
            <span>{formatDate(order.createdAt)}</span>
          </div>
        </div>

        {/* Total + chevron */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-stone-200">
            {formatZAR(order.totalCents)}
          </span>
          <svg
            className={`w-4 h-4 text-stone-500 transition-transform ${
              expanded ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 8.25l-7.5 7.5-7.5-7.5"
            />
          </svg>
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-stone-800/30 px-4 pb-4 pt-3 space-y-4">
          {/* Items */}
          <div className="space-y-2">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex-1 min-w-0">
                  <span className="text-stone-300">{item.productName}</span>
                  {item.option1Value && (
                    <span className="text-stone-500 text-xs ml-1">
                      ({item.option1Value}
                      {item.option2Value ? `, ${item.option2Value}` : ""})
                    </span>
                  )}
                  <span className="text-stone-600 text-xs ml-1">
                    ×{item.quantity}
                  </span>
                </div>
                <span className="text-stone-400 text-xs font-medium ml-2">
                  {formatZAR(item.priceInCents * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          {/* Shipping info */}
          {order.courierName && (
            <div className="rounded-xl bg-stone-800/30 border border-stone-800/20 p-3">
              <p className="text-xs text-stone-500 mb-1">Shipping</p>
              <p className="text-sm text-stone-300">
                {order.courierName}
                {order.trackingNumber && (
                  <span className="text-stone-500 ml-1">
                    · #{order.trackingNumber}
                  </span>
                )}
              </p>
              {order.shippedAt && (
                <p className="text-xs text-stone-500 mt-1">
                  Shipped {formatDate(order.shippedAt)}
                </p>
              )}
              {order.deliveredAt && (
                <p className="text-xs text-emerald-500 mt-1">
                  Delivered {formatDate(order.deliveredAt)}
                </p>
              )}
            </div>
          )}

          {/* Payment badge */}
          {order.paidAt ? (
            <div className="flex items-center gap-1.5 text-xs text-emerald-500">
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Paid {formatDate(order.paidAt)}
            </div>
          ) : order.status !== "CANCELLED" ? (
            <p className="text-xs text-amber-500">Payment pending</p>
          ) : null}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Link
              href={`/track/${encodeURIComponent(order.orderNumber)}`}
              className="flex-1 text-center px-4 py-2 rounded-xl bg-stone-800/60 border border-stone-700/30 text-xs font-semibold text-stone-300 hover:bg-stone-800 transition-colors"
            >
              Track Order
            </Link>
            <Link
              href={`/catalog/${order.shop.slug}`}
              className="flex-1 text-center px-4 py-2 rounded-xl bg-emerald-600/15 border border-emerald-600/20 text-xs font-semibold text-emerald-400 hover:bg-emerald-600/25 transition-colors"
            >
              Shop Again
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
