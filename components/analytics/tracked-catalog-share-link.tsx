"use client";

import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type MouseEvent,
} from "react";

import { trackCatalogSharedAction } from "@/app/actions/onboarding";

interface TrackedCatalogShareLinkProps
  extends ComponentPropsWithoutRef<"a"> {
  shopSlug: string;
}

export const TrackedCatalogShareLink = forwardRef<
  HTMLAnchorElement,
  TrackedCatalogShareLinkProps
>(function TrackedCatalogShareLink(
  { shopSlug, onClick, ...props },
  ref,
) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (!event.defaultPrevented) {
      void trackCatalogSharedAction(shopSlug, "dashboard");
    }
  };

  return <a ref={ref} {...props} onClick={handleClick} />;
});
