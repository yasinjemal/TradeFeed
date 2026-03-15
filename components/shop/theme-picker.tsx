"use client";

import { useState, useTransition } from "react";
import { THEME_PRESETS, THEME_FONTS, type ThemePreset } from "@/lib/config/themes";
import { updateShopThemeAction } from "@/app/actions/shop-settings";
import { toast } from "sonner";

interface ThemePickerProps {
  shopSlug: string;
  isPro: boolean;
  currentTheme: {
    themePreset: string | null;
    themePrimary: string | null;
    themeAccent: string | null;
    themeFont: string | null;
  };
}

export function ThemePicker({ shopSlug, isPro, currentTheme }: ThemePickerProps) {
  const [selectedPreset, setSelectedPreset] = useState<string | null>(currentTheme.themePreset);
  const [customPrimary, setCustomPrimary] = useState(currentTheme.themePrimary ?? "");
  const [customAccent, setCustomAccent] = useState(currentTheme.themeAccent ?? "");
  const [selectedFont, setSelectedFont] = useState(currentTheme.themeFont ?? "");
  const [isPending, startTransition] = useTransition();

  const activePreset = THEME_PRESETS.find((t) => t.id === selectedPreset);

  const handlePresetSelect = (preset: ThemePreset) => {
    setSelectedPreset(preset.id);
    setCustomPrimary(preset.primary);
    setCustomAccent(preset.accent);
    setSelectedFont(preset.font);
  };

  const handleSave = () => {
    if (!isPro) return;
    startTransition(async () => {
      const result = await updateShopThemeAction(shopSlug, {
        themePreset: selectedPreset,
        themePrimary: customPrimary || null,
        themeAccent: customAccent || null,
        themeFont: selectedFont || null,
      });
      if (result.success) {
        toast.success("Theme updated! Check your catalog preview.");
      } else {
        toast.error(result.error ?? "Failed to update theme");
      }
    });
  };

  const handleReset = () => {
    setSelectedPreset(null);
    setCustomPrimary("");
    setCustomAccent("");
    setSelectedFont("");
    if (!isPro) return;
    startTransition(async () => {
      const result = await updateShopThemeAction(shopSlug, {
        themePreset: null,
        themePrimary: null,
        themeAccent: null,
        themeFont: null,
      });
      if (result.success) {
        toast.success("Theme reset to default");
      }
    });
  };

  const hasChanges =
    selectedPreset !== currentTheme.themePreset ||
    (customPrimary || null) !== currentTheme.themePrimary ||
    (customAccent || null) !== currentTheme.themeAccent ||
    (selectedFont || null) !== currentTheme.themeFont;

  return (
    <div className="space-y-6">
      {/* Pro gate overlay */}
      {!isPro && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3">
          <span className="text-xl mt-0.5">🔒</span>
          <div>
            <p className="text-sm font-bold text-amber-900">Pro Feature</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Storefront themes are available on Pro plans. Upgrade to customize your catalog&apos;s look and feel.
            </p>
          </div>
        </div>
      )}

      {/* Preset Grid */}
      <div>
        <h4 className="text-sm font-semibold text-stone-700 mb-3">Choose a preset</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {THEME_PRESETS.map((preset) => {
            const isActive = selectedPreset === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => isPro && handlePresetSelect(preset)}
                disabled={!isPro}
                className={`relative overflow-hidden rounded-xl border-2 p-4 text-left transition-all ${
                  isActive
                    ? "border-emerald-500 ring-2 ring-emerald-200 shadow-md"
                    : isPro
                      ? "border-stone-200 hover:border-stone-300 hover:shadow-sm"
                      : "border-stone-100 opacity-60 cursor-not-allowed"
                }`}
              >
                {/* Color preview bar */}
                <div className="flex gap-1.5 mb-3">
                  <div className="h-6 flex-1 rounded-md" style={{ backgroundColor: preset.primary }} />
                  <div className="h-6 w-8 rounded-md" style={{ backgroundColor: preset.accent }} />
                </div>
                <p className="text-sm font-bold text-stone-900">{preset.name}</p>
                <p className="text-[11px] text-stone-500 mt-0.5 leading-tight">{preset.description}</p>
                {isActive && (
                  <div className="absolute top-2 right-2">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white text-xs">✓</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Colors */}
      <div>
        <h4 className="text-sm font-semibold text-stone-700 mb-3">Customize colors</h4>
        <div className="flex gap-4">
          <label className="flex-1">
            <span className="text-xs text-stone-500 block mb-1.5">Primary</span>
            <div className="flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-2">
              <input
                type="color"
                value={customPrimary || "#10b981"}
                onChange={(e) => { setCustomPrimary(e.target.value); setSelectedPreset(null); }}
                disabled={!isPro}
                className="h-6 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
              />
              <span className="text-sm font-mono text-stone-600">{customPrimary || "#10b981"}</span>
            </div>
          </label>
          <label className="flex-1">
            <span className="text-xs text-stone-500 block mb-1.5">Accent</span>
            <div className="flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-2">
              <input
                type="color"
                value={customAccent || "#f59e0b"}
                onChange={(e) => { setCustomAccent(e.target.value); setSelectedFont(""); setSelectedPreset(null); }}
                disabled={!isPro}
                className="h-6 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
              />
              <span className="text-sm font-mono text-stone-600">{customAccent || "#f59e0b"}</span>
            </div>
          </label>
        </div>
      </div>

      {/* Font Selector */}
      <div>
        <h4 className="text-sm font-semibold text-stone-700 mb-3">Font</h4>
        <div className="flex flex-wrap gap-2">
          {Object.entries(THEME_FONTS).map(([id, family]) => (
            <button
              key={id}
              onClick={() => { if (isPro) { setSelectedFont(id); setSelectedPreset(null); } }}
              disabled={!isPro}
              className={`rounded-lg border px-3 py-2 text-sm transition-all ${
                selectedFont === id
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700 font-semibold"
                  : isPro
                    ? "border-stone-200 text-stone-600 hover:border-stone-300"
                    : "border-stone-100 text-stone-400 cursor-not-allowed"
              }`}
              style={{ fontFamily: family }}
            >
              {id.replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </button>
          ))}
        </div>
      </div>

      {/* Live Preview */}
      {(customPrimary || activePreset) && (
        <div>
          <h4 className="text-sm font-semibold text-stone-700 mb-3">Preview</h4>
          <div
            className="rounded-xl border border-stone-200 p-5 space-y-3"
            style={{ fontFamily: THEME_FONTS[selectedFont] || THEME_FONTS.inter }}
          >
            <div className="h-10 rounded-lg" style={{ backgroundColor: customPrimary || activePreset?.primary }} />
            <div className="flex gap-2">
              <div className="h-3 flex-1 rounded bg-stone-200" />
              <div className="h-3 w-16 rounded" style={{ backgroundColor: customAccent || activePreset?.accent }} />
            </div>
            <div className="flex gap-2">
              <div className="h-16 flex-1 rounded-lg bg-stone-100" />
              <div className="h-16 flex-1 rounded-lg bg-stone-100" />
            </div>
            <button
              className="w-full rounded-lg py-2.5 text-sm font-semibold text-white"
              style={{ backgroundColor: customPrimary || activePreset?.primary }}
            >
              Add to Cart
            </button>
          </div>
        </div>
      )}

      {/* Save / Reset */}
      {isPro && (
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={isPending || !hasChanges}
            className="flex-1 rounded-xl bg-stone-900 py-3 text-sm font-semibold text-white transition-all hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? "Saving…" : "Apply Theme"}
          </button>
          {(currentTheme.themePreset || currentTheme.themePrimary) && (
            <button
              onClick={handleReset}
              disabled={isPending}
              className="rounded-xl border border-stone-200 px-4 py-3 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-50"
            >
              Reset
            </button>
          )}
        </div>
      )}
    </div>
  );
}
