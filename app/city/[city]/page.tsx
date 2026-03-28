// ============================================================
// Flat City URL — /city/[city]
// ============================================================
// SEO-friendly short URL that redirects to the canonical
// hierarchical URL: /marketplace/[province]/[city]
//
// Examples:
//   /city/johannesburg → /marketplace/gauteng/johannesburg
//   /city/cape-town    → /marketplace/western-cape/cape-town
//   /city/durban       → /marketplace/kwazulu-natal/durban
// ============================================================

import { permanentRedirect, notFound } from "next/navigation";
import { getCityBySlug, SA_PROVINCES } from "@/lib/marketplace/locations";
import type { Metadata } from "next";

interface CityPageProps {
  params: Promise<{ city: string }>;
}

export async function generateStaticParams() {
  return SA_PROVINCES.flatMap((p) =>
    p.cities.map((c) => ({ city: c.slug })),
  );
}

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const { city: citySlug } = await params;
  const result = getCityBySlug(citySlug);
  if (!result) return {};

  return {
    title: `Suppliers in ${result.city.name} — TradeFeed`,
    description: `Browse wholesale and retail products from suppliers in ${result.city.name}, ${result.province.name}. Shop on TradeFeed.`,
    alternates: {
      canonical: `https://tradefeed.co.za/marketplace/${result.province.slug}/${result.city.slug}`,
    },
  };
}

export default async function CityRedirectPage({ params }: CityPageProps) {
  const { city: citySlug } = await params;
  const result = getCityBySlug(citySlug);

  if (!result) {
    notFound();
  }

  permanentRedirect(`/marketplace/${result.province.slug}/${result.city.slug}`);
}
