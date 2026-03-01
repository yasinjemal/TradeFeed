import type { Metadata } from "next";
import Script from "next/script";
import { ClerkProvider } from "@clerk/nextjs";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { CookieConsent } from "@/components/cookie-consent";
import { GlobalBottomNav } from "@/components/ui/global-bottom-nav";
import { Toaster } from "sonner";
import { generateSiteJsonLd } from "@/lib/seo/json-ld";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://tradefeed.co.za"),
  title: {
    default:
      "TradeFeed | Online Marketplace South Africa — Sell Online & Create Your Shop",
    template: "%s | TradeFeed — SA Online Marketplace",
  },
  description:
    "TradeFeed is South Africa's online marketplace where sellers create their own online shop for free, list products, and receive structured orders via WhatsApp. Join hundreds of sellers across all 9 provinces — start selling online in South Africa today.",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-icon.svg", type: "image/svg+xml" }],
  },
  keywords: [
    "online marketplace South Africa",
    "sell online South Africa",
    "create online shop South Africa",
    "South African marketplace",
    "sell products online SA",
    "create online store South Africa",
    "WhatsApp catalog",
    "WhatsApp selling",
    "buy online South Africa",
    "SA marketplace",
    "online shop South Africa free",
    "ecommerce South Africa",
    "wholesale South Africa",
    "sell on WhatsApp",
    "SA online store",
  ],
  openGraph: {
    type: "website",
    siteName: "TradeFeed",
    title:
      "TradeFeed | Online Marketplace South Africa — Sell Online & Create Your Shop",
    description:
      "South Africa's online marketplace for sellers and buyers. Create your online shop for free, list products, and get orders via WhatsApp. Start selling online in South Africa today.",
    url: "https://tradefeed.co.za",
    images: [
      {
        url: "/api/og?title=Online+Marketplace+South+Africa&subtitle=Sell+Online+%E2%80%A2+Create+Your+Shop+%E2%80%A2+Free+to+Start",
        width: 1200,
        height: 630,
        alt: "TradeFeed — Online Marketplace South Africa for Sellers & Buyers",
      },
    ],
    locale: "en_ZA",
  },
  twitter: {
    card: "summary_large_image",
    title:
      "TradeFeed | Online Marketplace South Africa — Sell Online & Create Your Shop",
    description:
      "South Africa's online marketplace. Create your online shop for free, list products, and get orders via WhatsApp. Start selling online today.",
    images: [
      "/api/og?title=Online+Marketplace+South+Africa&subtitle=Sell+Online+%E2%80%A2+Create+Your+Shop+%E2%80%A2+Free+to+Start",
    ],
  },
  alternates: {
    canonical: "https://tradefeed.co.za",
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
    >
      <html lang={locale}>
        <head>
          {/* Google Merchant Center verification */}
          <meta name="google-site-verification" content="t7VN3FQbd8ShLmh9D_6FGqAgNepY9Dm5CwUZLagBhXs" />
          {/* Site-wide JSON-LD: Organization + WebSite (sitelinks search box) */}
          {generateSiteJsonLd().map((schema, i) => (
            <script
              key={`site-ld-${i}`}
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
            />
          ))}
          {/* PWA */}
          <link rel="manifest" href="/manifest.json" />
          <meta name="theme-color" content="#059669" />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
          <meta name="apple-mobile-web-app-title" content="TradeFeed" />
          {/* Google Analytics 4 — in <head> for Google Merchant Center verification */}
          <Script
            src="https://www.googletagmanager.com/gtag/js?id=G-TL499XE6KR"
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-TL499XE6KR');`}
          </Script>
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
          {/* Register Service Worker for PWA */}
          <Script id="sw-register" strategy="afterInteractive">
            {`if('serviceWorker' in navigator){window.addEventListener('load',()=>{navigator.serviceWorker.register('/sw.js').catch(()=>{})})}`}
          </Script>
        </body>
      </html>
    </ClerkProvider>
  );
}
