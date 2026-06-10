// ============================================================
// Page — Catalogue Import Hub (/dashboard/[slug]/import)
// ============================================================
// The "migrate your whole catalogue in one session" entry point.
// Shows source cards (Photos live; Paste/CSV staged) or resumes
// an in-flight import job from DB state — survives closed tabs.
//
// Gated behind FEATURE_FLAGS.CATALOGUE_IMPORT.
// ============================================================

import Link from "next/link";
import { notFound } from "next/navigation";
import { requireShopAccess } from "@/lib/auth";
import { db } from "@/lib/db";
import { FEATURE_FLAGS } from "@/lib/config/feature-flags";
import { PhotoImportFlow } from "@/components/import/photo-import-flow";

export const metadata = {
  title: "Import Your Catalogue | TradeFeed",
};

interface ImportPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ source?: string }>;
}

export default async function CatalogueImportPage({ params, searchParams }: ImportPageProps) {
  if (!FEATURE_FLAGS.CATALOGUE_IMPORT) return notFound();

  const { slug } = await params;
  const { source } = await searchParams;

  let access: Awaited<ReturnType<typeof requireShopAccess>>;
  try {
    access = await requireShopAccess(slug);
  } catch {
    return notFound();
  }
  if (!access) return notFound();

  // Resume an in-flight job (PROCESSING or REVIEW) — most recent first
  const activeJob = await db.importJob.findFirst({
    where: { shopId: access.shopId, status: { in: ["PROCESSING", "REVIEW"] } },
    orderBy: { createdAt: "desc" },
    select: { id: true, status: true, source: true, totalItems: true, readyItems: true },
  });

  const showPhotoFlow = source === "photos" || activeJob?.source === "PHOTOS";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Import your catalogue</h1>
        <p className="text-sm text-slate-500 mt-1">
          Bring your whole WhatsApp catalogue into TradeFeed in one session — no retyping.
        </p>
      </div>

      {activeJob && showPhotoFlow ? (
        <>
          <div className="rounded-xl bg-emerald-50 border border-emerald-200/60 px-4 py-3">
            <p className="text-sm font-semibold text-emerald-800">
              Welcome back — resuming your import ({activeJob.readyItems}/{activeJob.totalItems} processed)
            </p>
          </div>
          <PhotoImportFlow
            shopSlug={slug}
            resumeJob={{
              jobId: activeJob.id,
              status: activeJob.status,
              totalItems: activeJob.totalItems,
              readyItems: activeJob.readyItems,
            }}
          />
        </>
      ) : showPhotoFlow ? (
        <PhotoImportFlow shopSlug={slug} resumeJob={null} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Photos — primary */}
          <Link
            href={`/dashboard/${slug}/import?source=photos`}
            className="rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 hover:border-emerald-400 transition-colors"
          >
            <div className="text-2xl mb-2">📸</div>
            <h2 className="text-sm font-bold text-slate-900">Photos</h2>
            <p className="text-xs text-slate-500 mt-1">
              Select up to 50 product photos. AI writes every listing.
            </p>
            <span className="inline-block mt-3 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 rounded-full px-2 py-0.5">
              Recommended
            </span>
          </Link>

          {/* Paste — staged (Flow B) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 opacity-60">
            <div className="text-2xl mb-2">💬</div>
            <h2 className="text-sm font-bold text-slate-900">Paste from WhatsApp</h2>
            <p className="text-xs text-slate-500 mt-1">
              Paste your captions — AI splits them into listings.
            </p>
            <span className="inline-block mt-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 rounded-full px-2 py-0.5">
              Coming soon
            </span>
          </div>

          {/* Spreadsheet — existing CSV import */}
          <Link
            href={`/dashboard/${slug}/products/import`}
            className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-emerald-300 transition-colors"
          >
            <div className="text-2xl mb-2">📊</div>
            <h2 className="text-sm font-bold text-slate-900">Spreadsheet</h2>
            <p className="text-xs text-slate-500 mt-1">
              Upload a CSV with your products and stock.
            </p>
          </Link>
        </div>
      )}
    </div>
  );
}
