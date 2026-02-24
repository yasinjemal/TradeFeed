import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { CookieConsent } from "@/components/cookie-consent";
import "./globals.css";

export const metadata: Metadata = {
  title: "TradeFeed — Digital Catalogs for SA Wholesalers",
  description:
    "Replace chaotic WhatsApp selling with structured digital catalog infrastructure for South African clothing wholesalers & retailers.",
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
