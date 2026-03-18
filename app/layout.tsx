import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { headers } from "next/headers";
import { ClerkProvider } from "@clerk/nextjs";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { CookieConsent } from "@/components/cookie-consent";
import { FloatingWhatsApp } from "@/components/floating-whatsapp";
import { GlobalBottomNav } from "@/components/ui/global-bottom-nav";
import { Toaster } from "sonner";
import { generateSiteJsonLd } from "@/lib/seo/json-ld";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://tradefeed.co.za"),
  title: {
    default:
      "TradeFeed — South Africa's Online Marketplace | Sell & Buy Wholesale & Retail",
    template: "%s | TradeFeed — SA Online Marketplace",
  },
  description:
    "South Africa's fastest-growing online marketplace. Create your free online shop, list products with AI, and get orders via WhatsApp. Buy wholesale & retail products from verified SA sellers in Johannesburg, Durban, Cape Town & all 9 provinces. Start selling online today — no app needed.",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-icon.svg", type: "image/svg+xml" }],
  },
  keywords: [
    // Core marketplace terms
    "online marketplace South Africa",
    "sell online South Africa",
    "buy online South Africa",
    "SA marketplace",
    "ecommerce South Africa",
    // Shop creation (high intent)
    "create online shop South Africa free",
    "create online store South Africa",
    "start online business South Africa",
    "how to sell online in South Africa",
    "free online shop South Africa",
    // WhatsApp selling (unique to TradeFeed)
    "sell on WhatsApp South Africa",
    "WhatsApp catalog South Africa",
    "WhatsApp business South Africa",
    "WhatsApp selling",
    "WhatsApp shop",
    // Wholesale (huge SA market)
    "wholesale South Africa",
    "wholesale South Africa",
    "cheap wholesale South Africa",
    "buy wholesale South Africa",
    "wholesale suppliers South Africa",
    "bulk buy South Africa",
    // City-specific wholesale (Jeppe, Durban, Cape Town)
    "wholesale Johannesburg",
    "Jeppe Street wholesale",
    "wholesale Durban",
    "wholesale Cape Town",
    "wholesale Pretoria",
    // Product categories (what buyers search)
    "buy products online South Africa",
    "sell products online South Africa",
    "buy shoes online South Africa",
    "buy wholesale South Africa online",
    "sell clothes online South Africa",
    "sell electronics online South Africa",
    // Small business / reseller
    "reseller South Africa",
    "township business online",
    "sell from home South Africa",
    "side hustle South Africa",
    "small business marketplace South Africa",
  ],
  openGraph: {
    type: "website",
    siteName: "TradeFeed",
    title:
      "TradeFeed — South Africa's Online Marketplace | Sell & Buy Wholesale & Retail",
    description:
      "Create your free online shop in 2 minutes. List products with AI, share on WhatsApp, get orders. Buy wholesale & retail products from verified SA sellers.",
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
      "TradeFeed — South Africa's Online Marketplace | Sell & Buy Wholesale",
    description:
      "Create your free online shop. List products with AI. Sell on WhatsApp. Buy wholesale & retail products from verified SA sellers.",
    images: [
      "/api/og?title=Online+Marketplace+South+Africa&subtitle=Sell+Online+%E2%80%A2+Create+Your+Shop+%E2%80%A2+Free+to+Start",
    ],
  },
  alternates: {
    canonical: "https://tradefeed.co.za",
    languages: {
      "en": "https://tradefeed.co.za",
      "x-default": "https://tradefeed.co.za",
    },
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();
  const hdrs = await headers();
  const nonce = hdrs.get("x-nonce") ?? undefined;

  return (
    <ClerkProvider
      nonce={nonce}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignOutUrl="/"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
    >
      <html lang={locale} className={inter.variable}>
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
            src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID || "G-TL499XE6KR"}`}
            strategy="afterInteractive"
            nonce={nonce}
          />
          <Script id="ga4-init" strategy="afterInteractive" nonce={nonce}>
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${process.env.NEXT_PUBLIC_GA_ID || "G-TL499XE6KR"}');`}
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
            <FloatingWhatsApp />
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
          <Script id="sw-register" strategy="afterInteractive" nonce={nonce}>
            {`if('serviceWorker' in navigator){window.addEventListener('load',()=>{navigator.serviceWorker.register('/sw.js').catch(()=>{})})}`}
          </Script>
          <SpeedInsights />
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
