import { TfSkeleton } from "@/components/tf/skeleton";

// Mirrors TfPaymentPage (header → intro → order summary card →
// pay button) so the payment page never opens on a blank screen.
export default function PayLoading() {
  return (
    <main className="min-h-screen bg-tf-surface text-tf-ink">
      <header className="border-b border-tf-stone-200 bg-tf-raised/90">
        <div className="mx-auto flex h-14 max-w-xl items-center justify-between px-5">
          <TfSkeleton className="h-6 w-28" />
          <TfSkeleton className="h-4 w-24" />
        </div>
      </header>
      <section className="mx-auto max-w-xl space-y-4 px-5 py-8 sm:py-12">
        <div className="space-y-2">
          <TfSkeleton className="h-4 w-28" />
          <TfSkeleton className="h-8 w-56" />
          <TfSkeleton className="h-4 w-44" />
        </div>
        <div className="space-y-3 rounded-xl border border-tf-stone-200 bg-tf-raised p-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex justify-between gap-4">
              <TfSkeleton className="h-4 w-2/5" />
              <TfSkeleton className="h-4 w-16" />
            </div>
          ))}
          <TfSkeleton className="h-5 w-full" />
        </div>
        <TfSkeleton className="h-12 w-full rounded-[10px]" />
      </section>
    </main>
  );
}
