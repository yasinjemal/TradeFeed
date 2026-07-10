import { TfProductCardSkeleton, TfSkeleton } from "@/components/tf/skeleton";

// Mirrors TfStorefront (hero seller card → fulfilment strip →
// product grid) so nothing shifts when the real page streams in.
export default function CatalogLoading() {
  return (
    <div className="space-y-5 pb-20">
      {/* Hero seller card */}
      <div className="flex items-start gap-4 rounded-xl border border-tf-stone-200 bg-tf-raised p-5">
        <TfSkeleton className="size-16 rounded-full" />
        <div className="flex-1 space-y-2.5">
          <TfSkeleton className="h-6 w-48" />
          <TfSkeleton className="h-4 w-64" />
          <TfSkeleton className="h-4 w-36" />
        </div>
      </div>

      {/* Fulfilment promise strip */}
      <TfSkeleton className="h-16 w-full rounded-xl" />

      {/* Search / filter row */}
      <div className="flex items-center gap-2">
        <TfSkeleton className="h-11 flex-1 rounded-[10px]" />
        <TfSkeleton className="h-11 w-24 rounded-[10px]" />
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <TfProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
