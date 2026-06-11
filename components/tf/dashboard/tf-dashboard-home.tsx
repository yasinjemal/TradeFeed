import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  BadgeCheck,
  Camera,
  ChevronRight,
  ClipboardList,
  ImportIcon,
  PackagePlus,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { formatZAR } from "@/types";
import { TfButton } from "@/components/tf/button";
import { TfEmptyState } from "@/components/tf/empty-state";
import { TfFonts } from "@/components/tf/tf-fonts";
import { TfReveal } from "@/components/tf/motion/tf-reveal";
import { TfShareCatalogue } from "./tf-share-catalogue";

// ============================================================
// TfDashboardHome — calm, scannable, card-based. Priorities for
// a seller on a low-end phone: share the catalogue (top), add
// product (photo→AI) / import, see orders, simple stats in
// tabular figures. Heavy charts live on /analytics, not here.
// ============================================================

export interface TfDashboardHomeProps {
  slug: string;
  shop: {
    name: string;
    logoUrl: string | null;
    isVerified: boolean;
    city: string | null;
  };
  catalogUrl: string;
  stats: {
    viewsLast7Days: number;
    ordersToday: number;
    revenueTodayCents: number;
    productCount: number;
  };
  pendingOrders: number;
  priorities: { level: "red" | "yellow"; label: string; href: string }[];
  recentProducts: {
    id: string;
    name: string;
    imageUrl: string | null;
    minPriceCents: number;
    totalStock: number;
    isActive: boolean;
  }[];
}

function initialsOf(name: string) {
  return name.charAt(0).toUpperCase();
}

export function TfDashboardHome({
  slug,
  shop,
  catalogUrl,
  stats,
  pendingOrders,
  priorities,
  recentProducts,
}: TfDashboardHomeProps) {
  const isNewSeller = stats.productCount === 0;

  const metric = (label: string, value: string) => (
    <div key={label} className="rounded-xl border border-tf-stone-200 bg-tf-raised p-4">
      <p className="text-xs text-tf-stone-500">{label}</p>
      <p className="mt-1 font-tf-display text-2xl font-semibold tabular-nums text-tf-ink">
        {value}
      </p>
    </div>
  );

  return (
    <div className="space-y-5 text-tf-ink">
      <TfFonts />

      {/* ── Identity ───────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-tf-deep text-base font-medium text-tf-surface">
          {shop.logoUrl ? (
            <Image src={shop.logoUrl} alt="" fill sizes="44px" className="object-cover" />
          ) : (
            initialsOf(shop.name)
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-tf-display text-lg font-semibold">
            {shop.name}
            {shop.isVerified && (
              <BadgeCheck
                aria-hidden="true"
                className="ml-1 inline-block size-[18px] align-[-3px] text-tf-verified"
              />
            )}
          </h1>
          <p className="text-xs text-tf-stone-500">
            Live{shop.city ? ` · ${shop.city}` : ""}
          </p>
        </div>
      </div>

      {/* ── Share — the #1 action, always up top ───────── */}
      <TfShareCatalogue catalogUrl={catalogUrl} shopName={shop.name} />

      {/* ── New-seller empty state: straight into import ── */}
      {isNewSeller ? (
        <TfEmptyState
          icon={<Camera />}
          title="Put your first products up"
          description="Fastest way: import your WhatsApp catalogue in one go. Or snap a photo and let AI write the listing."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <TfButton asChild>
                <Link href={`/dashboard/${slug}/import`}>
                  <ImportIcon aria-hidden="true" />
                  Import my catalogue
                </Link>
              </TfButton>
              <TfButton asChild variant="secondary">
                <Link href={`/dashboard/${slug}/products/new?ai=true`}>
                  <Camera aria-hidden="true" />
                  Photo → AI listing
                </Link>
              </TfButton>
            </div>
          }
        />
      ) : (
        <>
          {/* ── Primary actions ────────────────────────── */}
          <TfReveal stagger className="grid grid-cols-3 gap-2">
            <Link
              href={`/dashboard/${slug}/products/new?ai=true`}
              className="flex min-h-[84px] flex-col items-center justify-center gap-1.5 rounded-xl border border-tf-stone-200 bg-tf-raised p-3 text-center outline-none hover:border-tf-primary focus-visible:ring-2 focus-visible:ring-tf-primary"
            >
              <PackagePlus aria-hidden="true" className="size-5 text-tf-primary" />
              <span className="text-xs font-medium">Add product</span>
            </Link>
            <Link
              href={`/dashboard/${slug}/import`}
              className="flex min-h-[84px] flex-col items-center justify-center gap-1.5 rounded-xl border border-tf-stone-200 bg-tf-raised p-3 text-center outline-none hover:border-tf-primary focus-visible:ring-2 focus-visible:ring-tf-primary"
            >
              <ImportIcon aria-hidden="true" className="size-5 text-tf-primary" />
              <span className="text-xs font-medium">Import catalogue</span>
            </Link>
            <Link
              href={`/dashboard/${slug}/orders`}
              className="relative flex min-h-[84px] flex-col items-center justify-center gap-1.5 rounded-xl border border-tf-stone-200 bg-tf-raised p-3 text-center outline-none hover:border-tf-primary focus-visible:ring-2 focus-visible:ring-tf-primary"
            >
              <ClipboardList aria-hidden="true" className="size-5 text-tf-primary" />
              <span className="text-xs font-medium">Orders</span>
              {pendingOrders > 0 && (
                <span className="absolute right-2 top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-tf-accent px-1 text-[11px] font-semibold tabular-nums text-tf-ink">
                  {pendingOrders > 9 ? "9+" : pendingOrders}
                </span>
              )}
            </Link>
          </TfReveal>

          {/* ── Simple stats ───────────────────────────── */}
          <TfReveal stagger className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {metric("Views (7 days)", stats.viewsLast7Days.toLocaleString("en-ZA"))}
            {metric("Orders today", stats.ordersToday.toLocaleString("en-ZA"))}
            {metric("Revenue today", formatZAR(stats.revenueTodayCents))}
            {metric("Products", stats.productCount.toLocaleString("en-ZA"))}
          </TfReveal>
          <p className="-mt-3 text-right">
            <Link
              href={`/dashboard/${slug}/analytics`}
              className="text-xs font-medium text-tf-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-tf-primary"
            >
              Full stats →
            </Link>
          </p>

          {/* ── Needs attention ────────────────────────── */}
          {priorities.length > 0 && (
            <section aria-label="Needs your attention">
              <h2 className="mb-2 text-sm font-medium text-tf-stone-500">Needs your attention</h2>
              <ul className="space-y-2">
                {priorities.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="flex min-h-11 items-center gap-3 rounded-xl border border-tf-stone-200 bg-tf-raised px-4 py-2.5 outline-none hover:border-tf-stone-300 focus-visible:ring-2 focus-visible:ring-tf-primary"
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          "size-2 shrink-0 rounded-full",
                          item.level === "red" ? "bg-tf-error" : "bg-tf-accent",
                        )}
                      />
                      <span className="flex-1 text-sm">{item.label}</span>
                      <ChevronRight aria-hidden="true" className="size-4 text-tf-stone-400" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* ── Recent products ────────────────────────── */}
          <section aria-label="Recent products">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-medium text-tf-stone-500">Recent products</h2>
              <Link
                href={`/dashboard/${slug}/products`}
                className="text-xs font-medium text-tf-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-tf-primary"
              >
                View all →
              </Link>
            </div>
            <ul className="divide-y divide-tf-stone-100 overflow-hidden rounded-xl border border-tf-stone-200 bg-tf-raised">
              {recentProducts.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/dashboard/${slug}/products/${p.id}`}
                    className="flex min-h-11 items-center gap-3 px-4 py-2.5 outline-none hover:bg-tf-stone-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-tf-primary"
                  >
                    <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-tf-stone-100">
                      {p.imageUrl && (
                        <Image src={p.imageUrl} alt="" fill sizes="40px" loading="lazy" className="object-cover" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{p.name}</p>
                      {!p.isActive && <p className="text-xs text-tf-stone-400">Hidden</p>}
                    </div>
                    <div className="shrink-0 text-right tabular-nums">
                      <p className="text-sm font-medium">{formatZAR(p.minPriceCents)}</p>
                      <p className={cn("text-xs", p.totalStock > 0 ? "text-tf-stone-400" : "font-medium text-tf-error")}>
                        {p.totalStock > 0 ? `${p.totalStock} in stock` : "Out of stock"}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
