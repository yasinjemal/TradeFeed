// ============================================================
// Loading — Product Detail Skeleton
// ============================================================

export default function ProductDetailLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl">
      {/* Breadcrumb skeleton */}
      <div className="mb-5 flex items-center gap-2">
        <div className="h-4 w-20 rounded-md bg-slate-100 skeleton" />
        <div className="h-3 w-3 rounded bg-slate-100" />
        <div className="h-4 w-16 rounded-md bg-slate-100 skeleton" />
        <div className="h-3 w-3 rounded bg-slate-100" />
        <div className="h-4 w-32 rounded-md bg-slate-100 skeleton" />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
        {/* LEFT — Gallery skeleton */}
        <div className="lg:col-span-7">
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <div className="aspect-square shimmer" />
            <div className="flex gap-2 bg-slate-50/50 p-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 w-16 flex-shrink-0 rounded-xl shimmer sm:h-20 sm:w-20" />
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — Info skeleton */}
        <div className="space-y-5 lg:col-span-5">
          {/* Product info card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-5">
            <div className="space-y-2">
              <div className="h-5 w-20 rounded-full bg-emerald-50 skeleton" />
              <div className="h-6 w-4/5 rounded-md bg-slate-100 skeleton" />
              <div className="h-4 w-1/3 rounded-md bg-slate-100 skeleton" />
            </div>
            <div className="h-20 rounded-2xl bg-slate-50 skeleton border border-slate-100" />
            <div className="border-t border-slate-100" />
            <div className="space-y-2.5">
              <div className="h-3 w-24 rounded-md bg-slate-100 skeleton" />
              <div className="flex gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-10 w-12 rounded-xl bg-slate-100 skeleton" />
                ))}
              </div>
            </div>
            <div className="h-12 w-full rounded-xl bg-emerald-100 skeleton" />
          </div>

          {/* Seller info card skeleton */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-slate-100 skeleton" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 rounded-md bg-slate-100 skeleton" />
                <div className="h-3 w-20 rounded-full bg-emerald-50 skeleton" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 rounded-xl bg-slate-50 p-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-1 text-center">
                  <div className="mx-auto h-5 w-8 rounded bg-slate-100 skeleton" />
                  <div className="mx-auto h-3 w-12 rounded bg-slate-100 skeleton" />
                </div>
              ))}
            </div>
            <div className="h-10 w-full rounded-xl bg-slate-100 skeleton" />
          </div>

          {/* Trust messaging skeleton */}
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 space-y-3">
            <div className="h-3 w-28 rounded bg-emerald-100 skeleton" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className="h-5 w-5 rounded-full bg-emerald-100 skeleton" />
                <div className="h-3.5 w-40 rounded bg-emerald-100/60 skeleton" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
