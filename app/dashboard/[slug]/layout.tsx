// ============================================================
// Layout — Seller Dashboard (Auth-Protected · Redesigned)
// ============================================================
// Polished layout with branded nav, active-state links, icons,
// responsive mobile menu, and subtle visual hierarchy.
// ============================================================

import Link from "next/link";
import { getShopBySlug } from "@/lib/db/shops";
import { requireShopAccess } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";

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

  const shop = await getShopBySlug(slug);
  if (!shop) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* ── Top Nav ─────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          {/* Brand + Shop */}
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href={`/dashboard/${slug}`}
              className="flex items-center gap-2 flex-shrink-0"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-sm">
                <span className="text-white text-sm font-bold">T</span>
              </div>
              <span className="text-lg font-bold tracking-tight hidden sm:inline">
                Trade<span className="text-emerald-600">Feed</span>
              </span>
            </Link>

            <div className="hidden sm:flex items-center gap-2 ml-1">
              <svg className="w-4 h-4 text-stone-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
              <span className="text-sm font-medium text-stone-600 truncate max-w-[200px]">
                {shop.name}
              </span>
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

      {/* ── Page Content ────────────────────────────────── */}
      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8">{children}</main>
    </div>
  );
}
