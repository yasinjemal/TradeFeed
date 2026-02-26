// ============================================================
// Dashboard Orders — Loading Skeleton
// ============================================================

export default function OrdersLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <div className="w-28 h-7 rounded-lg bg-stone-200 animate-pulse" />
        <div className="w-52 h-4 rounded bg-stone-100 animate-pulse mt-1" />
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-stone-200 p-4 space-y-2"
          >
            <div className="w-20 h-3 rounded bg-stone-100 animate-pulse" />
            <div
              className="w-12 h-7 rounded-lg bg-stone-100 animate-pulse"
              style={{ animationDelay: `${i * 60}ms` }}
            />
          </div>
        ))}
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="w-24 h-9 rounded-xl bg-stone-100 animate-pulse shrink-0"
            style={{ animationDelay: `${i * 50}ms` }}
          />
        ))}
      </div>

      {/* Order rows */}
      <div className="bg-white rounded-2xl border border-stone-200 divide-y divide-stone-100">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-4 flex items-center gap-4">
            <div className="w-20 h-4 rounded bg-stone-100 animate-pulse" />
            <div className="flex-1 space-y-1">
              <div
                className="w-48 h-4 rounded bg-stone-100 animate-pulse"
                style={{ animationDelay: `${i * 80}ms` }}
              />
              <div className="w-32 h-3 rounded bg-stone-50 animate-pulse" />
            </div>
            <div className="w-16 h-6 rounded-full bg-stone-100 animate-pulse" />
            <div className="w-20 h-4 rounded bg-stone-100 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
