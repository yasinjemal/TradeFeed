// ============================================================
// Component — Shop Settings Form
// ============================================================
// Comprehensive settings page for sellers to build their profile.
// Sections: Basic Info, Location + Map, Business Hours, Social Links.
// ============================================================

"use client";

import { useActionState, useState } from "react";
import { updateShopSettingsAction } from "@/app/actions/shop-settings";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  SA_PROVINCES,
  DAYS_OF_WEEK,
  DAY_LABELS,
  type BusinessHours,
  type DayKey,
} from "@/lib/validation/shop-settings";

/* ── SA Cities for quick select ──────────────────────────── */
const SA_CITIES = [
  "Johannesburg",
  "Cape Town",
  "Durban",
  "Pretoria",
  "Port Elizabeth",
  "Bloemfontein",
  "Nelspruit",
  "Polokwane",
  "Kimberley",
  "East London",
  "Pietermaritzburg",
  "Rustenburg",
  "Soweto",
  "Sandton",
  "Midrand",
] as const;

/* ── Map Presets for popular wholesale areas ──────────────── */
const MAP_PRESETS = [
  { label: "Jeppe St, JHB", lat: -26.2023, lng: 28.0436 },
  { label: "Fashion District, JHB", lat: -26.2050, lng: 28.0400 },
  { label: "Oriental Plaza, JHB", lat: -26.2060, lng: 28.0255 },
  { label: "Cape Town CBD", lat: -33.9249, lng: 18.4241 },
  { label: "Durban CBD", lat: -29.8587, lng: 31.0218 },
  { label: "Pretoria CBD", lat: -25.7479, lng: 28.2293 },
] as const;

interface ShopSettingsFormProps {
  shopSlug: string;
  initialData: {
    name: string;
    description: string | null;
    aboutText: string | null;
    address: string | null;
    city: string | null;
    province: string | null;
    latitude: number | null;
    longitude: number | null;
    businessHours: string | null;
    instagram: string | null;
    facebook: string | null;
    tiktok: string | null;
    website: string | null;
  };
}

export function ShopSettingsForm({
  shopSlug,
  initialData,
}: ShopSettingsFormProps) {
  const boundAction = updateShopSettingsAction.bind(null, shopSlug);
  const [state, formAction, isPending] = useActionState(boundAction, null);

  // ── Local state for interactive fields ──────────────────
  const [lat, setLat] = useState(initialData.latitude?.toString() ?? "");
  const [lng, setLng] = useState(initialData.longitude?.toString() ?? "");

  // Business hours state
  const initialHours: BusinessHours = initialData.businessHours
    ? (JSON.parse(initialData.businessHours) as BusinessHours)
    : {};
  const [hours, setHours] = useState<BusinessHours>(initialHours);

  const updateHour = (day: DayKey, value: string) => {
    setHours((prev) => ({ ...prev, [day]: value }));
  };

  const setPresetHours = (preset: "weekdays" | "everyday" | "custom") => {
    if (preset === "weekdays") {
      setHours({
        mon: "08:00-17:00",
        tue: "08:00-17:00",
        wed: "08:00-17:00",
        thu: "08:00-17:00",
        fri: "08:00-17:00",
        sat: "09:00-14:00",
        sun: "Closed",
      });
    } else if (preset === "everyday") {
      setHours({
        mon: "08:00-18:00",
        tue: "08:00-18:00",
        wed: "08:00-18:00",
        thu: "08:00-18:00",
        fri: "08:00-18:00",
        sat: "08:00-18:00",
        sun: "08:00-18:00",
      });
    }
  };

  const selectMapPreset = (preset: { lat: number; lng: number }) => {
    setLat(preset.lat.toString());
    setLng(preset.lng.toString());
  };

  return (
    <form action={formAction} className="space-y-8">
      {/* Hidden field for serialized business hours */}
      <input
        type="hidden"
        name="businessHours"
        value={JSON.stringify(hours)}
      />
      <input type="hidden" name="latitude" value={lat} />
      <input type="hidden" name="longitude" value={lng} />

      {/* ── Status Messages ──────────────────────────────── */}
      {state?.success && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700 flex items-center gap-2">
          <span>✅</span> Settings saved successfully!
        </div>
      )}
      {state?.error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <span>⚠️</span> {state.error}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* Section 1: Basic Info                               */}
      {/* ═══════════════════════════════════════════════════ */}
      <section className="rounded-2xl border border-stone-200 bg-white p-6 space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-stone-900 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 text-sm">
              🏪
            </span>
            Basic Info
          </h2>
          <p className="text-sm text-stone-500 mt-1">
            Your shop name and description visible to buyers
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Shop Name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={initialData.name}
              className="rounded-xl"
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Short Description</Label>
            <Input
              id="description"
              name="description"
              defaultValue={initialData.description ?? ""}
              placeholder="e.g. Wholesale men's and women's clothing"
              className="rounded-xl"
              maxLength={500}
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="aboutText">
              About Your Shop{" "}
              <span className="text-stone-400 font-normal">(shown on profile)</span>
            </Label>
            <Textarea
              id="aboutText"
              name="aboutText"
              defaultValue={initialData.aboutText ?? ""}
              placeholder="Tell buyers about your shop — what you sell, your history, what makes you special..."
              className="rounded-xl"
              rows={4}
              maxLength={2000}
              disabled={isPending}
            />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* Section 2: Location                                 */}
      {/* ═══════════════════════════════════════════════════ */}
      <section className="rounded-2xl border border-stone-200 bg-white p-6 space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-stone-900 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 text-sm">
              📍
            </span>
            Location
          </h2>
          <p className="text-sm text-stone-500 mt-1">
            Help buyers find your physical shop on a map
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address">Street Address</Label>
            <Input
              id="address"
              name="address"
              defaultValue={initialData.address ?? ""}
              placeholder="e.g. Shop 42, Marble Tower, 62 Jeppe St"
              className="rounded-xl"
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <div className="space-y-2">
              <Input
                id="city"
                name="city"
                defaultValue={initialData.city ?? ""}
                placeholder="e.g. Johannesburg"
                className="rounded-xl"
                disabled={isPending}
              />
              <div className="flex flex-wrap gap-1">
                {SA_CITIES.slice(0, 6).map((city) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => {
                      const input = document.getElementById("city") as HTMLInputElement;
                      if (input) input.value = city;
                    }}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="province">Province</Label>
            <select
              id="province"
              name="province"
              defaultValue={initialData.province ?? ""}
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
              disabled={isPending}
            >
              <option value="">Select province...</option>
              {SA_PROVINCES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Map Pin */}
        <div className="space-y-3">
          <Label>Map Pin (GPS Coordinates)</Label>
          <p className="text-xs text-stone-400">
            Set your exact location so buyers can find you on Google Maps
          </p>

          {/* Quick presets for popular wholesale areas */}
          <div className="flex flex-wrap gap-1.5">
            {MAP_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => selectMapPreset(preset)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                  lat === preset.lat.toString() && lng === preset.lng.toString()
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-stone-200 bg-white text-stone-600 hover:border-blue-300 hover:bg-blue-50"
                }`}
              >
                📍 {preset.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="lat-input" className="text-xs text-stone-400">
                Latitude
              </Label>
              <Input
                id="lat-input"
                type="number"
                step="any"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="-26.2023"
                className="rounded-xl text-sm"
                disabled={isPending}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="lng-input" className="text-xs text-stone-400">
                Longitude
              </Label>
              <Input
                id="lng-input"
                type="number"
                step="any"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                placeholder="28.0436"
                className="rounded-xl text-sm"
                disabled={isPending}
              />
            </div>
          </div>

          {/* Map preview */}
          {lat && lng && (
            <div className="rounded-xl overflow-hidden border border-stone-200 h-48">
              <iframe
                title="Shop Location Preview"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(lng) - 0.005}%2C${Number(lat) - 0.003}%2C${Number(lng) + 0.005}%2C${Number(lat) + 0.003}&layer=mapnik&marker=${lat}%2C${lng}`}
              />
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* Section 3: Business Hours                           */}
      {/* ═══════════════════════════════════════════════════ */}
      <section className="rounded-2xl border border-stone-200 bg-white p-6 space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-stone-900 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 text-sm">
              🕐
            </span>
            Business Hours
          </h2>
          <p className="text-sm text-stone-500 mt-1">
            Let buyers know when they can visit or expect replies
          </p>
        </div>

        {/* Quick presets */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPresetHours("weekdays")}
            className="text-xs px-3 py-1.5 rounded-full border border-stone-200 bg-white text-stone-600 hover:border-amber-300 hover:bg-amber-50 transition-all"
          >
            🏢 Weekdays + Sat AM
          </button>
          <button
            type="button"
            onClick={() => setPresetHours("everyday")}
            className="text-xs px-3 py-1.5 rounded-full border border-stone-200 bg-white text-stone-600 hover:border-amber-300 hover:bg-amber-50 transition-all"
          >
            🔄 Every day 8-6
          </button>
        </div>

        {/* Day-by-day editor */}
        <div className="space-y-2">
          {DAYS_OF_WEEK.map((day) => (
            <div
              key={day}
              className="flex items-center gap-3"
            >
              <span className="w-24 text-sm font-medium text-stone-700">
                {DAY_LABELS[day]}
              </span>
              <Input
                value={hours[day] ?? ""}
                onChange={(e) => updateHour(day, e.target.value)}
                placeholder="08:00-17:00 or Closed"
                className="rounded-xl text-sm flex-1"
                disabled={isPending}
              />
              <button
                type="button"
                onClick={() => updateHour(day, "Closed")}
                className="text-xs px-2 py-1 rounded-lg bg-stone-100 text-stone-500 hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                Closed
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* Section 4: Social Links                             */}
      {/* ═══════════════════════════════════════════════════ */}
      <section className="rounded-2xl border border-stone-200 bg-white p-6 space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-stone-900 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 text-sm">
              🔗
            </span>
            Social & Links
          </h2>
          <p className="text-sm text-stone-500 mt-1">
            Connect your social media — builds buyer trust
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="instagram" className="flex items-center gap-2">
              <span className="text-pink-500">📸</span> Instagram
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-stone-400">
                @
              </span>
              <Input
                id="instagram"
                name="instagram"
                defaultValue={initialData.instagram ?? ""}
                placeholder="yourshop"
                className="rounded-xl pl-7"
                disabled={isPending}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tiktok" className="flex items-center gap-2">
              <span>🎵</span> TikTok
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-stone-400">
                @
              </span>
              <Input
                id="tiktok"
                name="tiktok"
                defaultValue={initialData.tiktok ?? ""}
                placeholder="yourshop"
                className="rounded-xl pl-7"
                disabled={isPending}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="facebook" className="flex items-center gap-2">
              <span className="text-blue-600">👥</span> Facebook
            </Label>
            <Input
              id="facebook"
              name="facebook"
              defaultValue={initialData.facebook ?? ""}
              placeholder="facebook.com/yourshop or page name"
              className="rounded-xl"
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website" className="flex items-center gap-2">
              <span>🌐</span> Website
            </Label>
            <Input
              id="website"
              name="website"
              defaultValue={initialData.website ?? ""}
              placeholder="https://yourshop.co.za"
              className="rounded-xl"
              disabled={isPending}
            />
          </div>
        </div>
      </section>

      {/* ── Save Button ──────────────────────────────────── */}
      <div className="flex justify-end">
        <Button
          type="submit"
          size="lg"
          disabled={isPending}
          className="rounded-xl px-8 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:shadow-lg hover:shadow-emerald-200 transition-all"
        >
          {isPending ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </span>
          ) : (
            "Save Settings"
          )}
        </Button>
      </div>
    </form>
  );
}
