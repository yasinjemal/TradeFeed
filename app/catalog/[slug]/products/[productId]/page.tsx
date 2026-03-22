import { getCatalogProduct, getCatalogShop, getSimilarProducts, getMoreFromSeller } from "@/lib/db/catalog";
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
import { ProductBreadcrumb } from "@/components/catalog/product-breadcrumb";
import { SellerInfoCard } from "@/components/catalog/seller-info-card";
import { TrustMessaging } from "@/components/catalog/trust-messaging";
import { SimilarProducts } from "@/components/catalog/similar-products";
import { MoreFromSeller } from "@/components/catalog/more-from-seller";
import { StickyBuyBar } from "@/components/catalog/sticky-buy-bar";
import { DeliveryEstimate } from "@/components/catalog/delivery-estimate";

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

  const [reviews, reviewAgg, soldCount, similarProducts, moreFromSeller] = await Promise.all([
    getProductReviews(productId),
    getReviewAggregation(productId),
    getProductSoldCount(productId),
    product.category ? getSimilarProducts(product.category.id, shop.id, product.id) : Promise.resolve([]),
    getMoreFromSeller(shop.id, product.id),
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
    <div className="mx-auto w-full max-w-6xl">
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

      {/* ── Sticky Mobile Buy Bar ── */}
      <StickyBuyBar
        productName={product.name}
        minPrice={minPrice}
        maxPrice={maxPrice}
        totalStock={totalStock}
      />

      {/* ── Section 1: Breadcrumb ── */}
      <ProductBreadcrumb category={product.category} productName={product.name} />

      {/* ── Two-column layout: Gallery + Info ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
        {/* LEFT COLUMN — Gallery (sticky on desktop) */}
        <div className="lg:col-span-7">
          <div className="lg:sticky lg:top-4">
            <div className="-mx-4 overflow-hidden sm:mx-0 sm:rounded-2xl sm:border sm:border-slate-200 sm:shadow-sm sm:shadow-slate-200/50">
              <ProductImageGallery images={product.images.map((img) => ({ id: img.id, url: img.url, altText: img.altText }))} productName={product.name} soldOut={totalStock === 0} />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN — Product info + Seller card + Trust messaging */}
        <div className="space-y-5 lg:col-span-5">
          {/* ── Section 3: Product Info Card ── */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 sm:p-6">
            <div className="space-y-5">
              {/* Wholesale-only banner */}
              {product.wholesaleOnly && (
                <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <span className="mt-0.5 text-xl">🏭</span>
                  <div>
                    <p className="text-sm font-bold text-amber-900">Wholesale Only</p>
                    <p className="mt-0.5 text-xs text-amber-700">
                      This product is available exclusively to verified wholesale buyers.{" "}
                      <Link href="/marketplace/wholesale-register" className="font-semibold underline hover:text-amber-900">
                        Register as a wholesale buyer →
                      </Link>
                    </p>
                  </div>
                </div>
              )}

              {/* Category + Title + Sold count */}
              <div>
                {product.category && (
                  <Link
                    href={`/marketplace?category=${encodeURIComponent(product.category.slug)}`}
                    className="mb-2 inline-flex items-center rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-700 transition-colors hover:bg-emerald-100"
                  >
                    {product.category.name}
                  </Link>
                )}
                <h1 className="text-xl font-bold leading-tight text-slate-900 sm:text-2xl">{product.name}</h1>

                {/* Star rating + sold count — social proof above the fold */}
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                  {reviewAgg.averageRating > 0 && (
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            className={`h-4 w-4 ${star <= Math.round(reviewAgg.averageRating) ? "text-amber-400" : "text-slate-200"}`}
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.176 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81H7.03a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-sm font-medium text-slate-600">{reviewAgg.averageRating.toFixed(1)}</span>
                      <span className="text-xs text-slate-400">({reviewAgg.totalReviews})</span>
                    </div>
                  )}
                  {soldCount > 0 && (
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600">
                      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                      </svg>
                      {soldCount >= 100 ? "100+" : soldCount} sold
                    </span>
                  )}
                </div>
              </div>

              {/* Pricing block */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">{formatZAR(minPrice)}</span>
                  {minPrice !== maxPrice && <span className="text-base font-medium text-slate-400">- {formatZAR(maxPrice)}</span>}
                  <span className="ml-auto text-xs text-slate-400">per unit</span>
                </div>

                {/* Savings callout — show when retail price is higher than wholesale */}
                {minRetailPrice && minRetailPrice > minPrice && (
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">
                      Save {Math.round(((minRetailPrice - minPrice) / minRetailPrice) * 100)}% wholesale
                    </span>
                    <span className="text-xs text-slate-400 line-through">{formatZAR(minRetailPrice)}</span>
                  </div>
                )}
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-blue-700">🛍️ Retail</span>
                      <span>{formatZAR(minRetailPrice)}{maxRetailPrice && minRetailPrice !== maxRetailPrice ? ` - ${formatZAR(maxRetailPrice)}` : ""}</span>
                      <span className="text-slate-400">· from 1 unit</span>
                    </div>
                    <p className="mt-0.5 text-[10px] text-slate-400">Choose wholesale or retail when adding to cart ↓</p>
                  </div>
                )}

                <div className="mt-2 flex items-center gap-2 text-xs font-medium">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 ${totalStock > 0 ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${totalStock > 0 ? "bg-emerald-500" : "bg-slate-500"}`} />
                    {totalStock > 0 ? `${totalStock} in stock` : "Out of stock"}
                  </span>
                  {/* Low stock urgency */}
                  {totalStock > 0 && totalStock <= 5 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2.5 py-1 text-red-600 font-semibold animate-pulse">
                      🔥 Only {totalStock} left!
                    </span>
                  )}
                  {product.minWholesaleQty > 1 && !minRetailPrice && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-amber-700">
                      📦 Wholesale min. {product.minWholesaleQty} units
                    </span>
                  )}
                </div>
              </div>

              {/* Bulk Discount Tiers */}
              {product.bulkDiscountTiers && product.bulkDiscountTiers.length > 0 && (
                <div className="rounded-xl border border-amber-100 bg-amber-50/60 px-4 py-3">
                  <p className="mb-2 text-xs font-semibold text-amber-800">📦 Volume Discounts</p>
                  <div className="flex flex-wrap gap-2">
                    {product.bulkDiscountTiers.map((tier) => (
                      <span
                        key={tier.minQuantity}
                        className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-white px-2.5 py-1 text-xs font-medium text-amber-700"
                      >
                        {tier.minQuantity}+ units → {tier.discountPercent}% off
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {product.description && (
                <p className="text-sm leading-relaxed text-slate-600">{product.description}</p>
              )}

              {/* Share — moved below description, out of the purchase flow */}
              <div className="pt-1">
                <ShareProduct
                  productName={product.name}
                  productUrl={`${process.env.NEXT_PUBLIC_BASE_URL ?? "https://tradefeed.co.za"}/catalog/${slug}/products/${product.id}`}
                  price={minPrice === maxPrice ? formatZAR(minPrice) : `${formatZAR(minPrice)} - ${formatZAR(maxPrice)}`}
                  shopName={shop.name}
                />
              </div>

              <div className="border-t border-slate-100" />

              {/* Add to Cart / Out of stock */}
              <div className="pt-1" id="add-to-cart">
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
                    <p className="text-sm font-medium text-slate-500">This product is currently sold out</p>
                    <a href={waLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700">
                      Ask about restock on WhatsApp
                    </a>
                    <div className="w-full border-t border-slate-100 pt-3">
                      <RestockAlert productId={product.id} productName={product.name} shopId={shop.id} />
                    </div>
                  </div>
                )}

                {/* Wholesale RFQ button */}
                {(product.wholesaleOnly || (product.bulkDiscountTiers && product.bulkDiscountTiers.length > 0) || product.minWholesaleQty > 1) && (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4">
                    <p className="mb-1 text-sm font-bold text-amber-900">📋 Need a custom wholesale quote?</p>
                    <p className="mb-3 text-xs text-amber-700">Get personalized pricing for large orders, custom packaging, or recurring supply.</p>
                    <a
                      href={wholesaleRfqLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-700"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/></svg>
                      Request Wholesale Quote
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Section 4: Seller Info Card ── */}
          <SellerInfoCard shop={shop} />

          {/* ── Section 5: Trust Messaging ── */}
          <TrustMessaging isVerified={shop.isVerified} />

          {/* ── Section 5b: Delivery Estimate ── */}
          <DeliveryEstimate />
        </div>
      </div>

      {/* ── Full-width sections below the fold ── */}

      {/* ── Section 6: Reviews ── */}
      <div className="mt-10">
        <ProductReviews shopId={shop.id} shopSlug={slug} productId={product.id} reviews={reviews} aggregation={reviewAgg} />
      </div>

      {/* ── Recently Viewed ── */}
      <div className="mt-8">
        <RecentlyViewedStrip shopSlug={slug} excludeProductId={product.id} />
      </div>

      {/* ── Section 7: Similar Products ── */}
      <div className="mt-10">
        <SimilarProducts products={similarProducts} categoryName={product.category?.name} />
      </div>

      {/* ── Section 8: More from Seller ── */}
      <div className="mt-10">
        <MoreFromSeller products={moreFromSeller} shopName={shop.name} shopSlug={slug} />
      </div>

      {/* ── Viral CTAs ── */}
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-6 text-center space-y-3">
          <h3 className="text-base font-bold text-slate-900">🚀 Start Your Own Shop Like This</h3>
          <div className="mx-auto flex max-w-xs flex-col gap-2 text-left text-sm text-slate-600">
            <div className="flex items-center gap-2.5"><span className="font-bold text-emerald-500">1.</span> Upload your products</div>
            <div className="flex items-center gap-2.5"><span className="font-bold text-emerald-500">2.</span> Share your catalog link</div>
            <div className="flex items-center gap-2.5"><span className="font-bold text-emerald-500">3.</span> Receive orders on WhatsApp</div>
          </div>
          <Link href="/create-shop" className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-200 transition-all hover:bg-emerald-700 active:scale-[0.98]">
            Create your shop in 2 minutes →
          </Link>
        </div>

        <div className="rounded-2xl border border-violet-200/60 bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 p-6 text-center space-y-3">
          <h3 className="text-base font-bold text-slate-900">⚡ Add Products in Seconds with AI</h3>
          <div className="mx-auto flex max-w-xs flex-col gap-2 text-left text-sm text-slate-600">
            <div className="flex items-center gap-2">📸 Upload a photo</div>
            <div className="flex items-center gap-2">✨ AI writes the title &amp; description</div>
            <div className="flex items-center gap-2">🏷️ AI suggests category &amp; price</div>
            <div className="flex items-center gap-2">🚀 List products 10× faster</div>
          </div>
          <Link href="/create-shop" className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-violet-200 transition-all hover:bg-violet-700 active:scale-[0.98]">
            Try it free →
          </Link>
        </div>
      </div>

      {/* ── Marketplace Browse ── */}
      <div className="mt-6 pb-2 text-center">
        <Link
          href={product.category ? `/marketplace?category=${encodeURIComponent(product.category.name.toLowerCase().replace(/\s+/g, "-"))}` : "/marketplace"}
          className="group inline-flex items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-emerald-600"
        >
          Browse {product.category ? product.category.name : "all products"} on TradeFeed Marketplace
          <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
