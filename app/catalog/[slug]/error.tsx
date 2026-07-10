"use client";

import * as React from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";
import { CircleAlert } from "lucide-react";

import { TfButton } from "@/components/tf/button";
import { TfEmptyState } from "@/components/tf/empty-state";

export default function CatalogError({
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
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <TfEmptyState
        icon={<CircleAlert />}
        title="This shop didn't load"
        description="Something went wrong on our side. Try again — the shop and its products are safe."
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <TfButton onClick={() => reset()}>Try again</TfButton>
            <TfButton variant="secondary" asChild>
              <Link href="/marketplace">Browse the marketplace</Link>
            </TfButton>
          </div>
        }
      />
    </div>
  );
}
