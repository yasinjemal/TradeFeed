"use client";

import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type MouseEvent,
} from "react";

import { trackWhatsAppClickAction } from "@/app/actions/analytics";

interface TrackedWhatsAppLinkProps extends ComponentPropsWithoutRef<"a"> {
  shopId: string;
  productId?: string;
}

export const TrackedWhatsAppLink = forwardRef<
  HTMLAnchorElement,
  TrackedWhatsAppLinkProps
>(function TrackedWhatsAppLink(
  { shopId, productId, onClick, ...props },
  ref,
) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (!event.defaultPrevented) {
      void trackWhatsAppClickAction(shopId, productId);
    }
  };

  return <a ref={ref} {...props} onClick={handleClick} />;
});
