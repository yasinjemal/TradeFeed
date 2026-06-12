// ============================================================
// Component — Shop Location Fields (City + Province)
// ============================================================
// Required location inputs shared by the /get-started and
// /create-shop signup forms. City is free text with suggestions;
// typing a known city auto-selects the province.
//
// WHY REQUIRED: the marketplace province/city SEO pages can only
// index shops that have a location set — shops without one are
// invisible to local buyers.
// ============================================================

"use client";

import { useState } from "react";
import {
  SA_PROVINCES,
  CITY_PROVINCE_MAP,
} from "@/lib/validation/shop-settings";

const INPUT_CLASSES =
  "w-full h-12 px-4 rounded-xl bg-stone-800/60 border border-stone-700/60 text-stone-100 placeholder:text-stone-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50 transition-all disabled:opacity-50";

interface Props {
  disabled?: boolean;
  fieldErrors?: Record<string, string[]>;
}

export function ShopLocationFields({ disabled, fieldErrors }: Props) {
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const autoDetected = CITY_PROVINCE_MAP[city.trim()];

  const handleCityChange = (value: string) => {
    setCity(value);
    const detected = CITY_PROVINCE_MAP[value.trim()];
    if (detected) setProvince(detected);
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* City */}
        <div className="space-y-2">
          <label htmlFor="city" className="text-sm font-medium text-stone-200">
            City / Town
          </label>
          <input
            id="city"
            name="city"
            type="text"
            list="sa-cities"
            placeholder="e.g. Johannesburg"
            required
            minLength={2}
            maxLength={100}
            disabled={disabled}
            value={city}
            onChange={(e) => handleCityChange(e.target.value)}
            className={INPUT_CLASSES}
          />
          <datalist id="sa-cities">
            {Object.keys(CITY_PROVINCE_MAP).map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          {fieldErrors?.city && (
            <p className="text-xs text-red-400">{fieldErrors.city[0]}</p>
          )}
        </div>

        {/* Province */}
        <div className="space-y-2">
          <label
            htmlFor="province"
            className="text-sm font-medium text-stone-200"
          >
            Province
          </label>
          <select
            id="province"
            name="province"
            required
            disabled={disabled}
            value={province}
            onChange={(e) => setProvince(e.target.value)}
            className={INPUT_CLASSES}
          >
            <option value="">Select province...</option>
            {SA_PROVINCES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          {fieldErrors?.province && (
            <p className="text-xs text-red-400">{fieldErrors.province[0]}</p>
          )}
        </div>
      </div>
      <p className="text-xs text-stone-500">
        {autoDetected && province === autoDetected
          ? "✓ Province auto-detected from your city"
          : "Helps local buyers find your shop"}
      </p>
    </div>
  );
}
