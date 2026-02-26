// ============================================================
// Dashboard Products — Loading Skeleton
// ============================================================

export default function ProductsLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="w-32 h-7 rounded-lg bg-stone-200 animate-pulse" />
          <div className="w-48 h-4 rounded bg-stone-100 animate-pulse" />
        </div>
        <div className="w-36 h-10 rounded-xl bg-emerald-100 animate-pulse" />
      </div>

      {/* Mapping nudge skeleton */}
      <div className="bg-amber-50/50 border border-amber-200/50 rounded-2xl p-4 flex items-center gap-4">
        <div className="w-8 h-8 rounded-lg bg-amber-100 animate-pulse" />
        <div className="flex-1 space-y-1">
          <div className="w-64 h-4 rounded bg-amber-100 animate-pulse" />
          <div className="w-48 h-3 rounded bg-amber-50 animate-pulse" />
        </div>
      </div>

      {/* Product cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-stone-200 overflow-hidden"
          >
            <div
              className="aspect-[4/3] bg-stone-100 animate-pulse"
              style={{ animationDelay: `${i * 80}ms` }}
            />
            <div className="p-4 space-y-3">
              <div className="w-3/4 h-5 rounded bg-stone-100 animate-pulse" />
              <div className="flex items-center justify-between">
                <div className="w-20 h-4 rounded bg-stone-100 animate-pulse" />
                <div className="w-16 h-6 rounded-full bg-stone-50 animate-pulse" />
              </div>
              <div className="flex gap-2">
                <div className="w-14 h-5 rounded-full bg-stone-50 animate-pulse" />
                <div className="w-14 h-5 rounded-full bg-stone-50 animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
