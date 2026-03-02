import { getCatalogProduct, getCatalogShop } from "@/lib/db/catalog";
import { trackEvent } from "@/lib/db/analytics";
import { getProductReviews, getReviewAggregation } from "@/lib/db/reviews";
import { formatZAR } from "@/types";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { AddToCart } from "@/components/catalog/add-to-cart";
import { ProductImageGallery } from "@/components/catalog/product-image-gallery";
import { ShareProduct } from "@/components/catalog/share-product";
import { generateProductJsonLd } from "@/lib/seo/json-ld";
import { RestockAlert } from "@/components/catalog/restock-alert";
import { RecentlyViewedTracker } from "@/lib/recently-viewed/recently-viewed";
import { RecentlyViewedStrip } from "@/components/catalog/recently-viewed-strip";
import { ProductReviews } from "@/components/reviews/product-reviews";

interface ProductDetailPageProps {
  params: Promise<{ slug: string; productId: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; productId: string }>;
}): Promise<Metadata> {
  const { slug, productId } = await params;
  const shop = await getCatalogShop(slug);
  if (!shop) return { title: "Not Found" };

  const product = await getCatalogProduct(productId, shop.id);
  if (!product) return { title: "Not Found" };

  const prices = product.variants.map((v) => v.priceInCents);
  const minPrice = prices.length > 0 ? formatZAR(Math.min(...prices)) : "";

  const ogUrl = new URL("/api/og", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");
  ogUrl.searchParams.set("type", "product");
  ogUrl.searchParams.set("name", product.name);
  ogUrl.searchParams.set("shopName", shop.name);
  if (minPrice) ogUrl.searchParams.set("price", `From ${minPrice}`);
  if (product.images[0]?.url) ogUrl.searchParams.set("image", product.images[0].url);

  return {
    title: `${product.name} - ${shop.name}`,
    description: product.description || `${product.name} from ${minPrice} at ${shop.name}`,
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_APP_URL || "https://tradefeed.co.za"}/catalog/${slug}/products/${productId}`,
    },
    openGraph: {
      title: `${product.name} - ${shop.name}`,
      description: product.description || `${product.name} from ${minPrice}`,
      type: "article",
      images: [{ url: ogUrl.toString(), width: 1200, height: 630, alt: product.name }],
    },
    other: {
      "product:price:amount": minPrice ? `${Math.min(...prices) / 100}` : "",
      "product:price:currency": "ZAR",
      "product:availability": product.variants.reduce((sum, v) => sum + v.stock, 0) > 0 ? "instock" : "oos",
      "product:brand": shop.name,
      "product:category": product.category?.name ?? "",
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} - ${shop.name}`,
      description: product.description || `${product.name} from ${minPrice}`,
      images: [ogUrl.toString()],
    },
  };
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug, productId } = await params;
  const shop = await getCatalogShop(slug);
  if (!shop) return notFound();

  const product = await getCatalogProduct(productId, shop.id);
  if (!product) return notFound();

  void trackEvent({ type: "PRODUCT_VIEW", shopId: shop.id, productId });

  const prices = product.variants.map((v) => v.priceInCents);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
  const retailPrices = product.variants.map((v) => v.retailPriceCents).filter((p): p is number => p !== null);
  const minRetailPrice = retailPrices.length > 0 ? Math.min(...retailPrices) : null;
  const maxRetailPrice = retailPrices.length > 0 ? Math.max(...retailPrices) : null;
  const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);

  const [reviews, reviewAgg] = await Promise.all([
    getProductReviews(productId),
    getReviewAggregation(productId),
  ]);

  const uniqueSizes = Array.from(new Set(product.variants.map((v) => v.size)));
  const uniqueColors = Array.from(new Set(product.variants.map((v) => v.color).filter(Boolean))) as string[];

  const option1Label = product.option1Label ?? "Size";
  const option2Label = product.option2Label ?? "Color";

  const waMessage = encodeURIComponent(
    `Hi! I'm interested in *${product.name}*\n\n` +
      `Available ${option1Label.toLowerCase()}s: ${uniqueSizes.join(", ")}\n` +
      (uniqueColors.length > 0 ? `${option2Label}s: ${uniqueColors.join(", ")}\n` : "") +
      "\nPlease let me know availability and pricing. Thank you!"
  );
  const waLink = `https://wa.me/${shop.whatsappNumber.replace("+", "")}?text=${waMessage}`;
  const retailWaLink = shop.retailWhatsappNumber
    ? `https://wa.me/${shop.retailWhatsappNumber.replace("+", "")}?text=${waMessage}`
    : null;

  return (
    <div className="mx-auto w-full max-w-3xl">
      <RecentlyViewedTracker
        shopSlug={slug}
        productId={product.id}
        productName={product.name}
        imageUrl={product.images[0]?.url ?? null}
        priceInCents={minPrice}
      />

      {generateProductJsonLd(shop, product, reviewAgg, reviews).map((schema, i) => (
        <script key={`product-ld-${i}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}

      <Link href={`/catalog/${slug}`} className="group mb-4 inline-flex items-center gap-1.5 text-sm text-stone-500 transition-colors hover:text-stone-700">
        <svg className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Back to catalog
      </Link>

      <div className="-mx-3 overflow-hidden sm:mx-0 sm:rounded-3xl sm:border sm:border-stone-200/60 sm:shadow-sm sm:shadow-stone-200/50">
        <ProductImageGallery images={product.images.map((img) => ({ id: img.id, url: img.url, altText: img.altText }))} productName={product.name} soldOut={totalStock === 0} />
      </div>

      <div className="mt-4 rounded-3xl bg-white p-5 shadow-sm shadow-stone-200/60 ring-1 ring-stone-200/60 sm:p-6">
        <div className="space-y-6">
          <div>
            {product.category && <span className="mb-2 inline-flex items-center rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-700">{product.category.name}</span>}
            <h1 className="text-xl font-bold leading-tight text-stone-900 sm:text-2xl">{product.name}</h1>
            <div className="mt-3">
              <ShareProduct
                productName={product.name}
                productUrl={`${process.env.NEXT_PUBLIC_BASE_URL ?? "https://tradefeed.co.za"}/catalog/${slug}/products/${product.id}`}
                price={minPrice === maxPrice ? formatZAR(minPrice) : `${formatZAR(minPrice)} - ${formatZAR(maxPrice)}`}
                shopName={shop.name}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-stone-100 bg-stone-50 px-4 py-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">{formatZAR(minPrice)}</span>
              {minPrice !== maxPrice && <span className="text-base font-medium text-stone-400">- {formatZAR(maxPrice)}</span>}
              <span className="ml-auto text-xs text-stone-400">per unit</span>
            </div>
            {minRetailPrice && (
              <div className="mt-1 flex items-baseline gap-1.5 text-sm text-stone-500">
                <span className="text-xs text-stone-400">Retail:</span>
                <span className="font-semibold">{formatZAR(minRetailPrice)}</span>
                {maxRetailPrice && minRetailPrice !== maxRetailPrice && (
                  <span className="text-stone-400">- {formatZAR(maxRetailPrice)}</span>
                )}
              </div>
            )}
            <div className="mt-2 flex items-center gap-2 text-xs font-medium">
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 ${totalStock > 0 ? "bg-emerald-100 text-emerald-700" : "bg-stone-200 text-stone-600"}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${totalStock > 0 ? "bg-emerald-500" : "bg-stone-500"}`} />
                {totalStock > 0 ? `${totalStock} in stock` : "Out of stock"}
              </span>
              {product.minWholesaleQty > 1 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-700 px-2.5 py-1">
                  📦 Wholesale min. {product.minWholesaleQty} units
                </span>
              )}
            </div>
          </div>

          {product.description && <p className="text-sm leading-relaxed text-stone-600">{product.description}</p>}

          <div className="border-t border-stone-100" />

          <div className="pt-2" id="add-to-cart">
            {totalStock > 0 ? (
              <AddToCart
                productId={product.id}
                productName={product.name}
                imageUrl={product.images[0]?.url}
                option1Label={option1Label}
                option2Label={option2Label}
                quickOrderHref={waLink}
                minWholesaleQty={product.minWholesaleQty}
                hasRetailOption={!!shop.retailWhatsappNumber}
                variants={product.variants.map((v) => ({ id: v.id, size: v.size, color: v.color, priceInCents: v.priceInCents, retailPriceCents: v.retailPriceCents, stock: v.stock }))}
              />
            ) : (
              <div className="flex flex-col items-center gap-3 py-3">
                <p className="text-sm font-medium text-stone-500">This product is currently sold out</p>
                <a href={waLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700">
                  Ask about restock on WhatsApp
                </a>
                <div className="w-full border-t border-stone-100 pt-3">
                  <RestockAlert productId={product.id} productName={product.name} shopId={shop.id} />
                </div>
              </div>
            )}
          </div>

          <a href={waLink} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 sm:hidden">
            {retailWaLink ? "🏭 Wholesale WhatsApp" : "Quick order on WhatsApp"}
          </a>
          {retailWaLink && (
            <a href={retailWaLink} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-100 sm:hidden">
              🛍️ Retail WhatsApp
            </a>
          )}
        </div>
      </div>

      <div className="mt-8">
        <ProductReviews shopId={shop.id} shopSlug={slug} productId={product.id} reviews={reviews} aggregation={reviewAgg} />
      </div>

      <div className="mt-6">
        <RecentlyViewedStrip shopSlug={slug} excludeProductId={product.id} />
      </div>

      <div className="mt-6 rounded-2xl border border-stone-200/50 bg-gradient-to-r from-stone-50 to-emerald-50/30 p-5 text-center">
        <p className="mb-2 text-sm text-stone-500">Looking for more products like this?</p>
        <Link
          href={product.category ? `/marketplace?category=${encodeURIComponent(product.category.name.toLowerCase().replace(/\s+/g, "-"))}` : "/marketplace"}
          className="group inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 transition-colors hover:text-emerald-700"
        >
          Browse {product.category ? product.category.name : "all products"} on TradeFeed Marketplace
          <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
