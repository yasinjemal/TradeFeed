// ============================================================
// Layout — Seller Dashboard (Auth-Protected · Redesigned)
// ============================================================
// Polished layout with branded nav, active-state links, icons,
// responsive mobile menu, and subtle visual hierarchy.
// ============================================================

import Link from "next/link";
import { getShopBySlug, getShopsForUser } from "@/lib/db/shops";
import { requireShopAccess } from "@/lib/auth";
import { TradeFeedLogo } from "@/components/ui/tradefeed-logo";
import { isAdmin } from "@/lib/auth/admin";
import { notFound, redirect } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { ShopSwitcher } from "@/components/dashboard/shop-switcher";
import { DashboardMobileNav } from "@/components/dashboard/mobile-nav";
import { MobileBottomNav } from "@/components/dashboard/mobile-bottom-nav";

interface DashboardLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function DashboardLayout({
  children,
  params,
}: DashboardLayoutProps) {
  const { slug } = await params;

  // Auth + shop access check
  let access: Awaited<ReturnType<typeof requireShopAccess>>;
  try {
    access = await requireShopAccess(slug);
  } catch {
    redirect("/sign-in");
  }

  if (!access) {
    notFound();
  }

  const [shop, userShops, adminId] = await Promise.all([
    getShopBySlug(slug),
    getShopsForUser(access.userId),
    isAdmin(),
  ]);
  if (!shop) {
    notFound();
  }
  const userIsAdmin = !!adminId;

  return (
    <div className="min-h-screen bg-stone-50">
      {/* ── Top Nav ─────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          {/* Brand + Shop + Mobile Menu */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Hamburger — triggers mobile nav rendered outside header */}
            <button
              type="button"
              id="mobile-nav-trigger"
              className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl hover:bg-stone-100 transition-colors text-stone-600"
              aria-label="Open navigation menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>

            <Link
              href="/"
              className="flex items-center gap-2 flex-shrink-0"
            >
              <TradeFeedLogo variant="dark" />
            </Link>

            <div className="hidden sm:flex items-center gap-2 ml-1">
              <svg className="w-4 h-4 text-stone-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
              <ShopSwitcher
                currentSlug={slug}
                shops={userShops.map((s) => ({
                  id: s.id,
                  slug: s.slug,
                  name: s.name,
                  role: s.role,
                }))}
              />
            </div>
          </div>

          {/* Desktop Nav */}
          <DashboardNav slug={slug} />

          {/* Right: User */}
          <div className="flex items-center gap-3">
            <Link
              href={`/catalog/${slug}`}
              target="_blank"
              className="hidden lg:flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-emerald-50"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
              Catalog
            </Link>
            {userIsAdmin && (
              <Link
                href="/admin"
                className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-red-500 hover:text-red-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
                Admin
              </Link>
            )}
            <div className="pl-3 border-l border-stone-200">
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "h-8 w-8",
                  },
                }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile nav rendered OUTSIDE header to avoid backdrop-blur containing block */}
      <DashboardMobileNav slug={slug} shopName={shop.name} />

      {/* ── Page Content ────────────────────────────────── */}
      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8 pb-24 md:pb-8">{children}</main>

      {/* ── Floating Add Product Button (mobile) ────────── */}
      <a
        href={`/dashboard/${slug}/products/new`}
        className="fixed bottom-[4.5rem] right-4 z-50 md:hidden
          w-14 h-14 rounded-full
          bg-gradient-to-br from-emerald-500 to-emerald-600
          text-white shadow-lg shadow-emerald-300/50
          flex items-center justify-center
          hover:shadow-xl hover:scale-105
          active:scale-95 transition-all duration-200"
        aria-label="Add product"
      >
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </a>

      {/* ── Mobile Bottom Tab Bar ───────────────────────── */}
      <MobileBottomNav slug={slug} />
    </div>
  );
}
