import Link from "next/link";
import { Bell, Heart, Package, Store } from "lucide-react";

type ActivityItem = { id: string; type: "ORDER" | "SAVED" | "FOLLOW" | "NOTIFICATION"; title: string; detail: string; href: string; createdAt: Date };

export function BuyerActivityTimeline({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) return <div className="rounded-2xl border border-stone-800/50 bg-stone-900/30 px-5 py-12 text-center"><p className="text-sm font-medium text-stone-300">No activity yet</p><p className="mt-1 text-xs text-stone-500">Orders, saved products, follows, and alerts will appear here.</p></div>;

  return <div className="relative space-y-2 before:absolute before:bottom-5 before:left-5 before:top-5 before:w-px before:bg-stone-800">{items.map((item) => {
    const Icon = item.type === "ORDER" ? Package : item.type === "SAVED" ? Heart : item.type === "FOLLOW" ? Store : Bell;
    return <Link key={item.id} href={item.href} className="relative flex gap-3 rounded-2xl border border-stone-800/40 bg-stone-900/40 p-4 transition hover:border-emerald-500/25 hover:bg-stone-900/70"><div className="z-10 flex size-10 shrink-0 items-center justify-center rounded-xl border border-stone-800 bg-stone-950 text-emerald-400"><Icon className="size-4" /></div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><p className="truncate text-sm font-semibold text-stone-200">{item.title}</p><time className="shrink-0 text-[10px] text-stone-600">{formatActivityDate(item.createdAt)}</time></div><p className="mt-1 line-clamp-2 text-xs leading-relaxed text-stone-500">{item.detail}</p></div></Link>;
  })}</div>;
}

function formatActivityDate(date: Date) {
  const now = new Date(); const value = new Date(date); const diffDays = Math.floor((now.getTime() - value.getTime()) / 86_400_000);
  if (diffDays === 0) return value.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return value.toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
}
