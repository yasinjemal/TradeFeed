// ============================================================
// Loading — Catalog Page Skeleton
// ============================================================
// Shown while the catalog SSR page loads on slow mobile data.
// Matches the redesigned hero + grid layout for seamless transition.
// ============================================================

export default function CatalogLoading() {
  return (
    <div className="space-y-5">
      {/* Hero skeleton */}
      <div className="overflow-hidden rounded-2xl bg-white border border-slate-200/60">
        {/* Banner */}
        <div className="h-32 sm:h-40 shimmer" />
        {/* Profile info */}
        <div className="px-4 -mt-12 pb-4">
          <div className="flex items-end gap-3">
            <div className="h-20 w-20 rounded-2xl bg-slate-200 border-[3px] border-white shadow-lg skeleton" />
            <div className="ml-auto mb-1">
              <div className="h-10 w-24 rounded-xl bg-slate-100 skeleton" />
            </div>
          </div>
          <div className="mt-3 space-y-2">
            <div className="h-6 w-40 rounded-lg bg-slate-100 skeleton" />
            <div className="h-4 w-56 rounded-md bg-slate-50 skeleton" />
            <div className="h-3.5 w-32 rounded-md bg-slate-50 skeleton" />
          </div>
          <div className="mt-4 flex items-center gap-4 border-t border-slate-100 pt-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <div className="h-4 w-10 rounded bg-slate-100 skeleton" />
                <div className="h-3 w-14 rounded bg-slate-50 skeleton" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Search bar skeleton */}
      <div className="h-11 rounded-xl bg-slate-100/80 skeleton" />

      {/* Product grid skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-slate-100 overflow-hidden"
          >
            <div className="aspect-[3/4] shimmer" />
            <div className="p-3 sm:p-3.5 space-y-2.5">
              <div className="h-3.5 w-3/4 rounded-md bg-slate-100 skeleton" />
              <div className="h-3 w-1/2 rounded-md bg-slate-100 skeleton" />
              <div className="flex gap-1">
                <div className="h-5 w-8 rounded-md bg-slate-50 skeleton" />
                <div className="h-5 w-8 rounded-md bg-slate-50 skeleton" />
                <div className="h-5 w-8 rounded-md bg-slate-50 skeleton" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
