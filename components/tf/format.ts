// Shared formatting helpers for the TF design system.

// Product-card and order-panel props deliberately use Rand amounts.
export { formatZARRands as formatZAR } from "@/lib/currency";

/** "~8 min" / "~2 hrs" / "~1 day" from minutes. */
export function formatReplyTime(minutes: number): string {
  if (minutes < 60) return `~${Math.max(1, Math.round(minutes))} min`;
  if (minutes < 60 * 24) return `~${Math.round(minutes / 60)} hr${minutes >= 90 ? "s" : ""}`;
  const days = Math.round(minutes / (60 * 24));
  return `~${days} day${days > 1 ? "s" : ""}`;
}
