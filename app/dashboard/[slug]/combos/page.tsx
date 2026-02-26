// ============================================================
// Page — Combos List (/dashboard/[slug]/combos)
// ============================================================

import Link from "next/link";
import Image from "next/image";
import { getShopBySlug } from "@/lib/db/shops";
import { getCombos, getComboCategories } from "@/lib/db/combos";
import { requireShopAccess } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { formatZAR } from "@/types";
import { ComboCategoryManager } from "@/components/combo/combo-category-manager";

interface CombosPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CombosPage({ params }: CombosPageProps) {
  const { slug } = await params;

  let access: Awaited<ReturnType<typeof requireShopAccess>>;
  try {
    access = await requireShopAccess(slug);
  } catch {
    redirect("/sign-in");
  }
  if (!access) return notFound();

  const shop = await getShopBySlug(slug);
  if (!shop) return notFound();

  const [combos, comboCategories] = await Promise.all([
    getCombos(shop.id),
    getComboCategories(shop.id),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Combos</h1>
          <p className="text-sm text-stone-500">
            {combos.length} combo deal{combos.length !== 1 ? "s" : ""} — bundle products for better value
          </p>
        </div>
        <Link
          href={`/dashboard/${slug}/combos/new`}
          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-200 hover:shadow-lg hover:shadow-emerald-300 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
        >
          + New Combo
        </Link>
      </div>

      {/* Combo Categories Manager */}
      <ComboCategoryManager
        categories={comboCategories.map((c) => ({
          id: c.id,
          name: c.name,
          _count: { combos: c._count.combos },
        }))}
        shopSlug={slug}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl bg-emerald-50 p-4 border border-emerald-100">
          <p className="text-[11px] uppercase tracking-wider text-emerald-600 font-semibold">Total</p>
          <p className="text-2xl font-bold mt-1 text-emerald-700">{combos.length}</p>
        </div>
        <div className="rounded-xl bg-blue-50 p-4 border border-blue-100">
          <p className="text-[11px] uppercase tracking-wider text-blue-600 font-semibold">Active</p>
          <p className="text-2xl font-bold mt-1 text-blue-700">{combos.filter((c) => c.isActive).length}</p>
        </div>
        <div className="rounded-xl bg-amber-50 p-4 border border-amber-100">
          <p className="text-[11px] uppercase tracking-wider text-amber-600 font-semibold">In Stock</p>
          <p className="text-2xl font-bold mt-1 text-amber-700">{combos.filter((c) => c.stock > 0).length}</p>
        </div>
        <div className="rounded-xl bg-purple-50 p-4 border border-purple-100">
          <p className="text-[11px] uppercase tracking-wider text-purple-600 font-semibold">Categories</p>
          <p className="text-2xl font-bold mt-1 text-purple-700">{comboCategories.length}</p>
        </div>
      </div>

      {/* Empty State */}
      {combos.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50/50 py-16 text-center">
          <div className="text-5xl mb-4">📦</div>
          <h2 className="text-lg font-semibold text-stone-900">No combos yet</h2>
          <p className="text-sm text-stone-500 mt-1 max-w-sm mx-auto">
            Create combo deals to bundle your products together. Buyers love saving money on bundles!
          </p>
          <Link
            href={`/dashboard/${slug}/combos/new`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-md mt-5 hover:bg-emerald-600 transition-colors"
          >
            Create Your First Combo
          </Link>
        </div>
      )}

      {/* Combo Grid */}
      {combos.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {combos.map((combo) => (
            <Link
              key={combo.id}
              href={`/dashboard/${slug}/combos/${combo.id}`}
              className="group rounded-2xl bg-white shadow-sm ring-1 ring-stone-200/60 overflow-hidden hover:shadow-md hover:ring-stone-300/60 transition-all"
            >
              {/* Image */}
              <div className="relative aspect-[4/3] bg-stone-100">
                {combo.images[0] ? (
                  <Image
                    src={combo.images[0].url}
                    alt={combo.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  />
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <span className="text-4xl">📦</span>
                  </div>
                )}
                {/* Status badges */}
                <div className="absolute top-2 left-2 flex gap-1.5">
                  {!combo.isActive && (
                    <span className="rounded-full bg-stone-800/80 backdrop-blur px-2 py-0.5 text-[11px] font-semibold text-white">
                      Draft
                    </span>
                  )}
                  {combo.stock === 0 && (
                    <span className="rounded-full bg-red-500/90 backdrop-blur px-2 py-0.5 text-[11px] font-semibold text-white">
                      Out of Stock
                    </span>
                  )}
                </div>
                {/* Price */}
                <div className="absolute bottom-2 right-2 rounded-full bg-white/95 backdrop-blur px-2.5 py-1 shadow-sm">
                  <span className="text-sm font-bold text-stone-900">{formatZAR(combo.priceCents)}</span>
                </div>
              </div>

              {/* Info */}
              <div className="p-4 space-y-1.5">
                <h3 className="font-semibold text-stone-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                  {combo.name}
                </h3>
                {combo.comboCategory && (
                  <span className="inline-flex items-center rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
                    {combo.comboCategory.name}
                  </span>
                )}
                <p className="text-xs text-stone-500">
                  {combo.items.length} item{combo.items.length !== 1 ? "s" : ""} · {combo.stock} in stock
                </p>
                <div className="flex flex-wrap gap-1 pt-1">
                  {combo.items.slice(0, 3).map((item, i) => (
                    <span key={i} className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] text-stone-600">
                      {item.quantity > 1 ? `${item.quantity}× ` : ""}{item.productName}
                    </span>
                  ))}
                  {combo.items.length > 3 && (
                    <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] text-stone-400">
                      +{combo.items.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
