// ============================================================
// Dashboard Overview — Loading Skeleton
// ============================================================

export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hero welcome skeleton */}
      <div className="rounded-3xl bg-gradient-to-br from-stone-200 via-stone-100 to-stone-200 p-7 sm:p-10">
        <div className="space-y-3">
          <div className="w-56 h-7 rounded-lg bg-stone-300/60 animate-pulse" />
          <div className="w-80 h-4 rounded bg-stone-300/40 animate-pulse" />
        </div>
      </div>

      {/* Stat cards skeleton (4 cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-stone-200 p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-stone-100 animate-pulse" />
              <div className="w-16 h-4 rounded bg-stone-100 animate-pulse" />
            </div>
            <div className="w-20 h-8 rounded-lg bg-stone-100 animate-pulse" />
            <div className="w-28 h-3 rounded bg-stone-50 animate-pulse" />
          </div>
        ))}
      </div>

      {/* Profile completeness + Recent products row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile completeness */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
          <div className="w-40 h-5 rounded bg-stone-100 animate-pulse" />
          <div className="w-full h-3 rounded-full bg-stone-100 animate-pulse" />
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-stone-100 animate-pulse" />
                <div
                  className="h-3 rounded bg-stone-100 animate-pulse"
                  style={{ width: `${60 + i * 10}%`, animationDelay: `${i * 100}ms` }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Recent products */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
          <div className="w-36 h-5 rounded bg-stone-100 animate-pulse" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl bg-stone-100 animate-pulse"
                style={{ animationDelay: `${i * 80}ms` }}
              />
              <div className="flex-1 space-y-1.5">
                <div className="w-3/4 h-4 rounded bg-stone-100 animate-pulse" />
                <div className="w-1/3 h-3 rounded bg-stone-50 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions skeleton */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
        <div className="w-32 h-5 rounded bg-stone-100 animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-20 rounded-xl bg-stone-50 border border-stone-100 animate-pulse"
              style={{ animationDelay: `${i * 60}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
