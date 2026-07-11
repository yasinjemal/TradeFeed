import Link from "next/link";
import { Compass, UserRound } from "lucide-react";
import { TradeFeedLogo } from "@/components/ui/tradefeed-logo";
import { BuyerAccountNav } from "@/components/buyer/buyer-account-nav";

export function BuyerAccountShell({
  children,
  width = "max-w-6xl",
}: {
  children: React.ReactNode;
  width?: string;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#080a09] text-stone-100">
      <div
        className="pointer-events-none fixed inset-x-0 top-0 h-[560px] bg-[radial-gradient(circle_at_50%_-15%,rgba(16,185,129,0.14),transparent_58%)]"
        aria-hidden="true"
      />

      <header className="sticky top-0 z-30 border-b border-white/[0.07] bg-[#080a09]/88 backdrop-blur-2xl">
        <div className={`mx-auto flex h-16 ${width} items-center justify-between px-4 sm:px-6`}>
          <Link href="/me" aria-label="My TradeFeed home">
            <TradeFeedLogo size="sm" />
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/marketplace"
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3.5 text-xs font-semibold text-stone-300 transition hover:border-emerald-400/25 hover:bg-emerald-400/10 hover:text-emerald-300"
            >
              <Compass className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Marketplace</span>
            </Link>
            <Link
              href="/me/account"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-stone-300 transition hover:border-emerald-400/25 hover:bg-emerald-400/10 hover:text-emerald-300"
              aria-label="Account settings"
            >
              <UserRound className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className={`mx-auto hidden ${width} px-6 md:block`}>
          <BuyerAccountNav />
        </div>
      </header>

      <main className={`relative mx-auto ${width} px-4 py-6 sm:px-6 sm:py-8`}>
        {children}
      </main>
    </div>
  );
}
