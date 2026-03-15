// ============================================================
// Component — Seller AI Preferences Form
// ============================================================
// Stand-alone form for AI personalisation settings.
// Follows the same Section card pattern as ShopSettingsForm
// but manages its own server action (seller-preferences).
// ============================================================

"use client";

import { useActionState, useEffect } from "react";
import { updateSellerPreferencesAction } from "@/app/actions/seller-preferences";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/* ── Constants ──────────────────────────────────────────── */

const BRAND_TONES = [
  { value: "", label: "No preference" },
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual & Friendly" },
  { value: "youthful", label: "Youthful & Trendy" },
  { value: "luxury", label: "Luxury & Premium" },
  { value: "playful", label: "Playful & Fun" },
] as const;

const PRICE_RANGES = [
  { value: "", label: "No preference" },
  { value: "budget", label: "Budget-friendly" },
  { value: "mid-range", label: "Mid-range" },
  { value: "premium", label: "Premium" },
] as const;

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "zu", label: "isiZulu" },
  { value: "xh", label: "isiXhosa" },
  { value: "af", label: "Afrikaans" },
  { value: "st", label: "Sesotho" },
] as const;

const CATEGORIES = [
  "T-Shirts", "Hoodies", "Jackets", "Jeans", "Dresses",
  "Sneakers", "Phones", "Earbuds", "Chargers", "Skincare",
  "Fragrance", "Snacks", "Beverages", "Home Decor", "Accessories", "Other",
] as const;

/* ── Props ──────────────────────────────────────────────── */

export interface SellerPreferencesData {
  brandTone: string | null;
  brandDescription: string | null;
  defaultCategory: string | null;
  preferredTags: string[];
  priceRange: string | null;
  targetAudience: string | null;
  languagePreference: string;
  aiToneNotes: string | null;
}

interface SellerPreferencesFormProps {
  shopSlug: string;
  initialData: SellerPreferencesData | null;
}

/* ── Component ──────────────────────────────────────────── */

export function SellerPreferencesForm({ shopSlug, initialData }: SellerPreferencesFormProps) {
  const boundAction = updateSellerPreferencesAction.bind(null, shopSlug);
  const [state, formAction, isPending] = useActionState(boundAction, null);

  useEffect(() => {
    if (state?.success) {
      toast.success("AI preferences saved!");
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  const d = initialData;

  return (
    <section id="section-ai" className="scroll-mt-28">
      <div className="relative rounded-2xl border border-stone-200/60 bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all duration-500 group/card">
        {/* Left accent stripe */}
        <div className="absolute top-0 left-0 w-1 h-full bg-indigo-200 opacity-80 rounded-l-2xl" />

        {/* Header */}
        <div className="flex items-center gap-4 px-6 pt-6 pb-3 pl-8">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center text-lg flex-shrink-0 shadow-sm group-hover/card:scale-105 transition-transform duration-300">
            🤖
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5">
              <h2 className="font-semibold text-stone-800 text-[17px] tracking-tight">AI Preferences</h2>
              <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">
                Beta
              </span>
            </div>
            <p className="text-[13px] text-stone-400 mt-0.5">
              Personalise how AI generates your product listings, descriptions & tags
            </p>
          </div>
        </div>

        {/* Content */}
        <form action={formAction} className="px-6 pb-6 pt-2 pl-8 space-y-5">
          {/* Brand Tone */}
          <div className="space-y-2">
            <Label htmlFor="brandTone" className="text-[13px] font-medium text-stone-600">
              Brand Voice
            </Label>
            <select
              id="brandTone"
              name="brandTone"
              defaultValue={d?.brandTone ?? ""}
              className="w-full rounded-xl h-11 border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 outline-none transition-all"
            >
              {BRAND_TONES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <p className="text-[11px] text-stone-400">How should AI write your product copy?</p>
          </div>

          {/* Brand Description */}
          <div className="space-y-2">
            <Label htmlFor="brandDescription" className="text-[13px] font-medium text-stone-600">
              Brand Story
            </Label>
            <Textarea
              id="brandDescription"
              name="brandDescription"
              defaultValue={d?.brandDescription ?? ""}
              placeholder="e.g. We sell handmade African jewellery inspired by Ndebele patterns..."
              maxLength={500}
              rows={3}
              className="rounded-xl border-stone-200 focus:border-indigo-400 focus:ring-indigo-400/20 text-sm resize-none"
            />
            <p className="text-[11px] text-stone-400">AI will weave your brand story into listings (max 500 chars)</p>
          </div>

          {/* Default Category + Price Range row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="defaultCategory" className="text-[13px] font-medium text-stone-600">
                Default Category
              </Label>
              <select
                id="defaultCategory"
                name="defaultCategory"
                defaultValue={d?.defaultCategory ?? ""}
                className="w-full rounded-xl h-11 border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 outline-none transition-all"
              >
                <option value="">Auto-detect</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priceRange" className="text-[13px] font-medium text-stone-600">
                Price Positioning
              </Label>
              <select
                id="priceRange"
                name="priceRange"
                defaultValue={d?.priceRange ?? ""}
                className="w-full rounded-xl h-11 border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 outline-none transition-all"
              >
                {PRICE_RANGES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Preferred Tags */}
          <div className="space-y-2">
            <Label htmlFor="preferredTags" className="text-[13px] font-medium text-stone-600">
              Preferred Tags
            </Label>
            <Input
              id="preferredTags"
              name="preferredTags"
              defaultValue={d?.preferredTags?.join(", ") ?? ""}
              placeholder="streetwear, South Africa, handmade, African fashion"
              className="rounded-xl h-11 border-stone-200 focus:border-indigo-400 focus:ring-indigo-400/20"
            />
            <p className="text-[11px] text-stone-400">Comma-separated — AI will prefer these tags on every listing</p>
          </div>

          {/* Target Audience + Language row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="targetAudience" className="text-[13px] font-medium text-stone-600">
                Target Audience
              </Label>
              <Input
                id="targetAudience"
                name="targetAudience"
                defaultValue={d?.targetAudience ?? ""}
                placeholder="e.g. Young women 18-30 in Johannesburg"
                maxLength={200}
                className="rounded-xl h-11 border-stone-200 focus:border-indigo-400 focus:ring-indigo-400/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="languagePreference" className="text-[13px] font-medium text-stone-600">
                AI Language
              </Label>
              <select
                id="languagePreference"
                name="languagePreference"
                defaultValue={d?.languagePreference ?? "en"}
                className="w-full rounded-xl h-11 border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 outline-none transition-all"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* AI Tone Notes */}
          <div className="space-y-2">
            <Label htmlFor="aiToneNotes" className="text-[13px] font-medium text-stone-600">
              Extra Instructions for AI
            </Label>
            <Textarea
              id="aiToneNotes"
              name="aiToneNotes"
              defaultValue={d?.aiToneNotes ?? ""}
              placeholder='e.g. Always mention free delivery in Gauteng. Use "Mzansi" instead of South Africa.'
              maxLength={500}
              rows={3}
              className="rounded-xl border-stone-200 focus:border-indigo-400 focus:ring-indigo-400/20 text-sm resize-none"
            />
            <p className="text-[11px] text-stone-400">Custom rules the AI will follow when generating listings (max 500 chars)</p>
          </div>

          {/* Submit */}
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={isPending}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-6 h-11 text-sm font-medium shadow-sm transition-all"
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving…
                </span>
              ) : (
                "Save AI Preferences"
              )}
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
