// ============================================================
// Component — Upgrade Form (Seller)
// ============================================================
// Multi-step upgrade form: select plan → select payment method
// → enter reference → optional proof upload → submit.
// ============================================================

"use client";

import { useState, useTransition } from "react";
import { submitUpgradeRequestAction } from "@/app/actions/manual-upgrade";

interface Plan {
  id: string;
  name: string;
  slug: string;
  priceInCents: number;
  productLimit: number;
  features: string | null;
}

interface PaymentMethod {
  id: string;
  name: string;
  description: string | null;
  instructions: string;
}

interface UpgradeFormProps {
  shopSlug: string;
  plans: Plan[];
  paymentMethods: PaymentMethod[];
  defaultPlanSlug: string;
  currentPlanName: string;
}

export function UpgradeForm({
  shopSlug,
  plans,
  paymentMethods,
  defaultPlanSlug,
  currentPlanName,
}: UpgradeFormProps) {
  const [selectedPlan, setSelectedPlan] = useState(defaultPlanSlug);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [paymentRef, setPaymentRef] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const plan = plans.find((p) => p.slug === selectedPlan);
  const method = paymentMethods.find((m) => m.id === selectedMethod);

  const handleSubmit = () => {
    if (!selectedPlan || !selectedMethod || !paymentRef.trim()) {
      setError("Please fill in all required fields.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await submitUpgradeRequestAction(shopSlug, {
        requestedPlanSlug: selectedPlan,
        manualPaymentMethod: method?.name ?? "",
        paymentReference: paymentRef.trim(),
        proofOfPaymentUrl: proofUrl.trim() || undefined,
      });

      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error ?? "Something went wrong.");
      }
    });
  };

  // ── Success screen ──────────────────────────────────
  if (success) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-emerald-800">Request Submitted!</h2>
        <p className="text-sm text-emerald-700 mt-2 max-w-sm mx-auto">
          Your upgrade request has been submitted for review. We&apos;ll verify your payment and activate
          your <span className="font-semibold">{plan?.name}</span> plan within 24 hours.
        </p>
        <div className="mt-6 p-4 bg-white/60 rounded-xl text-left text-xs text-emerald-700 space-y-1.5 max-w-xs mx-auto">
          <p><span className="font-medium text-emerald-800">Plan:</span> {plan?.name}</p>
          <p><span className="font-medium text-emerald-800">Payment:</span> {method?.name}</p>
          <p><span className="font-medium text-emerald-800">Reference:</span> {paymentRef}</p>
        </div>
        <a
          href={`/dashboard/${shopSlug}/billing`}
          className="inline-block mt-6 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition-colors"
        >
          Back to Billing
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Step 1: Select Plan ───────────────────────────── */}
      <div className="bg-white border border-stone-200/60 rounded-2xl p-6">
        <h2 className="text-sm font-bold text-stone-800 mb-1">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold mr-2">1</span>
          Select Plan
        </h2>
        <p className="text-xs text-stone-500 mb-4 ml-7">
          You&apos;re currently on <span className="font-medium">{currentPlanName}</span>. Choose your upgrade:
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          {plans.map((p) => {
            const features: string[] = p.features ? JSON.parse(p.features) as string[] : [];
            const isSelected = selectedPlan === p.slug;

            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedPlan(p.slug)}
                className={`text-left p-4 rounded-xl border-2 transition-all ${
                  isSelected
                    ? "border-emerald-500 bg-emerald-50/50 shadow-sm"
                    : "border-stone-200 hover:border-stone-300"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-stone-900">{p.name}</h3>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    isSelected ? "border-emerald-500 bg-emerald-500" : "border-stone-300"
                  }`}>
                    {isSelected && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
                  </div>
                </div>
                <p className="text-lg font-bold text-stone-900">
                  R{(p.priceInCents / 100).toFixed(0)}
                  <span className="text-xs font-normal text-stone-400 ml-1">/month</span>
                </p>
                {features.length > 0 && (
                  <ul className="mt-3 space-y-1">
                    {features.slice(0, 4).map((f) => (
                      <li key={f} className="flex items-center gap-1.5 text-[11px] text-stone-600">
                        <svg className="w-3 h-3 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        {f}
                      </li>
                    ))}
                    {features.length > 4 && (
                      <li className="text-[11px] text-stone-400">+{features.length - 4} more</li>
                    )}
                  </ul>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Step 2: Select Payment Method ─────────────────── */}
      <div className="bg-white border border-stone-200/60 rounded-2xl p-6">
        <h2 className="text-sm font-bold text-stone-800 mb-1">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold mr-2">2</span>
          Make Payment
        </h2>
        <p className="text-xs text-stone-500 mb-4 ml-7">
          Pay <span className="font-bold text-stone-800">R{plan ? (plan.priceInCents / 100).toFixed(0) : "—"}</span> using
          one of the methods below, then enter your reference.
        </p>

        <div className="space-y-3">
          {paymentMethods.map((pm) => {
            const isSelected = selectedMethod === pm.id;
            return (
              <div key={pm.id}>
                <button
                  type="button"
                  onClick={() => setSelectedMethod(isSelected ? null : pm.id)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-50/30"
                      : "border-stone-200 hover:border-stone-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-stone-900">{pm.name}</h3>
                      {pm.description && (
                        <p className="text-xs text-stone-500 mt-0.5">{pm.description}</p>
                      )}
                    </div>
                    <svg
                      className={`w-4 h-4 text-stone-400 transition-transform ${isSelected ? "rotate-180" : ""}`}
                      fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </div>
                </button>
                {isSelected && (
                  <div className="mt-2 ml-4 p-4 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-600 leading-relaxed whitespace-pre-wrap">
                    {pm.instructions}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Step 3: Enter Reference ───────────────────────── */}
      <div className="bg-white border border-stone-200/60 rounded-2xl p-6">
        <h2 className="text-sm font-bold text-stone-800 mb-1">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold mr-2">3</span>
          Payment Details
        </h2>
        <p className="text-xs text-stone-500 mb-4 ml-7">
          Enter the reference from your payment so we can verify it.
        </p>

        <div className="space-y-4 ml-7">
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1.5">
              Payment Reference <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={paymentRef}
              onChange={(e) => setPaymentRef(e.target.value)}
              placeholder="e.g. TF-20250301-1234 or bank reference"
              className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1.5">
              Proof of Payment URL <span className="text-stone-400">(optional)</span>
            </label>
            <input
              type="url"
              value={proofUrl}
              onChange={(e) => setProofUrl(e.target.value)}
              placeholder="Paste a link to your payment screenshot"
              className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40"
            />
            <p className="text-[10px] text-stone-400 mt-1">
              Upload your proof screenshot to any image host and paste the URL here.
            </p>
          </div>
        </div>
      </div>

      {/* ── Error ─────────────────────────────────────────── */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ── Submit ────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <a
          href={`/dashboard/${shopSlug}/billing`}
          className="text-sm text-stone-500 hover:text-stone-700 transition-colors"
        >
          Cancel
        </a>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending || !selectedPlan || !selectedMethod || !paymentRef.trim()}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-600/20 hover:shadow-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
        >
          {isPending ? (
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Submitting...
            </span>
          ) : (
            "Submit Upgrade Request"
          )}
        </button>
      </div>
    </div>
  );
}
