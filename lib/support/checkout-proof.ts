import { createHash, timingSafeEqual } from "node:crypto";

/** The random checkout key is a capability, never an order number or a phone. */
export function matchesCheckoutProof(saved: string | null, supplied?: string): boolean {
  if (!saved || !supplied || saved.length < 32 || supplied.length > 200) return false;
  return timingSafeEqual(
    createHash("sha256").update(saved).digest(),
    createHash("sha256").update(supplied).digest(),
  );
}
