import type { EventType } from "@prisma/client";

/**
 * The complete runtime allowlist for records written to AnalyticsEvent.
 * Extra properties are deliberately discarded by buildAnalyticsEventRecord,
 * even if an untyped or compromised caller supplies them.
 */
export const ANALYTICS_EVENT_ALLOWED_PROPERTIES = [
  "type",
  "shopId",
  "productId",
  "visitorId",
] as const;

export interface AnalyticsEventInput {
  type: EventType;
  shopId: string;
  productId?: string;
  visitorId?: string;
}

export interface AnalyticsEventRecord {
  type: EventType;
  shopId: string;
  productId: string | null;
  visitorId: string | null;
}

function bounded(value: string | undefined, maxLength: number): string | null {
  const cleaned = value?.trim();
  return cleaned ? cleaned.slice(0, maxLength) : null;
}

function requiredIdentifier(value: string, name: string): string {
  const cleaned = bounded(value, 100);
  if (!cleaned) {
    throw new Error(`${name} is required for analytics persistence.`);
  }
  return cleaned;
}

export function buildAnalyticsEventRecord(
  input: AnalyticsEventInput,
): AnalyticsEventRecord {
  return {
    type: input.type,
    shopId: requiredIdentifier(input.shopId, "shopId"),
    productId: bounded(input.productId, 100),
    visitorId: bounded(input.visitorId, 64),
  };
}
