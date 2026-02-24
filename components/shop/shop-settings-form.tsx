// ============================================================
// Component — Shop Settings Form (v2 — Mind-blowing Edition)
// ============================================================
// Beautiful, smooth, automatic:
// - Animated expanding sections with smooth transitions
// - GPS auto-detect for location
// - Toggle switches for business hours
// - Character counters on text fields
// - Floating sticky save bar
// - Success animation
// - Smart city/province auto-link
// ============================================================

"use client";

import { useActionState, useState, useRef, useEffect, useCallback } from "react";
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

/* ── SA Cities → Province auto-map ───────────────────────── */
const CITY_PROVINCE_MAP: Record<string, string> = {
  "Johannesburg": "Gauteng",
  "Pretoria": "Gauteng",
  "Sandton": "Gauteng",
  "Soweto": "Gauteng",
  "Midrand": "Gauteng",
  "Centurion": "Gauteng",
  "Cape Town": "Western Cape",
  "Stellenbosch": "Western Cape",
  "Paarl": "Western Cape",
  "Durban": "KwaZulu-Natal",
  "Pietermaritzburg": "KwaZulu-Natal",
  "Port Elizabeth": "Eastern Cape",
  "East London": "Eastern Cape",
  "Queenstown": "Eastern Cape",
  "Bloemfontein": "Free State",
  "Welkom": "Free State",
  "Nelspruit": "Mpumalanga",
  "Polokwane": "Limpopo",
  "Kimberley": "Northern Cape",
  "Rustenburg": "North West",
  "Mahikeng": "North West",
};

const SA_CITIES = Object.keys(CITY_PROVINCE_MAP);

/* ── Map Presets for popular wholesale areas ──────────────── */
const MAP_PRESETS = [
  { label: "Jeppe St, JHB", lat: -26.2023, lng: 28.0436, emoji: "🏪" },
  { label: "Fashion District", lat: -26.2050, lng: 28.0400, emoji: "👗" },
  { label: "Oriental Plaza", lat: -26.2060, lng: 28.0255, emoji: "🏬" },
  { label: "Cape Town CBD", lat: -33.9249, lng: 18.4241, emoji: "🌊" },
  { label: "Durban CBD", lat: -29.8587, lng: 31.0218, emoji: "☀️" },
  { label: "Pretoria CBD", lat: -25.7479, lng: 28.2293, emoji: "🏛️" },
] as const;

/* ── Business hour presets ────────────────────────────────── */
const HOUR_PRESETS = [
  {
    label: "Weekdays + Sat AM",
    icon: "🏢",
    desc: "Mon–Fri 8–5, Sat 9–2",
    hours: {
      mon: "08:00-17:00", tue: "08:00-17:00", wed: "08:00-17:00",
      thu: "08:00-17:00", fri: "08:00-17:00", sat: "09:00-14:00", sun: "Closed",
    } as BusinessHours,
  },
  {
    label: "Every Day 8–6",
    icon: "🔄",
    desc: "Open 7 days a week",
    hours: {
      mon: "08:00-18:00", tue: "08:00-18:00", wed: "08:00-18:00",
      thu: "08:00-18:00", fri: "08:00-18:00", sat: "08:00-18:00", sun: "08:00-18:00",
    } as BusinessHours,
  },
  {
    label: "Early Bird",
    icon: "🌅",
    desc: "Mon–Sat 6–3",
    hours: {
      mon: "06:00-15:00", tue: "06:00-15:00", wed: "06:00-15:00",
      thu: "06:00-15:00", fri: "06:00-15:00", sat: "06:00-15:00", sun: "Closed",
    } as BusinessHours,
  },
];

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

  // ── Expandable section state ────────────────────────────
  const [openSection, setOpenSection] = useState<string | null>("basic");

  // ── Location state ──────────────────────────────────────
  const [lat, setLat] = useState(initialData.latitude?.toString() ?? "");
  const [lng, setLng] = useState(initialData.longitude?.toString() ?? "");
  const [gpsStatus, setGpsStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [cityValue, setCityValue] = useState(initialData.city ?? "");
  const [provinceValue, setProvinceValue] = useState(initialData.province ?? "");

  // ── Business hours state ────────────────────────────────
  const initialHours: BusinessHours = initialData.businessHours
    ? (JSON.parse(initialData.businessHours) as BusinessHours)
    : {};
  const [hours, setHours] = useState<BusinessHours>(initialHours);
  const [activePreset, setActivePreset] = useState<number | null>(null);

  // ── Character counters ──────────────────────────────────
  const [aboutLength, setAboutLength] = useState(initialData.aboutText?.length ?? 0);
  const [descLength, setDescLength] = useState(initialData.description?.length ?? 0);

  // ── Success animation ───────────────────────────────────
  const [showSuccess, setShowSuccess] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Scroll to top on success
  useEffect(() => {
    if (state?.success) {
      setShowSuccess(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      const t = setTimeout(() => setShowSuccess(false), 3000);
      return () => clearTimeout(t);
    }
  }, [state?.success]);

  // ── Helpers ─────────────────────────────────────────────
  const toggleSection = (key: string) => {
    setOpenSection((prev) => (prev === key ? null : key));
  };

  const updateHour = (day: DayKey, value: string) => {
    setHours((prev) => ({ ...prev, [day]: value }));
    setActivePreset(null);
  };

  const selectCity = useCallback((city: string) => {
    setCityValue(city);
    const province = CITY_PROVINCE_MAP[city];
    if (province) setProvinceValue(province);
    // Update actual inputs
    const cityInput = document.getElementById("city") as HTMLInputElement | null;
    const provInput = document.getElementById("province") as HTMLSelectElement | null;
    if (cityInput) cityInput.value = city;
    if (provInput && province) provInput.value = province;
  }, []);

  const detectGPS = () => {
    if (!navigator.geolocation) {
      setGpsStatus("error");
      return;
    }
    setGpsStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
        setGpsStatus("success");
        setTimeout(() => setGpsStatus("idle"), 2000);
      },
      () => {
        setGpsStatus("error");
        setTimeout(() => setGpsStatus("idle"), 3000);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const selectMapPreset = (preset: { lat: number; lng: number }, index: number) => {
    setLat(preset.lat.toString());
    setLng(preset.lng.toString());
  };

  // ── Section component ───────────────────────────────────
  const Section = ({
    id,
    icon,
    iconBg,
    title,
    subtitle,
    badge,
    children,
  }: {
    id: string;
    icon: React.ReactNode;
    iconBg: string;
    title: string;
    subtitle: string;
    badge?: React.ReactNode;
    children: React.ReactNode;
  }) => {
    const isOpen = openSection === id;
    return (
      <section className="rounded-2xl border border-stone-200/80 bg-white overflow-hidden transition-all duration-300 hover:border-stone-300/80 hover:shadow-sm">
        <button
          type="button"
          onClick={() => toggleSection(id)}
          className="w-full flex items-center gap-4 p-5 sm:p-6 text-left group"
        >
          <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center text-lg flex-shrink-0 transition-transform duration-300 ${isOpen ? "scale-110" : "group-hover:scale-105"}`}>
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-stone-900">{title}</h2>
              {badge}
            </div>
            <p className="text-sm text-stone-500 mt-0.5">{subtitle}</p>
          </div>
          <svg
            className={`w-5 h-5 text-stone-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>

        <div
          className={`transition-all duration-300 ease-in-out overflow-hidden ${
            isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="px-5 sm:px-6 pb-6 pt-0 space-y-5 border-t border-stone-100">
            <div className="pt-5">{children}</div>
          </div>
        </div>
      </section>
    );
  };

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      {/* Hidden fields for serialized data */}
      <input type="hidden" name="businessHours" value={JSON.stringify(hours)} />
      <input type="hidden" name="latitude" value={lat} />
      <input type="hidden" name="longitude" value={lng} />

      {/* ── Success Toast ────────────────────────────────── */}
      {showSuccess && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
          <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-emerald-600 text-white shadow-2xl shadow-emerald-200/50">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-sm">Settings saved!</p>
              <p className="text-emerald-100 text-xs">Changes are live on your catalog</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Error Message ────────────────────────────────── */}
      {state?.error && !state.success && (
        <div className="rounded-2xl bg-red-50 border border-red-200 px-5 py-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-red-800">{state.error}</p>
            {state.fieldErrors && (
              <ul className="mt-1.5 space-y-0.5">
                {Object.entries(state.fieldErrors).map(([field, errors]) => (
                  <li key={field} className="text-xs text-red-600">
                    {field}: {errors.join(", ")}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* Section 1: Basic Info                               */}
      {/* ═══════════════════════════════════════════════════ */}
      <Section
        id="basic"
        icon="🏪"
        iconBg="bg-emerald-50"
        title="Basic Info"
        subtitle="Your shop name and story — first impression matters"
      >
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Shop Name
            </Label>
            <Input
              id="name"
              name="name"
              defaultValue={initialData.name}
              className="rounded-xl h-12 text-base font-medium border-stone-200 focus:border-emerald-400 focus:ring-emerald-400/20 transition-all"
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="description" className="text-sm font-medium">
                Short Description
              </Label>
              <span className={`text-xs tabular-nums ${descLength > 400 ? "text-amber-500" : "text-stone-400"}`}>
                {descLength}/500
              </span>
            </div>
            <Input
              id="description"
              name="description"
              defaultValue={initialData.description ?? ""}
              placeholder="e.g. Premium wholesale men's and women's clothing"
              className="rounded-xl h-12 border-stone-200 focus:border-emerald-400 focus:ring-emerald-400/20 transition-all"
              maxLength={500}
              onChange={(e) => setDescLength(e.target.value.length)}
              disabled={isPending}
            />
            <p className="text-[11px] text-stone-400">Shown in catalog header and search results</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="aboutText" className="text-sm font-medium">
                About Your Shop
              </Label>
              <span className={`text-xs tabular-nums ${aboutLength > 1800 ? "text-amber-500" : "text-stone-400"}`}>
                {aboutLength}/2000
              </span>
            </div>
            <Textarea
              id="aboutText"
              name="aboutText"
              defaultValue={initialData.aboutText ?? ""}
              placeholder="Tell your story — what you sell, your history, why buyers should trust you..."
              className="rounded-xl min-h-[120px] border-stone-200 focus:border-emerald-400 focus:ring-emerald-400/20 transition-all resize-y"
              rows={5}
              maxLength={2000}
              onChange={(e) => setAboutLength(e.target.value.length)}
              disabled={isPending}
            />
            <p className="text-[11px] text-stone-400">
              💡 Tip: Mention your years of experience, what brands you carry, and what makes you different
            </p>
          </div>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* Section 2: Location                                 */}
      {/* ═══════════════════════════════════════════════════ */}
      <Section
        id="location"
        icon="📍"
        iconBg="bg-blue-50"
        title="Location"
        subtitle="Help buyers find your physical shop"
        badge={
          lat && lng ? (
            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Map pin set
            </span>
          ) : null
        }
      >
        <div className="space-y-6">
          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address" className="text-sm font-medium">Street Address</Label>
            <Input
              id="address"
              name="address"
              defaultValue={initialData.address ?? ""}
              placeholder="e.g. Shop 42, Marble Tower, 62 Jeppe St"
              className="rounded-xl h-12 border-stone-200 focus:border-blue-400 focus:ring-blue-400/20 transition-all"
              disabled={isPending}
            />
          </div>

          {/* City + Province (auto-linked) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city" className="text-sm font-medium">City</Label>
              <Input
                id="city"
                name="city"
                value={cityValue}
                onChange={(e) => {
                  setCityValue(e.target.value);
                  const match = CITY_PROVINCE_MAP[e.target.value];
                  if (match) setProvinceValue(match);
                }}
                placeholder="e.g. Johannesburg"
                className="rounded-xl h-12 border-stone-200 focus:border-blue-400 focus:ring-blue-400/20 transition-all"
                disabled={isPending}
              />
              {/* Quick city select */}
              <div className="flex flex-wrap gap-1">
                {SA_CITIES.slice(0, 8).map((city) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => selectCity(city)}
                    className={`text-[11px] px-2.5 py-1 rounded-full transition-all ${
                      cityValue === city
                        ? "bg-blue-100 text-blue-700 border border-blue-200 font-medium"
                        : "bg-stone-50 text-stone-500 border border-stone-100 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="province" className="text-sm font-medium">Province</Label>
              <select
                id="province"
                name="province"
                value={provinceValue}
                onChange={(e) => setProvinceValue(e.target.value)}
                className="flex h-12 w-full rounded-xl border border-stone-200 bg-background px-3 py-2 text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 focus:outline-none transition-all"
                disabled={isPending}
              >
                <option value="">Select province...</option>
                {SA_PROVINCES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              {cityValue && CITY_PROVINCE_MAP[cityValue] && provinceValue === CITY_PROVINCE_MAP[cityValue] && (
                <p className="text-[11px] text-blue-500 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Auto-detected from city
                </p>
              )}
            </div>
          </div>

          {/* GPS + Map Presets */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Map Pin</Label>
              <button
                type="button"
                onClick={detectGPS}
                disabled={gpsStatus === "loading"}
                className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
                  gpsStatus === "loading"
                    ? "bg-blue-100 text-blue-600 border border-blue-200"
                    : gpsStatus === "success"
                      ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                      : gpsStatus === "error"
                        ? "bg-red-100 text-red-600 border border-red-200"
                        : "bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100"
                }`}
              >
                {gpsStatus === "loading" ? (
                  <>
                    <span className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    Detecting...
                  </>
                ) : gpsStatus === "success" ? (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    Location found!
                  </>
                ) : gpsStatus === "error" ? (
                  <>⚠️ GPS unavailable</>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    Use my location
                  </>
                )}
              </button>
            </div>

            {/* Wholesale area presets */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {MAP_PRESETS.map((preset, i) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => selectMapPreset(preset, i)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left text-xs transition-all ${
                    lat === preset.lat.toString() && lng === preset.lng.toString()
                      ? "border-blue-400 bg-blue-50 text-blue-700 shadow-sm shadow-blue-100"
                      : "border-stone-200 bg-white text-stone-600 hover:border-blue-300 hover:bg-blue-50/50"
                  }`}
                >
                  <span className="text-base">{preset.emoji}</span>
                  <span className="font-medium truncate">{preset.label}</span>
                </button>
              ))}
            </div>

            {/* Lat/Lng inputs (compact) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="lat-input" className="text-xs text-stone-400">Latitude</Label>
                <Input
                  id="lat-input"
                  type="number"
                  step="any"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  placeholder="-26.2023"
                  className="rounded-xl text-sm h-10 border-stone-200 focus:border-blue-400 focus:ring-blue-400/20"
                  disabled={isPending}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="lng-input" className="text-xs text-stone-400">Longitude</Label>
                <Input
                  id="lng-input"
                  type="number"
                  step="any"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  placeholder="28.0436"
                  className="rounded-xl text-sm h-10 border-stone-200 focus:border-blue-400 focus:ring-blue-400/20"
                  disabled={isPending}
                />
              </div>
            </div>

            {/* Live map preview */}
            {lat && lng && (
              <div className="rounded-2xl overflow-hidden border border-stone-200 shadow-sm">
                <iframe
                  title="Shop Location Preview"
                  width="100%"
                  height="200"
                  style={{ border: 0 }}
                  loading="lazy"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(lng) - 0.005}%2C${Number(lat) - 0.003}%2C${Number(lng) + 0.005}%2C${Number(lat) + 0.003}&layer=mapnik&marker=${lat}%2C${lng}`}
                />
                <div className="bg-stone-50 px-3 py-2 flex items-center justify-between">
                  <span className="text-[11px] text-stone-400">
                    📍 {Number(lat).toFixed(4)}, {Number(lng).toFixed(4)}
                  </span>
                  <a
                    href={`https://www.google.com/maps?q=${lat},${lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-blue-500 hover:text-blue-700 font-medium transition-colors"
                  >
                    Open in Google Maps →
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* Section 3: Business Hours                           */}
      {/* ═══════════════════════════════════════════════════ */}
      <Section
        id="hours"
        icon="🕐"
        iconBg="bg-amber-50"
        title="Business Hours"
        subtitle="Let buyers know when to visit or expect replies"
        badge={
          Object.keys(hours).length > 0 ? (
            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Hours set
            </span>
          ) : null
        }
      >
        <div className="space-y-5">
          {/* Preset cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {HOUR_PRESETS.map((preset, i) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setHours(preset.hours);
                  setActivePreset(i);
                }}
                className={`flex flex-col items-start gap-1 px-4 py-3 rounded-xl border text-left transition-all ${
                  activePreset === i
                    ? "border-amber-400 bg-amber-50 shadow-sm shadow-amber-100"
                    : "border-stone-200 bg-white hover:border-amber-300 hover:bg-amber-50/50"
                }`}
              >
                <span className="text-lg">{preset.icon}</span>
                <span className="text-sm font-semibold text-stone-800">{preset.label}</span>
                <span className="text-[11px] text-stone-500">{preset.desc}</span>
              </button>
            ))}
          </div>

          {/* Day-by-day editor */}
          <div className="rounded-2xl border border-stone-200 overflow-hidden">
            {DAYS_OF_WEEK.map((day, i) => {
              const isClosed = hours[day]?.toLowerCase() === "closed";
              const hasValue = !!hours[day] && !isClosed;

              return (
                <div
                  key={day}
                  className={`flex items-center gap-3 px-4 py-3 ${
                    i < DAYS_OF_WEEK.length - 1 ? "border-b border-stone-100" : ""
                  } ${isClosed ? "bg-stone-50/50" : "bg-white"} transition-colors`}
                >
                  {/* Day label */}
                  <span className={`w-24 text-sm font-medium ${isClosed ? "text-stone-400" : "text-stone-700"}`}>
                    {DAY_LABELS[day]}
                  </span>

                  {/* Time input */}
                  <div className="flex-1">
                    <Input
                      value={isClosed ? "" : (hours[day] ?? "")}
                      onChange={(e) => updateHour(day, e.target.value)}
                      placeholder="08:00-17:00"
                      className={`rounded-lg h-9 text-sm border-stone-200 focus:border-amber-400 focus:ring-amber-400/20 transition-all ${
                        isClosed ? "opacity-40" : ""
                      }`}
                      disabled={isPending || isClosed}
                    />
                  </div>

                  {/* Open/Closed toggle */}
                  <button
                    type="button"
                    onClick={() => updateHour(day, isClosed ? "08:00-17:00" : "Closed")}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
                      !isClosed ? "bg-emerald-500" : "bg-stone-300"
                    }`}
                    title={isClosed ? "Mark as open" : "Mark as closed"}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                        !isClosed ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* Section 4: Social Links                             */}
      {/* ═══════════════════════════════════════════════════ */}
      <Section
        id="social"
        icon="🔗"
        iconBg="bg-purple-50"
        title="Social & Links"
        subtitle="Connect your socials — builds buyer confidence"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Instagram */}
          <div className="space-y-2">
            <Label htmlFor="instagram" className="flex items-center gap-2 text-sm font-medium">
              <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </span>
              Instagram
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-stone-400 font-medium">@</span>
              <Input
                id="instagram"
                name="instagram"
                defaultValue={initialData.instagram ?? ""}
                placeholder="yourshop"
                className="rounded-xl h-11 pl-8 border-stone-200 focus:border-pink-400 focus:ring-pink-400/20 transition-all"
                disabled={isPending}
              />
            </div>
          </div>

          {/* TikTok */}
          <div className="space-y-2">
            <Label htmlFor="tiktok" className="flex items-center gap-2 text-sm font-medium">
              <span className="w-6 h-6 rounded-lg bg-black flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.52a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.43v-7.15a8.16 8.16 0 005.58 2.2V11.2a4.85 4.85 0 01-3.77-1.84V6.69h3.77z" />
                </svg>
              </span>
              TikTok
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-stone-400 font-medium">@</span>
              <Input
                id="tiktok"
                name="tiktok"
                defaultValue={initialData.tiktok ?? ""}
                placeholder="yourshop"
                className="rounded-xl h-11 pl-8 border-stone-200 focus:border-stone-400 focus:ring-stone-400/20 transition-all"
                disabled={isPending}
              />
            </div>
          </div>

          {/* Facebook */}
          <div className="space-y-2">
            <Label htmlFor="facebook" className="flex items-center gap-2 text-sm font-medium">
              <span className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </span>
              Facebook
            </Label>
            <Input
              id="facebook"
              name="facebook"
              defaultValue={initialData.facebook ?? ""}
              placeholder="facebook.com/yourshop"
              className="rounded-xl h-11 border-stone-200 focus:border-blue-400 focus:ring-blue-400/20 transition-all"
              disabled={isPending}
            />
          </div>

          {/* Website */}
          <div className="space-y-2">
            <Label htmlFor="website" className="flex items-center gap-2 text-sm font-medium">
              <span className="w-6 h-6 rounded-lg bg-stone-700 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                </svg>
              </span>
              Website
            </Label>
            <Input
              id="website"
              name="website"
              defaultValue={initialData.website ?? ""}
              placeholder="https://yourshop.co.za"
              className="rounded-xl h-11 border-stone-200 focus:border-stone-400 focus:ring-stone-400/20 transition-all"
              disabled={isPending}
            />
          </div>
        </div>
      </Section>

      {/* ── Floating Save Bar ────────────────────────────── */}
      <div className="sticky bottom-4 z-40">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-stone-200/80 shadow-xl shadow-stone-200/30 px-5 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-stone-500 min-w-0">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
            <span className="truncate">Make changes above, then save</span>
          </div>
          <Button
            type="submit"
            disabled={isPending}
            className="rounded-xl px-6 sm:px-8 h-11 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold shadow-lg shadow-emerald-200/50 hover:shadow-emerald-300/50 transition-all active:scale-[0.98] flex-shrink-0"
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Save Changes
              </span>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
