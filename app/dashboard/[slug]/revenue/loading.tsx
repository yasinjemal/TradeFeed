// ============================================================
// Dashboard Revenue — Loading Skeleton
// ============================================================

export default function RevenueLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header + date filter */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="w-28 h-7 rounded-lg bg-stone-200 animate-pulse" />
          <div className="w-48 h-4 rounded bg-stone-100 animate-pulse" />
        </div>
        <div className="w-28 h-9 rounded-xl bg-stone-100 animate-pulse" />
      </div>

      {/* Revenue overview cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-stone-200 p-5 space-y-3"
          >
            <div className="w-20 h-3 rounded bg-stone-100 animate-pulse" />
            <div
              className="w-24 h-8 rounded-lg bg-stone-100 animate-pulse"
              style={{ animationDelay: `${i * 80}ms` }}
            />
            <div className="w-16 h-3 rounded bg-stone-50 animate-pulse" />
          </div>
        ))}
      </div>

      {/* Revenue chart skeleton */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6">
        <div className="w-32 h-5 rounded bg-stone-100 animate-pulse mb-4" />
        <div className="h-48 flex items-end gap-2">
          {Array.from({ length: 14 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 bg-emerald-50 rounded-t animate-pulse"
              style={{
                height: `${15 + Math.sin(i * 0.5) * 35 + 35}%`,
                animationDelay: `${i * 50}ms`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Top products by revenue */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
        <div className="w-44 h-5 rounded bg-stone-100 animate-pulse" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl bg-stone-100 animate-pulse"
              style={{ animationDelay: `${i * 60}ms` }}
            />
            <div className="flex-1 space-y-1">
              <div className="w-3/5 h-4 rounded bg-stone-100 animate-pulse" />
              <div className="w-1/4 h-3 rounded bg-stone-50 animate-pulse" />
            </div>
            <div className="w-20 h-5 rounded bg-stone-100 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
