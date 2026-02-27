"use client";

import Link from "next/link";
import { IllustrationError } from "@/components/ui/illustrations";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto mb-6">
          <IllustrationError className="w-48 h-48 mx-auto" />
        </div>
        <h2 className="text-xl font-bold text-stone-900 mb-2">Something went wrong</h2>
        <p className="text-stone-500 text-sm mb-8">
          We hit an unexpected error. Please try again.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-all active:scale-[0.98]"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-medium rounded-xl transition-all border border-stone-200"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
