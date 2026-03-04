// ============================================================
// Component — WhatsApp CTA Product Setter
// ============================================================
// Invisible component that sets the product name in the
// WhatsApp CTA context. Placed on product detail pages.
// ============================================================

"use client";

import { useEffect } from "react";
import { useWhatsAppCTA } from "./whatsapp-cta-context";

interface WhatsAppCTAProductSetterProps {
  productName: string;
}

export function WhatsAppCTAProductSetter({ productName }: WhatsAppCTAProductSetterProps) {
  const { setProductName } = useWhatsAppCTA();

  useEffect(() => {
    setProductName(productName);
    return () => setProductName(null);
  }, [productName, setProductName]);

  return null;
}
