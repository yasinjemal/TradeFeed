// ============================================================
// Clerk Proxy — Route Protection + Rate Limiting
// ============================================================
// Next.js 16 proxy convention (replaces middleware.ts).
// Protects private routes (dashboard, create-shop, API).
// Public routes: home, catalog, sign-in, sign-up, webhooks.
// Rate limits public routes to prevent abuse.
// ============================================================

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit-upstash";
import {
  ANALYTICS_CONSENT_COOKIE,
  parseAnalyticsConsent,
} from "@/lib/analytics/consent";
import {
  ANALYTICS_VISITOR_COOKIE,
  ANALYTICS_VISITOR_HEADER,
  analyticsVisitorCookieOptions,
  isSyntheticMonitorRequest,
  resolveConsentManagedVisitorId,
} from "@/lib/analytics/visitor";

// In-memory cache for custom domain → shop slug lookups (5 min TTL)
const domainCache = new Map<string, { slug: string | null; ts: number }>();
const DOMAIN_CACHE_TTL = 5 * 60 * 1000;

// Known platform hostnames that should NOT trigger custom domain lookup
const PLATFORM_HOSTS = new Set([
  "tradefeed.co.za",
  "www.tradefeed.co.za",
  "trade-feed.vercel.app",
  "localhost",
  "127.0.0.1",
]);

function isPlatformHost(host: string): boolean {
  const bare = host.split(":")[0]!.toLowerCase();
  return PLATFORM_HOSTS.has(bare) || bare.endsWith(".vercel.app");
}

// Routes that DON'T require authentication
const isPublicRoute = createRouteMatcher([
  "/",                              // Landing page
  "/sign-in(.*)",                   // Clerk sign-in
  "/sign-up(.*)",                   // Clerk sign-up
  "/catalog/(.*)",                  // Public storefront (buyer-facing)
  "/s/(.*)",                        // Vanity short link → redirects to catalog
  "/marketplace(.*)",               // Public marketplace (discovery)
  "/hunt(.*)",                      // HUNT pilot (buyer requests + public rooms)
  "/track(.*)",                     // Public order tracking (buyer-facing)
  "/orders",                        // Buyer order history (optional auth — shows sign-in CTA for guests)
  "/api/webhooks/(.*)",             // Clerk webhooks (server-to-server)
  "/api/uploadthing(.*)",           // Uploadthing CDN upload endpoint
  "/api/og(.*)",                    // Dynamic OG image generation
  "/api/health",                    // Health check (uptime monitoring)
  "/api/cron/(.*)",                  // Vercel Cron jobs (server-to-server)
  "/api/merchant-feed",              // Google Merchant Center product feed
  "/monitoring",                     // Sentry browser-envelope tunnel
  "/import-whatsapp-catalogue",      // WhatsApp import SEO landing page
  "/privacy",                       // Privacy policy (POPIA)
  "/terms",                         // Terms of service
  "/contact",                       // Contact / help center
  "/growth",                        // TradeFeed Growth managed-service landing page
  "/sitemap.xml",                   // SEO sitemap
  "/robots.txt",                    // SEO robots
  // ── SEO money pages + info pages (must be crawlable: Googlebot and
  // link-preview scrapers don't send browser headers, and auth.protect()
  // returns 404 to non-page requests) ─────────────────────
  "/pricing",
  "/sell-online-south-africa",
  "/sell-on-whatsapp",
  "/whatsapp-catalog",
  "/create-online-shop",
  "/compare/(.*)",
  "/city/(.*)",                     // Legacy city pages (308 → /marketplace/[province]/[city])
  "/faq",
  "/how-it-works",
  // ── Anonymous-reachable app routes (each page enforces its own auth:
  // /get-started redirects to sign-in, /invite + /review validate tokens,
  // /pay + /whatsapp-login are buyer-facing with zero auth by design) ──
  "/create-shop",
  "/get-started",
  "/invite/(.*)",
  "/pay/(.*)",
  "/review/(.*)",
  "/whatsapp-login(.*)",
]);

// Routes that should be rate-limited
const isCatalogRoute = createRouteMatcher(["/catalog/(.*)"]);
const isMarketplaceRoute = createRouteMatcher(["/marketplace(.*)"]);
const isHuntRoute = createRouteMatcher(["/hunt(.*)"]);
const isPublicOrderRoute = createRouteMatcher(["/track(.*)", "/pay/(.*)"]);
const isApiRoute = createRouteMatcher(["/api/(.*)"]);
const isSentryTunnelRoute = createRouteMatcher(["/monitoring"]);
// Routes that should SKIP rate limiting (Uploadthing needs unrestricted callback access)
const isUploadthingRoute = createRouteMatcher(["/api/uploadthing(.*)"]);
const isWebhookRoute = createRouteMatcher(["/api/webhooks/(.*)"]);

export default clerkMiddleware(async (auth, request) => {
  // Non-essential first-party measurement follows the same explicit choice
  // as GA4 and Vercel Analytics. No visitor identity is created while the
  // preference is missing or denied.
  const analyticsConsent = isSyntheticMonitorRequest(request.headers)
    ? null
    : parseAnalyticsConsent(
        request.cookies.get(ANALYTICS_CONSENT_COOKIE)?.value,
      );
  const existingVisitorCookie = request.cookies.get(
    ANALYTICS_VISITOR_COOKIE,
  )?.value;
  const visitor = resolveConsentManagedVisitorId(
    analyticsConsent,
    existingVisitorCookie,
  );
  const requestHeaders = new Headers(request.headers);
  if (visitor) {
    requestHeaders.set(ANALYTICS_VISITOR_HEADER, visitor.visitorId);
  } else {
    requestHeaders.delete(ANALYTICS_VISITOR_HEADER);
  }
  // Create the nonce before any redirect/rewrite response can be returned so
  // every response path receives the same security policy and rewritten
  // requests can pass the nonce to the rendered page.
  const nonce = crypto.randomUUID();
  requestHeaders.set("x-nonce", nonce);

  const withVisitorCookie = (response: NextResponse): NextResponse => {
    const cookieOptions = analyticsVisitorCookieOptions(
      process.env.NODE_ENV === "production",
    );

    if (visitor?.isNew) {
      response.cookies.set(
        ANALYTICS_VISITOR_COOKIE,
        visitor.visitorId,
        cookieOptions,
      );
    } else if (!visitor && existingVisitorCookie) {
      // Revocation removes only the analytics identity. Authentication and
      // other essential site data remain untouched.
      response.cookies.set(ANALYTICS_VISITOR_COOKIE, "", {
        ...cookieOptions,
        maxAge: 0,
        expires: new Date(0),
      });
    }
    return response;
  };

  const withSecurityHeaders = (response: NextResponse): NextResponse => {
    // 'strict-dynamic' is intentionally omitted because Clerk injects its
    // browser SDK with a host-allowlisted script tag that has no nonce.
    const csp = [
      `default-src 'self'`,
      `script-src 'self' 'nonce-${nonce}' https://www.googletagmanager.com https://vercel.live https://*.clerk.accounts.dev https://*.tradefeed.co.za https://*.clerk.com https://challenges.cloudflare.com https://translate.google.com https://translate.googleapis.com`,
      `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://www.gstatic.com https://api.fontshare.com`,
      `img-src 'self' data: blob: https://images.unsplash.com https://utfs.io https://*.ufs.sh https://vercel.live https://vercel.com https://img.clerk.com https://*.clerk.com https://i.ytimg.com`,
      `font-src 'self' data: https://vercel.live https://fonts.gstatic.com https://cdn.fontshare.com`,
      // media-src https: is deliberate — sellers may attach product videos
      // as direct file links from any https host (media only; scripts and
      // frames stay locked down).
      `media-src 'self' blob: https:`,
      `connect-src 'self' https://www.google-analytics.com https://www.googletagmanager.com https://utfs.io https://*.ufs.sh https://*.uploadthing.com https://*.sentry.io https://*.ingest.sentry.io https://api.openai.com https://vercel.live https://vercel.com wss://*.pusher.com https://*.clerk.accounts.dev https://*.clerk.com https://*.tradefeed.co.za https://challenges.cloudflare.com https://translate.googleapis.com`,
      `frame-src 'self' https://www.openstreetmap.org https://vercel.live https://*.clerk.accounts.dev https://*.tradefeed.co.za https://challenges.cloudflare.com https://www.youtube-nocookie.com`,
      `worker-src 'self' blob:`,
    ].join("; ");

    response.headers.set("Content-Security-Policy", csp);
    response.headers.set("X-Content-Type-Options", "nosniff");
    // Keep dynamic shop, product, invitation, review, and order paths out of
    // third-party referrer fields.
    response.headers.set("Referrer-Policy", "strict-origin");
    response.headers.set("X-Frame-Options", "SAMEORIGIN");
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains",
    );
    response.headers.set(
      "Permissions-Policy",
      'camera=(), microphone=(), geolocation=(self), payment=(), fullscreen=(self "https://www.youtube-nocookie.com")',
    );
    return response;
  };

  const finalizeResponse = (response: NextResponse): NextResponse =>
    withVisitorCookie(withSecurityHeaders(response));

  try {
    // ── Custom domain rewrite ───────────────────────────
    // If the request comes from a custom domain, rewrite to /catalog/[slug]
    const host = request.headers.get("host") || "";
    if (!isPlatformHost(host)) {
      const bare = host.split(":")[0]!.toLowerCase();
      let entry = domainCache.get(bare);
      if (!entry || Date.now() - entry.ts > DOMAIN_CACHE_TTL) {
        // Dynamic import to avoid bundling prisma in edge — runs in Node runtime
        let slug: string | null = null;
        try {
          const { db } = await import("@/lib/db");
          const shop = await db.shop.findUnique({
            where: { customDomain: bare },
            select: { slug: true, domainStatus: true },
          });
          slug = shop?.domainStatus === "ACTIVE" ? shop.slug : null;
        } catch {
          // DB unavailable — fall through to normal routing
        }
        entry = { slug, ts: Date.now() };
        domainCache.set(bare, entry);
      }
      if (entry.slug) {
        // A custom hostname is another entrance to the public catalogue. It
        // must receive the same browsing limit as /catalog before rewrite.
        const result = await checkRateLimit("catalog", getClientIp(request));
        if (!result.allowed) {
          console.warn("[middleware] rate_limit custom_catalog", { limit: 60 });
          return finalizeResponse(
            new NextResponse("Too many requests. Please try again later.", {
              status: 429,
              headers: {
                "Retry-After": String(result.retryAfterSeconds),
                "X-RateLimit-Limit": "60",
                "X-RateLimit-Remaining": "0",
              },
            }),
          );
        }

        const url = request.nextUrl.clone();
        // Rewrite /anything on custom domain to /catalog/slug/anything
        const path = url.pathname === "/" ? "" : url.pathname;
        url.pathname = `/catalog/${entry.slug}${path}`;
        return finalizeResponse(
          NextResponse.rewrite(url, {
            request: { headers: requestHeaders },
          }),
        );
      }
    }

    // ── Category canonical redirect ─────────────────────
    // Redirect /marketplace?category=slug to /marketplace/category/slug
    // to avoid duplicate content in search engines.
    const url = request.nextUrl;
    if (url.pathname === "/marketplace" && url.searchParams.has("category")) {
      const cat = url.searchParams.get("category")!;
      const otherParams = new URLSearchParams(url.searchParams);
      otherParams.delete("category");
      // Only redirect when category is the sole filter (preserve search/sort/etc.)
      if (otherParams.size === 0) {
        return finalizeResponse(
          NextResponse.redirect(
            new URL(`/marketplace/category/${encodeURIComponent(cat)}`, request.url),
            301,
          ),
        );
      }
    }

    // Skip rate limiting for Uploadthing (server callbacks) and webhooks
    const ip = getClientIp(request);

    if (isPublicOrderRoute(request)) {
      const result = await checkRateLimit("tracking", ip);
      if (!result.allowed) {
        console.warn("[middleware] rate_limit tracking", { limit: 20 });
        return finalizeResponse(
          new NextResponse("Too many order lookups. Please try again later.", {
            status: 429,
            headers: {
              "Retry-After": String(result.retryAfterSeconds),
              "X-RateLimit-Limit": "20",
              "X-RateLimit-Remaining": "0",
            },
          }),
        );
      }
    } else if (isCatalogRoute(request) || isMarketplaceRoute(request) || isHuntRoute(request)) {
      const result = await checkRateLimit("catalog", ip);
      if (!result.allowed) {
        console.warn("[middleware] rate_limit catalog", { limit: 60 });
        return finalizeResponse(
          new NextResponse("Too many requests. Please try again later.", {
            status: 429,
            headers: {
              "Retry-After": String(result.retryAfterSeconds),
              "X-RateLimit-Limit": "60",
              "X-RateLimit-Remaining": "0",
            },
          }),
        );
      }
    } else if (isSentryTunnelRoute(request)) {
      // Browser exception envelopes must work without a signed-in session.
      // Give telemetry a bounded burst allowance instead of exposing an
      // unlimited public tunnel.
      const result = await checkRateLimit("analytics", ip);
      if (!result.allowed) {
        console.warn("[middleware] rate_limit sentry_tunnel", { limit: 100 });
        return finalizeResponse(
          new NextResponse("Too many telemetry requests.", {
            status: 429,
            headers: {
              "Retry-After": String(result.retryAfterSeconds),
              "X-RateLimit-Limit": "100",
              "X-RateLimit-Remaining": "0",
            },
          }),
        );
      }
    } else if (isApiRoute(request) && !isUploadthingRoute(request) && !isWebhookRoute(request)) {
      const result = await checkRateLimit("api", ip);
      if (!result.allowed) {
        console.warn("[middleware] rate_limit api", { limit: 30 });
        return finalizeResponse(
          NextResponse.json(
            { error: "Rate limit exceeded" },
            {
              status: 429,
              headers: {
                "Retry-After": String(result.retryAfterSeconds),
              },
            },
          ),
        );
      }
    }

  } catch (err: unknown) {
    // Fail open only for infra errors in the sections above (custom-domain
    // lookup, rate limiting). Auth runs below, outside this try, so its
    // control-flow errors always reach clerkMiddleware intact.
    console.error("[middleware] invocation error, failing open", err);
  }

  // Auth protection — deliberately OUTSIDE the try/catch. auth.protect()
  // communicates by throwing (redirect to sign-in for page requests, 404
  // for non-page requests); a catch here used to swallow the redirect and
  // fail open, leaving page-level auth() checks as the only real guard.
  if (!isPublicRoute(request)) {
    await auth.protect();
  }

  // ── Security headers ──────────────────────────────────────
  const response = NextResponse.next({
    // Pass the nonce and visitor identity to the request consumed by pages
    // and server actions. Neither internal header is exposed to the browser.
    request: { headers: requestHeaders },
  });

  return finalizeResponse(response);
}, {
  signInUrl: "/sign-in",
  signUpUrl: "/sign-up",
});

export const config = {
  // Match all routes except static files and Next.js internals
  // NOTE: /api/uploadthing must NOT be excluded here — Clerk middleware
  // needs to run so auth() has context. The route is in isPublicRoute
  // so it won't require login, but auth() will work when a session exists.
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|json)).*)",
  ],
};
