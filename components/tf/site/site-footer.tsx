import Link from "next/link";

import { TradeFeedLogo } from "@/components/ui/tradefeed-logo";
import { TfCompanyDetails } from "@/components/tf/site/company-details";
import { COMPANY } from "@/lib/config/company";
import { SA_PROVINCES } from "@/lib/marketplace/locations";

// ============================================================
// TfSiteFooter — the one footer for public seller-facing pages
// ============================================================
// Three jobs:
//  1. Linking spine (SEO blueprint §12): every page links to the
//     money pages, the info pages and the province pages.
//  2. Company identity: who operates TradeFeed and how to reach a
//     person (lib/config/company.ts).
//  3. Payment methods, named in text. No card-scheme or PayFast
//     logos: their marks may only be used under each brand's own
//     rules, which nobody has confirmed for this site.
// ============================================================

export const MONEY_LINKS = [
  { href: "/sell-online-south-africa", label: "Sell online in South Africa" },
  { href: "/create-online-shop", label: "Create an online shop" },
  { href: "/sell-on-whatsapp", label: "Sell on WhatsApp" },
  { href: "/whatsapp-catalog", label: "WhatsApp catalogue for business" },
  { href: "/import-whatsapp-catalogue", label: "Import your WhatsApp catalogue" },
  { href: "/compare/shopify-alternative-south-africa", label: "Shopify alternative for SA" },
  { href: "/compare/whatsapp-groups", label: "TradeFeed vs WhatsApp groups" },
] as const;

const PRODUCT_LINKS = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/faq", label: "FAQ" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/hunt#start-hunt", label: "TradeFeed HUNT", badge: "Beta" },
  { href: "/growth", label: "TradeFeed Growth" },
] as const;

const COMPANY_LINKS = [
  { href: "/about", label: "About TradeFeed" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy", label: "Privacy (POPIA)" },
  { href: "/terms", label: "Terms" },
] as const;

const headingCls = "mb-3 text-xs font-semibold uppercase tracking-wider text-tf-stone-500";
const linkCls = "text-sm text-tf-stone-600 transition-colors hover:text-tf-ink";

function LinkColumn({
  title,
  links,
}: {
  title: string;
  links: readonly { href: string; label: string; badge?: string }[];
}) {
  return (
    <nav aria-label={title}>
      <h2 className={headingCls}>{title}</h2>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className={`inline-flex items-center gap-2 ${linkCls}`}>
              {link.label}
              {link.badge && (
                <span className="rounded-full bg-tf-verified-soft px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-tf-verified">
                  {link.badge}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function TfSiteFooter() {
  return (
    <footer className="border-t border-tf-stone-200 bg-tf-raised">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <TradeFeedLogo size="sm" variant="auto" />
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-tf-stone-600">
              South Africa&apos;s WhatsApp-first marketplace. Create an online shop, list
              products, and take orders on WhatsApp.
            </p>
          </div>
          <LinkColumn title="Product" links={PRODUCT_LINKS} />
          <LinkColumn title="For sellers" links={MONEY_LINKS} />
          <LinkColumn title="Company" links={COMPANY_LINKS} />
        </div>

        <nav aria-label="Shops by province" className="mt-10 border-t border-tf-stone-200 pt-6">
          <h2 className={headingCls}>Shops by province</h2>
          <ul className="flex flex-wrap gap-x-4 gap-y-2">
            {SA_PROVINCES.map((province) => (
              <li key={province.slug}>
                <Link href={`/marketplace/${province.slug}`} className={linkCls}>
                  {province.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <section aria-label="Company details" className="mt-8 border-t border-tf-stone-200 pt-6">
          <h2 className={headingCls}>Who you&apos;re dealing with</h2>
          <TfCompanyDetails className="lg:grid-cols-4" />
          <p className="mt-5 max-w-3xl text-sm leading-relaxed text-tf-stone-600">
            Seller subscriptions are billed in rand through PayFast, by card or EFT. Buyers
            arrange payment directly with the seller.{" "}
            <Link href="/about" className="underline decoration-tf-stone-300 underline-offset-2 hover:text-tf-ink">
              How TradeFeed works
            </Link>
          </p>
        </section>

        <p className="mt-8 border-t border-tf-stone-200 pt-6 text-xs text-tf-stone-600">
          © {new Date().getFullYear()} {COMPANY.legalName ?? COMPANY.brandName}. Your
          information is handled under POPIA —{" "}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-tf-ink">
            privacy policy
          </Link>
          .
        </p>
      </div>
    </footer>
  );
}
