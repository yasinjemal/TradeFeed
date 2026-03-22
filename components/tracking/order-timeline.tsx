"use client";

// ============================================================
// Order Timeline — Visual status tracker
// ============================================================
// Shows all 4 order stages with current step highlighted.
// Cancelled orders show a special state.
// ============================================================

interface OrderTimelineProps {
  currentStatus: string;
  createdAt: string;
  updatedAt: string;
  /** When seller sent payment link to buyer */
  paymentRequestedAt?: string | null;
  /** When buyer completed payment (PayFast ITN) */
  paidAt?: string | null;
  /** Payment method (PAYFAST, COD, MANUAL) */
  paymentMethod?: string | null;
  /** When seller confirmed cash received (COD only) */
  codConfirmedAt?: string | null;
}

const STEPS = [
  {
    key: "PENDING",
    label: "Order Placed",
    desc: "Waiting for seller confirmation",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    key: "CONFIRMED",
    label: "Confirmed",
    desc: "Seller is preparing your order",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    key: "SHIPPED",
    label: "Shipped / Ready",
    desc: "Out for delivery or ready for pickup",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
    ),
  },
  {
    key: "DELIVERED",
    label: "Delivered",
    desc: "Order complete",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
] as const;

const STATUS_ORDER: Record<string, number> = {
  PENDING: 0,
  CONFIRMED: 1,
  SHIPPED: 2,
  DELIVERED: 3,
};

function formatRelative(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
}

export function OrderTimeline({
  currentStatus,
  createdAt,
  updatedAt,
  paymentRequestedAt,
  paidAt,
  paymentMethod,
  codConfirmedAt,
}: OrderTimelineProps) {
  // Handle cancelled separately
  if (currentStatus === "CANCELLED") {
    return (
      <div className="flex items-center gap-4 p-4 rounded-xl bg-red-500/5 border border-red-500/10">
        <div className="w-10 h-10 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-sm text-red-400">Order Cancelled</p>
          <p className="text-xs text-stone-500 mt-0.5">
            This order was cancelled on {new Date(updatedAt).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
      </div>
    );
  }

  const currentIndex = STATUS_ORDER[currentStatus] ?? 0;
  const isCod = paymentMethod === "COD";
  const paymentDone = !!paidAt;
  const paymentRequested = !!paymentRequestedAt && !paidAt;
  const codConfirmed = isCod && !!codConfirmedAt;

  return (
    <div className="space-y-0">
      {/* COD payment note (between steps) */}
      {isCod && (
        <div className="flex gap-4 mb-2">
          <div className="flex flex-col items-center">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 border-2 ${
                codConfirmed
                  ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                  : "bg-amber-500/20 border-amber-500 text-amber-400"
              }`}
            >
              {codConfirmed ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                </svg>
              )}
            </div>
            <div className="w-0.5 flex-1 min-h-[24px] bg-stone-800" />
          </div>
          <div className="pb-4">
            <p className="font-semibold text-sm text-stone-200">
              {codConfirmed ? "Cash payment confirmed" : "Cash on Delivery"}
            </p>
            <p className="text-xs text-stone-500 mt-0.5">
              {codConfirmed && codConfirmedAt
                ? `Cash received ${formatRelative(codConfirmedAt)}`
                : "Pay in cash when you receive your order"}
            </p>
          </div>
        </div>
      )}

      {/* Payment status row (between Order Placed and Confirmed) — only for non-COD */}
      {!isCod && (paymentRequested || paymentDone) && (
        <div className="flex gap-4 mb-2">
          <div className="flex flex-col items-center">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 border-2 ${
                paymentDone
                  ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                  : "bg-amber-500/20 border-amber-500 text-amber-400"
              }`}
            >
              {paymentDone ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5h6" />
                </svg>
              )}
            </div>
            <div className="w-0.5 flex-1 min-h-[24px] bg-stone-800" />
          </div>
          <div className="pb-4">
            <p className="font-semibold text-sm text-stone-200">
              {paymentDone ? "Payment received" : "Payment link sent"}
            </p>
            <p className="text-xs text-stone-500 mt-0.5">
              {paymentDone && paidAt
                ? `Paid ${formatRelative(paidAt)}`
                : paymentRequestedAt
                ? `Link sent ${formatRelative(paymentRequestedAt)}`
                : ""}
            </p>
          </div>
        </div>
      )}

      {STEPS.map((step, i) => {
        const stepIndex = STATUS_ORDER[step.key] ?? 0;
        const isCompleted = stepIndex < currentIndex;
        const isCurrent = stepIndex === currentIndex;
        const isFuture = stepIndex > currentIndex;
        const isLast = i === STEPS.length - 1;

        return (
          <div key={step.key} className="flex gap-4">
            {/* Circle + Connector */}
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all border-2 ${
                  isCompleted
                    ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                    : isCurrent
                    ? "bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/30 scale-110"
                    : "bg-stone-800/50 border-stone-700 text-stone-600"
                }`}
              >
                {isCompleted ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                ) : (
                  step.icon
                )}
              </div>
              {!isLast && (
                <div
                  className={`w-0.5 flex-1 min-h-[32px] transition-colors ${
                    isCompleted ? "bg-emerald-500/40" : "bg-stone-800"
                  }`}
                />
              )}
            </div>

            {/* Content */}
            <div className={`pb-6 ${isLast ? "pb-0" : ""}`}>
              <p
                className={`font-semibold text-sm ${
                  isCompleted || isCurrent ? "text-stone-200" : "text-stone-600"
                }`}
              >
                {step.label}
              </p>
              <p
                className={`text-xs mt-0.5 ${
                  isCurrent ? "text-stone-400" : "text-stone-600"
                }`}
              >
                {step.desc}
              </p>
              {isCurrent && (
                <p className="text-[11px] text-emerald-500/80 mt-1 font-medium">
                  {stepIndex === 0
                    ? `Placed ${formatRelative(createdAt)}`
                    : `Updated ${formatRelative(updatedAt)}`}
                </p>
              )}
              {isCompleted && stepIndex === 0 && (
                <p className="text-[11px] text-stone-600 mt-0.5">
                  {formatRelative(createdAt)}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
