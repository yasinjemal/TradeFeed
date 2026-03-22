"use client";

import { motion } from "framer-motion";
import { FadeIn, StaggerContainer, StaggerItem } from "./fade-in";

export function CustomDomainSection() {
  return (
    <section className="relative py-24 sm:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-500/10 rounded-full blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <FadeIn>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] font-medium mb-4">
              🌐 PRO FEATURE
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
              Your Brand. Your Domain.
            </h2>
            <p className="mt-4 text-lg text-slate-400 leading-relaxed">
              Stop sharing generic links. Connect your own domain and look as professional as the big retailers.
            </p>
          </div>
        </FadeIn>

        {/* Before/After visual */}
        <FadeIn delay={0.1}>
          <div className="max-w-lg mx-auto mb-16">
            <div className="rounded-2xl border border-slate-700 bg-slate-800/50 backdrop-blur-sm overflow-hidden">
              {/* Before */}
              <div className="px-6 py-4 border-b border-slate-700/50">
                <p className="text-xs text-red-400/80 font-medium mb-1.5">BEFORE</p>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900/60">
                  <svg className="w-4 h-4 text-slate-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                  </svg>
                  <code className="text-sm text-slate-400 font-mono">tradefeed.co.za/s/my-fashion-shop</code>
                </div>
              </div>
              {/* After */}
              <div className="px-6 py-4">
                <p className="text-xs text-emerald-400/80 font-medium mb-1.5">AFTER — WITH PRO</p>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                  <code className="text-sm text-emerald-300 font-mono font-semibold">shop.mybrand.co.za</code>
                  <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-medium">SSL ✓</span>
                </div>
              </div>
            </div>
          </div>
        </FadeIn>

        {/* Benefits grid */}
        <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto mb-14">
          {[
            {
              icon: "🔒",
              title: "Free SSL Certificate",
              description: "Every custom domain gets automatic HTTPS — secure padlock included.",
            },
            {
              icon: "⚡",
              title: "5-Minute Setup",
              description: "Step-by-step DNS guide with registrar-specific instructions for SA providers.",
            },
            {
              icon: "📈",
              title: "Better SEO",
              description: "Your brand domain builds authority in Google — rank for your own name.",
            },
            {
              icon: "🇿🇦",
              title: "SA Registrar Guides",
              description: "Built-in guides for 1-grid, Afrihost, Domains.co.za, GoDaddy & Namecheap.",
            },
          ].map((item, i) => (
            <StaggerItem key={item.title}>
              <motion.div
                whileHover={{ y: -3 }}
                transition={{ duration: 0.2 }}
                className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700/50 hover:border-blue-500/30 transition-all h-full"
              >
                <span className="text-2xl block mb-3">{item.icon}</span>
                <h3 className="text-sm font-bold text-white mb-1">{item.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* CTA */}
        <FadeIn delay={0.3}>
          <div className="text-center">
            <p className="text-sm text-slate-400 mb-1">
              .co.za domains from <span className="text-white font-semibold">R60/year</span> at any registrar
            </p>
            <p className="text-xs text-slate-500">
              Available on Pro (R299/mo) and Pro AI (R499/mo) plans
            </p>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
