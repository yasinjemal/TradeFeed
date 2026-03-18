"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { FadeIn } from "./fade-in";

export function ProductPreviewSection() {
  const products = [
    { name: "Oversized Hoodie", price: "R 280", badge: "BEST SELLER", badgeColor: "bg-amber-500", img: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=400&fit=crop&q=80", colors: ["bg-stone-800", "bg-amber-700", "bg-emerald-700"] },
    { name: "Wireless Earbuds Pro", price: "R 350", badge: "NEW", badgeColor: "bg-blue-500", img: "https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=400&h=400&fit=crop&q=80", colors: ["bg-white", "bg-stone-900"] },
    { name: "Vitamin C Serum", price: "R 180", badge: null, badgeColor: "", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&h=400&fit=crop&q=80", colors: ["bg-amber-300", "bg-emerald-300"] },
    { name: "Classic Denim Jacket", price: "R 450", badge: null, badgeColor: "", img: "https://images.unsplash.com/photo-1551537482-f2075a1d41f2?w=400&h=400&fit=crop&q=80", colors: ["bg-blue-600", "bg-stone-700"] },
    { name: "Dried Fruit Pack 500g", price: "R 120", badge: "HOT", badgeColor: "bg-rose-500", img: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=400&fit=crop&q=80", colors: ["bg-amber-700", "bg-red-700"] },
    { name: "Silicone Phone Case", price: "R 95", badge: null, badgeColor: "", img: "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400&h=400&fit=crop&q=80", colors: ["bg-stone-900", "bg-blue-600", "bg-rose-500"] },
  ];

  return (
    <section className="relative py-24 sm:py-32">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50/50 via-white to-slate-50/30" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-blue-400/[0.04] rounded-full blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <FadeIn>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-sm font-semibold text-blue-600 mb-3">Live Preview</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900">
              Your catalog, beautifully presented
            </h2>
            <p className="mt-4 text-lg text-slate-500 leading-relaxed">
              Customers browse, filter, and order — all from a single link you share on WhatsApp.
            </p>
          </div>
        </FadeIn>

        <FadeIn delay={0.2}>
          <div className="max-w-4xl mx-auto">
            {/* Browser frame */}
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ duration: 0.3 }}
              className="rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/50 overflow-hidden"
            >
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-5 py-3 bg-slate-50 border-b border-slate-100">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white rounded-lg border border-slate-200 text-xs text-slate-400 font-mono">
                    <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                    tradefeed.co.za/catalog/jeppe-wholesale-hub
                  </div>
                </div>
              </div>

              {/* Catalog content */}
              <div className="p-6 sm:p-8">
                {/* Shop header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-orange-500/20">
                      JW
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 text-sm">Jeppe Wholesale Hub</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-medium border border-emerald-200">
                          ✓ Verified
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">📍 Johannesburg, Gauteng · 48 products</span>
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-2">
                    <div className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-500/20">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                      Chat on WhatsApp
                    </div>
                  </div>
                </div>

                {/* Category pills */}
                <div className="flex gap-2 mb-5 overflow-hidden">
                  {["All", "Popular", "New Arrivals", "Clothing", "Electronics", "Beauty"].map((cat, i) => (
                    <span
                      key={cat}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                        i === 0
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200"
                      }`}
                    >
                      {cat}
                    </span>
                  ))}
                </div>

                {/* Product grid */}
                <div className="grid grid-cols-3 gap-4">
                  {products.map((product) => (
                    <div key={product.name} className="group rounded-xl border border-slate-100 overflow-hidden hover:border-blue-200 hover:shadow-lg hover:shadow-blue-50 transition-all duration-300">
                      <div className="aspect-square relative overflow-hidden bg-slate-50">
                        <Image src={product.img} alt={product.name} fill sizes="200px" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                        {product.badge && (
                          <span className={`absolute top-2 left-2 ${product.badgeColor} text-white text-[9px] font-bold px-2 py-0.5 rounded-md shadow-lg`}>
                            {product.badge}
                          </span>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="text-xs font-medium text-slate-700 truncate">{product.name}</p>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-sm font-bold text-blue-600">{product.price}</span>
                          <div className="flex gap-1">
                            {product.colors.map((c, i) => (
                              <div key={i} className={`w-3 h-3 rounded-full ${c} border border-slate-200`} />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Cart bar */}
                <div className="mt-6 flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold">3</div>
                    items in cart · <span className="text-blue-600 font-semibold">R 750</span>
                  </div>
                  <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-500/20">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    Order on WhatsApp
                  </div>
                </div>
              </div>
            </motion.div>

            <p className="text-center text-xs text-slate-400 mt-6">
              ↑ This is what your customers see — a professional storefront powered by TradeFeed.
            </p>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
