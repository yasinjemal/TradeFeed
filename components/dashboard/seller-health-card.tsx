// ============================================================
// Component — Seller Health Score Card
// ============================================================
// Displays the seller's health score (0–100) with:
//   - Circular score indicator with color coding
//   - 5-dimension breakdown bars
//   - Top 3 actionable suggestions
//
// Mobile-first. No external chart libraries.
// Color coding: emerald (good) → amber (warning) → red (critical)
// ============================================================

import type { SellerHealthResult } from "@/lib/intelligence";

interface SellerHealthCardProps {
  health: SellerHealthResult;
}

// ── Color helpers ────────────────────────────────────────

function getScoreColor(score: number): {
  text: string;
  bg: string;
  border: string;
  ring: string;
  label: string;
} {
  if (score >= 75)
    return {
      text: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      ring: "stroke-emerald-500",
      label: "Excellent",
    };
  if (score >= 50)
    return {
      text: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-200",
      ring: "stroke-amber-500",
      label: "Good",
    };
  if (score >= 25)
    return {
      text: "text-orange-600",
      bg: "bg-orange-50",
      border: "border-orange-200",
      ring: "stroke-orange-500",
      label: "Needs Work",
    };
  return {
    text: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
    ring: "stroke-red-500",
    label: "Critical",
  };
}

function getBarColor(value: number, max: number): string {
  const pct = max > 0 ? value / max : 0;
  if (pct >= 0.75) return "bg-emerald-500";
  if (pct >= 0.5) return "bg-amber-500";
  if (pct >= 0.25) return "bg-orange-500";
  return "bg-red-500";
}

// ── Breakdown dimension labels ───────────────────────────

const DIMENSIONS = [
  { key: "completeness" as const, label: "Product Quality", max: 25, icon: "📦" },
  { key: "inventory" as const, label: "Inventory", max: 20, icon: "📊" },
  { key: "reliability" as const, label: "Fulfillment", max: 20, icon: "✅" },
  { key: "activity" as const, label: "Activity", max: 15, icon: "⚡" },
  { key: "diversity" as const, label: "Catalog Breadth", max: 20, icon: "🏷️" },
];

// ── Component ────────────────────────────────────────────

export function SellerHealthCard({ health }: SellerHealthCardProps) {
  const { score, breakdown, suggestions } = health;
  const color = getScoreColor(score);

  // SVG circle parameters for score ring
  const size = 88;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className={`rounded-2xl border ${color.border} ${color.bg} p-4 sm:p-5`}>
      {/* ── Header row: Score ring + label ───────────── */}
      <div className="flex items-center gap-4 sm:gap-5">
        {/* Circular score indicator */}
        <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
          <svg
            width={size}
            height={size}
            className="transform -rotate-90"
          >
            {/* Background ring */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="currentColor"
              className="text-white/60"
              strokeWidth={strokeWidth}
            />
            {/* Score ring */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              className={color.ring}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 0.6s ease-out" }}
            />
          </svg>
          {/* Score text centered */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-2xl font-bold ${color.text}`}>
              {score}
            </span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-sm text-stone-900">Shop Health</h3>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${color.text} ${color.bg} border ${color.border}`}
            >
              {color.label}
            </span>
          </div>
          <p className="text-[12px] text-stone-500 mt-1">
            How well your shop is performing across 5 key areas.
          </p>
        </div>
      </div>

      {/* ── Breakdown bars ────────────────────────────── */}
      <div className="mt-4 space-y-2.5">
        {DIMENSIONS.map((dim) => {
          const value = breakdown[dim.key];
          const pct = dim.max > 0 ? Math.round((value / dim.max) * 100) : 0;

          return (
            <div key={dim.key}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[11px] font-medium text-stone-600 flex items-center gap-1.5">
                  <span className="text-xs">{dim.icon}</span>
                  {dim.label}
                </span>
                <span className="text-[10px] text-stone-500 tabular-nums">
                  {value}/{dim.max}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-white/70 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${getBarColor(value, dim.max)}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Suggestions ───────────────────────────────── */}
      {suggestions.length > 0 && (
        <div className="mt-4 pt-3 border-t border-stone-200/50">
          <p className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider mb-2">
            💡 How to improve
          </p>
          <ul className="space-y-1.5">
            {suggestions.map((s, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-[12px] text-stone-600 leading-relaxed"
              >
                <span className="w-4 h-4 rounded-full bg-white flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-bold text-stone-400">
                  {i + 1}
                </span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
