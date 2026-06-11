"use client";

import * as React from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";

// ============================================================
// TfBottomNav — mobile tab bar in the TF system. Generic and
// item-driven so each surface (marketplace, dashboard) supplies
// its own tabs. 44px+ targets, safe-area padding, lg+ hidden.
// ============================================================

export interface TfBottomNavItem {
  key: string;
  href: string;
  label: string;
  icon: React.ReactNode;
  isActive?: boolean;
  /** Small count bubble, e.g. unread orders */
  badge?: number;
}

interface TfBottomNavProps extends React.ComponentProps<"nav"> {
  items: TfBottomNavItem[];
}

function TfBottomNav({ items, className, ...props }: TfBottomNavProps) {
  return (
    <nav
      data-slot="tf-bottom-nav"
      aria-label="Primary"
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-tf-stone-200 bg-tf-raised",
        "pb-[env(safe-area-inset-bottom)] lg:hidden",
        className,
      )}
      {...props}
    >
      <ul className="mx-auto flex max-w-3xl items-stretch justify-around">
        {items.map((item) => (
          <li key={item.key} className="flex-1">
            <Link
              href={item.href}
              aria-current={item.isActive ? "page" : undefined}
              className={cn(
                "relative flex min-h-[52px] flex-col items-center justify-center gap-0.5 px-2 py-1.5 text-[11px] font-medium outline-none",
                "transition-colors motion-reduce:transition-none",
                "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-tf-primary",
                item.isActive ? "text-tf-primary" : "text-tf-stone-500 hover:text-tf-stone-700",
                "[&_svg]:size-5",
              )}
            >
              <span className="relative">
                {item.icon}
                {item.badge != null && item.badge > 0 && (
                  <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-tf-accent px-1 text-[10px] font-semibold leading-none text-tf-ink">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
              </span>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export { TfBottomNav };
