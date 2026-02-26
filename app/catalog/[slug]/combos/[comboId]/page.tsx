// ============================================================
// Page — Combo Detail (/catalog/[slug]/combos/[comboId])
// ============================================================

import { getCatalogCombo, getCatalogShop } from "@/lib/db/catalog";
import { formatZAR } from "@/types";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ProductImageGallery } from "@/components/catalog/product-image-gallery";
import { AddComboToCart } from "@/components/catalog/add-combo-to-cart";
import { ShareProduct } from "@/components/catalog/share-product";

interface ComboDetailPageProps {
  params: Promise<{ slug: string; comboId: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; comboId: string }>;
}): Promise<Metadata> {
  const { slug, comboId } = await params;
  const shop = await getCatalogShop(slug);
  if (!shop) return { title: "Not Found" };

  const combo = await getCatalogCombo(comboId, shop.id);
  if (!combo) return { title: "Not Found" };

  return {
    title: `${combo.name} - ${shop.name}`,
    description: combo.description || `${combo.name} combo deal at ${shop.name} for ${formatZAR(combo.priceCents)}`,
  };
}

export default async function ComboDetailPage({ params }: ComboDetailPageProps) {
  const { slug, comboId } = await params;
  const shop = await getCatalogShop(slug);
  if (!shop) return notFound();

  const combo = await getCatalogCombo(comboId, shop.id);
  if (!combo) return notFound();

  const waMessage = encodeURIComponent(
    `Hi! I'm interested in the *${combo.name}* combo deal (${formatZAR(combo.priceCents)})\n\n` +
    `Items:\n${combo.items.map((i) => `• ${i.quantity > 1 ? `${i.quantity}× ` : ""}${i.productName}${i.variantLabel ? ` (${i.variantLabel})` : ""}`).join("\n")}\n\n` +
    `Please let me know availability. Thank you!`
  );
  const waLink = `https://wa.me/${shop.whatsappNumber.replace("+", "")}?text=${waMessage}`;

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Link href={`/catalog/${slug}`} className="group mb-4 inline-flex items-center gap-1.5 text-sm text-stone-500 transition-colors hover:text-stone-700">
        <svg className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Back to catalog
      </Link>

      {/* Images */}
      {combo.images.length > 0 && (
        <div className="-mx-3 overflow-hidden sm:mx-0 sm:rounded-3xl sm:border sm:border-stone-200/60 sm:shadow-sm sm:shadow-stone-200/50">
          <ProductImageGallery
            images={combo.images.map((img) => ({ id: img.id, url: img.url, altText: img.altText }))}
            productName={combo.name}
            soldOut={combo.stock === 0}
          />
        </div>
      )}

      {/* Info Card */}
      <div className="mt-4 rounded-3xl bg-white p-5 shadow-sm shadow-stone-200/60 ring-1 ring-stone-200/60 sm:p-6">
        <div className="space-y-6">
          {/* Title & Category */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-orange-700">
                📦 COMBO DEAL
              </span>
              {combo.comboCategory && (
                <span className="inline-flex items-center rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
                  {combo.comboCategory.name}
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold leading-tight text-stone-900 sm:text-2xl">{combo.name}</h1>
            <div className="mt-3">
              <ShareProduct
                productName={combo.name}
                productUrl={`${process.env.NEXT_PUBLIC_BASE_URL ?? "https://tradefeed.co.za"}/catalog/${slug}/combos/${combo.id}`}
                price={formatZAR(combo.priceCents)}
                shopName={shop.name}
              />
            </div>
          </div>

          {/* Price */}
          <div className="rounded-2xl border border-stone-100 bg-stone-50 px-4 py-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
                {formatZAR(combo.priceCents)}
              </span>
              <span className="ml-auto text-xs text-stone-400">combo price</span>
            </div>
            {combo.retailPriceCents && (
              <div className="mt-1 flex items-baseline gap-1.5 text-sm text-stone-500">
                <span className="text-xs text-stone-400">Retail:</span>
                <span className="font-semibold">{formatZAR(combo.retailPriceCents)}</span>
              </div>
            )}
            <div className="mt-2 flex items-center gap-2 text-xs font-medium">
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 ${combo.stock > 0 ? "bg-emerald-100 text-emerald-700" : "bg-stone-200 text-stone-600"}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${combo.stock > 0 ? "bg-emerald-500" : "bg-stone-500"}`} />
                {combo.stock > 0 ? `${combo.stock} available` : "Sold out"}
              </span>
            </div>
          </div>

          {/* Description */}
          {combo.description && <p className="text-sm leading-relaxed text-stone-600">{combo.description}</p>}

          {/* What's Included */}
          <div>
            <h2 className="text-sm font-semibold text-stone-900 mb-3">What&apos;s Included</h2>
            <div className="space-y-2">
              {combo.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 rounded-xl border border-stone-100 bg-stone-50 px-4 py-3">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold">
                    {item.quantity}×
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-stone-800 truncate">
                      {item.productId ? (
                        <Link href={`/catalog/${slug}/products/${item.productId}`} className="hover:text-emerald-600 underline-offset-2 hover:underline">
                          {item.productName}
                        </Link>
                      ) : (
                        item.productName
                      )}
                    </p>
                    {item.variantLabel && (
                      <p className="text-xs text-stone-500">{item.variantLabel}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-stone-100" />

          {/* Add to Cart */}
          {combo.stock > 0 && (
            <AddComboToCart
              comboId={combo.id}
              comboName={combo.name}
              priceCents={combo.priceCents}
              retailPriceCents={combo.retailPriceCents}
              stock={combo.stock}
              imageUrl={combo.images[0]?.url}
              items={combo.items}
            />
          )}

          {/* WhatsApp Quick Order */}
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Ask about this combo on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
