// ============================================================
// Context — Sticky WhatsApp CTA Product Context
// ============================================================
// Allows product detail pages to override the generic WhatsApp
// message with a product-specific "I'm interested in {name}".
// ============================================================

"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface WhatsAppCTAContextValue {
  productName: string | null;
  setProductName: (name: string | null) => void;
}

const WhatsAppCTAContext = createContext<WhatsAppCTAContextValue>({
  productName: null,
  setProductName: () => {},
});

export function WhatsAppCTAProvider({ children }: { children: ReactNode }) {
  const [productName, setProductNameState] = useState<string | null>(null);
  const setProductName = useCallback((name: string | null) => setProductNameState(name), []);

  return (
    <WhatsAppCTAContext.Provider value={{ productName, setProductName }}>
      {children}
    </WhatsAppCTAContext.Provider>
  );
}

export function useWhatsAppCTA() {
  return useContext(WhatsAppCTAContext);
}
