import { TfProductCardSkeleton, TfSellerCardSkeleton, TfSkeleton } from "@/components/tf/skeleton";

// Mirrors the TfMarketplaceShell layout (announcement strip →
// search nav → category pills → toolbar → grid) so the page
// doesn't shift when real content streams in.
export default function MarketplaceLoading() {
  return (
    <div className="min-h-screen bg-tf-surface pb-20 text-tf-ink">
      {/* Announcement strip */}
      <div className="bg-tf-deepest">
        <div className="mx-auto flex h-8 max-w-6xl items-center px-4 sm:px-6" />
      </div>

      {/* Search nav */}
      <div className="border-b border-tf-stone-200 bg-tf-raised">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:gap-4 sm:px-6">
          <TfSkeleton className="hidden h-6 w-28 sm:block" />
          <TfSkeleton className="min-h-[52px] flex-1 rounded-2xl" />
          <TfSkeleton className="h-12 w-12 rounded-2xl sm:w-24" />
          <TfSkeleton className="hidden h-12 w-28 rounded-2xl md:block" />
        </div>
      </div>

      {/* Category pills */}
      <div className="border-b border-tf-stone-200 bg-tf-raised">
        <div className="mx-auto max-w-6xl overflow-hidden px-4 sm:px-6">
          <div className="flex items-center gap-1.5 py-2.5">
            {Array.from({ length: 7 }).map((_, i) => (
              <TfSkeleton key={i} className="h-8 w-20 shrink-0 rounded-full" />
            ))}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 pt-5 sm:px-6">
        {/* Featured sellers rail */}
        <TfSkeleton className="mb-2.5 h-3 w-32" />
        <div className="mb-5 flex gap-3 overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <TfSellerCardSkeleton key={i} className="w-[260px] shrink-0" />
          ))}
        </div>

        {/* Toolbar */}
        <div className="mb-4 flex items-center gap-2 overflow-hidden">
          <TfSkeleton className="h-5 w-28" />
          {Array.from({ length: 4 }).map((_, i) => (
            <TfSkeleton key={i} className="h-8 w-24 shrink-0 rounded-full" />
          ))}
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <TfProductCardSkeleton key={i} />
          ))}
        </div>
      </main>
    </div>
  );
}
