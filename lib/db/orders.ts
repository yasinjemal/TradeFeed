// ============================================================
// Data Access — Orders
// ============================================================
// All order queries scoped by shopId. Never call Prisma directly
// from actions — always go through this layer.
//
// ORDER FLOW:
//   Cart → createOrder() authoritative transaction → WhatsApp
//   Seller: listOrders() → updateOrderStatus()
//
// ORDER NUMBER FORMAT: TF-YYYYMMDD-<20 HEX> (80 random bits)
// ============================================================

import { randomBytes } from "node:crypto";
import { Prisma, type OrderStatus, type Order, type OrderItem, type ShippingMethod } from "@prisma/client";
import { db } from "@/lib/db";
import { syncProductRestockAlerts } from "@/lib/notifications/buyer-alerts";
import { getSpecificRate } from "@/lib/shipping/rates";
import {
  aggregateCheckoutItems,
  aggregateStockQuantities,
  CheckoutPolicyError,
  deriveCheckoutUnitPrice,
} from "@/lib/orders/checkout-policy";

// ── Order Number Generator ──────────────────────────────────

export function generateOrderNumber(date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  // 80 bits of CSPRNG entropy prevents practical enumeration of public URLs.
  const suffix = randomBytes(10).toString("hex").toUpperCase();
  return `TF-${y}${m}${d}-${suffix}`;
}

// ── Types ───────────────────────────────────────────────────

export interface CreateOrderInput {
  shopId: string;
  shopSlug: string;
  items: {
    productId: string;
    variantId: string;
    productName: string;
    option1Label: string;
    option1Value: string;
    option2Label: string;
    option2Value: string | null;
    priceInCents: number;
    quantity: number;
    orderType?: "wholesale" | "retail";
  }[];
  buyerName?: string;
  buyerPhone?: string;
  buyerNote?: string;
  deliveryAddress?: string;
  deliveryCity?: string;
  deliveryProvince?: string;
  deliveryPostalCode?: string;
  whatsappMessage?: string;
  marketingConsent?: boolean;
  // Buyer-selected fulfilment. Rates and courier details are derived server-side.
  shippingMethod?: ShippingMethod;
  shippingRateKey?: string;
  buyerClerkId?: string;
  paymentMethod?: "PAYFAST" | "COD";
}

// ── Create Order ────────────────────────────────────────────

export type CreateOrderResult =
  | { success: true; order: Order & { items: OrderItem[] } }
  | { success: false; error: string };

const MAX_DATABASE_INT = 2_147_483_647;
const ORDER_TRANSACTION_ATTEMPTS = 3;

function wholesaleBuyerPhoneCandidates(phone: string | undefined): string[] {
  if (!phone) return [];

  const candidates = new Set([phone]);
  if (phone.startsWith("+27") && phone.length === 12) {
    candidates.add(`0${phone.slice(3)}`);
    candidates.add(phone.slice(1));
  } else if (phone.startsWith("27") && phone.length === 11) {
    candidates.add(`+${phone}`);
    candidates.add(`0${phone.slice(2)}`);
  } else if (phone.startsWith("0") && phone.length === 10) {
    candidates.add(`+27${phone.slice(1)}`);
    candidates.add(`27${phone.slice(1)}`);
  }
  return [...candidates];
}

function parseShippingRateKey(
  key: string | undefined,
): { carrier: string; service: string } | null {
  if (!key) return null;
  const separator = key.indexOf("|");
  if (separator < 1 || separator === key.length - 1) return null;
  return {
    carrier: key.slice(0, separator),
    service: key.slice(separator + 1),
  };
}

function isRetryableOrderTransactionError(error: unknown): boolean {
  if (!error || typeof error !== "object" || !("code" in error)) return false;
  const code = String(error.code);
  return code === "P2034" || code === "P2002";
}

/**
 * Create an order with line items in a single transaction.
 * The transaction is the authority for shop/product/variant membership,
 * prices, fulfilment, payment policy, and conditional stock decrements.
 *
 * Returns a result object instead of throwing so callers get
 * actionable error messages (e.g. "variant no longer available").
 */
export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  let requestedItems;
  try {
    requestedItems = aggregateCheckoutItems(
      input.items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        orderType: item.orderType ?? "wholesale",
        quantity: item.quantity,
      })),
    );
    if (requestedItems.length === 0) {
      throw new CheckoutPolicyError("Cart is empty.");
    }
  } catch (error) {
    if (error instanceof CheckoutPolicyError) {
      return { success: false, error: error.message };
    }
    throw error;
  }

  let lastError: unknown;
  for (let attempt = 0; attempt < ORDER_TRANSACTION_ATTEMPTS; attempt++) {
    const orderNumber = generateOrderNumber();
    try {
      const transactionResult = await db.$transaction(
        async (tx) => {
          const shop = await tx.shop.findFirst({
            where: {
              id: input.shopId,
              slug: input.shopSlug,
              isActive: true,
            },
            select: {
              id: true,
              codEnabled: true,
              deliveryEnabled: true,
              collectionEnabled: true,
              province: true,
              city: true,
            },
          });
          if (!shop) {
            throw new CheckoutPolicyError("This shop is not available.");
          }

          const variantIds = [...new Set(requestedItems.map((item) => item.variantId))].sort();
          const variants = await tx.productVariant.findMany({
            where: {
              id: { in: variantIds },
              isActive: true,
              product: {
                is: {
                  shopId: shop.id,
                  isActive: true,
                },
              },
            },
            select: {
              id: true,
              size: true,
              color: true,
              priceInCents: true,
              retailPriceCents: true,
              stock: true,
              product: {
                select: {
                  id: true,
                  name: true,
                  option1Label: true,
                  option2Label: true,
                  minWholesaleQty: true,
                  wholesaleOnly: true,
                  bulkDiscountTiers: {
                    orderBy: { minQuantity: "asc" },
                    select: {
                      minQuantity: true,
                      discountPercent: true,
                    },
                  },
                },
              },
            },
          });
          if (variants.length !== variantIds.length) {
            throw new CheckoutPolicyError(
              "One or more cart items are no longer available from this shop.",
            );
          }

          const variantMap = new Map(variants.map((variant) => [variant.id, variant]));
          const verifiedItems = requestedItems.map((requested) => {
            const variant = variantMap.get(requested.variantId);
            if (!variant || variant.product.id !== requested.productId) {
              throw new CheckoutPolicyError(
                "One or more cart items do not match this shop's catalogue.",
              );
            }

            const priceInCents = deriveCheckoutUnitPrice({
              orderType: requested.orderType,
              productName: variant.product.name,
              wholesaleOnly: variant.product.wholesaleOnly,
              minWholesaleQty: variant.product.minWholesaleQty,
              wholesalePriceCents: variant.priceInCents,
              retailPriceCents: variant.retailPriceCents,
              quantity: requested.quantity,
              bulkDiscountTiers: variant.product.bulkDiscountTiers,
            });

            return {
              productId: variant.product.id,
              variantId: variant.id,
              productName: variant.product.name,
              option1Label: variant.product.option1Label,
              option1Value: variant.size,
              option2Label: variant.product.option2Label,
              option2Value: variant.color,
              priceInCents,
              quantity: requested.quantity,
              orderType: requested.orderType,
            };
          });

          if (verifiedItems.some((item) => variantMap.get(item.variantId)?.product.wholesaleOnly)) {
            const phones = wholesaleBuyerPhoneCandidates(input.buyerPhone);
            const verifiedBuyer = phones.length
              ? await tx.wholesaleBuyer.findFirst({
                  where: {
                    phone: { in: phones },
                    status: "VERIFIED",
                  },
                  select: { id: true },
                })
              : null;
            if (!verifiedBuyer) {
              throw new CheckoutPolicyError(
                "A verified wholesale buyer phone number is required for this order.",
              );
            }
          }

          const itemCount = verifiedItems.reduce(
            (sum, item) => sum + item.quantity,
            0,
          );
          const merchandiseTotalCents = verifiedItems.reduce(
            (sum, item) => sum + item.priceInCents * item.quantity,
            0,
          );
          if (
            !Number.isSafeInteger(merchandiseTotalCents) ||
            merchandiseTotalCents < 0 ||
            merchandiseTotalCents > MAX_DATABASE_INT
          ) {
            throw new CheckoutPolicyError("Order total is invalid.");
          }

          let shippingMethod: ShippingMethod;
          if (input.shippingMethod) {
            shippingMethod = input.shippingMethod;
          } else if (shop.collectionEnabled && !input.deliveryAddress) {
            shippingMethod = "COLLECTION";
          } else if (shop.deliveryEnabled) {
            shippingMethod = "SELLER_ARRANGED";
          } else if (shop.collectionEnabled) {
            shippingMethod = "COLLECTION";
          } else {
            throw new CheckoutPolicyError("This shop has no available fulfilment method.");
          }

          let shippingCostCents = 0;
          let courierName: string | null = null;
          if (shippingMethod === "COLLECTION") {
            if (!shop.collectionEnabled) {
              throw new CheckoutPolicyError("Collection is not available from this shop.");
            }
          } else if (shippingMethod === "SELLER_ARRANGED") {
            if (!shop.deliveryEnabled) {
              throw new CheckoutPolicyError("Delivery is not available from this shop.");
            }
          } else if (shippingMethod === "PLATFORM_COURIER") {
            if (
              !shop.deliveryEnabled ||
              !shop.province ||
              !input.deliveryProvince ||
              !input.deliveryAddress
            ) {
              throw new CheckoutPolicyError(
                "A valid delivery address is required for courier shipping.",
              );
            }
            const rateChoice = parseShippingRateKey(input.shippingRateKey);
            if (!rateChoice) {
              throw new CheckoutPolicyError("Select a valid courier option.");
            }
            const rate = getSpecificRate(
              {
                originProvince: shop.province,
                originCity: shop.city ?? undefined,
                destinationProvince: input.deliveryProvince,
                destinationCity: input.deliveryCity,
                itemCount,
              },
              rateChoice.carrier,
              rateChoice.service,
            );
            if (!rate) {
              throw new CheckoutPolicyError("The selected courier option is not available.");
            }
            shippingCostCents = rate.priceCents;
            courierName = `${rate.carrier} — ${rate.service}`;
          } else {
            throw new CheckoutPolicyError("Invalid fulfilment method.");
          }

          const requestedPaymentMethod: string = input.paymentMethod ?? "PAYFAST";
          if (requestedPaymentMethod !== "PAYFAST" && requestedPaymentMethod !== "COD") {
            throw new CheckoutPolicyError("Invalid payment method.");
          }
          if (requestedPaymentMethod === "COD" && !shop.codEnabled) {
            throw new CheckoutPolicyError("Cash on delivery is not available from this shop.");
          }

          const totalCents = merchandiseTotalCents + shippingCostCents;
          if (
            !Number.isSafeInteger(totalCents) ||
            totalCents < 0 ||
            totalCents > MAX_DATABASE_INT
          ) {
            throw new CheckoutPolicyError("Order total is invalid.");
          }

          const stockQuantities = aggregateStockQuantities(verifiedItems);
          for (const [variantId, quantity] of [...stockQuantities].sort(([a], [b]) =>
            a.localeCompare(b),
          )) {
            const stockUpdate = await tx.productVariant.updateMany({
              where: {
                id: variantId,
                isActive: true,
                stock: { gte: quantity },
                product: {
                  is: {
                    shopId: shop.id,
                    isActive: true,
                  },
                },
              },
              data: {
                stock: { decrement: quantity },
              },
            });
            if (stockUpdate.count !== 1) {
              const productName =
                variantMap.get(variantId)?.product.name ?? "An item";
              throw new CheckoutPolicyError(
                `"${productName}" does not have enough stock for this order.`,
              );
            }
          }

          const authoritativeMessage = [
            `Order ${orderNumber}`,
            ...verifiedItems.map(
              (item) =>
                `${item.quantity} × ${item.productName} (${item.orderType}, ${item.option1Value}${item.option2Value ? ` / ${item.option2Value}` : ""}) — R${(item.priceInCents / 100).toFixed(2)} each`,
            ),
            `Total: R${(totalCents / 100).toFixed(2)}`,
          ].join("\n");

          const order = await tx.order.create({
            data: {
              orderNumber,
              shopId: shop.id,
              buyerClerkId: input.buyerClerkId,
              buyerName: input.buyerName,
              buyerPhone: input.buyerPhone,
              buyerNote: input.buyerNote,
              deliveryAddress: input.deliveryAddress,
              deliveryCity: input.deliveryCity,
              deliveryProvince: input.deliveryProvince,
              deliveryPostalCode: input.deliveryPostalCode,
              totalCents,
              itemCount,
              whatsappMessage: authoritativeMessage,
              marketingConsent: input.marketingConsent ?? false,
              shippingMethod,
              shippingCostCents,
              courierName,
              paymentMethod: requestedPaymentMethod,
              items: {
                create: verifiedItems.map((item) => ({
                  productId: item.productId,
                  variantId: item.variantId,
                  productName: item.productName,
                  option1Label: item.option1Label,
                  option1Value: item.option1Value,
                  option2Label: item.option2Label,
                  option2Value: item.option2Value,
                  priceInCents: item.priceInCents,
                  quantity: item.quantity,
                })),
              },
            },
            include: { items: true },
          });

          return {
            order,
            productIds: [...new Set(verifiedItems.map((item) => item.productId))],
          };
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          maxWait: 5_000,
          timeout: 10_000,
        },
      );

      // This optional sync must not turn a committed checkout into an error.
      for (const productId of transactionResult.productIds) {
        try {
          await syncProductRestockAlerts(productId);
        } catch (error) {
          console.error("[restock-alerts] Failed to sync after checkout", productId, error);
        }
      }

      return { success: true, order: transactionResult.order };
    } catch (error) {
      if (error instanceof CheckoutPolicyError) {
        return { success: false, error: error.message };
      }
      lastError = error;
      if (
        attempt < ORDER_TRANSACTION_ATTEMPTS - 1 &&
        isRetryableOrderTransactionError(error)
      ) {
        continue;
      }
      throw error;
    }
  }

  throw lastError;
}

// ── List Orders ─────────────────────────────────────────────

/**
 * List orders for a shop with optional status filter.
 * Sorted by newest first. Includes line items.
 */
export async function listOrders(
  shopId: string,
  options?: {
    status?: OrderStatus;
    awaitingPayment?: boolean;
    limit?: number;
    cursor?: string;
  },
) {
  const { status, awaitingPayment, limit = 20, cursor } = options ?? {};

  return db.order.findMany({
    where: {
      shopId,
      deletedAt: null,
      ...(status ? { status } : {}),
      ...(awaitingPayment ? { paymentRequestedAt: { not: null }, paidAt: null, status: { not: "CANCELLED" } } : {}),
    },
    include: {
      items: true,
      messages: {
        where: { senderType: "BUYER", readAt: null },
        select: { id: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
  });
}

// ── Get Single Order ────────────────────────────────────────

export async function getOrder(orderId: string, shopId: string) {
  return db.order.findFirst({
    where: { id: orderId, shopId, deletedAt: null },
    include: { items: true },
  });
}

// ── Update Order Status ─────────────────────────────────────

export async function updateOrderStatus(
  orderId: string,
  shopId: string,
  status: OrderStatus,
) {
  return db.order.update({
    where: { id: orderId, shopId },
    data: { status },
  });
}

// ── Mark Order Paid (webhook — no shopId scoping) ───────────

export async function markOrderPaid(orderId: string) {
  return db.order.update({
    where: { id: orderId },
    data: { paidAt: new Date(), status: "CONFIRMED" },
  });
}

/**
 * Fetch order with shop details for webhook processing.
 * No shopId scoping — webhook is server-to-server.
 */
export async function getOrderForWebhook(orderId: string) {
  return db.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderNumber: true,
      shopId: true,
      totalCents: true,
      paidAt: true,
      buyerPhone: true,
      shop: {
        select: {
          name: true,
          slug: true,
          whatsappNumber: true,
        },
      },
    },
  });
}

// ── Mark payment link requested (seller sent link to buyer) ──

/** Default payment link validity: 24 hours */
const PAYMENT_LINK_TTL_MS = 24 * 60 * 60 * 1000;

export async function markPaymentRequested(
  orderId: string,
  shopId: string,
  paymentLinkUrl?: string,
) {
  const now = new Date();
  return db.order.update({
    where: { id: orderId, shopId },
    data: {
      paymentRequestedAt: now,
      paymentLinkUrl: paymentLinkUrl ?? undefined,
      paymentLinkExpiresAt: new Date(now.getTime() + PAYMENT_LINK_TTL_MS),
    },
  });
}

// ── Order Stats ─────────────────────────────────────────────

export async function getOrderStats(shopId: string) {
  const [total, pending, confirmed, shipped, delivered, cancelled, awaitingPayment, revenue] =
    await Promise.all([
      db.order.count({ where: { shopId, deletedAt: null } }),
      db.order.count({ where: { shopId, deletedAt: null, status: "PENDING" } }),
      db.order.count({ where: { shopId, deletedAt: null, status: "CONFIRMED" } }),
      db.order.count({ where: { shopId, deletedAt: null, status: "SHIPPED" } }),
      db.order.count({ where: { shopId, deletedAt: null, status: "DELIVERED" } }),
      db.order.count({ where: { shopId, deletedAt: null, status: "CANCELLED" } }),
      db.order.count({ where: { shopId, deletedAt: null, paymentRequestedAt: { not: null }, paidAt: null, status: { not: "CANCELLED" } } }),
      db.order.aggregate({
        where: { shopId, deletedAt: null, status: { not: "CANCELLED" } },
        _sum: { totalCents: true },
      }),
    ]);

  return {
    total,
    pending,
    confirmed,
    shipped,
    delivered,
    cancelled,
    awaitingPayment,
    revenueCents: revenue._sum.totalCents ?? 0,
  };
}

// ── Product Sold Count ──────────────────────────────────────

/**
 * Get total units sold for a single product (non-cancelled orders).
 */
export async function getProductSoldCount(productId: string): Promise<number> {
  const result = await db.orderItem.aggregate({
    where: {
      productId,
      order: { status: { not: "CANCELLED" } },
    },
    _sum: { quantity: true },
  });
  return result._sum.quantity ?? 0;
}

// ── Buyer Order History ─────────────────────────────────────

/**
 * List all orders placed by a buyer (by Clerk userId).
 * Includes shop name + item details for display.
 * Excludes soft-deleted orders.
 */
export async function getBuyerOrders(buyerClerkId: string) {
  return db.order.findMany({
    where: {
      buyerClerkId,
      deletedAt: null,
    },
    include: {
      items: true,
      shop: {
        select: {
          name: true,
          slug: true,
          logoUrl: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

// ── Confirm COD Payment ─────────────────────────────────────

/**
 * Mark a COD order as "cash received" by the seller.
 * Sets codConfirmedAt + auto-advances status to DELIVERED.
 */
export async function confirmCodPayment(orderId: string, shopId: string) {
  return db.order.update({
    where: { id: orderId, shopId, paymentMethod: "COD" },
    data: {
      codConfirmedAt: new Date(),
      paidAt: new Date(),
      status: "DELIVERED",
    },
  });
}
