"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FadeIn } from "./fade-in";

interface FinalCTASectionProps {
  badge: string;
  title: string;
  titleHighlight: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  ctaSecondaryLabel: string;
  ctaSecondaryHref: string;
  footer: string;
}

export function FinalCTASection({
  badge,
  title,
  titleHighlight,
  subtitle,
  ctaLabel,
  ctaHref,
  ctaSecondaryLabel,
  ctaSecondaryHref,
  footer,
}: FinalCTASectionProps) {
  return (
    <section className="relative py-28 sm:py-36 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-slate-900" />
      <div className="absolute inset-0">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-blue-500/[0.1] rounded-full blur-3xl" />
        <div className="absolute top-[20%] right-[10%] w-[400px] h-[300px] bg-purple-500/[0.06] rounded-full blur-3xl" />
        <div className="absolute top-[30%] left-[5%] w-[300px] h-[200px] bg-blue-400/[0.04] rounded-full blur-3xl" />
        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-3xl px-6 lg:px-8 text-center">
        <FadeIn>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-4 py-1.5 text-xs font-medium text-blue-300 mb-8 backdrop-blur-sm">
            🚀 {badge}
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            {title}{" "}
            <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-purple-400 bg-clip-text text-transparent">
              {titleHighlight}
            </span>
          </h2>
        </FadeIn>

        <FadeIn delay={0.2}>
          <p className="mt-6 text-lg text-slate-400 max-w-xl mx-auto leading-relaxed">{subtitle}</p>
        </FadeIn>

        <FadeIn delay={0.3}>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                href={ctaHref}
                className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-10 py-4 text-base font-semibold text-white shadow-2xl shadow-blue-600/25 transition-all hover:bg-blue-500 hover:shadow-blue-500/35 w-full sm:w-auto"
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
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-blue-300 transition-colors"
            >
              {ctaSecondaryLabel}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
          <p className="mt-6 text-xs text-slate-500">{footer}</p>
        </FadeIn>
      </div>
    </section>
  );
}
