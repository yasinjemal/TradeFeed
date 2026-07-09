"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bot,
  CreditCard,
  Globe2,
  ImageIcon,
  Link2,
  MapPin,
  Palette,
  Settings2,
  ShieldCheck,
  Store,
  UsersRound,
  Clock3,
} from "lucide-react";

const SECTIONS = [
  { id: "store", label: "Store status", icon: Store },
  { id: "images", label: "Shop images", icon: ImageIcon },
  { id: "basic", label: "Shop profile", icon: Settings2 },
  { id: "location", label: "Location", icon: MapPin },
  { id: "hours", label: "Business hours", icon: Clock3 },
  { id: "social", label: "Social & links", icon: Link2 },
  { id: "palette", label: "Theme & branding", icon: Palette },
  { id: "verification", label: "Verification badge", icon: ShieldCheck },
  { id: "domain", label: "Custom domains", icon: Globe2 },
  { id: "wholesale", label: "Wholesale settings", icon: Bot },
  { id: "payment", label: "Payment settings", icon: CreditCard },
  { id: "team", label: "Team members", icon: UsersRound },
] as const;

export function SettingsSidebar({
  className,
  showVerification = false,
}: {
  className?: string;
  showVerification?: boolean;
}) {
  const [activeId, setActiveId] = useState("store");
  const visibleSections = useMemo(() => showVerification
    ? SECTIONS
    : SECTIONS.filter(({ id }) => id !== "verification"), [showVerification]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id.replace("section-", ""));
        }
      },
      { rootMargin: "-20% 0px -60% 0px" },
    );

    visibleSections.forEach(({ id }) => {
      const element = document.getElementById(`section-${id}`);
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, [visibleSections]);

  return (
    <nav className={className} aria-label="Shop settings sections">
      <p className="mb-3 px-3.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-tf-stone-400">Settings</p>
      <div className="space-y-0.5">
        {visibleSections.map(({ id, label, icon: Icon }) => {
          const isActive = activeId === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" })}
              className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-[13px] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-primary ${
                isActive
                  ? "bg-tf-raised font-semibold text-tf-ink shadow-tf-sm"
                  : "text-tf-stone-500 hover:bg-tf-raised/70 hover:text-tf-ink"
              }`}
            >
              <Icon aria-hidden="true" className={`size-4 shrink-0 ${isActive ? "text-tf-primary" : "text-tf-stone-400"}`} />
              <span className="truncate">{label}</span>
              {isActive && <span className="ml-auto size-1.5 shrink-0 rounded-full bg-tf-primary" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
