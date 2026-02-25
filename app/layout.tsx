import type { Metadata } from "next";
import Script from "next/script";
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
        <head>
          {/* PWA */}
          <link rel="manifest" href="/manifest.json" />
          <meta name="theme-color" content="#059669" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
          <meta name="apple-mobile-web-app-title" content="TradeFeed" />
          <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
        </head>
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
          {/* Google Analytics 4 */}
          <Script
            src="https://www.googletagmanager.com/gtag/js?id=G-TL499XE6KR"
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-TL499XE6KR');`}
          </Script>
          {/* Register Service Worker for PWA */}
          <script
            dangerouslySetInnerHTML={{
              __html: `if('serviceWorker' in navigator){window.addEventListener('load',()=>{navigator.serviceWorker.register('/sw.js').catch(()=>{})})}`
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
