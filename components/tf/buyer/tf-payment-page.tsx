import Link from "next/link";
import { BadgeCheck, CreditCard, MapPin, PackageCheck, TriangleAlert } from "lucide-react";

import { formatZARCents } from "@/lib/currency";
import { TfButton } from "@/components/tf/button";
import { TfFonts } from "@/components/tf/tf-fonts";
import { TfTrustBar } from "@/components/tf/trust-bar";
import { TfVerifiedSellerCard } from "@/components/tf/verified-seller-card";
import { TradeFeedLogo } from "@/components/ui/tradefeed-logo";
import { getOrderByNumber } from "@/lib/db/tracking";

type Order = NonNullable<Awaited<ReturnType<typeof getOrderByNumber>>>;

interface TfPaymentPageProps {
  order: Order;
  paymentUrl: string | null;
  status?: string;
  isExpired: boolean;
}

export function TfPaymentPage({ order, paymentUrl, status, isExpired }: TfPaymentPageProps) {
  const trackHref = `/track/${encodeURIComponent(order.orderNumber)}`;
  const alreadyPaid = Boolean(order.paidAt);
  const isCancelled = order.status === "CANCELLED";
  const isCod = order.paymentMethod === "COD";
  const location = [order.shop.city, order.shop.province].filter(Boolean).join(", ") || undefined;
  const state = alreadyPaid
    ? { title: "Payment received", body: "Your payment is confirmed. The seller will process your order shortly.", tone: "success" }
    : isCancelled
      ? { title: "This order was cancelled", body: "It can no longer be paid online.", tone: "warning" }
      : isCod
        ? { title: "Cash on delivery", body: `Pay ${formatZARCents(order.totalCents)} when you receive your order.`, tone: "warning" }
        : isExpired
          ? { title: "This payment link has expired", body: "Ask the seller to send a new payment link on WhatsApp.", tone: "warning" }
          : null;

  return (
    <main className="min-h-screen bg-tf-surface text-tf-ink">
      <TfFonts />
      <header className="border-b border-tf-stone-200 bg-tf-raised/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-xl items-center justify-between px-5">
          <Link href="/" aria-label="TradeFeed home"><TradeFeedLogo size="sm" variant="dark" /></Link>
          <span className="font-mono text-xs text-tf-stone-500">{order.orderNumber}</span>
        </div>
      </header>
      <section className="mx-auto max-w-xl space-y-4 px-5 py-8 sm:py-12">
        <div>
          <p className="text-sm font-medium text-tf-primary">Secure checkout</p>
          <h1 className="mt-1 font-tf-hero text-3xl font-semibold tracking-tight">Review your order</h1>
          <p className="mt-2 text-sm text-tf-stone-600">You&apos;re ordering from {order.shop.name}.</p>
        </div>

        {status === "success" && !alreadyPaid && (
          <div className="rounded-xl border border-tf-verified/25 bg-tf-verified-soft p-4 text-sm text-tf-deep">
            Payment is being confirmed. This page will update once PayFast completes the payment.
          </div>
        )}
        {status === "cancelled" && !alreadyPaid && (
          <div className="rounded-xl border border-tf-accent/30 bg-tf-accent-soft p-4 text-sm text-tf-ink">Payment was cancelled. You can try again below.</div>
        )}
        {state && (
          <div className="flex gap-3 rounded-xl border border-tf-stone-200 bg-tf-raised p-4">
            {state.tone === "success" ? <BadgeCheck aria-hidden="true" className="size-5 shrink-0 text-tf-verified" /> : <TriangleAlert aria-hidden="true" className="size-5 shrink-0 text-tf-accent-ink" />}
            <div><p className="font-medium">{state.title}</p><p className="mt-0.5 text-sm text-tf-stone-600">{state.body}</p></div>
          </div>
        )}

        <TfVerifiedSellerCard
          name={order.shop.name}
          verified={order.shop.isVerified}
          avatarUrl={order.shop.logoUrl}
          location={location}
          href={`/catalog/${order.shop.slug}`}
        />

        <section className="overflow-hidden rounded-xl border border-tf-stone-200 bg-tf-raised shadow-tf-sm">
          <h2 className="border-b border-tf-stone-200 px-5 py-4 font-tf-display font-semibold">Order summary</h2>
          <ul className="divide-y divide-tf-stone-100">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-4 px-5 py-4">
                <div className="min-w-0"><p className="truncate text-sm font-medium">{item.productName}</p><p className="mt-0.5 text-xs text-tf-stone-500">{item.option1Value}{item.option2Value ? ` · ${item.option2Value}` : ""} · Qty {item.quantity}</p></div>
                <span className="shrink-0 text-sm font-medium tabular-nums">{formatZARCents(item.priceInCents * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between border-t border-tf-stone-200 bg-tf-stone-50 px-5 py-4"><span className="font-medium">Total</span><span className="font-tf-display text-xl font-semibold tabular-nums">{formatZARCents(order.totalCents)}</span></div>
        </section>

        {paymentUrl && !alreadyPaid && !isCancelled && !isCod && !isExpired && (
          <div className="space-y-3">
            <TfButton asChild fullWidth size="lg"><a href={paymentUrl}><CreditCard aria-hidden="true" />Pay {formatZARCents(order.totalCents)} securely</a></TfButton>
            <p className="text-center text-xs text-tf-stone-500">Payment is handled by PayFast. TradeFeed never sees your card details.</p>
          </div>
        )}
        <TfButton asChild fullWidth variant={paymentUrl ? "ghost" : "primary"}><Link href={trackHref}><PackageCheck aria-hidden="true" />Track this order</Link></TfButton>
        <TfTrustBar compact />
        {location && <p className="flex items-center justify-center gap-1.5 text-xs text-tf-stone-500"><MapPin aria-hidden="true" className="size-3.5" />{location}</p>}
      </section>
    </main>
  );
}
