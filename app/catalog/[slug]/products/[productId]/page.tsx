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
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tradefeed.co.za";

  // Use actual product photo for OG image (WhatsApp shows real photos much better)
  // Fall back to dynamically generated branded card when no photo exists
  const productImageUrl = product.images[0]?.url;
  const ogFallbackUrl = new URL("/api/og", baseUrl);
  ogFallbackUrl.searchParams.set("type", "product");
  ogFallbackUrl.searchParams.set("name", product.name);
  ogFallbackUrl.searchParams.set("shopName", shop.name);
  if (minPrice) ogFallbackUrl.searchParams.set("price", `From ${minPrice}`);
  if (productImageUrl) ogFallbackUrl.searchParams.set("image", productImageUrl);

  // Primary: real photo (renders instantly, WhatsApp/social always shows it)
  // Secondary: generated branded card (for platforms that use multiple images)
  const ogImages = productImageUrl
    ? [
        { url: productImageUrl, width: 800, height: 800, alt: product.name },
        { url: ogFallbackUrl.toString(), width: 1200, height: 630, alt: `${product.name} — ${shop.name}` },
      ]
    : [{ url: ogFallbackUrl.toString(), width: 1200, height: 630, alt: product.name }];

  const categoryTag = product.category?.name ? ` — ${product.category.name}` : "";

  return {
    title: `${product.name}${categoryTag} | Buy Online at ${shop.name} — TradeFeed SA`,
    description: product.description
      ? `${product.description.slice(0, 140)}. From ${minPrice} at ${shop.name}. Order via WhatsApp. Free online marketplace South Africa.`
      : `Buy ${product.name} from ${minPrice} at ${shop.name} on TradeFeed. South Africa's online marketplace. Order via WhatsApp — no app needed.`,
    keywords: [
      product.name.toLowerCase(),
      `buy ${product.name.toLowerCase()} online`,
      `buy ${product.name.toLowerCase()} South Africa`,
      ...(product.category?.name ? [product.category.name.toLowerCase(), `${product.category.name.toLowerCase()} South Africa`] : []),
      shop.name.toLowerCase(),
      "buy online South Africa",
      "TradeFeed",
    ],
    alternates: {
      canonical: `${baseUrl}/catalog/${slug}/products/${product.slug ?? productId}`,
    },
    openGraph: {
      title: `${product.name} from ${minPrice} | ${shop.name} — TradeFeed`,
      description: product.description || `Buy ${product.name} from ${minPrice} at ${shop.name}. Order on WhatsApp.`,
      type: "article",
      images: ogImages,
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
      title: `${product.name} from ${minPrice} | ${shop.name}`,
      description: product.description || `Buy ${product.name} from ${minPrice}. Order via WhatsApp on TradeFeed.`,
      images: productImageUrl ? [productImageUrl] : [ogFallbackUrl.toString()],
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
            {/* Wholesale price — primary */}
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">{formatZAR(minPrice)}</span>
              {minPrice !== maxPrice && <span className="text-base font-medium text-stone-400">- {formatZAR(maxPrice)}</span>}
              <span className="ml-auto text-xs text-stone-400">per unit</span>
            </div>

            {/* Dual pricing callout — show when retail prices exist */}
            {minRetailPrice && (
              <div className="mt-2 flex flex-col gap-1.5 rounded-xl border border-blue-100 bg-blue-50/60 px-3 py-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-stone-600">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5">🏭 Wholesale</span>
                  <span>{formatZAR(minPrice)}{minPrice !== maxPrice ? ` - ${formatZAR(maxPrice)}` : ""}</span>
                  {product.minWholesaleQty > 1 && <span className="text-stone-400">· min. {product.minWholesaleQty} units</span>}
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-stone-600">
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 text-blue-700 px-2 py-0.5">🛍️ Retail</span>
                  <span>{formatZAR(minRetailPrice)}{maxRetailPrice && minRetailPrice !== maxRetailPrice ? ` - ${formatZAR(maxRetailPrice)}` : ""}</span>
                  <span className="text-stone-400">· from 1 unit</span>
                </div>
                <p className="text-[10px] text-stone-400 mt-0.5">Choose wholesale or retail when adding to cart ↓</p>
              </div>
            )}

            <div className="mt-2 flex items-center gap-2 text-xs font-medium">
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 ${totalStock > 0 ? "bg-emerald-100 text-emerald-700" : "bg-stone-200 text-stone-600"}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${totalStock > 0 ? "bg-emerald-500" : "bg-stone-500"}`} />
                {totalStock > 0 ? `${totalStock} in stock` : "Out of stock"}
              </span>
              {product.minWholesaleQty > 1 && !minRetailPrice && (
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
                minWholesaleQty={product.minWholesaleQty}
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
        </div>
      </div>

      <div className="mt-8">
        <ProductReviews shopId={shop.id} shopSlug={slug} productId={product.id} reviews={reviews} aggregation={reviewAgg} />
      </div>

      <div className="mt-6">
        <RecentlyViewedStrip shopSlug={slug} excludeProductId={product.id} />
      </div>

      {/* ── Start Your Own Shop — Viral CTA ───────────── */}
      <div className="mt-6 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 border border-emerald-200/60 p-6 text-center space-y-3">
        <h3 className="text-base font-bold text-stone-900">🚀 Start Your Own Shop Like This</h3>
        <div className="flex flex-col gap-2 text-sm text-stone-600 max-w-xs mx-auto text-left">
          <div className="flex items-center gap-2.5"><span className="text-emerald-500 font-bold">1.</span> Upload your products</div>
          <div className="flex items-center gap-2.5"><span className="text-emerald-500 font-bold">2.</span> Share your catalog link</div>
          <div className="flex items-center gap-2.5"><span className="text-emerald-500 font-bold">3.</span> Receive orders on WhatsApp</div>
        </div>
        <Link href="/create-shop" className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-200 transition-all hover:bg-emerald-700 active:scale-[0.98]">
          Create your shop in 2 minutes →
        </Link>
      </div>

      {/* ── AI Feature Advertising ────────────────────── */}
      <div className="mt-4 rounded-2xl bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 border border-violet-200/60 p-6 text-center space-y-3">
        <h3 className="text-base font-bold text-stone-900">⚡ Add Products in Seconds with AI</h3>
        <div className="flex flex-col gap-2 text-sm text-stone-600 max-w-xs mx-auto text-left">
          <div className="flex items-center gap-2">📸 Upload a photo</div>
          <div className="flex items-center gap-2">✨ AI writes the title &amp; description</div>
          <div className="flex items-center gap-2">🏷️ AI suggests category &amp; price</div>
          <div className="flex items-center gap-2">🚀 List products 10× faster</div>
        </div>
        <Link href="/create-shop" className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-violet-200 transition-all hover:bg-violet-700 active:scale-[0.98]">
          Try it free →
        </Link>
      </div>

      {/* ── Marketplace Browse ── */}
      <div className="mt-4 text-center py-2">
        <Link
          href={product.category ? `/marketplace?category=${encodeURIComponent(product.category.name.toLowerCase().replace(/\s+/g, "-"))}` : "/marketplace"}
          className="inline-flex items-center gap-1.5 text-sm text-stone-400 hover:text-emerald-600 transition-colors group"
        >
          Browse {product.category ? product.category.name : "all products"} on TradeFeed Marketplace
          <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
