export type RestockAlertDecision = "ARM" | "NOTIFY" | "NONE";

/** Pure state transition used by inventory notification orchestration. */
export function getRestockAlertDecision(
  totalStock: number,
  restockNotifiedAt: Date | null,
): RestockAlertDecision {
  if (!Number.isFinite(totalStock) || totalStock <= 0) return "ARM";
  return restockNotifiedAt === null ? "NOTIFY" : "NONE";
}
