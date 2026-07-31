import Link from "next/link";
import { SearchX } from "lucide-react";

import { TfButton } from "@/components/tf/button";

export default function HuntNotFound() {
  return (
    <div className="mx-auto flex min-h-[70svh] max-w-xl flex-col items-center justify-center px-4 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-tf-stone-100 text-tf-stone-500">
        <SearchX className="size-7" aria-hidden="true" />
      </span>
      <h1 className="mt-5 font-tf-display text-3xl font-semibold text-tf-ink">
        This Hunt is not available
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-tf-stone-600">
        It may have been removed, rejected during review, or the link may be
        incorrect.
      </p>
      <TfButton asChild className="mt-6">
        <Link href="/hunt">Start a new Hunt</Link>
      </TfButton>
    </div>
  );
}
