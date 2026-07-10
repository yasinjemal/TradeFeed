import { TfSkeleton } from "@/components/tf/skeleton";

// Mirrors TfOrderTracking (status hero → progress card → order
// summary) so the tracking link opened from WhatsApp feels instant.
export default function TrackOrderLoading() {
  return (
    <main className="min-h-screen bg-tf-surface text-tf-ink">
      <header className="border-b border-tf-stone-200 bg-tf-raised/90">
        <div className="mx-auto flex h-14 max-w-xl items-center justify-between px-5">
          <TfSkeleton className="h-6 w-28" />
          <TfSkeleton className="h-4 w-24" />
        </div>
      </header>
      <section className="mx-auto max-w-xl space-y-4 px-5 py-8 sm:py-12">
        {/* Status hero */}
        <div className="space-y-3 rounded-2xl bg-tf-deep p-6">
          <TfSkeleton className="h-4 w-24 bg-white/15" />
          <TfSkeleton className="h-8 w-48 bg-white/15" />
          <TfSkeleton className="h-4 w-64 bg-white/15" />
        </div>

        {/* Progress */}
        <div className="space-y-4 rounded-xl border border-tf-stone-200 bg-tf-raised p-5">
          <TfSkeleton className="h-5 w-32" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <TfSkeleton className="size-7 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <TfSkeleton className="h-4 w-32" />
                <TfSkeleton className="h-3 w-52" />
              </div>
            </div>
          ))}
        </div>

        {/* Order summary */}
        <div className="space-y-3 rounded-xl border border-tf-stone-200 bg-tf-raised p-5">
          <TfSkeleton className="h-5 w-28" />
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex justify-between gap-4">
              <TfSkeleton className="h-4 w-2/5" />
              <TfSkeleton className="h-4 w-16" />
            </div>
          ))}
          <TfSkeleton className="h-5 w-full" />
        </div>
      </section>
    </main>
  );
}
