// ============================================================
// Component — Mobile Bottom Tab Bar
// ============================================================
// Fixed bottom nav for mobile dashboard (md:hidden).
// 4 tabs: Products · Orders · Share · More
// 48px+ tap targets for fat-finger friendliness.
// ============================================================

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface MobileBottomNavProps {
  slug: string;
}

const tabs = [
  {
    label: "Products",
    href: (slug: string) => `/dashboard/${slug}/products`,
    match: "/products",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
      </svg>
    ),
  },
  {
    label: "Orders",
    href: (slug: string) => `/dashboard/${slug}/orders`,
    match: "/orders",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15a2.25 2.25 0 0 1 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
      </svg>
    ),
  },
  {
    label: "Share",
    href: (slug: string) => `/catalog/${slug}`,
    match: "__never_active__",
    isExternal: true,
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    ),
  },
  {
    label: "Explore",
    href: () => "/marketplace",
    match: "__never_active__",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35m0 0A7.125 7.125 0 1 0 6.575 6.575a7.125 7.125 0 0 0 10.075 10.075Z" />
      </svg>
    ),
  },
];

export function MobileBottomNav({ slug }: MobileBottomNavProps) {
  const pathname = usePathname();
  const basePath = `/dashboard/${slug}`;

  const isActive = (match: string) => {
    if (match === "__never_active__") return false;
    if (match === "__overview__") {
      // Active when on overview or any non-primary tab
      return (
        pathname === basePath ||
        pathname === `${basePath}/` ||
        (!pathname.includes("/products") && !pathname.includes("/orders"))
      );
    }
    return pathname.includes(match);
  };

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-white border-t border-stone-200 safe-area-pb">
      <div className="flex items-stretch h-14">
        {tabs.map((tab) => {
          const active = isActive(tab.match);
          const href = tab.href(slug);

          if (tab.isExternal) {
            return (
              <a
                key={tab.label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[48px]
                  text-whatsapp transition-colors active:bg-green-50`}
              >
                {tab.icon}
                <span className="text-[10px] font-semibold leading-none">
                  {tab.label}
                </span>
              </a>
            );
          }

          return (
            <Link
              key={tab.label}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[48px]
                transition-colors active:bg-stone-100
                ${active ? "text-emerald-600" : "text-stone-400 hover:text-stone-600"}`}
            >
              {tab.icon}
              <span className={`text-[10px] leading-none ${active ? "font-bold" : "font-medium"}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
