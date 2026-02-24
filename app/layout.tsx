import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { CookieConsent } from "@/components/cookie-consent";
import "./globals.css";

export const metadata: Metadata = {
  title: "TradeFeed — Structured Clothing Catalogs for WhatsApp Sellers",
  description:
    "Upload products. Share your catalog link. Get organized orders via WhatsApp — no app download required. Built for South African clothing wholesalers & retailers.",
  keywords: [
    "WhatsApp catalog",
    "clothing wholesale South Africa",
    "digital catalog",
    "WhatsApp selling",
    "Jeppe fashion",
    "SA wholesale",
    "clothing inventory",
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
          <CookieConsent />
        </body>
      </html>
    </ClerkProvider>
  );
}
