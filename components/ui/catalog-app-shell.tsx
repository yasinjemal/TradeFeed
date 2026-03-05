import type { ReactNode } from "react";

interface CatalogAppShellProps {
  header: ReactNode;
  children: ReactNode;
  bottomNav: ReactNode;
}

export function CatalogAppShell({
  header,
  children,
  bottomNav,
}: CatalogAppShellProps) {
  return (
    <div className="h-[100dvh] bg-stone-50 text-stone-900 flex flex-col">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-2xl border-b border-stone-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        {header}
      </header>

      <main className="flex-1 overflow-y-auto pb-28">{children}</main>

      {bottomNav}
    </div>
  );
}