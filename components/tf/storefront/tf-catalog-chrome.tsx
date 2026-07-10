import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, MapPin, Store } from "lucide-react";

import { LanguageSwitcher } from "@/components/language-switcher";
import { ShareCatalog } from "@/components/catalog/share-catalog";
import { TfThemeToggle } from "@/components/tf/theme-toggle";

// ============================================================
// TF catalog chrome — storefront header + footer rendered by
// app/catalog/[slug]/layout.tsx when UI_REDESIGN is on.
// Calm and trust-first: verified/Pro read as quiet chips, not
// gold shimmer. Server components; the interactive bits
// (language, theme, share) are their own client islands.
// ============================================================

export interface TfCatalogChromeShop {
  slug: string;
  name: string;
  logoUrl: string | null;
  isVerified: boolean;
  city: string | null;
  productCount: number;
  isPro: boolean;
  /** Seller tier label, e.g. "Top seller" — omitted for new sellers */
  tierLabel?: string;
}

export function TfCatalogHeader({ shop }: { shop: TfCatalogChromeShop }) {
  return (
    <div className="px-3 py-2.5 sm:px-4 sm:py-3">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-2">
        <Link
          href={`/catalog/${shop.slug}`}
          className="group flex min-w-0 items-center gap-2.5 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-tf-primary"
        >
          {/* Avatar */}
          <span
            className={`relative block h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-tf-stone-200 ring-2 ${
              shop.isVerified ? "ring-tf-verified/50" : "ring-tf-stone-200"
            }`}
          >
            {shop.logoUrl ? (
              <Image
                src={shop.logoUrl}
                alt={shop.name}
                width={40}
                height={40}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-sm font-bold text-tf-stone-600">
                {shop.name.charAt(0).toUpperCase()}
              </span>
            )}
          </span>

          <span className="min-w-0">
            <span className="flex items-center gap-1.5">
              <h1 className="truncate text-[15px] font-semibold leading-tight text-tf-ink transition-colors group-hover:text-tf-primary">
                {shop.name}
              </h1>
              {shop.isVerified && (
                <BadgeCheck
                  aria-label="Verified seller"
                  className="size-4 flex-shrink-0 text-tf-verified"
                />
              )}
              {shop.isPro && (
                <span className="flex-shrink-0 rounded-full bg-tf-accent-soft px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-tf-accent-ink">
                  Pro
                </span>
              )}
              {shop.tierLabel && (
                <span className="hidden flex-shrink-0 rounded-full bg-tf-stone-100 px-1.5 py-0.5 text-[9px] font-semibold text-tf-stone-600 sm:inline-block">
                  {shop.tierLabel}
                </span>
              )}
            </span>
            <span className="mt-0.5 block truncate text-[11px] leading-tight text-tf-stone-500">
              {shop.city && <span>{shop.city} · </span>}
              {shop.productCount} {shop.productCount === 1 ? "product" : "products"}
            </span>
          </span>
        </Link>

        <div className="flex flex-shrink-0 items-center gap-1">
          <LanguageSwitcher />
          <TfThemeToggle className="size-9 sm:size-11" />
          <ShareCatalog
            shopName={shop.name}
            shopSlug={shop.slug}
            productCount={shop.productCount}
            variant="icon"
          />
        </div>
      </div>
    </div>
  );
}

export function TfCatalogFooter({ shop }: { shop: TfCatalogChromeShop }) {
  return (
    <footer className="rounded-2xl border border-tf-stone-200 bg-tf-raised px-5 py-6 text-center">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-tf-stone-500">
          {shop.isVerified && (
            <span className="inline-flex items-center gap-1 font-semibold text-tf-verified">
              <BadgeCheck aria-hidden="true" className="size-3" />
              Verified
            </span>
          )}
          <span>
            {shop.productCount} {shop.productCount === 1 ? "product" : "products"}
          </span>
          {shop.city && (
            <span className="inline-flex items-center gap-1">
              <MapPin aria-hidden="true" className="size-3" />
              {shop.city}
            </span>
          )}
        </div>

        {/* Viral loop — turns buyers into sellers */}
        <Link
          href="/create-shop"
          className="group mx-auto flex w-fit items-center justify-center gap-2.5 rounded-xl bg-tf-surface px-5 py-3 ring-1 ring-tf-stone-200 transition-all duration-300 hover:shadow-tf-md hover:ring-tf-primary/40 focus-visible:ring-2 focus-visible:ring-tf-primary"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-tf-primary">
            <Store aria-hidden="true" className="size-4 text-white" />
          </span>
          <span className="text-left">
            <span className="block text-xs font-bold text-tf-ink">Powered by TradeFeed</span>
            <span className="block text-[10px] text-tf-stone-500 transition-colors group-hover:text-tf-primary">
              Create your free shop →
            </span>
          </span>
        </Link>

        <div className="flex items-center justify-center gap-4 text-[10px] text-tf-stone-400">
          <Link href="/" className="font-semibold text-tf-stone-500 transition-colors hover:text-tf-primary">
            TradeFeed
          </Link>
          <Link href="/privacy" className="transition-colors hover:text-tf-primary">
            Privacy
          </Link>
          <Link href="/terms" className="transition-colors hover:text-tf-primary">
            Terms
          </Link>
        </div>
      </div>
    </footer>
  );
}
