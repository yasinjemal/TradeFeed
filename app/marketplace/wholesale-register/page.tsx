import type { Metadata } from "next";
import { WholesaleRegisterForm } from "@/components/marketplace/wholesale-register-form";

export const metadata: Metadata = {
  title: "Register as a Wholesale Buyer | TradeFeed",
  description:
    "Apply to become a verified wholesale buyer on TradeFeed. Get access to wholesale pricing, bulk discounts, and direct supplier relationships.",
};

export default function WholesaleRegisterPage() {
  return (
    <div className="min-h-screen bg-stone-950">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:py-20">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/20 px-4 py-1.5 mb-4">
            <span className="text-amber-400 text-sm font-semibold">🏭 B2B Wholesale</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Register as a Wholesale Buyer
          </h1>
          <p className="mt-3 text-stone-400 text-sm sm:text-base max-w-lg mx-auto">
            Get access to wholesale pricing, bulk discounts, and connect directly
            with suppliers across South Africa.
          </p>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[
            { emoji: "💰", title: "Wholesale Prices", desc: "Lower per-unit costs for bulk orders" },
            { emoji: "📦", title: "Bulk Discounts", desc: "Volume-based pricing tiers" },
            { emoji: "🤝", title: "Direct Access", desc: "Connect with verified suppliers" },
          ].map((b) => (
            <div
              key={b.title}
              className="rounded-xl border border-stone-800 bg-stone-900/50 p-4 text-center"
            >
              <span className="text-2xl">{b.emoji}</span>
              <p className="text-sm font-semibold text-white mt-2">{b.title}</p>
              <p className="text-xs text-stone-400 mt-1">{b.desc}</p>
            </div>
          ))}
        </div>

        {/* Registration Form */}
        <div className="rounded-2xl border border-stone-800 bg-stone-900/80 p-6 sm:p-8">
          <WholesaleRegisterForm />
        </div>

        {/* Process info */}
        <div className="mt-8 text-center text-xs text-stone-500 space-y-1">
          <p>Applications are reviewed within 24-48 hours.</p>
          <p>You&apos;ll receive a WhatsApp notification when approved.</p>
        </div>
      </div>
    </div>
  );
}
