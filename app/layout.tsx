import type { Metadata } from "next";
import Script from "next/script";
import { ClerkProvider } from "@clerk/nextjs";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { CookieConsent } from "@/components/cookie-consent";
import { GlobalBottomNav } from "@/components/ui/global-bottom-nav";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://tradefeed.co.za"),
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
  openGraph: {
    type: "website",
    siteName: "TradeFeed",
    title: "TradeFeed — WhatsApp Catalogs for SA Wholesalers",
    description:
      "Upload products, share your catalog link, get structured WhatsApp orders. Free for South African wholesalers & retailers.",
    url: "https://tradefeed.co.za",
    images: [
      {
        url: "/api/og?title=TradeFeed&subtitle=WhatsApp+Catalogs+for+SA+Wholesalers",
        width: 1200,
        height: 630,
        alt: "TradeFeed — WhatsApp Catalogs for SA Wholesalers",
      },
    ],
    locale: "en_ZA",
  },
  twitter: {
    card: "summary_large_image",
    title: "TradeFeed — WhatsApp Catalogs for SA Wholesalers",
    description:
      "Upload products, share your catalog link, get structured WhatsApp orders. Free for South African wholesalers & retailers.",
    images: ["/api/og?title=TradeFeed&subtitle=WhatsApp+Catalogs+for+SA+Wholesalers"],
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignOutUrl="/"
      signInFallbackRedirectUrl="/create-shop"
      signUpFallbackRedirectUrl="/create-shop"
      dynamic
    >
      <html lang={locale}>
        <head>
          {/* PWA */}
          <link rel="manifest" href="/manifest.json" />
          <meta name="theme-color" content="#059669" />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
          <meta name="apple-mobile-web-app-title" content="TradeFeed" />
          <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
        </head>
        <body>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-emerald-600 focus:text-white focus:rounded-lg focus:text-sm focus:font-semibold"
          >
            Skip to content
          </a>
          <NextIntlClientProvider messages={messages}>
            <main id="main-content">{children}</main>
            <GlobalBottomNav />
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
          </NextIntlClientProvider>
          {/* Google Analytics 4 — nonce auto-injected by Next.js + Clerk strict CSP */}
          <Script
            src="https://www.googletagmanager.com/gtag/js?id=G-TL499XE6KR"
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-TL499XE6KR');`}
          </Script>
          {/* Register Service Worker for PWA */}
          <Script id="sw-register" strategy="afterInteractive">
            {`if('serviceWorker' in navigator){window.addEventListener('load',()=>{navigator.serviceWorker.register('/sw.js').catch(()=>{})})}`}
          </Script>
        </body>
      </html>
    </ClerkProvider>
  );
}
