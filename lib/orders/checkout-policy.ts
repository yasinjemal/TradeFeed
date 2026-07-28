import {
  effectiveUnitPriceCents,
  type BulkDiscountTier,
  type OrderType,
} from "@/lib/cart/pricing";

export const MAX_CHECKOUT_QUANTITY_PER_LINE = 1_000;
export const MAX_CHECKOUT_TOTAL_QUANTITY = 10_000;

export class CheckoutPolicyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CheckoutPolicyError";
  }
}

export interface RequestedCheckoutItem {
  productId: string;
  variantId: string;
  orderType: OrderType;
  quantity: number;
}

/**
 * Merge repeated cart rows without conflating retail and wholesale prices.
 * A variant can legitimately appear once per order type, but repeated rows
 * for the same variant + order type must share a product and quantity cap.
 */
export function aggregateCheckoutItems<T extends RequestedCheckoutItem>(
  items: readonly T[],
): T[] {
  const aggregated = new Map<string, T>();
  let totalQuantity = 0;

  for (const item of items) {
    if (
      !Number.isSafeInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > MAX_CHECKOUT_QUANTITY_PER_LINE
    ) {
      throw new CheckoutPolicyError("Invalid item quantity.");
    }

    totalQuantity += item.quantity;
    if (totalQuantity > MAX_CHECKOUT_TOTAL_QUANTITY) {
      throw new CheckoutPolicyError("Order quantity is too large.");
    }

    const key = `${item.variantId}:${item.orderType}`;
    const existing = aggregated.get(key);
    if (!existing) {
      aggregated.set(key, { ...item });
      continue;
    }
    if (existing.productId !== item.productId) {
      throw new CheckoutPolicyError("A cart item does not match its product.");
    }

    const quantity = existing.quantity + item.quantity;
    if (quantity > MAX_CHECKOUT_QUANTITY_PER_LINE) {
      throw new CheckoutPolicyError("Quantity is too large for one item.");
    }
    aggregated.set(key, { ...existing, quantity });
  }

  return [...aggregated.values()];
}

export function deriveCheckoutUnitPrice(input: {
  orderType: OrderType;
  productName: string;
  wholesaleOnly: boolean;
  minWholesaleQty: number;
  wholesalePriceCents: number;
  retailPriceCents: number | null;
  quantity: number;
  bulkDiscountTiers: readonly BulkDiscountTier[];
}): number {
  if (input.orderType === "retail" && input.wholesaleOnly) {
    throw new CheckoutPolicyError(`"${input.productName}" is wholesale only.`);
  }

  const minWholesaleQty = Math.max(1, input.minWholesaleQty);
  if (input.orderType === "wholesale" && input.quantity < minWholesaleQty) {
    throw new CheckoutPolicyError(
      `"${input.productName}" requires at least ${minWholesaleQty} units for wholesale orders.`,
    );
  }

  const priceInCents = effectiveUnitPriceCents({
    orderType: input.orderType,
    wholesalePriceCents: input.wholesalePriceCents,
    retailPriceCents: input.retailPriceCents,
    quantity: input.quantity,
    bulkDiscountTiers: input.bulkDiscountTiers,
  });

  if (!Number.isSafeInteger(priceInCents) || priceInCents < 0) {
    throw new CheckoutPolicyError(`"${input.productName}" has invalid pricing.`);
  }
  return priceInCents;
}

export function aggregateStockQuantities(
  items: readonly Pick<RequestedCheckoutItem, "variantId" | "quantity">[],
): Map<string, number> {
  const quantities = new Map<string, number>();
  for (const item of items) {
    quantities.set(
      item.variantId,
      (quantities.get(item.variantId) ?? 0) + item.quantity,
    );
  }
  return quantities;
}
