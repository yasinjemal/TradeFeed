import * as React from "react";
import Link from "next/link";

import { TfButton } from "@/components/tf/button";
import { TfReveal } from "@/components/tf/motion/tf-reveal";
import { JsonLdScript } from "@/components/tf/site/json-ld-script";
import { TfSiteFooter } from "@/components/tf/site/site-footer";
import { TfSiteHeader } from "@/components/tf/site/site-header";
import { sellerCta } from "@/lib/config/seller-cta";

// ============================================================
// SeoPageShell — shared frame for editorial money pages
// (SEO blueprint §7). Breadcrumb JSON-LD plus the site-wide
// header and footer, so /pricing, /about, /faq and the money
// pages carry the same navigation, sign-up button, company
// details and "linking spine" as the /sell landing page.
// ============================================================

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://tradefeed.co.za";

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
      <JsonLdScript data={breadcrumbLd} />
      <TfSiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">{children}</main>
      <TfSiteFooter />
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

/**
 * Mid-page conversion banner. The label is deliberately not a prop:
 * every sign-up button on the site says the same thing and goes to
 * the same place (lib/config/seller-cta.ts).
 */
export function SeoCta({ sub }: { sub?: string }) {
  const cta = sellerCta();
  return (
    <div className="mt-10 rounded-xl bg-tf-deep p-6 text-center">
      <TfButton asChild size="lg">
        <Link href={cta.href}>{cta.label}</Link>
      </TfButton>
      <p className="mt-3 text-xs text-emerald-100/80">
        {sub ?? "20 products free · 10 AI listings a month · no credit card · set up in under 3 minutes"}
      </p>
    </div>
  );
}
