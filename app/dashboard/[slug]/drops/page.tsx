// ============================================================
// Page — Stock Drops List (/dashboard/[slug]/drops)
// ============================================================

import Link from "next/link";
import Image from "next/image";
import { getShopBySlug } from "@/lib/db/shops";
import { getDrops } from "@/lib/db/drops";
import { requireShopAccess } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { formatZAR } from "@/types";

interface DropsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function DropsPage({ params }: DropsPageProps) {
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

  const drops = await getDrops(shop.id);

  const published = drops.filter((d) => d.status === "PUBLISHED");
  const drafts = drops.filter((d) => d.status === "DRAFT");
  const archived = drops.filter((d) => d.status === "ARCHIVED");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Stock Drops</h1>
          <p className="text-sm text-stone-500">
            Announce new arrivals and share to WhatsApp groups in one tap
          </p>
        </div>
        <Link
          href={`/dashboard/${slug}/drops/new`}
          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-rose-200 hover:shadow-lg hover:shadow-rose-300 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
        >
          🔥 New Drop
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-emerald-50 p-4 border border-emerald-100">
          <p className="text-[11px] uppercase tracking-wider text-emerald-600 font-semibold">
            Published
          </p>
          <p className="text-2xl font-bold mt-1 text-emerald-700">
            {published.length}
          </p>
        </div>
        <div className="rounded-xl bg-amber-50 p-4 border border-amber-100">
          <p className="text-[11px] uppercase tracking-wider text-amber-600 font-semibold">
            Drafts
          </p>
          <p className="text-2xl font-bold mt-1 text-amber-700">
            {drafts.length}
          </p>
        </div>
        <div className="rounded-xl bg-stone-50 p-4 border border-stone-200">
          <p className="text-[11px] uppercase tracking-wider text-stone-500 font-semibold">
            Archived
          </p>
          <p className="text-2xl font-bold mt-1 text-stone-600">
            {archived.length}
          </p>
        </div>
      </div>

      {/* Empty state */}
      {drops.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-stone-200 py-16 text-center">
          <div className="text-5xl mb-4">🔥</div>
          <h3 className="text-lg font-bold text-stone-800">
            No stock drops yet
          </h3>
          <p className="text-sm text-stone-500 mt-2 max-w-sm mx-auto">
            Got new stock? Create a stock drop to announce your new arrivals and
            share them with your WhatsApp groups instantly.
          </p>
          <Link
            href={`/dashboard/${slug}/drops/new`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-rose-200 hover:shadow-lg hover:shadow-rose-300 mt-6"
          >
            🔥 Create Your First Drop
          </Link>
        </div>
      )}

      {/* Drops list */}
      {drops.length > 0 && (
        <div className="space-y-3">
          {drops.map((drop) => {
            const statusStyles = {
              PUBLISHED:
                "bg-emerald-50 text-emerald-700 border-emerald-200",
              DRAFT: "bg-amber-50 text-amber-700 border-amber-200",
              ARCHIVED: "bg-stone-100 text-stone-500 border-stone-200",
            };

            const firstImages = drop.items
              .filter((i) => i.imageUrl)
              .slice(0, 4);

            return (
              <div
                key={drop.id}
                className="rounded-xl border border-stone-200 bg-white p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-bold text-stone-900 truncate">
                        {drop.title}
                      </h3>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${statusStyles[drop.status]}`}
                      >
                        {drop.status}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500">
                      {drop._count.items} product
                      {drop._count.items !== 1 ? "s" : ""} •{" "}
                      {drop.publishedAt
                        ? `Published ${new Date(drop.publishedAt).toLocaleDateString()}`
                        : `Created ${new Date(drop.createdAt).toLocaleDateString()}`}
                    </p>

                    {/* Product image strip */}
                    {firstImages.length > 0 && (
                      <div className="flex -space-x-1.5 mt-2">
                        {firstImages.map((item) => (
                          <div
                            key={item.id}
                            className="w-8 h-8 rounded-lg border-2 border-white bg-stone-100 overflow-hidden flex-shrink-0"
                          >
                            <Image
                              src={item.imageUrl!}
                              alt=""
                              width={32}
                              height={32}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                        {drop.items.length > 4 && (
                          <div className="w-8 h-8 rounded-lg border-2 border-white bg-stone-200 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-stone-600">
                            +{drop.items.length - 4}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {drop.status === "PUBLISHED" && (
                      <a
                        href={`/catalog/${slug}/drops/${drop.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold transition-colors"
                      >
                        View →
                      </a>
                    )}
                    {drop.status === "PUBLISHED" && (
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(`${drop.message}\n\n👉 ${typeof window !== "undefined" ? window.location.origin : "https://tradefeed.co.za"}/catalog/${slug}/drops/${drop.id}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs bg-[#25D366] text-white px-3 py-1.5 rounded-full font-semibold hover:opacity-90 transition-opacity"
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        Share
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
