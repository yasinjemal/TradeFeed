// ============================================================
// Loading — Catalog Page Skeleton
// ============================================================
// Shown while the catalog SSR page loads on slow mobile data.
// Matches the grid layout so the transition feels seamless.
// ============================================================

export default function CatalogLoading() {
  return (
    <div className="space-y-5">
      {/* Summary bar skeleton */}
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-stone-200 skeleton" />
        <div className="h-4 w-32 rounded-md bg-stone-200 skeleton" />
      </div>

      {/* Product grid skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-stone-100 overflow-hidden"
          >
            {/* Image skeleton */}
            <div className="aspect-[3/4] shimmer" />

            {/* Info skeleton */}
            <div className="p-3 sm:p-3.5 space-y-2.5">
              <div className="h-3.5 w-3/4 rounded-md bg-stone-100 skeleton" />
              <div className="h-3 w-1/2 rounded-md bg-stone-100 skeleton" />
              <div className="flex gap-1">
                <div className="h-5 w-8 rounded-md bg-stone-50 skeleton" />
                <div className="h-5 w-8 rounded-md bg-stone-50 skeleton" />
                <div className="h-5 w-8 rounded-md bg-stone-50 skeleton" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
