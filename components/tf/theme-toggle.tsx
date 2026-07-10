"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

import { cn } from "@/lib/utils";

// ============================================================
// TfThemeToggle — light/dark switch
// Renders a stable placeholder until mounted (next-themes only
// knows the resolved theme on the client, so rendering the icon
// during SSR would hydration-mismatch). 44px tap target, visible
// focus ring, no layout shift between states.
// ============================================================

export function TfThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      disabled={!mounted}
      className={cn(
        "inline-flex size-11 cursor-pointer items-center justify-center rounded-[10px] text-tf-stone-600 transition-colors duration-200 hover:bg-tf-stone-100 hover:text-tf-ink outline-none focus-visible:ring-2 focus-visible:ring-tf-primary focus-visible:ring-offset-2 focus-visible:ring-offset-tf-surface motion-reduce:transition-none",
        className,
      )}
    >
      {isDark ? (
        <Sun className="size-5" aria-hidden="true" />
      ) : (
        <Moon className="size-5" aria-hidden="true" />
      )}
    </button>
  );
}
