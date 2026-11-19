// ============================================================
// Component — Floating "Add product" button (mobile dashboard)
// ============================================================
// The one-tap way into the Add product screen from anywhere in
// the dashboard. Hidden on that screen itself, where it would
// sit on top of the Publish button.
// ============================================================

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";

export function AddProductFab({ slug }: { slug: string }) {
  const pathname = usePathname();
  const href = `/dashboard/${slug}/products/new`;

  if (pathname === href) return null;

  return (
    <Link
      href={href}
      aria-label="Add product"
      className="fixed bottom-[4.5rem] right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-700 text-white shadow-lg shadow-emerald-700/25 transition-all duration-200 hover:bg-emerald-800 hover:shadow-xl motion-safe:hover:scale-105 motion-safe:active:scale-95 md:hidden"
    >
      <Plus aria-hidden="true" className="h-7 w-7" strokeWidth={2.5} />
    </Link>
  );
}
