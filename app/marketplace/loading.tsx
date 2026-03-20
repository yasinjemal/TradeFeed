import { MarketplaceProductCardSkeleton } from "@/components/marketplace/marketplace-product-card";

export default function MarketplaceLoading() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 animate-pulse rounded-lg bg-slate-100" />
            <div className="h-5 w-24 animate-pulse rounded bg-slate-100" />
          </div>
          <div className="hidden h-8 w-48 animate-pulse rounded-full bg-slate-100 lg:block" />
          <div className="h-10 w-28 animate-pulse rounded-xl bg-slate-100" />
        </div>
      </nav>

      <section className="px-4 pb-8 pt-24 sm:px-6 sm:pb-10 sm:pt-28">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-50/80 p-6 shadow-sm shadow-slate-200/60 sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.55fr)]">
            <div>
              <div className="h-3 w-40 animate-pulse rounded bg-slate-100" />
              <div className="mt-4 h-12 w-3/4 animate-pulse rounded bg-slate-100" />
              <div className="mt-3 h-5 w-full max-w-2xl animate-pulse rounded bg-slate-100" />
              <div className="mt-2 h-5 w-2/3 animate-pulse rounded bg-slate-100" />
              <div className="mt-5 flex gap-2">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-8 w-36 animate-pulse rounded-full bg-slate-100" />
                ))}
              </div>
              <div className="mt-6 h-14 w-full max-w-3xl animate-pulse rounded-2xl bg-white" />
              <div className="mt-4 h-20 w-full max-w-3xl animate-pulse rounded-2xl bg-white" />
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-28 animate-pulse rounded-[1.5rem] bg-white" />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-4 sm:px-6">
        <div className="mx-auto flex max-w-7xl gap-2 overflow-hidden">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="h-20 w-28 shrink-0 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      </section>

      <section className="px-4 pb-3 pt-8 sm:px-6">
        <div className="mx-auto max-w-7xl rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="h-10 w-44 animate-pulse rounded-xl bg-slate-100" />
            <div className="h-10 w-32 animate-pulse rounded-xl bg-slate-100" />
          </div>
        </div>
      </section>

      <section className="px-4 py-6 sm:px-6">
        <div className="mx-auto flex max-w-7xl gap-6">
          <aside className="hidden w-[300px] shrink-0 lg:block">
            <div className="space-y-4 rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-28 animate-pulse rounded-2xl bg-slate-100" />
              ))}
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <MarketplaceProductCardSkeleton key={index} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
