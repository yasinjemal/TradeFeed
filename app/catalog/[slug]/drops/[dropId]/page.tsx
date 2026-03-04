// ============================================================
// Page — Public Stock Drop (/catalog/[slug]/drops/[dropId])
// ============================================================
// The buyer-facing "stock drop" page. SSR for fast load + WhatsApp
// link previews. Shows product grid, "Order via WhatsApp" CTA,
// and "Powered by TradeFeed" viral badge.
// ============================================================

import { getPublicDrop } from "@/lib/db/drops";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { formatZAR } from "@/types";

interface DropPageProps {
  params: Promise<{ slug: string; dropId: string }>;
}

export async function generateMetadata({
  params,
}: DropPageProps): Promise<Metadata> {
  const { dropId } = await params;
  const drop = await getPublicDrop(dropId);

  if (!drop) {
    return { title: "Drop Not Found — TradeFeed" };
  }

  const itemCount = drop.items.length;
  const description = `${drop.shop.name} just dropped ${itemCount} new product${itemCount !== 1 ? "s" : ""}! Check them out and order via WhatsApp.`;

  return {
    title: `${drop.title} — ${drop.shop.name} | TradeFeed`,
    description,
    openGraph: {
      title: drop.title,
      description,
      type: "website",
    },
  };
}

export default async function PublicDropPage({ params }: DropPageProps) {
  const { slug, dropId } = await params;
  const drop = await getPublicDrop(dropId);

  if (!drop || drop.shop.slug !== slug) {
    notFound();
  }

  const shop = drop.shop;

  // Build WhatsApp order link
  const whatsappOrderText = `Hi ${shop.name}! I saw your stock drop "${drop.title}" on TradeFeed and I'm interested in ordering. 🛍️`;
  const whatsappOrderUrl = `https://wa.me/${shop.whatsappNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(whatsappOrderText)}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white">
      {/* ── Header ── */}
      <div className="bg-gradient-to-br from-rose-500 via-orange-500 to-amber-500 text-white">
        <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
          {/* Shop info */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {shop.logoUrl ? (
                <Image
                  src={shop.logoUrl}
                  alt={shop.name}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-xl object-cover"
                />
              ) : (
                <span className="text-lg font-bold">
                  {shop.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold opacity-90">
                  {shop.name}
                </span>
                {shop.isVerified && (
                  <svg
                    className="w-4 h-4 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              {shop.city && (
                <span className="text-xs opacity-75">📍 {shop.city}</span>
              )}
            </div>
          </div>

          {/* Drop title */}
          <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight">
            {drop.title}
          </h1>
          <p className="text-sm opacity-80 mt-2">
            {drop.items.length} new product
            {drop.items.length !== 1 ? "s" : ""} just dropped •{" "}
            {drop.publishedAt
              ? new Date(drop.publishedAt).toLocaleDateString("en-ZA", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : "Just now"}
          </p>
        </div>
      </div>

      {/* ── Products Grid ── */}
      <div className="max-w-2xl mx-auto px-4 -mt-4">
        <div className="grid grid-cols-2 gap-3">
          {drop.items.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl bg-white border border-stone-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Product image */}
              <div className="aspect-square bg-stone-100 relative">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.productName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg
                      className="w-10 h-10 text-stone-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
                      />
                    </svg>
                  </div>
                )}
                {/* NEW badge */}
                <div className="absolute top-2 left-2 bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  NEW
                </div>
              </div>

              {/* Info */}
              <div className="p-3">
                <p className="text-sm font-semibold text-stone-900 line-clamp-2">
                  {item.productName}
                </p>
                <p className="text-sm font-bold text-rose-600 mt-1">
                  {formatZAR(item.priceSnapshot)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Order CTA ── */}
      <div className="max-w-2xl mx-auto px-4 mt-8 space-y-4">
        {/* WhatsApp Order Button */}
        <a
          href={whatsappOrderUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2.5 rounded-2xl bg-[#25D366] px-6 py-4 text-base font-bold text-white shadow-lg shadow-emerald-200 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          Order via WhatsApp
        </a>

        {/* Browse full catalog */}
        <Link
          href={`/catalog/${slug}`}
          className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-stone-200 px-6 py-3.5 text-sm font-semibold text-stone-700 hover:bg-stone-50 transition-colors"
        >
          Browse Full Catalog →
        </Link>
      </div>

      {/* ── Powered by TradeFeed (Viral Badge) ── */}
      <div className="max-w-2xl mx-auto px-4 mt-10 mb-8">
        <Link
          href="/create-shop"
          className="block rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-5 text-center text-white hover:shadow-xl hover:-translate-y-0.5 transition-all"
        >
          <div className="flex items-center justify-center gap-2 mb-1">
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
                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"
              />
            </svg>
            <span className="text-sm font-bold">Powered by TradeFeed</span>
          </div>
          <p className="text-xs opacity-90">
            Create your free WhatsApp shop →
          </p>
        </Link>
      </div>
    </div>
  );
}
