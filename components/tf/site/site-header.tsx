import Link from "next/link";
import { ScanSearch } from "lucide-react";

import { LanguageSwitcher } from "@/components/language-switcher";
import { TradeFeedLogo } from "@/components/ui/tradefeed-logo";
import { TfButton } from "@/components/tf/button";
import { TfThemeToggle } from "@/components/tf/theme-toggle";
import { TfLandingHeader } from "@/components/tf/landing/tf-header";
import { sellerCta, type SellerCta } from "@/lib/config/seller-cta";

// ============================================================
// TfSiteHeader — the one header for public seller-facing pages
// ============================================================
// /sell, /pricing, /about and every SEO money page render this,
// so the navigation, the "Sign in" link and the sign-up button
// are identical wherever a prospective seller lands.
//
//   variant="overlay"  fixed, transparent over a dark hero until
//                      the page scrolls (the landing page)
//   variant="solid"    sticky on the page surface (everything else)
//
// The sign-up label and target come from lib/config/seller-cta.ts.
// Below `sm` only the logo and the sign-up button fit; HUNT, the
// language switcher and "Sign in" return from `sm` upwards.
// ============================================================

export const SITE_NAV_LINKS = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/growth", label: "Done-for-you" },
  { href: "/marketplace", label: "Marketplace" },
] as const;

interface TfSiteHeaderProps {
  variant?: "solid" | "overlay";
  /** Defaults to the signed-out sign-up call to action. */
  cta?: SellerCta;
  /** Hides "Sign in" for visitors who already have a session. */
  isSignedIn?: boolean;
}

function HuntLink({ className, compact = false }: { className: string; compact?: boolean }) {
  return (
    <Link
      href="/hunt#start-hunt"
      aria-label={compact ? "Start a TradeFeed HUNT" : undefined}
      className={`tf-hunt-nav items-center gap-1.5 rounded-full border px-3 transition-colors ${className}`}
    >
      <ScanSearch aria-hidden="true" className={compact ? "size-4" : "size-3.5"} />
      HUNT
      {!compact && (
        <span className="tf-hunt-nav-badge rounded-full px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider">
          Beta
        </span>
      )}
    </Link>
  );
}

export function TfSiteHeader({
  variant = "solid",
  cta = sellerCta(),
  isSignedIn = false,
}: TfSiteHeaderProps) {
  const overlay = variant === "overlay";

  const bar = (
    <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
      <Link href="/" aria-label="TradeFeed home" className="shrink-0">
        {overlay ? (
          <>
            <span className="tf-over-hero">
              <TradeFeedLogo size="sm" variant="light" />
            </span>
            <span className="tf-over-surface">
              <TradeFeedLogo size="sm" variant="auto" />
            </span>
          </>
        ) : (
          <TradeFeedLogo size="sm" variant="auto" />
        )}
      </Link>

      <nav
        aria-label="Main"
        className="hidden items-center gap-6 text-sm text-tf-stone-600 lg:flex"
      >
        {SITE_NAV_LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="tf-navlink hover:text-tf-ink">
            {link.label}
          </Link>
        ))}
        <HuntLink className="inline-flex min-h-10 font-semibold" />
      </nav>

      <div className="flex items-center gap-2">
        <HuntLink compact className="hidden min-h-11 shrink-0 text-xs font-bold sm:inline-flex lg:hidden" />
        <span className="hidden sm:inline-flex">
          <LanguageSwitcher />
        </span>
        <span className="hidden sm:inline-flex">
          <TfThemeToggle />
        </span>
        {!isSignedIn && (
          <Link
            href="/sign-in"
            className="hidden px-3 py-2 text-sm text-tf-stone-600 transition-colors hover:text-tf-ink sm:block"
          >
            Sign in
          </Link>
        )}
        <TfButton asChild size="sm">
          <Link href={cta.href}>{cta.label}</Link>
        </TfButton>
      </div>
    </div>
  );

  if (overlay) return <TfLandingHeader>{bar}</TfLandingHeader>;

  return (
    <header className="sticky top-0 z-30 border-b border-tf-stone-200 bg-tf-surface/95 backdrop-blur-sm">
      {bar}
    </header>
  );
}
