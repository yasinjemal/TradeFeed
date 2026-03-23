// ============================================================
// Component — Settings Sidebar Navigation
// ============================================================
// Sticky sidebar with IntersectionObserver-based scroll tracking.
// Shows active section, smooth-scrolls on click.
// Hidden on mobile — sections just stack naturally.
// ============================================================

"use client";

import { useEffect, useState } from "react";

const SECTIONS = [
  { id: "images", label: "Shop Images", icon: "📸" },
  { id: "basic", label: "Basic Info", icon: "🏪" },
  { id: "location", label: "Location", icon: "📍" },
  { id: "hours", label: "Business Hours", icon: "🕐" },
  { id: "social", label: "Social & Links", icon: "🔗" },
  { id: "domain", label: "Custom Domain", icon: "🌐" },
  { id: "ai", label: "AI Preferences", icon: "🤖" },
  { id: "gallery", label: "Gallery", icon: "🎨" },
  { id: "team", label: "Team", icon: "👥" },
] as const;

export function SettingsSidebar({ className }: { className?: string }) {
  const [activeId, setActiveId] = useState("images");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.id.replace("section-", "");
            setActiveId(id);
          }
        }
      },
      { rootMargin: "-20% 0px -60% 0px" }
    );

    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(`section-${id}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(`section-${id}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <nav className={className}>
      <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-[0.12em] px-3.5 mb-3">
        Sections
      </p>
      <div className="space-y-0.5">
        {SECTIONS.map(({ id, label, icon }) => {
          const isActive = activeId === id;
          return (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left text-[13px] transition-all duration-200 ${
                isActive
                  ? "bg-white text-stone-900 shadow-sm shadow-stone-200/50 font-semibold"
                  : "text-stone-400 hover:text-stone-600 hover:bg-white/60"
              }`}
            >
              <span className="text-base flex-shrink-0">{icon}</span>
              <span className="truncate">{label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
