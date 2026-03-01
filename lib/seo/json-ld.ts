// ============================================================
// JSON-LD Structured Data Helpers
// ============================================================
// Generates Schema.org JSON-LD for Google rich results.
// Used in catalog layout + product detail pages + marketplace.
//
// SCHEMAS:
//   - Organization (TradeFeed branding)
//   - WebSite (root layout — sitelinks search box)
//   - LocalBusiness (per shop)
//   - Product (per product with individual Offer objects)
//   - BreadcrumbList (navigation trail)
//   - ItemList (marketplace product grid)
//
// REF: https://developers.google.com/search/docs/appearance/structured-data/product
// ============================================================

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/**
 * JSON-LD for the root layout — renders once across the site.
 * Schema: Organization + WebSite with SearchAction (sitelinks search box)
 */
export function generateSiteJsonLd() {
  const organization: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "TradeFeed",
    url: APP_URL,
    logo: `${APP_URL}/icon.svg`,
    description:
      "TradeFeed is South Africa's online marketplace where sellers create their own online shop, list products, and receive orders via WhatsApp. Sell online in South Africa — free to start.",
    sameAs: [],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      availableLanguage: ["English", "Afrikaans", "Zulu", "Xhosa", "Sotho"],
    },
    areaServed: {
      "@type": "Country",
      name: "South Africa",
    },
  };

  const webSite: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "TradeFeed",
    url: APP_URL,
    description:
      "Online marketplace South Africa — browse products from local sellers, create your own online shop, and sell online across all 9 provinces.",
    inLanguage: "en-ZA",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${APP_URL}/marketplace?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return [organization, webSite];
}

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
 * Schema: Product with individual Offer per variant + BreadcrumbList
 *
 * Follows Google's Product structured data requirements:
 * https://developers.google.com/search/docs/appearance/structured-data/product
 */
export function generateProductJsonLd(
  shop: { name: string; slug: string },
  product: {
    id: string;
    name: string;
    description: string | null;
    images: { url: string }[];
    variants: {
      id: string;
      size: string;
      color?: string | null;
      priceInCents: number;
      sku?: string | null;
      stock: number;
      isActive?: boolean;
    }[];
    category: { name: string } | null;
  },
  reviewAgg?: { averageRating: number; totalReviews: number } | null,
  reviews?: {
    id: string;
    rating: number;
    title?: string | null;
    comment?: string | null;
    buyerName: string;
    createdAt: Date;
  }[]
) {
  const activeVariants = product.variants.filter((v) => v.isActive !== false);
  const activePrices = activeVariants.map((v) => v.priceInCents);
  const minPrice = activePrices.length > 0 ? Math.min(...activePrices) / 100 : 0;
  const maxPrice = activePrices.length > 0 ? Math.max(...activePrices) / 100 : 0;
  const totalStock = activeVariants.reduce((sum, v) => sum + v.stock, 0);
  const productUrl = `${APP_URL}/catalog/${shop.slug}/products/${product.id}`;

  // 6-month validity for price
  const priceValidUntil = new Date();
  priceValidUntil.setMonth(priceValidUntil.getMonth() + 6);
  const priceValidUntilStr = priceValidUntil.toISOString().split("T")[0];

  // Shared shipping + return policy
  const shippingDetails = {
    "@type": "OfferShippingDetails",
    shippingDestination: {
      "@type": "DefinedRegion",
      addressCountry: "ZA",
    },
    deliveryTime: {
      "@type": "ShippingDeliveryTime",
      handlingTime: {
        "@type": "QuantitativeValue",
        minValue: 1,
        maxValue: 3,
        unitCode: "DAY",
      },
      transitTime: {
        "@type": "QuantitativeValue",
        minValue: 1,
        maxValue: 7,
        unitCode: "DAY",
      },
    },
  };

  const returnPolicy = {
    "@type": "MerchantReturnPolicy",
    applicableCountry: "ZA",
    returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
    merchantReturnDays: 7,
    returnMethod: "https://schema.org/ReturnByMail",
    returnFees: "https://schema.org/FreeReturn",
  };

  // Individual Offer per variant (Google prefers this over AggregateOffer)
  const offers = activeVariants.map((v) => ({
    "@type": "Offer",
    url: productUrl,
    priceCurrency: "ZAR",
    price: (v.priceInCents / 100).toFixed(2),
    priceValidUntil: priceValidUntilStr,
    itemCondition: "https://schema.org/NewCondition",
    availability:
      v.stock > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    ...(v.sku && { sku: v.sku }),
    seller: {
      "@type": "Organization",
      name: shop.name,
      url: `${APP_URL}/catalog/${shop.slug}`,
    },
    shippingDetails,
    hasMerchantReturnPolicy: returnPolicy,
  }));

  // Build individual Review objects (max 10 for page weight)
  const reviewObjects = (reviews ?? []).slice(0, 10).map((r) => ({
    "@type": "Review",
    reviewRating: {
      "@type": "Rating",
      ratingValue: r.rating,
      bestRating: 5,
      worstRating: 1,
    },
    author: {
      "@type": "Person",
      name: r.buyerName,
    },
    datePublished: r.createdAt instanceof Date
      ? r.createdAt.toISOString().split("T")[0]
      : String(r.createdAt).split("T")[0],
    ...(r.title && { name: r.title }),
    ...(r.comment && { reviewBody: r.comment }),
  }));

  const productLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    url: productUrl,
    ...(product.description && { description: product.description }),
    ...(product.images.length > 0 && {
      image: product.images.map((img) => img.url),
    }),
    ...(product.category && { category: product.category.name }),
    brand: {
      "@type": "Brand",
      name: shop.name,
    },
    ...(reviewAgg && reviewAgg.totalReviews > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: reviewAgg.averageRating.toFixed(1),
            reviewCount: reviewAgg.totalReviews,
            bestRating: "5",
            worstRating: "1",
          },
        }
      : {}),
    ...(reviewObjects.length > 0 && { review: reviewObjects }),
    // Use individual offers for richer Google Shopping data
    offers: offers.length === 1
      ? offers[0]
      : {
          "@type": "AggregateOffer",
          priceCurrency: "ZAR",
          lowPrice: minPrice.toFixed(2),
          highPrice: maxPrice.toFixed(2),
          offerCount: offers.length,
          availability:
            totalStock > 0
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
          offers,
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

/**
 * JSON-LD for the marketplace discovery page.
 * Schema: ItemList (product grid) + BreadcrumbList + WebPage
 *
 * Google may surface these as rich results or use them
 * for Google Shopping eligibility signals.
 */
export function generateMarketplaceJsonLd(
  products: {
    id: string;
    name: string;
    shopSlug: string;
    image: string | null;
    priceInCents: number;
  }[],
  categoryName?: string
) {
  const pageUrl = categoryName
    ? `${APP_URL}/marketplace?category=${encodeURIComponent(categoryName.toLowerCase().replace(/\s+/g, "-"))}`
    : `${APP_URL}/marketplace`;

  const itemList: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: categoryName
      ? `${categoryName} — TradeFeed Marketplace`
      : "TradeFeed Marketplace",
    description: categoryName
      ? `Browse ${categoryName.toLowerCase()} from South Africa's top sellers on TradeFeed.`
      : "Discover products from South Africa's top sellers on TradeFeed Marketplace.",
    url: pageUrl,
    numberOfItems: products.length,
    itemListElement: products.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${APP_URL}/catalog/${product.shopSlug}/products/${product.id}`,
      name: product.name,
      ...(product.image && { image: product.image }),
    })),
  };

  const breadcrumb: Record<string, unknown> = {
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
        name: "Marketplace",
        item: `${APP_URL}/marketplace`,
      },
      ...(categoryName
        ? [
            {
              "@type": "ListItem",
              position: 3,
              name: categoryName,
              item: pageUrl,
            },
          ]
        : []),
    ],
  };

  const webPage: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: categoryName
      ? `${categoryName} — TradeFeed Marketplace`
      : "TradeFeed Marketplace",
    description: categoryName
      ? `Shop ${categoryName.toLowerCase()} from SA's top sellers on TradeFeed.`
      : "South Africa's wholesale marketplace. Browse products from top sellers.",
    url: pageUrl,
    isPartOf: {
      "@type": "WebSite",
      name: "TradeFeed",
      url: APP_URL,
    },
  };

  return [itemList, breadcrumb, webPage];
}
