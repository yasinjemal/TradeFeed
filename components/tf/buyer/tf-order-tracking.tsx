import Link from "next/link";
import { BadgeCheck, CircleHelp, CreditCard, MapPin, MessageCircle, PackageCheck, Truck } from "lucide-react";

import { getOrderByNumber } from "@/lib/db/tracking";
import { formatZARCents } from "@/lib/currency";
import { TfButton } from "@/components/tf/button";
import { TfFonts } from "@/components/tf/tf-fonts";
import { TfTrustBar } from "@/components/tf/trust-bar";
import { TfVerifiedSellerCard } from "@/components/tf/verified-seller-card";
import { TradeFeedLogo } from "@/components/ui/tradefeed-logo";
import { TfTrackingSearch } from "./tf-tracking-search";

type Order = NonNullable<Awaited<ReturnType<typeof getOrderByNumber>>>;

const steps = [
  { key: "PENDING", label: "Order placed", detail: "The seller will confirm your order." },
  { key: "CONFIRMED", label: "Confirmed", detail: "The seller is preparing your order." },
  { key: "SHIPPED", label: "On its way", detail: "Your order has been sent or is ready to collect." },
  { key: "DELIVERED", label: "Delivered", detail: "Your order is complete." },
] as const;

const statusIndex: Record<string, number> = { PENDING: 0, CONFIRMED: 1, SHIPPED: 2, DELIVERED: 3 };

interface TfOrderTrackingProps { order: Order; payment?: string }

export function TfOrderTracking({ order, payment }: TfOrderTrackingProps) {
  const current = statusIndex[order.status] ?? 0;
  const location = [order.shop.city, order.shop.province].filter(Boolean).join(", ") || undefined;
  const waNumber = order.shop.whatsappNumber.replace(/\D/g, "");
  const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(`Hi, I have a question about order ${order.orderNumber}.`)}`;
  const isCancelled = order.status === "CANCELLED";
  const canPay = !order.paidAt && !isCancelled && order.paymentMethod !== "COD";

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
        <div className="rounded-2xl bg-tf-deep p-6 text-tf-surface">
          <p className="text-sm text-emerald-200">Order status</p>
          <div className="mt-2 flex items-start justify-between gap-4">
            <div>
              <h1 className="font-tf-hero text-3xl font-semibold tracking-tight">
                {isCancelled ? "Order cancelled" : steps[current]?.label}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-white/70">
                {isCancelled ? "Contact the seller on WhatsApp if you need help." : steps[current]?.detail}
              </p>
            </div>
            <PackageCheck aria-hidden="true" className="size-7 shrink-0 text-emerald-300" />
          </div>
        </div>

        {payment === "success" && (
          <div className="rounded-xl border border-tf-verified/25 bg-tf-verified-soft p-4 text-sm text-tf-deep">
            {order.paidAt ? "Payment received. The seller will process your order shortly." : "Your payment is being confirmed by PayFast."}
          </div>
        )}
        {payment === "cancelled" && !order.paidAt && <div className="rounded-xl border border-tf-accent/30 bg-tf-accent-soft p-4 text-sm">Payment was cancelled. You can try again below.</div>}

        <section className="rounded-xl border border-tf-stone-200 bg-tf-raised p-5 shadow-tf-sm">
          <h2 className="font-tf-display font-semibold">Order progress</h2>
          <ol className="mt-5 space-y-0">
            {isCancelled ? (
              <li className="flex gap-3 text-sm text-tf-stone-600"><CircleHelp aria-hidden="true" className="size-5 text-tf-error" />This order was cancelled.</li>
            ) : steps.map((step, index) => {
              const complete = index < current;
              const active = index === current;
              return <li key={step.key} className="flex gap-3">
                <div className="flex flex-col items-center"><span className={`flex size-7 items-center justify-center rounded-full text-xs font-semibold ${complete ? "bg-tf-verified text-white" : active ? "bg-tf-primary text-white" : "bg-tf-stone-100 text-tf-stone-400"}`}>{complete ? "✓" : index + 1}</span>{index < steps.length - 1 && <span className="h-7 w-px bg-tf-stone-200" />}</div>
                <div className={`pb-5 ${active ? "text-tf-ink" : "text-tf-stone-500"}`}><p className="text-sm font-medium">{step.label}</p><p className="mt-0.5 text-xs">{step.detail}</p></div>
              </li>;
            })}
          </ol>
        </section>

        {canPay && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-tf-stone-200 bg-tf-raised p-4">
            <div><p className="text-sm font-medium">Payment pending</p><p className="text-xs text-tf-stone-500">Pay securely through PayFast.</p></div>
            <TfButton asChild size="sm"><Link href={`/pay/${encodeURIComponent(order.orderNumber)}`}><CreditCard aria-hidden="true" />Pay {formatZARCents(order.totalCents)}</Link></TfButton>
          </div>
        )}
        {order.paymentMethod === "COD" && !order.paidAt && <div className="rounded-xl border border-tf-accent/30 bg-tf-accent-soft p-4 text-sm">Cash on delivery: pay {formatZARCents(order.totalCents)} when you receive your order.</div>}
        {(order.courierName || order.trackingNumber) && <div className="flex gap-3 rounded-xl border border-tf-stone-200 bg-tf-raised p-4 text-sm"><Truck aria-hidden="true" className="size-5 shrink-0 text-tf-primary" /><div><p className="font-medium">Delivery details</p><p className="mt-0.5 text-tf-stone-600">{[order.courierName, order.trackingNumber].filter(Boolean).join(" · ")}</p></div></div>}

        <section className="overflow-hidden rounded-xl border border-tf-stone-200 bg-tf-raised shadow-tf-sm">
          <h2 className="border-b border-tf-stone-200 px-5 py-4 font-tf-display font-semibold">Your order</h2>
          <ul className="divide-y divide-tf-stone-100">{order.items.map((item) => <li key={item.id} className="flex justify-between gap-4 px-5 py-3"><div className="min-w-0"><p className="truncate text-sm font-medium">{item.productName}</p><p className="text-xs text-tf-stone-500">Qty {item.quantity}</p></div><span className="shrink-0 text-sm tabular-nums">{formatZARCents(item.priceInCents * item.quantity)}</span></li>)}</ul>
          <div className="flex justify-between border-t border-tf-stone-200 bg-tf-stone-50 px-5 py-4 font-semibold"><span>Total</span><span className="tabular-nums">{formatZARCents(order.totalCents)}</span></div>
        </section>

        <TfVerifiedSellerCard name={order.shop.name} verified={order.shop.isVerified} avatarUrl={order.shop.logoUrl} location={location} href={`/catalog/${order.shop.slug}`} />
        <TfButton asChild variant="whatsapp" fullWidth><a href={waLink} target="_blank" rel="noopener noreferrer"><MessageCircle aria-hidden="true" />Contact seller on WhatsApp</a></TfButton>
        <TfTrustBar compact />
        {location && <p className="flex items-center justify-center gap-1.5 text-xs text-tf-stone-500"><MapPin aria-hidden="true" className="size-3.5" />{location}</p>}
        <section className="rounded-xl border border-tf-stone-200 bg-tf-stone-50 p-4"><p className="mb-3 text-sm font-medium">Track another order</p><TfTrackingSearch /></section>
      </section>
    </main>
  );
}
