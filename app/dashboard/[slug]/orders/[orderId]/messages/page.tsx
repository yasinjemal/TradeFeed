import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

import { OrderMessageThread } from "@/components/orders/order-message-thread";
import { requireShopAccess } from "@/lib/auth";
import { getSellerOrderThread } from "@/lib/db/order-messages";

export default async function SellerOrderMessagesPage({ params }: { params: Promise<{ slug: string; orderId: string }> }) {
  const { slug, orderId } = await params;
  const access = await requireShopAccess(slug, "orders:update");
  if (!access) notFound();

  const order = await getSellerOrderThread(orderId, access.shopId);
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <Link href={`/dashboard/${slug}/orders`} className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-500 hover:text-stone-800"><ArrowLeft className="size-3.5" />Back to orders</Link>
        <h1 className="mt-3 text-2xl font-bold text-stone-900">Buyer conversation</h1>
        <p className="mt-1 text-sm text-stone-500">Reply about this order without sharing personal contact details.</p>
      </div>
      <OrderMessageThread orderId={order.id} orderNumber={order.orderNumber} viewer="SELLER" participantName={order.buyerName?.trim() || "Buyer"} initialMessages={order.messages} shopSlug={slug} />
    </div>
  );
}
