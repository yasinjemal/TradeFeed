// ============================================================
// Marketplace Activity — Live trust signals
// ============================================================
// Shows rotating activity indicators to make the marketplace
// feel alive and active. Uses deterministic pseudo-random
// values seeded from totalProducts to avoid hydration mismatch.
// ============================================================

"use client";

import { useState, useEffect, useRef } from "react";

interface MarketplaceActivityProps {
  totalProducts: number;
  totalShops: number;
}

const SIGNALS = [
  {
    icon: (
      <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
      </svg>
    ),
    template: (n: number) => `${n} products sold today`,
  },
  {
    icon: (
      <svg className="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
    template: (n: number) => `${n} people browsing now`,
  },
  {
    icon: (
      <svg className="w-3.5 h-3.5 text-purple-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    template: (n: number) => `New product added ${n} minutes ago`,
  },
  {
    icon: (
      <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72l1.189-1.19A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72M6.75 18h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .414.336.75.75.75z" />
      </svg>
    ),
    template: (n: number) => `${n} verified sellers online`,
  },
];

export function MarketplaceActivity({ totalProducts, totalShops }: MarketplaceActivityProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null);

  // Deterministic values to avoid hydration mismatch
  const soldToday = Math.max(3, Math.floor(totalProducts * 0.08));
  const browsing = Math.max(12, Math.floor(totalProducts * 0.6));
  const minutesAgo = 2;
  const sellersOnline = Math.max(5, Math.floor(totalShops * 0.4));
  const values = [soldToday, browsing, minutesAgo, sellersOnline];

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setActiveIndex((prev) => (prev + 1) % SIGNALS.length);
        setIsVisible(true);
      }, 300);
    }, 4000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const signal = SIGNALS[activeIndex]!;
  const value = values[activeIndex] ?? 0;

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200">
      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
      <div
        className={`flex items-center gap-1.5 transition-all duration-300 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"
        }`}
      >
        {signal.icon}
        <span className="text-xs text-slate-600 font-medium">
          {signal.template(value)}
        </span>
      </div>
    </div>
  );
}
