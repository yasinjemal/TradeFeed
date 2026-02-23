// ============================================================
// Layout — Seller Dashboard
// ============================================================
// Shared layout for all /dashboard/[slug]/* pages.
// Provides navigation, shop context, and branding.
//
// MULTI-TENANT: Resolves shop from slug. Phase 3 adds auth check.
// ============================================================

import Link from "next/link";
import { getShopBySlug } from "@/lib/db/shops";
import { notFound } from "next/navigation";

interface DashboardLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function DashboardLayout({
  children,
  params,
}: DashboardLayoutProps) {
  const { slug } = await params;
  const shop = await getShopBySlug(slug);

  if (!shop) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ---- Top Nav Bar ---- */}
      <header className="sticky top-0 z-10 border-b bg-white">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          {/* Brand + Shop Name */}
          <div className="flex items-center gap-3">
            <Link
              href={`/dashboard/${slug}`}
              className="text-lg font-bold tracking-tight"
            >
              Trade<span className="text-green-600">Feed</span>
            </Link>
            <span className="text-sm text-muted-foreground">|</span>
            <span className="text-sm font-medium truncate max-w-[150px]">
              {shop.name}
            </span>
          </div>

          {/* Nav Links */}
          <nav className="flex items-center gap-1">
            <Link
              href={`/dashboard/${slug}`}
              className="rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              Overview
            </Link>
            <Link
              href={`/dashboard/${slug}/products`}
              className="rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              Products
            </Link>
            <Link
              href={`/catalog/${slug}`}
              className="rounded-md px-3 py-2 text-sm font-medium text-green-600 hover:bg-green-50 transition-colors"
              target="_blank"
            >
              View Catalog ↗
            </Link>
          </nav>
        </div>
      </header>

      {/* ---- Page Content ---- */}
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
