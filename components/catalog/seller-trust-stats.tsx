// ============================================================
// Component — Seller Trust Stats Strip
// ============================================================
// Compact trust signals under the shop hero: orders fulfilled,
// fulfilment rate, and typical dispatch time. Server component —
// zero client JS. Only renders signals that exist (no shaming
// new sellers with empty stats).
// ============================================================

import type { SellerTrustStats } from "@/lib/trust/seller-stats";
import { formatDispatchLabel } from "@/lib/trust/seller-stats";

interface SellerTrustStatsStripProps {
  stats: SellerTrustStats;
  memberSince: Date;
}

export function SellerTrustStatsStrip({ stats, memberSince }: SellerTrustStatsStripProps) {
  const dispatchLabel = formatDispatchLabel(stats.avgDispatchHours);
  const ratePercent =
    stats.fulfilmentRate !== null ? Math.round(stats.fulfilmentRate * 100) : null;

  const signals: { icon: string; text: string }[] = [];

  if (stats.ordersFulfilled >= 3) {
    signals.push({ icon: "✅", text: `${stats.ordersFulfilled} orders fulfilled` });
  }
  if (ratePercent !== null && ratePercent >= 80 && stats.ordersFulfilled >= 5) {
    signals.push({ icon: "🤝", text: `${ratePercent}% fulfilment rate` });
  }
  if (dispatchLabel) {
    signals.push({ icon: "🚚", text: dispatchLabel });
  }
  signals.push({
    icon: "🗓️",
    text: `Member since ${memberSince.toLocaleDateString("en-ZA", { month: "short", year: "numeric" })}`,
  });

  // Member-since alone isn't worth a strip
  if (signals.length < 2) return null;

  return (
    <div className="flex items-center gap-x-4 gap-y-1.5 flex-wrap rounded-2xl border border-emerald-200/50 bg-emerald-50/50 px-4 py-2.5">
      {signals.map((signal) => (
        <span key={signal.text} className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-900/80">
          <span aria-hidden="true">{signal.icon}</span>
          {signal.text}
        </span>
      ))}
    </div>
  );
}
