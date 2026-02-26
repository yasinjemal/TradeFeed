// ============================================================
// Component — Smart Variant Creator
// ============================================================
// Visual batch variant creator with:
// - Dynamic option labels (Size/Color, Storage/Color, Weight/Flavor)
// - Pre-built option1 chips (letters / numbers / shoes / custom)
// - Option2 swatches (color hex preview when applicable)
// - Auto-generates all option1 × option2 combinations
// - Skips duplicates that already exist
// - Price + stock for the whole batch
// ============================================================

"use client";

import { useState, useTransition } from "react";
import { batchCreateVariantsAction } from "@/app/actions/product";
import type { VariantPreset } from "@/lib/config/category-variants";
import { DEFAULT_VARIANT_PRESET } from "@/lib/config/category-variants";

interface SmartVariantCreatorProps {
  shopSlug: string;
  productId: string;
  existingVariants: { size: string; color: string | null }[];
  option1Label?: string;
  option2Label?: string;
  preset?: VariantPreset;
}

// ── Size Presets ────────────────────────────────────────────

const LETTER_SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"];
const NUMBER_SIZES = ["28", "30", "32", "34", "36", "38", "40", "42", "44"];
const SHOE_SIZES = ["3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

// ── Color Presets (SA wholesale palette) ────────────────────

const COLORS = [
  { name: "Black", hex: "#000000" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Navy", hex: "#1B2A4A" },
  { name: "Grey", hex: "#808080" },
  { name: "Charcoal", hex: "#333333" },
  { name: "Red", hex: "#DC2626" },
  { name: "Burgundy", hex: "#800020" },
  { name: "Blue", hex: "#2563EB" },
  { name: "Royal Blue", hex: "#1E40AF" },
  { name: "Sky Blue", hex: "#7DD3FC" },
  { name: "Green", hex: "#16A34A" },
  { name: "Olive", hex: "#808000" },
  { name: "Khaki", hex: "#C3B091" },
  { name: "Brown", hex: "#92400E" },
  { name: "Tan", hex: "#D2B48C" },
  { name: "Beige", hex: "#F5F5DC" },
  { name: "Cream", hex: "#FFFDD0" },
  { name: "Pink", hex: "#EC4899" },
  { name: "Purple", hex: "#7C3AED" },
  { name: "Orange", hex: "#F97316" },
  { name: "Yellow", hex: "#FACC15" },
  { name: "Coral", hex: "#FF7F50" },
  { name: "Teal", hex: "#14B8A6" },
  { name: "Maroon", hex: "#800000" },
] as const;

const LIGHT_COLORS = new Set([
  "White",
  "Cream",
  "Beige",
  "Yellow",
  "Khaki",
  "Tan",
  "Sky Blue",
]);

export function SmartVariantCreator({
  shopSlug,
  productId,
  existingVariants,
  option1Label = "Size",
  option2Label = "Color",
  preset = DEFAULT_VARIANT_PRESET,
}: SmartVariantCreatorProps) {
  // Use preset data for option1 tabs and option2 swatches
  const option1PresetGroups = preset.option1Presets ?? [LETTER_SIZES, NUMBER_SIZES, SHOE_SIZES];
  const option1PresetLabels = preset.option1PresetLabels ?? ["S / M / L", "28 – 44", "Shoes"];
  const option2PresetValues = preset.option2Presets ?? COLORS;
  const isOption2Color = option2Label.toLowerCase() === "color" || option2Label.toLowerCase() === "shade";

  const [activeGroup, setActiveGroup] = useState(0);
  const [selectedOption1s, setSelectedOption1s] = useState<Set<string>>(new Set());
  const [selectedOption2s, setSelectedOption2s] = useState<Set<string>>(new Set());
  const [price, setPrice] = useState("299.99");
  const [retailPrice, setRetailPrice] = useState("");
  const [stock, setStock] = useState("50");
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const currentOption1Values = option1PresetGroups[activeGroup] ?? [];

  // ── Toggles ──────────────────────────────────────────────

  const toggleOption1 = (val: string) => {
    const next = new Set(selectedOption1s);
    next.has(val) ? next.delete(val) : next.add(val);
    setSelectedOption1s(next);
    setResult(null);
  };

  const toggleOption2 = (val: string) => {
    const next = new Set(selectedOption2s);
    next.has(val) ? next.delete(val) : next.add(val);
    setSelectedOption2s(next);
    setResult(null);
  };

  const selectAllOption1 = () => {
    setSelectedOption1s(new Set(currentOption1Values));
    setResult(null);
  };
  const clearOption1 = () => {
    setSelectedOption1s(new Set());
    setResult(null);
  };
  const clearOption2 = () => {
    setSelectedOption2s(new Set());
    setResult(null);
  };

  // ── Count new variants (exclude existing) ────────────────

  const existingSet = new Set(
    existingVariants.map((v) => `${v.size}|${v.color ?? ""}`)
  );
  const option2sToUse =
    selectedOption2s.size > 0 ? Array.from(selectedOption2s) : [""];
  const newCombinations = Array.from(selectedOption1s).flatMap((opt1) =>
    option2sToUse.filter((opt2) => !existingSet.has(`${opt1}|${opt2}`))
  );
  const newCount = newCombinations.length;

  // ── Generate ─────────────────────────────────────────────

  const handleGenerate = () => {
    if (newCount === 0) return;
    const priceInCents = Math.round(parseFloat(price) * 100);
    const retailPriceInCents = retailPrice.trim() ? Math.round(parseFloat(retailPrice) * 100) : null;
    const stockNum = parseInt(stock, 10);
    if (isNaN(priceInCents) || priceInCents <= 0) return;
    if (isNaN(stockNum) || stockNum < 0) return;
    if (retailPriceInCents !== null && (isNaN(retailPriceInCents) || retailPriceInCents <= 0)) return;

    startTransition(async () => {
      const res = await batchCreateVariantsAction(
        shopSlug,
        productId,
        Array.from(selectedOption1s),
        Array.from(selectedOption2s),
        priceInCents,
        stockNum,
        retailPriceInCents,
      );
      if (res.success) {
        setResult({
          success: true,
          message: `${newCount} variant${newCount > 1 ? "s" : ""} created!`,
        });
        setSelectedOption1s(new Set());
        setSelectedOption2s(new Set());
      } else {
        setResult({ success: false, message: res.error || "Failed" });
      }
    });
  };

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6 space-y-6 shadow-sm">
      {/* ── Header ──────────────────────────────────────── */}
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          ✨ Quick Add Variants
        </h3>
        <p className="text-sm text-stone-500 mt-1">
          Select {option1Label.toLowerCase()}s &amp; {option2Label.toLowerCase()}s, set pricing — we generate all combinations
        </p>
      </div>

      {/* ── Option 1 Tabs ──────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-stone-700">{option1Label}s</label>
          {option1PresetGroups.length > 1 && (
            <div className="flex rounded-lg bg-stone-100 p-0.5">
              {option1PresetLabels.map((label, idx) => (
                <button
                  key={label}
                  onClick={() => {
                    setActiveGroup(idx);
                    setSelectedOption1s(new Set());
                    setResult(null);
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200
                    ${activeGroup === idx ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Option 1 Chips */}
        <div className="flex flex-wrap gap-2">
          {currentOption1Values.map((val) => {
            const selected = selectedOption1s.has(val);
            return (
              <button
                key={val}
                onClick={() => toggleOption1(val)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 border-2
                  ${
                    selected
                      ? "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-200/60 scale-105"
                      : "bg-white border-stone-200 text-stone-700 hover:border-emerald-300 hover:bg-emerald-50"
                  }`}
              >
                {val}
              </button>
            );
          })}
        </div>

        <div className="flex gap-2 mt-2">
          <button
            onClick={selectAllOption1}
            className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
          >
            Select All
          </button>
          <span className="text-stone-300">·</span>
          <button
            onClick={clearOption1}
            className="text-xs text-stone-500 hover:text-stone-700 font-medium"
          >
            Clear
          </button>
        </div>
      </div>

      {/* ── Option 2 Swatches / Chips ──────────────────── */}
      {option2PresetValues.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-stone-700">
              {option2Label}s{" "}
              <span className="text-stone-400 font-normal">(optional)</span>
            </label>
            {selectedOption2s.size > 0 && (
              <button
                onClick={clearOption2}
                className="text-xs text-stone-500 hover:text-stone-700 font-medium"
              >
                Clear ({selectedOption2s.size})
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2.5">
            {option2PresetValues.map((item) => {
              const name = typeof item === "string" ? item : item.name;
              const hex = typeof item === "string" ? null : item.hex;
              const selected = selectedOption2s.has(name);
              const isLight = LIGHT_COLORS.has(name);

              // Color swatch mode (has hex)
              if (hex && isOption2Color) {
                return (
                  <button
                    key={name}
                    onClick={() => toggleOption2(name)}
                    title={name}
                    className={`group relative w-10 h-10 rounded-xl transition-all duration-200 border-2
                      ${
                        selected
                          ? "scale-110 shadow-lg ring-2 ring-emerald-400 ring-offset-2 border-emerald-500"
                          : `${isLight ? "border-stone-200" : "border-transparent"} hover:scale-105 hover:shadow-md`
                      }`}
                    style={{ backgroundColor: hex }}
                  >
                    {selected && (
                      <span
                        className={`absolute inset-0 flex items-center justify-center text-base font-bold ${isLight ? "text-stone-800" : "text-white"}`}
                      >
                        ✓
                      </span>
                    )}
                    <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-stone-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none bg-white px-1.5 py-0.5 rounded shadow-sm border border-stone-100">
                      {name}
                    </span>
                  </button>
                );
              }

              // Text chip mode (no hex or not a color field)
              return (
                <button
                  key={name}
                  onClick={() => toggleOption2(name)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 border-2
                    ${
                      selected
                        ? "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-200/60 scale-105"
                        : "bg-white border-stone-200 text-stone-700 hover:border-emerald-300 hover:bg-emerald-50"
                    }`}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Price & Stock ───────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium text-stone-700 mb-1.5 block">
            Wholesale Price
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-stone-400">
              R
            </span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={price}
              onChange={(e) => {
                setPrice(e.target.value);
                setResult(null);
              }}
              className="w-full rounded-xl border-2 border-stone-200 pl-8 pr-3 py-2.5 text-sm font-medium
                focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-stone-700 mb-1.5 block">
            Retail Price <span className="text-stone-400 font-normal text-xs">(optional)</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-stone-400">
              R
            </span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={retailPrice}
              onChange={(e) => {
                setRetailPrice(e.target.value);
                setResult(null);
              }}
              placeholder="—"
              className="w-full rounded-xl border-2 border-stone-200 pl-8 pr-3 py-2.5 text-sm font-medium
                focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-stone-700 mb-1.5 block">
            Stock per variant
          </label>
          <input
            type="number"
            min="0"
            step="1"
            value={stock}
            onChange={(e) => {
              setStock(e.target.value);
              setResult(null);
            }}
            className="w-full rounded-xl border-2 border-stone-200 px-3 py-2.5 text-sm font-medium
              focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
          />
        </div>
      </div>

      {/* ── Generate Button ─────────────────────────────── */}
      <button
        onClick={handleGenerate}
        disabled={isPending || newCount === 0 || !price || !stock}
        className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all duration-300
          ${
            newCount > 0 && !isPending
              ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-200/60 hover:shadow-xl hover:shadow-emerald-300/60 hover:-translate-y-0.5 active:translate-y-0"
              : "bg-stone-100 text-stone-400 cursor-not-allowed"
          }`}
      >
        {isPending
          ? "Creating variants..."
          : newCount > 0
            ? `✨ Generate ${newCount} Variant${newCount > 1 ? "s" : ""}`
            : selectedOption1s.size === 0
              ? `Select ${option1Label.toLowerCase()}s to get started`
              : "All combinations already exist"}
      </button>

      {/* ── Result Feedback ─────────────────────────────── */}
      {result && (
        <div
          className={`rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2 transition-all
          ${result.success ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}
        >
          {result.success ? "🎉" : "⚠️"} {result.message}
        </div>
      )}
    </div>
  );
}
