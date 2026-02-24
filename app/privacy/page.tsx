// ============================================================
// Privacy Policy — /privacy
// ============================================================
// POPIA-compliant privacy policy for TradeFeed.
// Required before public launch in South Africa.
// ============================================================

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — TradeFeed",
  description: "TradeFeed privacy policy. How we collect, use, and protect your personal information in compliance with POPIA.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* ── Header ───────────────────────────────────────── */}
      <div className="bg-stone-50 border-b border-stone-200">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <Link
            href="/"
            className="text-sm text-stone-500 hover:text-stone-700 transition-colors mb-4 inline-block"
          >
            ← Back to TradeFeed
          </Link>
          <h1 className="text-3xl font-bold text-stone-900">Privacy Policy</h1>
          <p className="text-stone-500 text-sm mt-2">
            Last updated: February 2026
          </p>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="prose prose-stone prose-sm max-w-none space-y-8">
          {/* 1 */}
          <section>
            <h2 className="text-xl font-semibold text-stone-900">1. Introduction</h2>
            <p className="text-stone-600 leading-relaxed">
              TradeFeed (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) operates the TradeFeed platform
              (tradefeed.co.za), a digital catalog service for South African clothing wholesalers and
              retailers. We are committed to protecting your personal information in compliance with
              the Protection of Personal Information Act, 2013 (POPIA) and other applicable South
              African legislation.
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-xl font-semibold text-stone-900">2. Information We Collect</h2>
            <p className="text-stone-600 leading-relaxed">We collect the following categories of personal information:</p>
            <ul className="list-disc pl-5 text-stone-600 space-y-1">
              <li>
                <strong>Account Information:</strong> Name, email address, and profile image when
                you sign up via our authentication provider (Clerk).
              </li>
              <li>
                <strong>Shop Information:</strong> Business name, WhatsApp number, address, city,
                province, GPS coordinates, business hours, and social media handles.
              </li>
              <li>
                <strong>Product Data:</strong> Product names, descriptions, images, prices, and
                variant information uploaded by sellers.
              </li>
              <li>
                <strong>Usage Analytics:</strong> Anonymised page views, product views, and
                WhatsApp click counts. We do not track individual buyer identities.
              </li>
              <li>
                <strong>Payment Information:</strong> Billing is processed by PayFast (a South
                African payment gateway). We do not store credit card details — PayFast handles
                all payment data securely.
              </li>
            </ul>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-xl font-semibold text-stone-900">3. How We Use Your Information</h2>
            <p className="text-stone-600 leading-relaxed">We process your personal information for the following purposes:</p>
            <ul className="list-disc pl-5 text-stone-600 space-y-1">
              <li>To create and manage your seller account and shop profile.</li>
              <li>To display your public catalog to potential buyers.</li>
              <li>To facilitate WhatsApp communication between buyers and sellers.</li>
              <li>To provide analytics about your catalog performance.</li>
              <li>To process subscription payments via PayFast.</li>
              <li>To send service-related communications (no marketing without consent).</li>
              <li>To improve our platform and fix technical issues.</li>
            </ul>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-xl font-semibold text-stone-900">4. Legal Basis for Processing (POPIA)</h2>
            <p className="text-stone-600 leading-relaxed">
              Under POPIA, we process your personal information based on:
            </p>
            <ul className="list-disc pl-5 text-stone-600 space-y-1">
              <li>
                <strong>Consent:</strong> You provide consent when creating an account and
                setting up your shop.
              </li>
              <li>
                <strong>Contract:</strong> Processing is necessary to provide our catalog
                services to you.
              </li>
              <li>
                <strong>Legitimate Interest:</strong> Anonymised analytics to improve the
                platform.
              </li>
            </ul>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-xl font-semibold text-stone-900">5. Data Sharing</h2>
            <p className="text-stone-600 leading-relaxed">
              We do not sell your personal information. We share data only with:
            </p>
            <ul className="list-disc pl-5 text-stone-600 space-y-1">
              <li>
                <strong>Clerk:</strong> Authentication provider (stores account credentials securely).
              </li>
              <li>
                <strong>PayFast:</strong> Payment processor for subscription billing.
              </li>
              <li>
                <strong>Uploadthing:</strong> Image hosting service for product photos.
              </li>
              <li>
                <strong>Neon:</strong> Database hosting provider (PostgreSQL).
              </li>
            </ul>
            <p className="text-stone-600 leading-relaxed">
              All service providers are bound by data protection agreements. Your shop&apos;s public
              catalog information (shop name, products, WhatsApp number) is intentionally made public
              as this is the core service — connecting buyers with sellers.
            </p>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-xl font-semibold text-stone-900">6. Data Retention</h2>
            <p className="text-stone-600 leading-relaxed">
              We retain your personal information for as long as your account is active. If you
              delete your account, we will remove your personal data within 30 days, except where
              retention is required by law (e.g., financial records for SARS compliance).
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-xl font-semibold text-stone-900">7. Your Rights Under POPIA</h2>
            <p className="text-stone-600 leading-relaxed">You have the right to:</p>
            <ul className="list-disc pl-5 text-stone-600 space-y-1">
              <li>
                <strong>Access:</strong> Request a copy of your personal information.
              </li>
              <li>
                <strong>Correction:</strong> Request correction of inaccurate information.
              </li>
              <li>
                <strong>Deletion:</strong> Request deletion of your personal information.
              </li>
              <li>
                <strong>Objection:</strong> Object to the processing of your information.
              </li>
              <li>
                <strong>Portability:</strong> Request your data in a machine-readable format.
              </li>
            </ul>
            <p className="text-stone-600 leading-relaxed">
              To exercise any of these rights, contact us at{" "}
              <a href="mailto:privacy@tradefeed.co.za" className="text-emerald-600 hover:underline">
                privacy@tradefeed.co.za
              </a>
              . We will respond within 30 days.
            </p>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-xl font-semibold text-stone-900">8. Cookies & Analytics</h2>
            <p className="text-stone-600 leading-relaxed">
              TradeFeed uses essential cookies for authentication (Clerk session management). We
              use anonymised, first-party analytics to track catalog page views and WhatsApp click
              counts — no third-party tracking scripts (no Google Analytics, no Facebook Pixel).
              We do not track individual buyers across sessions.
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-xl font-semibold text-stone-900">9. Security</h2>
            <p className="text-stone-600 leading-relaxed">
              We implement appropriate technical and organisational measures to protect your
              personal information, including: encrypted database connections (TLS), secure
              authentication via Clerk, HTTPS-only access, and role-based access controls.
            </p>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-xl font-semibold text-stone-900">10. Information Officer</h2>
            <p className="text-stone-600 leading-relaxed">
              Our Information Officer can be contacted at:{" "}
              <a href="mailto:privacy@tradefeed.co.za" className="text-emerald-600 hover:underline">
                privacy@tradefeed.co.za
              </a>
            </p>
            <p className="text-stone-600 leading-relaxed">
              If you are not satisfied with our response, you have the right to lodge a complaint
              with the Information Regulator of South Africa at{" "}
              <a
                href="https://inforegulator.org.za"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 hover:underline"
              >
                inforegulator.org.za
              </a>
              .
            </p>
          </section>

          {/* 11 */}
          <section>
            <h2 className="text-xl font-semibold text-stone-900">11. Changes to This Policy</h2>
            <p className="text-stone-600 leading-relaxed">
              We may update this privacy policy from time to time. We will notify registered users
              of material changes via email. The &ldquo;Last updated&rdquo; date at the top of
              this page indicates when the policy was last revised.
            </p>
          </section>
        </div>

        {/* ── Footer links ───────────────────────────────── */}
        <div className="mt-12 pt-8 border-t border-stone-200 flex flex-wrap gap-4 text-sm text-stone-500">
          <Link href="/terms" className="hover:text-emerald-600 transition-colors">
            Terms of Service →
          </Link>
          <Link href="/" className="hover:text-emerald-600 transition-colors">
            Back to TradeFeed →
          </Link>
        </div>
      </div>
    </main>
  );
}
