"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { IllustrationError } from "@/components/ui/illustrations";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);
  return (
    <html lang="en">
      <body className="min-h-screen bg-stone-950 text-stone-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto mb-6">
            <IllustrationError className="w-48 h-48 mx-auto" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
          <p className="text-stone-400 text-sm mb-8">
            An unexpected error occurred. Our team has been notified.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={reset}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-all active:scale-[0.98]"
            >
              Try Again
            </button>
            <a
              href="/"
              className="px-5 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 text-sm font-medium rounded-xl transition-all border border-stone-700"
            >
              Go Home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
