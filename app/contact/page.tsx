// ============================================================
// Contact / Help Center — /contact
// ============================================================
// Public-facing contact page with email, WhatsApp support link,
// and quick FAQ for common questions. Builds trust with prospective
// sellers and buyers who want to reach a human before signing up.
// ============================================================

import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { SeoPageShell } from "@/components/seo/seo-page";
import { TfHeroFont } from "@/components/tf/tf-fonts";
import { COMPANY } from "@/lib/config/company";

export const metadata: Metadata = {
  // The root layout appends the brand — don't repeat it here.
  title: "Contact & Help",
  description:
    "Get help with TradeFeed. Contact our support team via email or WhatsApp. Find answers to common questions about selling, orders, and your account.",
  alternates: {
    canonical: "https://tradefeed.co.za/contact",
  },
};

const SUPPORT_EMAIL = COMPANY.supportEmail;
const SUPPORT_WHATSAPP = COMPANY.supportWhatsApp;

export default async function ContactPage() {
  const t = await getTranslations("contact");

  const HELP_TOPICS = [
    {icon:"",q:"How do I pay for a product?",a:"Check the payment options on your order. Most orders use payment arranged directly with the seller. Online payment appears only for enabled shops. Confirm delivery costs before paying."},
    { icon: "🛍️", q: t("faq.createShop"), a: t("faq.createShopAnswer") },
    { icon: "📸", q: t("faq.aiListing"), a: t("faq.aiListingAnswer") },
    { icon: "📦", q: t("faq.orders"), a: t("faq.ordersAnswer") },
    { icon: "🔒", q: t("faq.whatsappSafe"), a: t("faq.whatsappSafeAnswer") },
    { icon: "❌", q: t("faq.cancelPro"), a: t("faq.cancelProAnswer") },
  ];

  return (
    // Same header, footer and company details as every other public page.
    <SeoPageShell breadcrumb={{ name: "Contact", path: "/contact" }}>
      <TfHeroFont />
      <h1 className="font-tf-hero font-semibold text-tf-ink" style={{ fontSize: "clamp(2.25rem, 5vw, 3.25rem)", lineHeight: "1.08", letterSpacing: "-0.03em" }}>
        {t("title")}
      </h1>
      <p className="mt-3 max-w-2xl text-lg leading-relaxed text-tf-stone-600">{t("subtitle")}</p>
      <p className="mt-2 flex items-center gap-1.5 text-sm text-tf-stone-600">
        <span aria-hidden="true" className="inline-block size-2 rounded-full bg-tf-primary" />
        {t("responseTime")}
      </p>
      <Link
        href="/support/order"
        className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-tf-primary px-5 font-semibold text-white transition-colors hover:bg-tf-primary-hover"
      >
        Delivery, returns or payment problem? Get order help →
      </Link>

      {/* ── Contact Cards ────────────────────────────────── */}
      <div className="mt-10">
        <div className="grid sm:grid-cols-2 gap-4 mb-12">
          {/* Email */}
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="group flex items-start gap-4 rounded-2xl border border-tf-stone-200 bg-tf-raised p-5 transition-all hover:border-tf-primary/40 hover:shadow-tf-md"
          >
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-tf-verified-soft text-tf-verified group-hover:bg-tf-primary group-hover:text-white transition-colors">
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
              <h2 className="text-base font-bold text-tf-ink">
                {t("emailSupport")}
              </h2>
              <p className="text-sm text-tf-primary font-medium mt-0.5">
                {SUPPORT_EMAIL}
              </p>
              <p className="text-xs text-tf-stone-600 mt-1">
                {t("emailDesc")}
              </p>
            </div>
          </a>

          {/* WhatsApp */}
          <a
            href={`https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent("Hi TradeFeed, I need help with...")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start gap-4 rounded-2xl border border-tf-stone-200 bg-tf-raised p-5 transition-all hover:border-tf-primary/40 hover:shadow-tf-md"
          >
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-tf-verified-soft text-tf-verified group-hover:bg-tf-primary group-hover:text-white transition-colors">
              <svg
                viewBox="0 0 24 24"
                className="h-6 w-6 fill-current"
                aria-hidden="true"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-tf-ink">
                {t("whatsappSupport")}
              </h2>
              <p className="text-sm text-tf-primary font-medium mt-0.5">
                {t("whatsappChat")}
              </p>
              <p className="text-xs text-tf-stone-600 mt-1">
                {t("whatsappDesc")}
              </p>
            </div>
          </a>
        </div>

        {/* ── Help Topics / FAQ ──────────────────────────── */}
        <div>
          <h2 className="text-xl font-bold text-tf-ink mb-1">
            {t("commonQuestions")}
          </h2>
          <p className="text-sm text-tf-stone-600 mb-6">
            {t("commonQuestionsDesc")}
          </p>

          <div className="space-y-3">
            {HELP_TOPICS.map((topic) => (
              <details
                key={topic.q}
                className="group rounded-xl border border-tf-stone-200 bg-tf-raised overflow-hidden transition-all hover:border-tf-stone-300 open:border-tf-primary/40 open:shadow-tf-sm"
              >
                <summary className="flex cursor-pointer items-center gap-3 px-5 py-4 text-sm font-semibold text-tf-ink list-none [&::-webkit-details-marker]:hidden">
                  <span className="text-lg flex-shrink-0">{topic.icon}</span>
                  <span className="flex-1">{topic.q}</span>
                  <svg
                    className="w-4 h-4 text-tf-stone-500 transition-transform group-open:rotate-180"
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
                <div className="px-5 pb-4 text-sm text-tf-stone-600 leading-relaxed border-t border-tf-stone-100 pt-3">
                  {topic.a}
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* ── Still need help? ───────────────────────────── */}
        <div className="mt-12 rounded-2xl border border-tf-stone-200 bg-tf-raised p-6 text-center">
          <h3 className="text-base font-bold text-tf-ink">
            {t("stillNeedHelp")}
          </h3>
          <p className="text-sm text-tf-stone-600 mt-1 mb-4">
            {t("stillNeedHelpDesc")}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="inline-flex items-center gap-2 rounded-xl bg-tf-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-tf-primary-hover transition-all"
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
              {t("emailUs")}
            </a>
            <a
              href={`https://wa.me/${SUPPORT_WHATSAPP}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-tf-raised px-5 py-2.5 text-sm font-semibold text-tf-stone-700 ring-1 ring-tf-stone-200 hover:bg-tf-stone-50 transition-all"
            >
              💬 {t("whatsappUs")}
            </a>
          </div>
        </div>
      </div>
    </SeoPageShell>
  );
}
