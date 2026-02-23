// ============================================================
// Loading — Product Detail Skeleton
// ============================================================

export default function ProductDetailLoading() {
  return (
    <div className="max-w-2xl mx-auto">
      {/* Back link skeleton */}
      <div className="h-4 w-24 rounded-md bg-stone-100 skeleton mb-4" />

      {/* Product card skeleton */}
      <div className="bg-white rounded-3xl border border-stone-100 overflow-hidden">
        {/* Image skeleton */}
        <div className="aspect-square shimmer" />

        {/* Thumbnail strip skeleton */}
        <div className="flex gap-2 p-3 bg-stone-50/50">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl shimmer flex-shrink-0"
            />
          ))}
        </div>

        {/* Info skeleton */}
        <div className="p-5 sm:p-6 space-y-5">
          <div className="space-y-2">
            <div className="h-5 w-2/3 rounded-md bg-stone-100 skeleton" />
            <div className="h-4 w-full rounded-md bg-stone-100 skeleton" />
            <div className="h-4 w-3/4 rounded-md bg-stone-100 skeleton" />
          </div>

          {/* Price skeleton */}
          <div className="h-12 rounded-2xl bg-stone-50 skeleton border border-stone-100" />

          <div className="border-t border-stone-100" />

          {/* Sizes skeleton */}
          <div className="space-y-2.5">
            <div className="h-3 w-24 rounded-md bg-stone-100 skeleton" />
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="w-12 h-10 rounded-xl bg-stone-100 skeleton"
                />
              ))}
            </div>
          </div>

          {/* Colors skeleton */}
          <div className="space-y-2.5">
            <div className="h-3 w-16 rounded-md bg-stone-100 skeleton" />
            <div className="flex gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="w-20 h-9 rounded-full bg-stone-50 skeleton border border-stone-100"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
