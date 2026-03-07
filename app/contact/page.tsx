// ============================================================
// Contact / Help Center — /contact
// ============================================================
// Public-facing contact page with email, WhatsApp support link,
// and quick FAQ for common questions. Builds trust with prospective
// sellers and buyers who want to reach a human before signing up.
// ============================================================

import type { Metadata } from "next";
import Link from "next/link";
import { TradeFeedLogo } from "@/components/ui/tradefeed-logo";

export const metadata: Metadata = {
  title: "Contact & Help — TradeFeed",
  description:
    "Get help with TradeFeed. Contact our support team via email or WhatsApp. Find answers to common questions about selling, orders, and your account.",
  alternates: {
    canonical: "https://tradefeed.co.za/contact",
  },
};

const SUPPORT_EMAIL = "support@tradefeed.co.za";
const SUPPORT_WHATSAPP = "27601234567"; // Replace with actual support number

const HELP_TOPICS = [
  {
    icon: "🛍️",
    q: "How do I create a shop?",
    a: 'Click "Start Selling" on the homepage, sign up with your email or Google account, and follow the setup wizard. You\'ll have your catalog link in under 2 minutes.',
  },
  {
    icon: "📸",
    q: "How does AI listing work?",
    a: "Upload a product photo and our AI automatically generates the title, description, category, and suggested price. You can edit anything before publishing. Free plan includes 5 AI listings per month.",
  },
  {
    icon: "💳",
    q: "How do payments work?",
    a: "Subscription payments are processed securely through PayFast — South Africa's most trusted payment gateway. Buyers pay sellers directly via WhatsApp/EFT — TradeFeed does not handle buyer payments.",
  },
  {
    icon: "📦",
    q: "How do orders work?",
    a: "When a buyer taps \"Order on WhatsApp\", a pre-filled message with their cart is sent to your WhatsApp. You confirm the order, arrange payment, and ship. Buyers can track their order status on TradeFeed.",
  },
  {
    icon: "🔒",
    q: "Is my WhatsApp number safe?",
    a: "Yes. Your number is only used to receive orders via WhatsApp's official API. We never share your number with third parties. See our Privacy Policy for full details.",
  },
  {
    icon: "❌",
    q: "How do I cancel my Pro subscription?",
    a: "Go to Dashboard → Billing → Cancel Plan. Your Pro features will remain active until the end of your billing period. You can always downgrade to the free plan.",
  },
];

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* ── Header ───────────────────────────────────────── */}
      <div className="bg-stone-50 border-b border-stone-200">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <Link href="/" className="flex items-center gap-2">
              <TradeFeedLogo size="sm" />
            </Link>
            <Link
              href="/marketplace"
              className="text-sm text-stone-500 hover:text-emerald-600 transition-colors"
            >
              Browse Marketplace →
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-stone-900">
            Contact &amp; Help
          </h1>
          <p className="text-stone-500 text-sm mt-2">
            Get help with your shop, orders, or account. We typically respond
            within a few hours.
          </p>
        </div>
      </div>

      {/* ── Contact Cards ────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="grid sm:grid-cols-2 gap-4 mb-12">
          {/* Email */}
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="group flex items-start gap-4 rounded-2xl border border-stone-200 bg-white p-5 transition-all hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-100/40"
          >
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">
                Email Support
              </h2>
              <p className="text-sm text-emerald-600 font-medium mt-0.5">
                {SUPPORT_EMAIL}
              </p>
              <p className="text-xs text-stone-500 mt-1">
                Best for account issues, billing questions, and detailed
                inquiries. We respond within 24 hours.
              </p>
            </div>
          </a>

          {/* WhatsApp */}
          <a
            href={`https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent("Hi TradeFeed, I need help with...")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start gap-4 rounded-2xl border border-stone-200 bg-white p-5 transition-all hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-100/40"
          >
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <svg
                viewBox="0 0 24 24"
                className="h-6 w-6 fill-current"
                aria-hidden="true"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">
                WhatsApp Support
              </h2>
              <p className="text-sm text-emerald-600 font-medium mt-0.5">
                Chat with us
              </p>
              <p className="text-xs text-stone-500 mt-1">
                Quick questions? Chat with our team on WhatsApp. Available
                Mon–Fri, 8am–5pm SAST.
              </p>
            </div>
          </a>
        </div>

        {/* ── Help Topics / FAQ ──────────────────────────── */}
        <div>
          <h2 className="text-xl font-bold text-stone-900 mb-1">
            Common Questions
          </h2>
          <p className="text-sm text-stone-500 mb-6">
            Quick answers to the most frequently asked questions.
          </p>

          <div className="space-y-3">
            {HELP_TOPICS.map((topic) => (
              <details
                key={topic.q}
                className="group rounded-xl border border-stone-200 bg-white overflow-hidden transition-all hover:border-stone-300 open:border-emerald-200 open:shadow-sm"
              >
                <summary className="flex cursor-pointer items-center gap-3 px-5 py-4 text-sm font-semibold text-stone-800 list-none [&::-webkit-details-marker]:hidden">
                  <span className="text-lg flex-shrink-0">{topic.icon}</span>
                  <span className="flex-1">{topic.q}</span>
                  <svg
                    className="w-4 h-4 text-stone-400 transition-transform group-open:rotate-180"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                    />
                  </svg>
                </summary>
                <div className="px-5 pb-4 text-sm text-stone-600 leading-relaxed border-t border-stone-100 pt-3">
                  {topic.a}
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* ── Still need help? ───────────────────────────── */}
        <div className="mt-12 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 p-6 text-center">
          <h3 className="text-base font-bold text-stone-900">
            Still need help?
          </h3>
          <p className="text-sm text-stone-600 mt-1 mb-4">
            Can&apos;t find what you&apos;re looking for? Our team is happy to
            help.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 transition-all"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
                />
              </svg>
              Email Us
            </a>
            <a
              href={`https://wa.me/${SUPPORT_WHATSAPP}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-stone-700 ring-1 ring-stone-200 hover:bg-stone-50 transition-all"
            >
              💬 WhatsApp Us
            </a>
          </div>
        </div>

        {/* ── Footer nav ─────────────────────────────────── */}
        <div className="mt-12 pt-8 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <div className="flex items-center gap-2">
            <TradeFeedLogo size="sm" />
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="hover:text-stone-700 transition-colors"
            >
              Home
            </Link>
            <Link
              href="/marketplace"
              className="hover:text-stone-700 transition-colors"
            >
              Marketplace
            </Link>
            <Link
              href="/privacy"
              className="hover:text-stone-700 transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="hover:text-stone-700 transition-colors"
            >
              Terms
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
