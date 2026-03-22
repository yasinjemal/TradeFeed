"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { requestWhatsappMagicLink } from "@/app/actions/auth";

export default function WhatsAppLoginPage() {
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");

  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">(
    urlError ? "error" : "idle"
  );
  const [errorMessage, setErrorMessage] = useState(urlError ?? "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    const result = await requestWhatsappMagicLink(phone);

    if (result.success) {
      setStatus("sent");
    } else {
      setStatus("error");
      setErrorMessage(result.error ?? "Something went wrong.");
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo / branding */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center shadow-lg shadow-blue-600/20 mx-auto">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
              </svg>
            </div>
          </Link>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Sign in with WhatsApp
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            We&apos;ll send a magic login link to your WhatsApp — no password needed.
          </p>
        </div>

        {status === "sent" ? (
          /* ── Success state ────────────────────────────── */
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-1">
              Check your WhatsApp!
            </h2>
            <p className="text-sm text-slate-600 mb-4">
              We sent a login link to <span className="font-semibold">{phone}</span>. Tap it to sign in — it expires in 5 minutes.
            </p>
            <button
              onClick={() => { setStatus("idle"); setPhone(""); }}
              className="text-sm text-blue-600 hover:text-blue-500 font-medium transition-colors"
            >
              Didn&apos;t get it? Try a different number →
            </button>
          </div>
        ) : (
          /* ── Form state ───────────────────────────────── */
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                WhatsApp Number
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <span className="text-slate-400 text-sm">🇿🇦</span>
                </div>
                <input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="082 123 4567"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (status === "error") setStatus("idle");
                  }}
                  className="block w-full rounded-xl border border-slate-300 bg-white py-3 pl-12 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                  required
                  disabled={status === "loading"}
                />
              </div>
              {status === "error" && errorMessage && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1.5">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                  </svg>
                  {errorMessage}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={status === "loading" || !phone.trim()}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            >
              {status === "loading" ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Sending…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.553 4.125 1.521 5.861L0 24l6.335-1.66A11.938 11.938 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.82a9.787 9.787 0 0 1-5.16-1.46l-.37-.22-3.835 1.005 1.023-3.735-.24-.382A9.78 9.78 0 0 1 2.18 12c0-5.414 4.406-9.82 9.82-9.82 5.414 0 9.82 4.406 9.82 9.82 0 5.414-4.406 9.82-9.82 9.82z" />
                  </svg>
                  Send Magic Link
                </>
              )}
            </button>
          </form>
        )}

        {/* Divider + email fallback */}
        <div className="mt-6 flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs text-slate-400">or</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        <Link
          href="/sign-in"
          className="mt-4 block w-full text-center rounded-xl border border-slate-300 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all"
        >
          Sign in with Email
        </Link>

        <p className="mt-6 text-center text-xs text-slate-400">
          Don&apos;t have an account?{" "}
          <Link href="/sign-up" className="text-blue-600 hover:text-blue-500 font-medium">
            Start selling free →
          </Link>
        </p>
      </div>
    </div>
  );
}
