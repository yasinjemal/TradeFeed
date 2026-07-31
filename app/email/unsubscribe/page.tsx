import type { Metadata } from "next";
import Link from "next/link";

import { TradeFeedLogo } from "@/components/ui/tradefeed-logo";
import {
  getEmailMarketingHmacSecret,
} from "@/lib/email/marketing-unsubscribe";
import { verifyMarketingUnsubscribeToken } from "@/lib/email/marketing-preferences";

import { UnsubscribeForm } from "./unsubscribe-form";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Email preferences | TradeFeed",
  description: "Manage TradeFeed product-news email preferences.",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

interface UnsubscribePageProps {
  searchParams: Promise<{
    token?: string | string[];
  }>;
}

export default async function UnsubscribePage({
  searchParams,
}: UnsubscribePageProps) {
  const params = await searchParams;
  const token =
    typeof params.token === "string" && params.token.length <= 512
      ? params.token
      : null;
  const secret = getEmailMarketingHmacSecret();

  let isValid = false;
  if (token && secret) {
    try {
      isValid =
        verifyMarketingUnsubscribeToken(token, secret) !== null;
    } catch {
      isValid = false;
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#071a0f] px-4 py-10 sm:py-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 18% 18%, rgba(16,185,129,.20), transparent 34%), radial-gradient(circle at 82% 74%, rgba(34,211,238,.10), transparent 32%)",
        }}
      />

      <div className="relative mx-auto w-full max-w-xl">
        <Link href="/" className="inline-flex" aria-label="TradeFeed home">
          <TradeFeedLogo size="lg" variant="light" />
        </Link>

        <section className="mt-8 rounded-3xl bg-white p-6 shadow-2xl shadow-black/25 sm:p-9">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
            Email preferences
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-stone-950 sm:text-4xl">
            Your inbox, your choice.
          </h1>
          <p className="mt-3 text-sm leading-6 text-stone-600">
            TradeFeed makes it straightforward to stop marketing emails
            without changing your shop or account.
          </p>

          <div className="mt-8">
            {isValid && token ? (
              <UnsubscribeForm token={token} />
            ) : (
              <div
                className="rounded-2xl border border-amber-200 bg-amber-50 p-6"
                role="alert"
              >
                <span
                  aria-hidden="true"
                  className="flex size-11 items-center justify-center rounded-full bg-amber-100 text-xl text-amber-800"
                >
                  !
                </span>
                <h2 className="mt-4 text-lg font-bold text-stone-900">
                  We couldn&apos;t verify this link
                </h2>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  No preference was changed. The link may be incomplete, or
                  this service may be temporarily unavailable. Try the link
                  from the original email again, or contact{" "}
                  <a
                    className="font-semibold text-emerald-700 underline"
                    href="mailto:privacy@tradefeed.co.za"
                  >
                    privacy@tradefeed.co.za
                  </a>
                  .
                </p>
              </div>
            )}
          </div>

          <div className="mt-8 border-t border-stone-200 pt-5 text-xs leading-5 text-stone-500">
            <p>
              This page never displays your email address. Opening it alone
              does not change your preference.
            </p>
            <Link
              href="/privacy"
              className="mt-2 inline-block font-semibold text-emerald-700 hover:underline"
            >
              Read our privacy policy
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
