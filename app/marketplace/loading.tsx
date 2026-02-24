// ============================================================
// Marketplace Loading Skeleton (M3.10)
// ============================================================
// Shimmer grid matching the marketplace layout. Shows while
// the server component fetches data.
// ============================================================

export default function MarketplaceLoading() {
  return (
    <main className="min-h-screen bg-stone-950 text-stone-100">
      {/* Navbar skeleton */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-stone-950/80 backdrop-blur-xl border-b border-stone-800/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 h-16">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-stone-800 animate-pulse" />
            <div className="w-24 h-5 rounded bg-stone-800 animate-pulse" />
          </div>
          <div className="hidden md:block w-64 h-10 rounded-xl bg-stone-900 animate-pulse" />
          <div className="w-24 h-9 rounded-lg bg-stone-800 animate-pulse" />
        </div>
      </nav>

      {/* Hero skeleton */}
      <section className="pt-24 pb-6 sm:pt-28 sm:pb-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="w-80 h-10 rounded bg-stone-800 animate-pulse" />
          <div className="w-96 h-5 rounded bg-stone-900 animate-pulse mt-3" />
        </div>
      </section>

      {/* Category bar skeleton */}
      <section className="px-4 sm:px-6 pb-4">
        <div className="max-w-7xl mx-auto flex gap-2 overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="w-28 h-9 rounded-xl bg-stone-900 animate-pulse shrink-0"
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
      </section>

      {/* Grid skeleton */}
      <section className="px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="w-40 h-5 rounded bg-stone-900 animate-pulse" />
            <div className="w-32 h-9 rounded-xl bg-stone-900 animate-pulse" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="bg-stone-900 rounded-2xl border border-stone-800/50 overflow-hidden">
                <div
                  className="aspect-[3/4] bg-stone-800 animate-pulse"
                  style={{ animationDelay: `${i * 80}ms` }}
                />
                <div className="p-3 space-y-2">
                  <div className="w-16 h-2.5 rounded bg-stone-800 animate-pulse" />
                  <div className="w-full h-4 rounded bg-stone-800 animate-pulse" />
                  <div className="w-24 h-3 rounded bg-stone-800/50 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
