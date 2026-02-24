// ============================================================
// Layout — Platform Admin (/admin)
// ============================================================
// Protected layout for platform admins.
// Checks ADMIN_USER_IDS env var against current Clerk user.
// ============================================================

import { isAdmin } from "@/lib/auth/admin";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const adminClerkId = await isAdmin();

  if (!adminClerkId) {
    // Not an admin — redirect to home silently
    notFound();
  }

  return (
    <div className="min-h-screen bg-stone-950">
      {/* ── Admin Header ─────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-stone-800 bg-stone-950/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-sm">
                <span className="text-white text-xs font-bold">A</span>
              </div>
              <span className="text-sm font-bold text-stone-300">
                Trade<span className="text-red-400">Feed</span>
                <span className="ml-2 text-[10px] font-medium text-red-400/60 uppercase tracking-widest">Admin</span>
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-xs text-stone-500 hover:text-stone-300 transition-colors"
            >
              ← Back to App
            </Link>
            <div className="pl-3 border-l border-stone-800">
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "h-7 w-7",
                  },
                }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Content ─────────────────────────────────── */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  );
}
