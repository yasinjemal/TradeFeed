import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { headers } from "next/headers";
import { ClerkProvider } from "@clerk/nextjs";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { ThemeProvider } from "next-themes";
import { CookieConsent } from "@/components/cookie-consent";
import { FloatingWhatsApp } from "@/components/floating-whatsapp";
import { GlobalBottomNav } from "@/components/ui/global-bottom-nav";
import { AppToaster } from "@/components/ui/app-toaster";
import { generateSiteJsonLd } from "@/lib/seo/json-ld";
import { FEATURE_FLAGS } from "@/lib/config/feature-flags";
import { env } from "@/lib/env";
import { ConsentManagedAnalytics } from "@/components/analytics/consent-managed-analytics";
import "./globals.css";

const GOOGLE_ANALYTICS_ID =
  env.NEXT_PUBLIC_GA_MEASUREMENT_REVIEWED === "true"
    ? env.NEXT_PUBLIC_GA_ID
    : undefined;
const GOOGLE_ANALYTICS_COOKIE_ID =
  env.NEXT_PUBLIC_GA_ID ?? "G-DISABLED";

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
    "South Africa's WhatsApp-first marketplace. Create a free online shop, let AI write your listings, and take orders on WhatsApp.",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-icon.svg", type: "image/svg+xml" }],
  },
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
        url: "/api/og?type=marketplace&title=Online+Marketplace+South+Africa&subtitle=Sell+Online+%E2%80%A2+Create+Your+Shop+%E2%80%A2+Free+to+Start",
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
      "/api/og?type=marketplace&title=Online+Marketplace+South+Africa&subtitle=Sell+Online+%E2%80%A2+Create+Your+Shop+%E2%80%A2+Free+to+Start",
    ],
  },
  // NOTE: canonical is intentionally NOT set here — it would propagate
  // to all child pages via Next.js metadata merging, causing Google to
  // treat every page as a duplicate of the homepage. Each page sets its
  // own canonical in its own generateMetadata / metadata export.
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
      <html lang={locale} className={inter.variable} suppressHydrationWarning>
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
          {/* Deny analytics by default before any measurement vendor can load. */}
          <script
            nonce={nonce}
            dangerouslySetInnerHTML={{
              __html: `window.dataLayer=window.dataLayer||[];window.gtag=window.gtag||function(){window.dataLayer.push(arguments);};window[${JSON.stringify(`ga-disable-${GOOGLE_ANALYTICS_COOKIE_ID}`)}]=true;window.gtag("consent","default",{analytics_storage:"denied",ad_storage:"denied",ad_user_data:"denied",ad_personalization:"denied",wait_for_update:500});`,
            }}
          />
        </head>
        <body>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-emerald-600 focus:text-white focus:rounded-lg focus:text-sm focus:font-semibold"
          >
            Skip to content
          </a>
          {/* Dark mode rides the TF redesign flag: while UI_REDESIGN is off,
              force light so the live legacy UI is untouched; when the flag
              flips, users get their system preference + the TfThemeToggle. */}
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            forcedTheme={FEATURE_FLAGS.UI_REDESIGN ? undefined : "light"}
          >
            <NextIntlClientProvider messages={messages}>
              <main id="main-content">{children}</main>
              <GlobalBottomNav />
              <FloatingWhatsApp />
              <AppToaster />
              <CookieConsent googleAnalyticsId={GOOGLE_ANALYTICS_COOKIE_ID} />
            </NextIntlClientProvider>
          </ThemeProvider>
          {/* Register Service Worker for PWA */}
          <Script id="sw-register" strategy="afterInteractive" nonce={nonce}>
            {`if('serviceWorker' in navigator){window.addEventListener('load',()=>{navigator.serviceWorker.register('/sw.js').catch(()=>{})})}`}
          </Script>
          <ConsentManagedAnalytics
            googleAnalyticsId={GOOGLE_ANALYTICS_ID}
            nonce={nonce}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
