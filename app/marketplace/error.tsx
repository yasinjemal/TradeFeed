"use client";

import * as React from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";
import { CircleAlert } from "lucide-react";

import { TfButton } from "@/components/tf/button";
import { TfEmptyState } from "@/components/tf/empty-state";

export default function MarketplaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-tf-surface px-4 text-tf-ink">
      <TfEmptyState
        icon={<CircleAlert />}
        title="The marketplace hit a snag"
        description="Something went wrong loading products. It's usually temporary — try again, or come back in a moment."
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <TfButton onClick={() => reset()}>Try again</TfButton>
            <TfButton variant="secondary" asChild>
              <Link href="/">Back to home</Link>
            </TfButton>
          </div>
        }
      />
    </main>
  );
}
