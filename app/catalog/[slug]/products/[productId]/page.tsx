import { getCatalogProduct, getCatalogShop } from "@/lib/db/catalog";
import { trackEvent } from "@/lib/db/analytics";
import { getProductReviews, getReviewAggregation } from "@/lib/db/reviews";
import { getProductSoldCount } from "@/lib/db/orders";
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

  const [reviews, reviewAgg, soldCount] = await Promise.all([
    getProductReviews(productId),
    getReviewAggregation(productId),
    getProductSoldCount(productId),
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

  // Wholesale RFQ message — structured for bulk inquiries
  const wholesaleRfqMessage = encodeURIComponent(
    `🏭 *Wholesale Inquiry — ${product.name}*\n\n` +
      `I'd like to request a wholesale quote.\n\n` +
      `📦 Product: ${product.name}\n` +
      `💰 Listed price: ${formatZAR(minPrice)}/unit\n` +
      (product.minWholesaleQty > 1 ? `📊 Min. order: ${product.minWholesaleQty} units\n` : "") +
      (product.bulkDiscountTiers && product.bulkDiscountTiers.length > 0
        ? `🎯 Volume tiers: ${product.bulkDiscountTiers.map((t) => `${t.minQuantity}+ → ${t.discountPercent}% off`).join(", ")}\n`
        : "") +
      `\nPlease share:\n• Bulk pricing for larger quantities\n• Lead times & availability\n• Delivery options\n\nThank you!`
  );
  const wholesaleRfqLink = `https://wa.me/${shop.whatsappNumber.replace("+", "")}?text=${wholesaleRfqMessage}`;

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
          {/* Wholesale-only banner */}
          {product.wholesaleOnly && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3">
              <span className="text-xl mt-0.5">🏭</span>
              <div>
                <p className="text-sm font-bold text-amber-900">Wholesale Only</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  This product is available exclusively to verified wholesale buyers.{" "}
                  <Link href="/marketplace/wholesale-register" className="font-semibold underline hover:text-amber-900">
                    Register as a wholesale buyer →
                  </Link>
                </p>
              </div>
            </div>
          )}

          <div>
            {product.category && <span className="mb-2 inline-flex items-center rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-700">{product.category.name}</span>}
            <h1 className="text-xl font-bold leading-tight text-stone-900 sm:text-2xl">{product.name}</h1>
            {soldCount > 0 && (
              <p className="mt-1.5 inline-flex items-center gap-1 text-sm font-medium text-emerald-600">
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                {soldCount >= 100 ? "100+" : soldCount} sold
              </p>
            )}
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

          {/* Bulk Discount Tiers */}
          {product.bulkDiscountTiers && product.bulkDiscountTiers.length > 0 && (
            <div className="rounded-xl border border-amber-100 bg-amber-50/60 px-4 py-3">
              <p className="text-xs font-semibold text-amber-800 mb-2">📦 Volume Discounts</p>
              <div className="flex flex-wrap gap-2">
                {product.bulkDiscountTiers.map((tier) => (
                  <span
                    key={tier.minQuantity}
                    className="inline-flex items-center gap-1 rounded-full bg-white border border-amber-200 px-2.5 py-1 text-xs font-medium text-amber-700"
                  >
                    {tier.minQuantity}+ units → {tier.discountPercent}% off
                  </span>
                ))}
              </div>
            </div>
          )}

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
                bulkDiscountTiers={product.bulkDiscountTiers}
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

            {/* Wholesale RFQ button — show for wholesale-only products or products with bulk tiers */}
            {(product.wholesaleOnly || (product.bulkDiscountTiers && product.bulkDiscountTiers.length > 0) || product.minWholesaleQty > 1) && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4">
                <p className="text-sm font-bold text-amber-900 mb-1">📋 Need a custom wholesale quote?</p>
                <p className="text-xs text-amber-700 mb-3">Get personalized pricing for large orders, custom packaging, or recurring supply.</p>
                <a
                  href={wholesaleRfqLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-700"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/></svg>
                  Request Wholesale Quote
                </a>
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
