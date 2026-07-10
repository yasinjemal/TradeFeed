// ============================================================
// TfCreateShop — one-question-per-screen shop onboarding
// ============================================================
// TF-language rebuild of the create-shop flow (design/design-
// decisions.md D7, concept 7601abf9): three steps, progress
// dots, live URL preview, reassurance at the commitment point.
//
// All inputs stay mounted (hidden steps use `hidden`) so the
// single <form> always submits complete FormData to the same
// createShopAction the legacy form uses. Server field errors
// jump the user back to the step that owns the field.
// ============================================================

"use client";

import * as React from "react";
import Link from "next/link";
import { useActionState } from "react";
import { ArrowLeft, ArrowRight, Check, Link2, Loader2 } from "lucide-react";

import { createShopAction } from "@/app/actions/shop";
import { TfButton } from "@/components/tf/button";
import { TradeFeedLogo } from "@/components/ui/tradefeed-logo";
import {
  SA_PROVINCES,
  CITY_PROVINCE_MAP,
} from "@/lib/validation/shop-settings";

const INPUT =
  "w-full min-h-12 rounded-[10px] border border-tf-stone-300 bg-tf-raised px-4 text-base text-tf-ink placeholder:text-tf-stone-400 disabled:opacity-50";

const STEP_FIELDS: Record<string, number> = {
  name: 0,
  whatsappNumber: 1,
  city: 2,
  province: 2,
  description: 2,
};

const STEP_INPUT_IDS = ["name", "whatsappNumber", "city"] as const;

function toSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

export interface TfCreateShopProps {
  sellerLabel: string;
}

export function TfCreateShop({ sellerLabel }: TfCreateShopProps) {
  const [state, formAction, isPending] = useActionState(createShopAction, null);

  const [step, setStep] = React.useState(0);
  const [name, setName] = React.useState("");
  const [whatsapp, setWhatsapp] = React.useState("");
  const [city, setCity] = React.useState("");
  const [province, setProvince] = React.useState("");

  const slug = toSlug(name);
  const provinceAutoDetected = CITY_PROVINCE_MAP[city.trim()];

  // When the server returns field errors, jump to the earliest offending step
  React.useEffect(() => {
    if (!state?.fieldErrors) return;
    const steps = Object.keys(state.fieldErrors)
      .map((f) => STEP_FIELDS[f])
      .filter((s): s is number => s !== undefined);
    if (steps.length > 0) setStep(Math.min(...steps));
  }, [state]);

  // Focus the active step's input
  React.useEffect(() => {
    document.getElementById(STEP_INPUT_IDS[step] ?? "")?.focus();
  }, [step]);

  const stepValid = [
    name.trim().length >= 2,
    whatsapp.replace(/\D/g, "").length >= 9,
    city.trim().length >= 2 && province !== "",
  ][step];

  const next = () => {
    if (stepValid && step < 2) setStep(step + 1);
  };

  const handleCityChange = (value: string) => {
    setCity(value);
    const detected = CITY_PROVINCE_MAP[value.trim()];
    if (detected) setProvince(detected);
  };

  return (
    <main className="flex min-h-screen flex-col bg-tf-surface text-tf-ink">
      {/* ── Header ── */}
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <Link href="/" aria-label="TradeFeed home">
          <TradeFeedLogo variant="auto" />
        </Link>
        <span className="text-sm text-tf-stone-500">Step {step + 1} of 3</span>
      </header>

      {/* ── Flow ── */}
      <div className="flex flex-1 items-start justify-center px-6 pt-10 sm:pt-16">
        <form
          action={formAction}
          className="w-full max-w-md"
          onKeyDown={(e) => {
            // Enter advances a step instead of submitting mid-flow
            if (e.key === "Enter" && step < 2 && !(e.target instanceof HTMLTextAreaElement)) {
              e.preventDefault();
              next();
            }
          }}
        >
          {/* Progress dots */}
          <div className="mb-8 flex items-center justify-center gap-2" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={
                  i === step
                    ? "h-2 w-6 rounded-full bg-tf-primary transition-all"
                    : "h-2 w-2 rounded-full bg-tf-stone-300 transition-all"
                }
              />
            ))}
          </div>

          {/* General (non-field) error */}
          {state?.error && !state.fieldErrors && (
            <div
              role="alert"
              className="mb-6 rounded-[10px] border border-tf-error/25 bg-tf-error-soft px-4 py-3 text-sm text-tf-error"
            >
              {state.error}
            </div>
          )}

          {/* ── Step 1 — Shop name ── */}
          <div hidden={step !== 0} className="tf-slide-in-right">
            <h1 className="font-tf-hero text-4xl font-semibold tracking-tight sm:text-5xl">
              What&apos;s your shop called?
            </h1>
            <div className="mt-8 space-y-3">
              <label htmlFor="name" className="sr-only">
                Shop name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="e.g. Thandi's Fashion"
                required
                minLength={2}
                maxLength={100}
                disabled={isPending}
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-describedby={state?.fieldErrors?.name ? "name-error" : "slug-preview"}
                className={INPUT}
              />
              {state?.fieldErrors?.name && (
                <p id="name-error" className="text-sm text-tf-error">
                  {state.fieldErrors.name[0]}
                </p>
              )}
              {slug && (
                <p
                  id="slug-preview"
                  className="flex items-center gap-1.5 text-sm text-tf-primary"
                >
                  <Link2 aria-hidden="true" className="size-4 shrink-0" />
                  tradefeed.co.za/catalog/<span className="font-medium">{slug}</span>
                </p>
              )}
            </div>
          </div>

          {/* ── Step 2 — WhatsApp number ── */}
          <div hidden={step !== 1} className="tf-slide-in-right">
            <h1 className="font-tf-hero text-4xl font-semibold tracking-tight sm:text-5xl">
              Where should orders go?
            </h1>
            <div className="mt-8 space-y-3">
              <label htmlFor="whatsappNumber" className="sr-only">
                WhatsApp number
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base text-tf-stone-500">
                  🇿🇦 +27
                </span>
                <input
                  id="whatsappNumber"
                  name="whatsappNumber"
                  type="tel"
                  inputMode="tel"
                  placeholder="71 234 5678"
                  required
                  disabled={isPending}
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  aria-describedby={
                    state?.fieldErrors?.whatsappNumber ? "whatsapp-error" : "whatsapp-help"
                  }
                  className={`${INPUT} pl-20`}
                />
              </div>
              {state?.fieldErrors?.whatsappNumber && (
                <p id="whatsapp-error" className="text-sm text-tf-error">
                  {state.fieldErrors.whatsappNumber[0]}
                </p>
              )}
              <p id="whatsapp-help" className="text-sm text-tf-stone-500">
                Buyers send their orders to this number on WhatsApp. We never share it.
              </p>
            </div>
          </div>

          {/* ── Step 3 — Location (+ optional description) ── */}
          <div hidden={step !== 2} className="tf-slide-in-right">
            <h1 className="font-tf-hero text-4xl font-semibold tracking-tight sm:text-5xl">
              Where are you based?
            </h1>
            <p className="mt-3 text-sm text-tf-stone-500">
              Local buyers find your shop through your city&apos;s marketplace page.
            </p>
            <div className="mt-8 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="city" className="text-sm font-medium text-tf-stone-600">
                    City / town
                  </label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    list="tf-sa-cities"
                    placeholder="e.g. Johannesburg"
                    required
                    minLength={2}
                    maxLength={100}
                    disabled={isPending}
                    value={city}
                    onChange={(e) => handleCityChange(e.target.value)}
                    className={INPUT}
                  />
                  <datalist id="tf-sa-cities">
                    {Object.keys(CITY_PROVINCE_MAP).map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                  {state?.fieldErrors?.city && (
                    <p className="text-sm text-tf-error">{state.fieldErrors.city[0]}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="province" className="text-sm font-medium text-tf-stone-600">
                    Province
                  </label>
                  <select
                    id="province"
                    name="province"
                    required
                    disabled={isPending}
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    className={INPUT}
                  >
                    <option value="">Select province…</option>
                    {SA_PROVINCES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                  {state?.fieldErrors?.province && (
                    <p className="text-sm text-tf-error">{state.fieldErrors.province[0]}</p>
                  )}
                </div>
              </div>
              {provinceAutoDetected && province === provinceAutoDetected && (
                <p className="flex items-center gap-1.5 text-sm text-tf-primary">
                  <Check aria-hidden="true" className="size-4" /> Province detected from your city
                </p>
              )}
              <div className="space-y-1.5">
                <label htmlFor="description" className="text-sm font-medium text-tf-stone-600">
                  One line about your shop <span className="text-tf-stone-400">(optional)</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  placeholder="e.g. Quality clothing at wholesale prices, based in Jeppe."
                  maxLength={500}
                  rows={2}
                  disabled={isPending}
                  className={`${INPUT} resize-none py-3`}
                />
                {state?.fieldErrors?.description && (
                  <p className="text-sm text-tf-error">{state.fieldErrors.description[0]}</p>
                )}
              </div>
            </div>
          </div>

          {/* ── Actions ── */}
          <div className="mt-10 flex items-center gap-3">
            {step > 0 && (
              <TfButton
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setStep(step - 1)}
                disabled={isPending}
                aria-label="Back"
              >
                <ArrowLeft aria-hidden="true" />
              </TfButton>
            )}
            {step < 2 ? (
              <TfButton type="button" size="lg" fullWidth onClick={next} disabled={!stepValid}>
                Continue <ArrowRight aria-hidden="true" className="size-4" />
              </TfButton>
            ) : (
              <TfButton type="submit" size="lg" fullWidth disabled={isPending || !stepValid}>
                {isPending ? (
                  <>
                    <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                    Setting up your shop…
                  </>
                ) : (
                  "Create my shop"
                )}
              </TfButton>
            )}
          </div>

          <p className="mt-4 text-center text-sm text-tf-stone-500">
            Free · no card needed · under 3 minutes
          </p>
        </form>
      </div>

      {/* ── Quiet social proof ── */}
      <footer className="px-6 py-6 text-center text-xs text-tf-stone-400">
        Trusted by {sellerLabel} · You can change everything later from your dashboard
      </footer>
    </main>
  );
}
