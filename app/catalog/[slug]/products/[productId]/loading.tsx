import { TfSkeleton } from "@/components/tf/skeleton";

// Mirrors TfProductPage (back link → gallery | title/price/
// options/CTAs → seller card) so nothing shifts on load.
export default function ProductDetailLoading() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 pb-28 lg:pb-6">
      {/* Back link */}
      <TfSkeleton className="h-4 w-28" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-10">
        {/* Gallery */}
        <TfSkeleton className="aspect-square w-full rounded-xl" />

        {/* Info + order panel */}
        <div className="space-y-5">
          <div className="space-y-3">
            <TfSkeleton className="h-6 w-24 rounded-full" />
            <TfSkeleton className="h-9 w-4/5" />
            <TfSkeleton className="h-4 w-32" />
          </div>

          <TfSkeleton className="h-11 w-40" />

          {/* Option pills */}
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <TfSkeleton key={i} className="h-11 w-16 rounded-full" />
            ))}
          </div>

          {/* Quantity + CTAs */}
          <TfSkeleton className="h-11 w-40 rounded-full" />
          <TfSkeleton className="hidden h-12 w-full rounded-[10px] lg:block" />
          <TfSkeleton className="hidden h-12 w-full rounded-[10px] lg:block" />

          {/* Seller card */}
          <div className="flex items-center gap-3 rounded-xl border border-tf-stone-200 bg-tf-raised p-4">
            <TfSkeleton className="size-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <TfSkeleton className="h-4 w-2/5" />
              <TfSkeleton className="h-3.5 w-3/5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
