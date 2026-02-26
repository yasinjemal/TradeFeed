// ============================================================
// Dashboard Analytics — Loading Skeleton
// ============================================================

export default function AnalyticsLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header + date filter */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="w-32 h-7 rounded-lg bg-stone-200 animate-pulse" />
          <div className="w-56 h-4 rounded bg-stone-100 animate-pulse" />
        </div>
        <div className="w-28 h-9 rounded-xl bg-stone-100 animate-pulse" />
      </div>

      {/* Stat cards (4 metrics) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-stone-200 p-5 space-y-3"
          >
            <div className="w-24 h-3 rounded bg-stone-100 animate-pulse" />
            <div
              className="w-16 h-8 rounded-lg bg-stone-100 animate-pulse"
              style={{ animationDelay: `${i * 80}ms` }}
            />
            <div className="w-20 h-3 rounded bg-stone-50 animate-pulse" />
          </div>
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6">
        <div className="w-28 h-5 rounded bg-stone-100 animate-pulse mb-4" />
        <div className="h-48 flex items-end gap-2">
          {Array.from({ length: 14 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 bg-stone-100 rounded-t animate-pulse"
              style={{
                height: `${20 + Math.sin(i * 0.7) * 40 + 30}%`,
                animationDelay: `${i * 50}ms`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Top products skeleton */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
        <div className="w-32 h-5 rounded bg-stone-100 animate-pulse" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-6 h-4 rounded bg-stone-50 animate-pulse" />
            <div
              className="flex-1 h-4 rounded bg-stone-100 animate-pulse"
              style={{ width: `${80 - i * 12}%`, animationDelay: `${i * 60}ms` }}
            />
            <div className="w-12 h-4 rounded bg-stone-100 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
