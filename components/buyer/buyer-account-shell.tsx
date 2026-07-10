import Link from "next/link";
import { TradeFeedLogo } from "@/components/ui/tradefeed-logo";
import { BuyerAccountNav } from "@/components/buyer/buyer-account-nav";

export function BuyerAccountShell({ children, width = "max-w-3xl" }: { children: React.ReactNode; width?: string }) {
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <header className="sticky top-0 z-30 border-b border-stone-800/60 bg-stone-950/90 backdrop-blur-xl">
        <div className={`mx-auto flex h-14 ${width} items-center justify-between px-5`}>
          <Link href="/me"><TradeFeedLogo size="sm" /></Link>
          <Link href="/marketplace" className="text-xs font-medium text-stone-500 transition-colors hover:text-stone-300">Marketplace →</Link>
        </div>
        <div className={`mx-auto ${width} px-5`}><BuyerAccountNav /></div>
      </header>
      <main className={`mx-auto ${width} px-5 py-8`}>{children}</main>
    </div>
  );
}
