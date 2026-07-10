import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { ArrowLeft } from "lucide-react";
import { notFound, redirect } from "next/navigation";

import { OrderMessageThread } from "@/components/orders/order-message-thread";
import { TradeFeedLogo } from "@/components/ui/tradefeed-logo";
import { getBuyerOrderThread } from "@/lib/db/order-messages";

export const metadata = { title: "Order Messages | TradeFeed", robots: { index: false, follow: false } };

export default async function BuyerOrderMessagesPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const { userId } = await auth();
  if (!userId) redirect(`/sign-in?redirect_url=${encodeURIComponent(`/orders/${orderId}/messages`)}`);

  const order = await getBuyerOrderThread(orderId, userId);
  if (!order) notFound();

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <header className="border-b border-stone-800/50 bg-stone-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-5">
          <Link href="/"><TradeFeedLogo size="sm" /></Link>
          <Link href="/orders" className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-200"><ArrowLeft className="size-3.5" />My orders</Link>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-5 py-8">
        <div className="mb-5">
          <h1 className="text-xl font-bold">Message seller</h1>
          <p className="mt-1 text-xs text-stone-500">Messages are private and connected to this order.</p>
        </div>
        <OrderMessageThread orderId={order.id} orderNumber={order.orderNumber} viewer="BUYER" participantName={order.shop.name} initialMessages={order.messages} />
        <p className="mt-4 text-center text-[11px] text-stone-600">For your safety, keep payment and order arrangements inside TradeFeed.</p>
      </main>
    </div>
  );
}
