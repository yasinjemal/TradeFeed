import Link from "next/link";
import { PackageSearch, ShieldCheck } from "lucide-react";

import { TfFonts } from "@/components/tf/tf-fonts";
import { TradeFeedLogo } from "@/components/ui/tradefeed-logo";
import { TfTrackingSearch } from "./tf-tracking-search";

export function TfTrackingLanding() {
  return (
    <main className="min-h-screen bg-tf-surface text-tf-ink">
      <TfFonts />
      <header className="border-b border-tf-stone-200 bg-tf-raised/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-5">
          <Link href="/" aria-label="TradeFeed home"><TradeFeedLogo size="sm" variant="dark" /></Link>
          <Link href="/marketplace" className="text-sm text-tf-stone-600 hover:text-tf-ink">Marketplace</Link>
        </div>
      </header>
      <section className="mx-auto max-w-xl px-5 py-16 sm:py-24">
        <div className="rounded-2xl border border-tf-stone-200 bg-tf-raised p-6 shadow-tf-sm sm:p-8">
          <div className="mb-6 flex size-12 items-center justify-center rounded-xl bg-tf-verified-soft text-tf-primary">
            <PackageSearch aria-hidden="true" className="size-6" />
          </div>
          <p className="text-sm font-medium text-tf-primary">Order updates, in one place</p>
          <h1 className="mt-2 font-tf-hero text-4xl font-semibold tracking-tight">Track your order</h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-tf-stone-600">
            Enter the order number from your TradeFeed WhatsApp message to see its latest status.
          </p>
          <div className="mt-7"><TfTrackingSearch /></div>
          <div className="mt-7 flex gap-3 rounded-xl bg-tf-stone-50 p-4 text-sm text-tf-stone-600">
            <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-tf-primary" />
            <p>Your order details are private. Only someone with the order number can view this page.</p>
          </div>
        </div>
      </section>
    </main>
  );
}

export function TfTrackingNotFound({ orderNumber }: { orderNumber: string }) {
  return (
    <main className="min-h-screen bg-tf-surface text-tf-ink">
      <TfFonts />
      <header className="border-b border-tf-stone-200 bg-tf-raised/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-5">
          <Link href="/" aria-label="TradeFeed home"><TradeFeedLogo size="sm" variant="dark" /></Link>
          <Link href="/marketplace" className="text-sm text-tf-stone-600 hover:text-tf-ink">Marketplace</Link>
        </div>
      </header>
      <section className="mx-auto max-w-xl px-5 py-16 sm:py-24">
        <div className="rounded-2xl border border-tf-stone-200 bg-tf-raised p-6 shadow-tf-sm sm:p-8">
          <div className="mb-6 flex size-12 items-center justify-center rounded-xl bg-tf-error-soft text-tf-error"><PackageSearch aria-hidden="true" className="size-6" /></div>
          <h1 className="font-tf-hero text-3xl font-semibold tracking-tight">We couldn&apos;t find that order</h1>
          <p className="mt-3 text-sm leading-relaxed text-tf-stone-600">Double-check the order number from your WhatsApp message and try again.</p>
          <p className="mt-4 inline-flex rounded-lg bg-tf-stone-50 px-3 py-2 font-mono text-sm text-tf-stone-600">{orderNumber}</p>
          <div className="mt-7"><TfTrackingSearch /></div>
        </div>
      </section>
    </main>
  );
}
