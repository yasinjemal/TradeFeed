// ============================================================
// Component — Create Shop Form (Redesigned)
// ============================================================
// Dark-themed form with step indicators, live slug preview,
// floating labels, and premium feel.
// ============================================================

"use client";

import { useActionState, useState } from "react";
import { createShopAction } from "@/app/actions/shop";

export function CreateShopForm() {
  const [state, formAction, isPending] = useActionState(
    createShopAction,
    null
  );
  const [shopName, setShopName] = useState("");
  const [descLength, setDescLength] = useState(0);

  // Generate a preview slug from the shop name
  const slugPreview = shopName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/30">
            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
            </svg>
          </div>
          <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">New Shop</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold text-stone-100 tracking-tight">
          Create Your Shop
        </h2>
        <p className="mt-2 text-stone-400 text-sm leading-relaxed">
          Fill in the basics — you&apos;ll have a shareable catalog link in seconds.
        </p>
      </div>

      {/* Form */}
      <form action={formAction} className="space-y-5">
        {/* ── General error ── */}
        {state?.error && !state.fieldErrors && (
          <div className="flex items-start gap-3 rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-300">
            <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            {state.error}
          </div>
        )}

        {/* ── Shop Name ── */}
        <div className="space-y-2">
          <label htmlFor="name" className="flex items-center gap-2 text-sm font-medium text-stone-200">
            <svg className="w-4 h-4 text-stone-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
            </svg>
            Shop Name
          </label>
          <div className="relative">
            <input
              id="name"
              name="name"
              type="text"
              placeholder="e.g. SA Trade Supplies"
              required
              minLength={2}
              maxLength={100}
              disabled={isPending}
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              className="w-full h-12 px-4 rounded-xl bg-stone-800/60 border border-stone-700/60 text-stone-100 placeholder:text-stone-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50 transition-all disabled:opacity-50"
              aria-describedby={state?.fieldErrors?.name ? "name-error" : undefined}
            />
            {shopName.length > 0 && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              </div>
            )}
          </div>
          {state?.fieldErrors?.name && (
            <p id="name-error" className="text-xs text-red-400 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" /></svg>
              {state.fieldErrors.name[0]}
            </p>
          )}

          {/* Live slug preview */}
          {slugPreview && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-stone-800/40 border border-stone-800/60">
              <svg className="w-3.5 h-3.5 text-stone-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
              </svg>
              <span className="text-xs text-stone-500">tradefeed.vercel.app/catalog/</span>
              <span className="text-xs text-emerald-400 font-medium">{slugPreview}</span>
            </div>
          )}
        </div>

        {/* ── WhatsApp Number ── */}
        <div className="space-y-2">
          <label htmlFor="whatsappNumber" className="flex items-center gap-2 text-sm font-medium text-stone-200">
            <svg className="w-4 h-4 text-stone-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
            </svg>
            WhatsApp Number
          </label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
              <span className="text-sm text-stone-500 font-medium">🇿🇦</span>
              <span className="text-sm text-stone-500">+27</span>
              <div className="w-px h-4 bg-stone-700" />
            </div>
            <input
              id="whatsappNumber"
              name="whatsappNumber"
              type="tel"
              placeholder="71 234 5678"
              required
              disabled={isPending}
              className="w-full h-12 pl-[5.5rem] pr-4 rounded-xl bg-stone-800/60 border border-stone-700/60 text-stone-100 placeholder:text-stone-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50 transition-all disabled:opacity-50"
              aria-describedby={state?.fieldErrors?.whatsappNumber ? "whatsapp-error" : undefined}
            />
          </div>
          {state?.fieldErrors?.whatsappNumber && (
            <p id="whatsapp-error" className="text-xs text-red-400 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" /></svg>
              {state.fieldErrors.whatsappNumber[0]}
            </p>
          )}
          <p className="text-xs text-stone-500 flex items-center gap-1.5">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" /></svg>
            Buyers will send orders to this number via WhatsApp
          </p>
        </div>

        {/* ── Description ── */}
        <div className="space-y-2">
          <label htmlFor="description" className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-medium text-stone-200">
              <svg className="w-4 h-4 text-stone-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.2 48.2 0 0 0 5.887-.512c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
              </svg>
              Description
            </span>
            <span className="text-xs text-stone-600">{descLength}/500</span>
          </label>
          <textarea
            id="description"
            name="description"
            placeholder="Tell buyers what you sell — e.g. Quality products at wholesale prices. Based in Jeppe, JHB."
            maxLength={500}
            rows={3}
            disabled={isPending}
            onChange={(e) => setDescLength(e.target.value.length)}
            className="w-full px-4 py-3 rounded-xl bg-stone-800/60 border border-stone-700/60 text-stone-100 placeholder:text-stone-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50 transition-all resize-none disabled:opacity-50"
            aria-describedby={state?.fieldErrors?.description ? "description-error" : undefined}
          />
          {state?.fieldErrors?.description && (
            <p id="description-error" className="text-xs text-red-400 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" /></svg>
              {state.fieldErrors.description[0]}
            </p>
          )}
        </div>

        {/* ── Divider ── */}
        <div className="h-px bg-stone-800/60" />

        {/* ── Submit Button ── */}
        <button
          type="submit"
          disabled={isPending}
          className="relative w-full h-12 rounded-xl font-semibold text-sm text-white overflow-hidden group disabled:opacity-60 disabled:cursor-not-allowed transition-all"
        >
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-emerald-500 group-hover:from-emerald-500 group-hover:to-emerald-400 transition-all" />
          {/* Shine effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          </div>
          {/* Content */}
          <div className="relative flex items-center justify-center gap-2">
            {isPending ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Creating your shop...</span>
              </>
            ) : (
              <>
                <span>Create Shop</span>
                <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </>
            )}
          </div>
        </button>

        {/* ── Footer note ── */}
        <div className="flex items-center justify-center gap-2 pt-1">
          <svg className="w-3.5 h-3.5 text-stone-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
          </svg>
          <p className="text-xs text-stone-600">
            You can update everything later from your dashboard
          </p>
        </div>
      </form>

      {/* ── What happens next ── */}
      <div className="mt-8 p-4 rounded-xl bg-stone-800/30 border border-stone-800/50">
        <p className="text-xs font-medium text-stone-400 mb-3">What happens next:</p>
        <div className="space-y-2.5">
          {[
            { step: "1", text: "Your catalog page goes live instantly", icon: "🚀" },
            { step: "2", text: "Add products with photos, sizes & prices", icon: "📦" },
            { step: "3", text: "Share your link on WhatsApp groups", icon: "💬" },
          ].map((item) => (
            <div key={item.step} className="flex items-center gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
                <span className="text-[10px] font-bold text-emerald-400">{item.step}</span>
              </div>
              <span className="text-xs text-stone-400">{item.text}</span>
              <span className="text-xs ml-auto">{item.icon}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
