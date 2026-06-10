// ============================================================
// Buyer Review Page — /review/[token]
// ============================================================
// Landed from the post-delivery WhatsApp message. The token
// proves the buyer placed the order, so the review is marked
// Verified. Mobile-first, server-rendered shell + small client
// form.
// ============================================================

import { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { TradeFeedLogo } from "@/components/ui/tradefeed-logo";
import { VerifiedReviewForm } from "@/components/reviews/verified-review-form";

export const metadata: Metadata = {
  title: "Rate Your Order | TradeFeed",
  description: "Tell other buyers about your experience.",
  robots: { index: false },
};

interface ReviewPageProps {
  params: Promise<{ token: string }>;
}

export default async function ReviewPage({ params }: ReviewPageProps) {
  const { token } = await params;

  const request = await db.reviewRequest.findUnique({
    where: { token },
    select: {
      respondedAt: true,
      order: {
        select: {
          orderNumber: true,
          buyerName: true,
          shop: { select: { name: true, slug: true } },
          items: {
            select: {
              productId: true,
              productName: true,
              option1Value: true,
              option2Value: true,
            },
          },
        },
      },
    },
  });

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <header className="border-b border-stone-800/50 bg-stone-950/80 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto flex items-center justify-between px-5 h-14">
          <Link href="/" className="flex items-center gap-2">
            <TradeFeedLogo size="sm" />
          </Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 py-10">
        {!request ? (
          <StatusCard
            emoji="🔗"
            title="Invalid review link"
            body="This link doesn't exist or has been removed. If you wanted to leave a review, contact the seller via WhatsApp."
          />
        ) : request.respondedAt ? (
          <StatusCard
            emoji="🙏"
            title="Thank you!"
            body="A review was already submitted for this order."
            cta={{ href: `/catalog/${request.order.shop.slug}`, label: `Back to ${request.order.shop.name}` }}
          />
        ) : (
          <>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-extrabold tracking-tight">
                How was your order from {request.order.shop.name}?
              </h1>
              <p className="text-stone-400 text-sm mt-2">
                Order {request.order.orderNumber} — your review helps other buyers
                and is marked as a verified purchase.
              </p>
            </div>
            <VerifiedReviewForm
              token={token}
              defaultBuyerName={request.order.buyerName ?? ""}
              shopSlug={request.order.shop.slug}
              items={dedupeItems(request.order.items)}
            />
          </>
        )}
      </main>
    </div>
  );
}

function dedupeItems(
  items: { productId: string; productName: string; option1Value: string; option2Value: string | null }[]
) {
  const seen = new Map<string, { productId: string; productName: string }>();
  for (const item of items) {
    if (!seen.has(item.productId)) {
      seen.set(item.productId, { productId: item.productId, productName: item.productName });
    }
  }
  return [...seen.values()];
}

function StatusCard({
  emoji,
  title,
  body,
  cta,
}: {
  emoji: string;
  title: string;
  body: string;
  cta?: { href: string; label: string };
}) {
  return (
    <div className="text-center py-16">
      <div className="text-4xl mb-4">{emoji}</div>
      <h1 className="text-xl font-extrabold tracking-tight mb-2">{title}</h1>
      <p className="text-stone-400 text-sm leading-relaxed max-w-sm mx-auto">{body}</p>
      {cta && (
        <Link
          href={cta.href}
          className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500 transition-colors"
        >
          {cta.label}
        </Link>
      )}
    </div>
  );
}
