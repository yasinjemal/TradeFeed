import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { CookieConsent } from "@/components/cookie-consent";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "TradeFeed — Structured Product Catalogs for WhatsApp Sellers",
  description:
    "Upload products. Share your catalog link. Get organized orders via WhatsApp — no app download required. Built for South African wholesalers & retailers.",
  keywords: [
    "WhatsApp catalog",
    "wholesale South Africa",
    "digital catalog",
    "WhatsApp selling",
    "Jeppe wholesale",
    "SA wholesale",
    "product inventory",
    "SA marketplace",
    "buy online South Africa",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignOutUrl="/"
    >
      <html lang="en">
        <body>
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: "#1c1917",
                color: "#fafaf9",
                border: "none",
                borderRadius: "12px",
                fontSize: "13px",
                padding: "12px 16px",
              },
            }}
            expand={false}
            richColors
          />
          <CookieConsent />
        </body>
      </html>
    </ClerkProvider>
  );
}
