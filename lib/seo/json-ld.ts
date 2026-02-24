// ============================================================
// JSON-LD Structured Data Helpers
// ============================================================
// Generates Schema.org JSON-LD for Google rich results.
// Used in catalog layout + product detail pages.
//
// SCHEMAS:
//   - Organization (TradeFeed branding)
//   - LocalBusiness (per shop)
//   - Product (per product with offers)
//   - BreadcrumbList (navigation trail)
// ============================================================

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/**
 * JSON-LD for a shop's public catalog page.
 * Schema: LocalBusiness + BreadcrumbList
 */
export function generateShopJsonLd(shop: {
  name: string;
  slug: string;
  description: string | null;
  whatsappNumber: string;
  logoUrl: string | null;
  city: string | null;
  province: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  isVerified: boolean;
}) {
  const localBusiness: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: shop.name,
    description: shop.description || `${shop.name} — WhatsApp wholesale catalog on TradeFeed`,
    url: `${APP_URL}/catalog/${shop.slug}`,
    telephone: shop.whatsappNumber,
    ...(shop.logoUrl && { image: shop.logoUrl }),
    ...(shop.address || shop.city
      ? {
          address: {
            "@type": "PostalAddress",
            ...(shop.address && { streetAddress: shop.address }),
            ...(shop.city && { addressLocality: shop.city }),
            ...(shop.province && { addressRegion: shop.province }),
            addressCountry: "ZA",
          },
        }
      : {}),
    ...(shop.latitude && shop.longitude
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: shop.latitude,
            longitude: shop.longitude,
          },
        }
      : {}),
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "TradeFeed",
        item: APP_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: shop.name,
        item: `${APP_URL}/catalog/${shop.slug}`,
      },
    ],
  };

  return [localBusiness, breadcrumb];
}

/**
 * JSON-LD for a product detail page.
 * Schema: Product with AggregateOffer + BreadcrumbList
 */
export function generateProductJsonLd(
  shop: { name: string; slug: string },
  product: {
    id: string;
    name: string;
    description: string | null;
    images: { url: string }[];
    variants: { priceInCents: number; stock: number; isActive?: boolean }[];
    category: { name: string } | null;
  }
) {
  const activePrices = product.variants
    .filter((v) => v.isActive !== false)
    .map((v) => v.priceInCents);
  const minPrice = activePrices.length > 0 ? Math.min(...activePrices) / 100 : 0;
  const maxPrice = activePrices.length > 0 ? Math.max(...activePrices) / 100 : 0;
  const totalStock = product.variants
    .filter((v) => v.isActive !== false)
    .reduce((sum, v) => sum + v.stock, 0);

  const productLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    ...(product.description && { description: product.description }),
    ...(product.images.length > 0 && {
      image: product.images.map((img) => img.url),
    }),
    ...(product.category && { category: product.category.name }),
    brand: {
      "@type": "Brand",
      name: shop.name,
    },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "ZAR",
      lowPrice: minPrice.toFixed(2),
      highPrice: maxPrice.toFixed(2),
      offerCount: activePrices.length,
      availability:
        totalStock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    },
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "TradeFeed",
        item: APP_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: shop.name,
        item: `${APP_URL}/catalog/${shop.slug}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.name,
        item: `${APP_URL}/catalog/${shop.slug}/products/${product.id}`,
      },
    ],
  };

  return [productLd, breadcrumb];
}
