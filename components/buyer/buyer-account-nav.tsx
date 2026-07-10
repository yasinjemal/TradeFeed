"use client";

import Link from "next/link";
import { Activity, Bell, House, Package, ShieldCheck, UserRound } from "lucide-react";
import { usePathname } from "next/navigation";

const links = [
  { href: "/me", label: "Home", Icon: House, exact: true },
  { href: "/orders", label: "Orders", Icon: Package },
  { href: "/me/notifications", label: "Alerts", Icon: Bell },
  { href: "/me/activity", label: "Activity", Icon: Activity },
  { href: "/me/account", label: "Account", Icon: UserRound },
  { href: "/me/security", label: "Security", Icon: ShieldCheck },
];

export function BuyerAccountNav() {
  const pathname = usePathname();
  return (
    <nav className="-mx-1 flex gap-1 overflow-x-auto pb-2 scrollbar-hide" aria-label="Buyer account">
      {links.map(({ href, label, Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return <Link key={href} href={href} className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${active ? "bg-emerald-500/15 text-emerald-400" : "text-stone-500 hover:bg-stone-900 hover:text-stone-300"}`}><Icon className="size-3.5" />{label}</Link>;
      })}
    </nav>
  );
}
