// ============================================================
// Terms of Service — /terms
// ============================================================
// Terms of service for TradeFeed platform.
// Covers seller responsibilities, buyer guidelines, and
// acceptable use for the SA wholesale market.
// ============================================================

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — TradeFeed",
  description: "TradeFeed terms of service. Rules and conditions for using our digital catalog platform.",
};

export default function TermsPage() {
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
          <h1 className="text-3xl font-bold text-stone-900">Terms of Service</h1>
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
            <h2 className="text-xl font-semibold text-stone-900">1. Acceptance of Terms</h2>
            <p className="text-stone-600 leading-relaxed">
              By accessing or using TradeFeed (&ldquo;the Platform&rdquo;), you agree to be bound by these
              Terms of Service (&ldquo;Terms&rdquo;). If you do not agree to these Terms, please do not use
              the Platform. TradeFeed is operated in South Africa and governed by South African law.
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-xl font-semibold text-stone-900">2. Description of Service</h2>
            <p className="text-stone-600 leading-relaxed">
              TradeFeed provides a digital catalog platform that enables South African
              wholesalers (&ldquo;Sellers&rdquo;) to create online product catalogs and connect with
              retailers and buyers (&ldquo;Buyers&rdquo;) via WhatsApp. TradeFeed is a catalog and
              communication tool — we do not process orders, handle payments between buyers and
              sellers, or guarantee transactions.
            </p>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-xl font-semibold text-stone-900">3. Seller Responsibilities</h2>
            <p className="text-stone-600 leading-relaxed">As a Seller on TradeFeed, you agree to:</p>
            <ul className="list-disc pl-5 text-stone-600 space-y-1">
              <li>Provide accurate and truthful product information (names, descriptions, prices, stock).</li>
              <li>Only list products that you are legally entitled to sell.</li>
              <li>Respond to buyer enquiries made via WhatsApp in a timely manner.</li>
              <li>Not use the platform for illegal goods, counterfeit products, or prohibited items.</li>
              <li>Comply with the Consumer Protection Act (CPA) and all applicable SA trading regulations.</li>
              <li>Keep your WhatsApp number active and reachable during listed business hours.</li>
              <li>Not misrepresent product quality, origin, or availability.</li>
            </ul>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-xl font-semibold text-stone-900">4. Buyer Guidelines</h2>
            <p className="text-stone-600 leading-relaxed">As a Buyer browsing TradeFeed catalogs:</p>
            <ul className="list-disc pl-5 text-stone-600 space-y-1">
              <li>
                All transactions occur directly between you and the Seller via WhatsApp.
                TradeFeed is not a party to any transaction.
              </li>
              <li>
                Verify product details, pricing, and availability directly with the Seller
                before placing orders.
              </li>
              <li>
                TradeFeed does not guarantee the quality, authenticity, or delivery of any
                products listed on the platform.
              </li>
            </ul>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-xl font-semibold text-stone-900">5. Subscription Plans & Billing</h2>
            <p className="text-stone-600 leading-relaxed">
              TradeFeed offers subscription plans for Sellers:
            </p>
            <ul className="list-disc pl-5 text-stone-600 space-y-1">
              <li>
                <strong>Free Plan:</strong> Limited to 10 products. No payment required.
              </li>
              <li>
                <strong>Pro Plan:</strong> Unlimited products. Billed monthly at the listed
                price via PayFast.
              </li>
            </ul>
            <p className="text-stone-600 leading-relaxed">
              Subscription payments are processed by PayFast (Pty) Ltd. By subscribing, you
              agree to PayFast&apos;s terms and conditions. Subscriptions renew automatically
              unless cancelled before the billing date. Refunds are handled on a case-by-case
              basis — contact support for refund requests.
            </p>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-xl font-semibold text-stone-900">6. Prohibited Content</h2>
            <p className="text-stone-600 leading-relaxed">
              You may not use TradeFeed to list or promote:
            </p>
            <ul className="list-disc pl-5 text-stone-600 space-y-1">
              <li>Counterfeit or stolen goods.</li>
              <li>Products that infringe intellectual property rights.</li>
              <li>Illegal substances or prohibited items under SA law.</li>
              <li>Misleading or fraudulent product listings.</li>
              <li>Content that is hateful, discriminatory, or harmful.</li>
            </ul>
            <p className="text-stone-600 leading-relaxed">
              TradeFeed reserves the right to remove any content and deactivate any shop that
              violates these terms, without prior notice.
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-xl font-semibold text-stone-900">7. Seller Verification</h2>
            <p className="text-stone-600 leading-relaxed">
              TradeFeed may offer a &ldquo;Verified Seller&rdquo; badge to shops that meet our verification
              criteria. Verification indicates that TradeFeed has confirmed basic information about
              the seller — it does not constitute an endorsement or guarantee of the seller&apos;s
              products, pricing, or reliability.
            </p>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-xl font-semibold text-stone-900">8. Intellectual Property</h2>
            <p className="text-stone-600 leading-relaxed">
              Sellers retain ownership of their product listings, images, and content. By uploading
              content to TradeFeed, you grant us a non-exclusive, royalty-free licence to display
              your content on the platform for the purpose of providing our services. The TradeFeed
              brand, logo, and platform design are our intellectual property.
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-xl font-semibold text-stone-900">9. Limitation of Liability</h2>
            <p className="text-stone-600 leading-relaxed">
              TradeFeed is provided &ldquo;as is&rdquo; without warranties of any kind. To the maximum
              extent permitted by South African law:
            </p>
            <ul className="list-disc pl-5 text-stone-600 space-y-1">
              <li>
                We are not liable for any disputes between Buyers and Sellers.
              </li>
              <li>
                We are not liable for loss of revenue, data, or profits arising from use of
                the platform.
              </li>
              <li>
                Our total liability to you shall not exceed the amount you paid to TradeFeed
                in the 12 months preceding the claim.
              </li>
            </ul>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-xl font-semibold text-stone-900">10. Account Termination</h2>
            <p className="text-stone-600 leading-relaxed">
              We may suspend or terminate your account if you violate these Terms. You may delete
              your account at any time by contacting{" "}
              <a href="mailto:support@tradefeed.co.za" className="text-emerald-600 hover:underline">
                support@tradefeed.co.za
              </a>
              . Upon termination, your shop and all associated data will be permanently deleted
              within 30 days, subject to legal retention requirements.
            </p>
          </section>

          {/* 11 */}
          <section>
            <h2 className="text-xl font-semibold text-stone-900">11. Governing Law</h2>
            <p className="text-stone-600 leading-relaxed">
              These Terms are governed by the laws of the Republic of South Africa. Any disputes
              shall be resolved in the courts of the Republic of South Africa, in the jurisdiction
              of the Gauteng Division.
            </p>
          </section>

          {/* 12 */}
          <section>
            <h2 className="text-xl font-semibold text-stone-900">12. Contact</h2>
            <p className="text-stone-600 leading-relaxed">
              For questions about these Terms, contact us at:{" "}
              <a href="mailto:support@tradefeed.co.za" className="text-emerald-600 hover:underline">
                support@tradefeed.co.za
              </a>
            </p>
          </section>
        </div>

        {/* ── Footer links ───────────────────────────────── */}
        <div className="mt-12 pt-8 border-t border-stone-200 flex flex-wrap gap-4 text-sm text-stone-500">
          <Link href="/privacy" className="hover:text-emerald-600 transition-colors">
            Privacy Policy →
          </Link>
          <Link href="/" className="hover:text-emerald-600 transition-colors">
            Back to TradeFeed →
          </Link>
        </div>
      </div>
    </main>
  );
}
