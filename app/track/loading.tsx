import { TfSkeleton } from "@/components/tf/skeleton";

// Mirrors TfTrackingLanding (header → search card).
export default function TrackLoading() {
  return (
    <main className="min-h-screen bg-tf-surface text-tf-ink">
      <header className="border-b border-tf-stone-200 bg-tf-raised/90">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-5">
          <TfSkeleton className="h-6 w-28" />
          <TfSkeleton className="h-4 w-24" />
        </div>
      </header>
      <section className="mx-auto max-w-xl px-5 py-16 sm:py-24">
        <div className="space-y-4 rounded-2xl border border-tf-stone-200 bg-tf-raised p-6 sm:p-8">
          <TfSkeleton className="size-12 rounded-xl" />
          <TfSkeleton className="h-4 w-44" />
          <TfSkeleton className="h-9 w-64" />
          <TfSkeleton className="h-4 w-full max-w-md" />
          <TfSkeleton className="h-12 w-full rounded-[10px]" />
        </div>
      </section>
    </main>
  );
}
