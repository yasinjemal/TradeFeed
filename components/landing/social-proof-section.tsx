"use client";

import { FadeIn, StaggerContainer, StaggerItem } from "./fade-in";
import { AnimatedCounter } from "./animated-stats";

interface SocialProofSectionProps {
  shopCount: number;
  productCount: number;
  orderCount: number;
  labels: {
    activeSellers: string;
    productsListed: string;
    ordersProcessed: string;
    provinces: string;
    ordersViaChat: string;
    title: string;
  };
}

export function SocialProofSection({
  shopCount,
  productCount,
  orderCount,
  labels,
}: SocialProofSectionProps) {
  const stats = [
    {
      value: Math.max(shopCount, 50),
      suffix: "+",
      label: labels.activeSellers,
      color: "text-blue-600",
      bg: "bg-blue-50",
      icon: (
        <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35" />
        </svg>
      ),
    },
    {
      value: Math.max(productCount, 200),
      suffix: "+",
      label: labels.productsListed,
      color: "text-purple-600",
      bg: "bg-purple-50",
      icon: (
        <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        </svg>
      ),
    },
    {
      value: Math.max(orderCount, 100),
      suffix: "+",
      label: labels.ordersProcessed,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      icon: (
        <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
      ),
    },
    {
      value: 9,
      suffix: "",
      label: labels.provinces,
      color: "text-amber-600",
      bg: "bg-amber-50",
      icon: (
        <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        </svg>
      ),
    },
  ];

  return (
    <section className="relative py-16 border-y border-slate-100">
      <div className="absolute inset-0 bg-gradient-to-r from-slate-50/80 via-white to-slate-50/80" />
      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <FadeIn>
          <p className="text-center text-[11px] font-semibold tracking-widest text-slate-400 uppercase mb-10">
            {labels.title}
          </p>
        </FadeIn>

        <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <StaggerItem key={stat.label}>
              <div className="flex flex-col items-center text-center group">
                <div className={`${stat.bg} w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                  {stat.icon}
                </div>
                <p className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${stat.color}`}>
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </p>
                <p className="text-xs text-slate-400 mt-1 font-medium">{stat.label}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
