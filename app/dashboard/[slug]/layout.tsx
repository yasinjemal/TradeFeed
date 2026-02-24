// ============================================================
// Layout — Seller Dashboard (Auth-Protected)
// ============================================================
// Shared layout for all /dashboard/[slug]/* pages.
// Provides navigation, shop context, auth guard, and branding.
//
// MULTI-TENANT: Resolves shop from slug + verifies user membership.
// AUTH: Clerk middleware protects the route, this layout verifies
//       shop-level access and provides the UserButton.
// ============================================================

import Link from "next/link";
import { getShopBySlug } from "@/lib/db/shops";
import { requireShopAccess } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { UserButton } from "@clerk/nextjs";

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
    // Not signed in — Clerk middleware should catch this,
    // but handle edge case
    redirect("/sign-in");
  }

  if (!access) {
    // Signed in but no access to this shop
    notFound();
  }

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
              href={`/dashboard/${slug}/settings`}
              className="rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              Settings
            </Link>
            <Link
              href={`/catalog/${slug}`}
              className="rounded-md px-3 py-2 text-sm font-medium text-green-600 hover:bg-green-50 transition-colors"
              target="_blank"
            >
              View Catalog ↗
            </Link>
            <div className="ml-2 pl-2 border-l">
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "h-8 w-8",
                  },
                }}
              />
            </div>
          </nav>
        </div>
      </header>

      {/* ---- Page Content ---- */}
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
