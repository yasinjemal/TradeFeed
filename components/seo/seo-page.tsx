import * as React from "react";
import Link from "next/link";

import { TradeFeedLogo } from "@/components/ui/tradefeed-logo";
import { TfButton } from "@/components/tf/button";
import { TfFonts } from "@/components/tf/tf-fonts";
import { SA_PROVINCES } from "@/lib/marketplace/locations";
import { TfReveal } from "@/components/tf/motion/tf-reveal";

// ============================================================
// SeoPageShell — shared frame for editorial money pages
// (SEO blueprint §7). Header with one CTA, breadcrumb JSON-LD,
// and the sitewide footer "linking spine" that pushes authority
// into money + province pages from every editorial URL.
// ============================================================

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://tradefeed.co.za";

export const MONEY_LINKS = [
  { href: "/sell-online-south-africa", label: "Sell online in South Africa" },
  { href: "/create-online-shop", label: "Create an online shop" },
  { href: "/sell-on-whatsapp", label: "Sell on WhatsApp" },
  { href: "/whatsapp-catalog", label: "WhatsApp catalogue for business" },
  { href: "/import-whatsapp-catalogue", label: "Import your WhatsApp catalogue" },
  { href: "/pricing", label: "Pricing" },
  { href: "/compare/shopify-alternative-south-africa", label: "Shopify alternative for SA" },
  { href: "/compare/whatsapp-groups", label: "TradeFeed vs WhatsApp groups" },
] as const;

interface SeoPageShellProps {
  /** Current page for breadcrumb schema, e.g. { name: "Sell on WhatsApp", path: "/sell-on-whatsapp" } */
  breadcrumb: { name: string; path: string };
  children: React.ReactNode;
}

export function SeoPageShell({ breadcrumb, children }: SeoPageShellProps) {
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "TradeFeed", item: APP_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: breadcrumb.name,
        item: `${APP_URL}${breadcrumb.path}`,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-tf-surface text-tf-ink">
      <TfFonts />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      <header className="sticky top-0 z-30 border-b border-tf-stone-200 bg-tf-surface/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/" aria-label="TradeFeed home" className="shrink-0">
            <TradeFeedLogo size="sm" />
          </Link>
          <nav aria-label="Main" className="hidden items-center gap-5 text-sm text-tf-stone-600 md:flex">
            <Link href="/marketplace" className="hover:text-tf-ink">Marketplace</Link>
            <Link href="/pricing" className="hover:text-tf-ink">Pricing</Link>
            <Link href="/sign-in" className="hover:text-tf-ink">Sign in</Link>
          </nav>
          <TfButton asChild size="sm">
            <Link href="/sign-up">Create your free shop</Link>
          </TfButton>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">{children}</main>

      {/* ── Linking spine (blueprint §12) ─────────────────── */}
      <footer className="border-t border-tf-stone-200 bg-tf-raised">
        <div className="mx-auto grid max-w-4xl gap-8 px-4 py-10 sm:grid-cols-3 sm:px-6">
          <nav aria-label="For sellers">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-tf-stone-500">
              For sellers
            </h2>
            <ul className="space-y-2">
              {MONEY_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-tf-stone-600 hover:text-tf-ink">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label="Sell in your province">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-tf-stone-500">
              Shops by province
            </h2>
            <ul className="space-y-2">
              {SA_PROVINCES.map((p) => (
                <li key={p.slug}>
                  <Link
                    href={`/marketplace/${p.slug}`}
                    className="text-sm text-tf-stone-600 hover:text-tf-ink"
                  >
                    {p.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label="TradeFeed">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-tf-stone-500">
              TradeFeed
            </h2>
            <ul className="space-y-2">
              {[
                { href: "/marketplace", label: "Browse the marketplace" },
                { href: "/contact", label: "Contact" },
                { href: "/privacy", label: "Privacy (POPIA)" },
                { href: "/terms", label: "Terms" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-tf-stone-600 hover:text-tf-ink">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <p className="border-t border-tf-stone-200 px-4 py-4 text-center text-xs text-tf-stone-500">
          © {new Date().getFullYear()} TradeFeed — South Africa&apos;s WhatsApp-first marketplace.
        </p>
      </footer>
    </div>
  );
}

/** Section heading + prose wrapper for consistent editorial rhythm. */
export function SeoSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <TfReveal as="section" className="mt-10">
      <h2 className="font-tf-display text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
      <div className="mt-3 space-y-4 text-[15px] leading-relaxed text-tf-stone-600 [&_strong]:text-tf-ink">
        {children}
      </div>
    </TfReveal>
  );
}

/** Mid-page conversion banner. */
export function SeoCta({ label = "Create your free shop", sub }: { label?: string; sub?: string }) {
  return (
    <div className="mt-10 rounded-xl bg-tf-deep p-6 text-center">
      <TfButton asChild size="lg">
        <Link href="/sign-up">{label}</Link>
      </TfButton>
      <p className="mt-3 text-xs text-emerald-100/80">
        {sub ?? "20 products free · 10 AI listings a month · no credit card · set up in under 3 minutes"}
      </p>
    </div>
  );
}
