"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FadeIn } from "./fade-in";

interface HeroSectionProps {
  badge: string;
  title: string;
  titleHighlight: string;
  subtitle: string;
  aiOffer: string;
  ctaLabel: string;
  ctaHref: string;
  ctaSecondaryLabel: string;
  ctaSecondaryHref: string;
  benefits: string[];
  proofSellers: string;
  proofCities: string;
}

export function HeroSection({
  badge,
  title,
  titleHighlight,
  subtitle,
  aiOffer,
  ctaLabel,
  ctaHref,
  ctaSecondaryLabel,
  ctaSecondaryHref,
  benefits,
  proofSellers,
  proofCities,
}: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-32">
      {/* Background gradient mesh */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-blue-50/40" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-gradient-to-br from-blue-500/[0.07] via-purple-500/[0.05] to-transparent rounded-full blur-3xl" />
        <div className="absolute top-20 right-[10%] w-[400px] h-[400px] bg-purple-400/[0.06] rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-[10%] w-[500px] h-[300px] bg-blue-400/[0.05] rounded-full blur-3xl" />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,0,0,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.08) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
          }}
        />
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <FadeIn>
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-200/60 px-4 py-1.5 text-xs font-medium text-blue-700 mb-8">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-500 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-600" />
              </span>
              {badge}
            </div>
          </FadeIn>

          {/* Headline */}
          <FadeIn delay={0.1}>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.05]">
              {title}{" "}
              <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                {titleHighlight}
              </span>
            </h1>
          </FadeIn>

          {/* Subtitle */}
          <FadeIn delay={0.2}>
            <p className="mt-6 text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
              {subtitle}
            </p>
          </FadeIn>

          {/* AI offer pill */}
          <FadeIn delay={0.25}>
            <div className="mt-5 inline-flex items-center gap-2 rounded-xl bg-purple-50 border border-purple-200/60 px-4 py-2 text-sm font-medium text-purple-700">
              <span>✨</span> {aiOffer}
            </div>
          </FadeIn>

          {/* Inline social proof */}
          <FadeIn delay={0.3}>
            <div className="mt-6 flex items-center justify-center gap-3">
              <div className="flex -space-x-2">
                {[
                  "from-amber-400 to-orange-500",
                  "from-blue-400 to-indigo-500",
                  "from-pink-400 to-rose-500",
                ].map((gradient, i) => (
                  <div
                    key={i}
                    className={`w-8 h-8 rounded-full bg-gradient-to-br ${gradient} border-2 border-white flex items-center justify-center text-[9px] font-bold text-white shadow-sm`}
                  >
                    {["JHB", "CPT", "DBN"][i]}
                  </div>
                ))}
              </div>
              <p className="text-sm text-slate-400">
                {proofSellers}{" "}
                <span className="text-slate-600 font-medium">{proofCities}</span>
              </p>
            </div>
          </FadeIn>

          {/* CTAs */}
          <FadeIn delay={0.35}>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href={ctaHref}
                  className="group relative inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-8 py-4 text-base font-semibold text-white shadow-xl shadow-blue-600/20 transition-all hover:bg-blue-500 hover:shadow-blue-500/30 w-full sm:w-auto"
                >
                  {ctaLabel}
                  <svg
                    className="w-5 h-5 transition-transform group-hover:translate-x-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              </motion.div>
              <Link
                href={ctaSecondaryHref}
                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors"
              >
                {ctaSecondaryLabel}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          </FadeIn>

          {/* Benefits strip */}
          <FadeIn delay={0.4}>
            <div className="mt-6 flex items-center justify-center gap-5 flex-wrap">
              {benefits.map((benefit, i) => (
                <span key={i} className="flex items-center gap-1.5 text-xs text-slate-400">
                  <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  {benefit}
                </span>
              ))}
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
