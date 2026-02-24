// ============================================================
// Admin Navigation — Shared tab bar across admin pages
// ============================================================

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview", icon: "📊" },
  { href: "/admin/categories", label: "Categories", icon: "📂" },
  { href: "/admin/promotions", label: "Promotions", icon: "📢" },
  { href: "/admin/analytics", label: "Analytics", icon: "📈" },
] as const;

export function AdminNav() {
  const pathname = usePathname();

  return (
    <div className="border-b border-stone-800 bg-stone-950/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <nav className="flex items-center gap-1 overflow-x-auto scrollbar-hide -mb-px">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? "text-red-400 border-red-500"
                    : "text-stone-500 border-transparent hover:text-stone-300 hover:border-stone-700"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
