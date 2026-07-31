import Link from "next/link";

import { TfButton } from "@/components/tf/button";
import { TfThemeToggle } from "@/components/tf/theme-toggle";
import { TradeFeedLogo } from "@/components/ui/tradefeed-logo";
import { cn } from "@/lib/utils";

export function HuntHeader({ overHero = false }: { overHero?: boolean }) {
  return (
    <header
      className={cn(
        "z-30 w-full",
        overHero
          ? "absolute inset-x-0 top-0 border-b border-white/10 bg-transparent"
          : "sticky top-0 border-b border-tf-stone-200 bg-tf-raised/95 shadow-tf-sm backdrop-blur-xl",
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          href="/"
          aria-label="TradeFeed home"
          className="inline-flex items-center gap-2.5"
        >
          <TradeFeedLogo
            size="sm"
            variant={overHero ? "light" : "auto"}
          />
          <span
            className={cn(
              "rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-[0.18em]",
              overHero
                ? "border-white/20 bg-white/10 text-white"
                : "border-tf-stone-200 bg-tf-stone-100 text-tf-stone-600",
            )}
          >
            HUNT
          </span>
        </Link>

        <nav
          aria-label="HUNT navigation"
          className={cn(
            "hidden items-center gap-6 text-sm md:flex",
            overHero ? "text-white/70" : "text-tf-stone-600",
          )}
        >
          <Link
            href="/hunt#how-it-works"
            className={cn(
              "transition-colors",
              overHero ? "hover:text-white" : "hover:text-tf-ink",
            )}
          >
            How it works
          </Link>
          <Link
            href="/hunt#live-hunts"
            className={cn(
              "transition-colors",
              overHero ? "hover:text-white" : "hover:text-tf-ink",
            )}
          >
            Live Hunts
          </Link>
          <Link
            href="/marketplace"
            className={cn(
              "transition-colors",
              overHero ? "hover:text-white" : "hover:text-tf-ink",
            )}
          >
            Marketplace
          </Link>
        </nav>

        <div className="flex items-center gap-1.5">
          <TfThemeToggle
            className={cn(
              overHero &&
                "text-white/70 hover:bg-white/10 hover:text-white focus-visible:ring-white focus-visible:ring-offset-[#071a0f]",
            )}
          />
          <TfButton asChild size="sm">
            <Link href="/hunt">Start a Hunt</Link>
          </TfButton>
        </div>
      </div>
    </header>
  );
}
