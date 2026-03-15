// ============================================================
// Data Access — Transaction Fees
// ============================================================
// Platform fees captured on completed buyer payments.
// Created by ITN webhook, queried for revenue dashboards.
// ============================================================

import { db } from "@/lib/db";

/** Flat fee in cents per completed order (R7.50) */
const FLAT_FEE_CENTS = 750;

/**
 * Calculate the platform fee for a given order amount.
 * Currently a flat R7.50 per transaction.
 */
export function calculateTransactionFee(_orderAmountCents: number): number {
  return FLAT_FEE_CENTS;
}

/**
 * Create a transaction fee record for a paid order.
 * Called by the PayFast ITN webhook after marking order as PAID.
 */
export async function createTransactionFee(params: {
  orderId: string;
  shopId: string;
  orderAmountCents: number;
  payfastPaymentId?: string;
}) {
  const feeCents = calculateTransactionFee(params.orderAmountCents);

  return db.transactionFee.create({
    data: {
      orderId: params.orderId,
      shopId: params.shopId,
      orderAmountCents: params.orderAmountCents,
      feeCents,
      feeType: "flat",
      payfastPaymentId: params.payfastPaymentId,
    },
  });
}

/**
 * Get total platform revenue from transaction fees.
 */
export async function getTransactionFeeStats(options?: {
  shopId?: string;
  from?: Date;
  to?: Date;
}) {
  const where: Record<string, unknown> = {};
  if (options?.shopId) where.shopId = options.shopId;
  if (options?.from || options?.to) {
    where.createdAt = {
      ...(options?.from && { gte: options.from }),
      ...(options?.to && { lte: options.to }),
    };
  }

  const [aggregate, count] = await Promise.all([
    db.transactionFee.aggregate({
      where,
      _sum: { feeCents: true, orderAmountCents: true },
    }),
    db.transactionFee.count({ where }),
  ]);

  return {
    totalFeeCents: aggregate._sum.feeCents ?? 0,
    totalOrderAmountCents: aggregate._sum.orderAmountCents ?? 0,
    transactionCount: count,
  };
}
