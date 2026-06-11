// Shared formatting helpers for the TF design system.

const zar = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const zarCents = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Format a Rand amount: whole rands get no cents ("R1 899"), otherwise two ("R1 899.50"). */
export function formatZAR(amount: number): string {
  return Number.isInteger(amount) ? zar.format(amount) : zarCents.format(amount);
}

/** "~8 min" / "~2 hrs" / "~1 day" from minutes. */
export function formatReplyTime(minutes: number): string {
  if (minutes < 60) return `~${Math.max(1, Math.round(minutes))} min`;
  if (minutes < 60 * 24) return `~${Math.round(minutes / 60)} hr${minutes >= 90 ? "s" : ""}`;
  const days = Math.round(minutes / (60 * 24));
  return `~${days} day${days > 1 ? "s" : ""}`;
}
