import { buyerOnlinePaymentsEnabled } from "@/lib/commerce/capabilities";
// ============================================================
// Public Buyer Payment Page — /pay/[orderNumber]
// ============================================================
// No auth required. Buyer accesses via link from seller.
// Shows: order summary, items, total, and "Pay Now" button
// that redirects to PayFast hosted checkout.
// ============================================================

import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getOrderByNumber } from "@/lib/db/tracking";
import { buildOrderPaymentUrl } from "@/lib/payfast";
import { TfPaymentPage } from "@/components/tf/buyer/tf-payment-page";

interface PayPageProps {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ status?: string }>;
}

export async function generateMetadata({ params }: PayPageProps): Promise<Metadata> {
  const { orderNumber } = await params;
  const decoded = decodeURIComponent(orderNumber);
  return {
    title: `Pay for Order ${decoded} | TradeFeed`,
    description: `Complete payment for your TradeFeed order ${decoded}.`,
    robots: { index: false, follow: false },
  };
}

export default async function PayPage({ params, searchParams }: PayPageProps) {
  const { orderNumber } = await params;
  const { status } = await searchParams;
  const decoded = decodeURIComponent(orderNumber);
  const order = await getOrderByNumber(decoded);

  if (!order) return notFound();

  const alreadyPaid = !!order.paidAt;
  const isCancelled = order.status === "CANCELLED";
  const isExpired = Boolean((order.paymentLinkExpiresAt && order.paymentLinkExpiresAt < new Date()) || (order.status === "PENDING" && order.reservationExpiresAt && order.reservationExpiresAt < new Date()));

  // Generate PayFast URL server-side (no client action needed)
  const paymentUrl =
    !alreadyPaid && !isCancelled && !isExpired && !order.paymentReviewRequired && order.paymentMethod === "PAYFAST" && buyerOnlinePaymentsEnabled(order.shop.id)
      ? buildOrderPaymentUrl({
          orderId: order.id,
          orderNumber: order.orderNumber,
          shopSlug: order.shop.slug,
          amountInCents: order.totalCents,
        })
      : null;

  return <TfPaymentPage order={order} paymentUrl={paymentUrl} status={status} isExpired={isExpired} />;
}
