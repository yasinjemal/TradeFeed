import type { ReactNode } from "react";
import { FEATURE_FLAGS } from "@/lib/config/feature-flags";

interface CatalogAppShellProps {
  header: ReactNode;
  children: ReactNode;
  bottomNav: ReactNode;
}

// Build-time flag: TF skin uses theme-aware tf-* tokens so the
// storefront follows light/dark mode; legacy keeps its fixed
// stone/white chrome until deletion.
const TF = FEATURE_FLAGS.UI_REDESIGN;

export function CatalogAppShell({
  header,
  children,
  bottomNav,
}: CatalogAppShellProps) {
  return (
    <div
      className={
        TF
          ? "h-[100dvh] bg-tf-surface text-tf-ink flex flex-col"
          : "h-[100dvh] bg-stone-50 text-stone-900 flex flex-col"
      }
    >
      <header
        className={
          TF
            ? "sticky top-0 z-40 border-b border-tf-stone-200 bg-tf-raised/85 backdrop-blur-2xl"
            : "sticky top-0 z-40 bg-white/80 backdrop-blur-2xl border-b border-stone-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
        }
      >
        {header}
      </header>

      <main className="flex-1 overflow-y-auto pb-28">{children}</main>

      {bottomNav}
    </div>
  );
}
