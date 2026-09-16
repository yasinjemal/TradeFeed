import { TfThemeToggle } from "@/components/tf/theme-toggle";
import Link from "next/link";
import { TradeFeedLogo } from "@/components/ui/tradefeed-logo";
import { TfFonts } from "@/components/tf/tf-fonts";

export function CommerceHeader({ compact = false }: { compact?: boolean }) {
  return (
    <header className="border-b border-tf-stone-200 bg-tf-raised text-tf-ink">
      <TfFonts />
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4">
        <Link href="/" aria-label="TradeFeed home">
          <TradeFeedLogo size="sm" variant="auto" />
        </Link>
        <nav
          aria-label="Main navigation"
          className="flex flex-wrap items-center gap-4 text-sm font-medium"
        >
          <Link className="py-2" href="/marketplace">
            Shop
          </Link>
          <Link className="py-2" href="/track">
            Track order
          </Link>
          <Link className="py-2" href="/support/order">
            Help
          </Link>
          <Link className="py-2" href="/me">
            Account
          </Link>
          <Link className="hidden py-2 sm:block" href="/sell">
            Sell on TradeFeed
          </Link>
          <TfThemeToggle className="size-11" />
      </nav>
        {!compact && (
          <form
            action="/marketplace"
            role="search"
            className="flex w-full rounded-xl border border-tf-stone-300 bg-tf-surface"
          >
            <input
              name="search"
              type="search"
              aria-label="Search products"
              placeholder="Find your next favourite"
              className="min-h-12 min-w-0 flex-1 rounded-xl bg-transparent px-4 outline-none focus-visible:ring-2 focus-visible:ring-tf-primary"
            />
            <button className="m-1 rounded-lg bg-tf-primary px-5 py-3 text-sm font-semibold text-white">
              Search
            </button>
          </form>
        )}
      </div>
    </header>
  );
}
