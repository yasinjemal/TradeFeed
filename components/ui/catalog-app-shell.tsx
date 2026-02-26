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
    <div className="h-[100dvh] bg-white text-stone-900 flex flex-col">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-stone-200/60">
        {header}
      </header>

      <main className="flex-1 overflow-y-auto pb-28">{children}</main>

      {bottomNav}
    </div>
  );
}