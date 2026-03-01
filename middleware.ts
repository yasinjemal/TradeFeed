// ============================================================
// Clerk Proxy â€” Route Protection + Rate Limiting
// ============================================================
// Protects private routes (dashboard, create-shop, API).
// Public routes: home, catalog, sign-in, sign-up, webhooks.
// Rate limits public routes to prevent abuse.
// ============================================================

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { rateLimit, getRateLimitKey } from "@/lib/rate-limit";
import { reportRateLimitEvent } from "@/lib/telemetry";

// Routes that DON'T require authentication
const isPublicRoute = createRouteMatcher([
  "/",                              // Landing page
  "/sign-in(.*)",                   // Clerk sign-in
  "/sign-up(.*)",                   // Clerk sign-up
  "/catalog/(.*)",                  // Public storefront (buyer-facing)
  "/marketplace(.*)",               // Public marketplace (discovery)
  "/track(.*)",                     // Public order tracking (buyer-facing)
  "/api/webhooks/(.*)",             // Clerk webhooks (server-to-server)
  "/api/uploadthing(.*)",           // Uploadthing CDN upload endpoint
  "/api/og(.*)",                    // Dynamic OG image generation
  "/api/health",                    // Health check (uptime monitoring)
  "/api/cron/(.*)",                  // Vercel Cron jobs (server-to-server)
  "/api/merchant-feed",              // Google Merchant Center product feed
  "/privacy",                       // Privacy policy (POPIA)
  "/terms",                         // Terms of service
  "/sitemap.xml",                   // SEO sitemap
  "/robots.txt",                    // SEO robots
]);

// Routes that should be rate-limited
const isCatalogRoute = createRouteMatcher(["/catalog/(.*)"]);
const isMarketplaceRoute = createRouteMatcher(["/marketplace(.*)"]);
const isApiRoute = createRouteMatcher(["/api/(.*)"]);
// Routes that should SKIP rate limiting (Uploadthing needs unrestricted callback access)
const isUploadthingRoute = createRouteMatcher(["/api/uploadthing(.*)"]);
const isWebhookRoute = createRouteMatcher(["/api/webhooks/(.*)"]);

export default clerkMiddleware(async (auth, request) => {
  // Skip rate limiting for Uploadthing (server callbacks) and webhooks
  if (isCatalogRoute(request) || isMarketplaceRoute(request)) {
    const key = getRateLimitKey(request, "catalog");
    const result = rateLimit(key, 60, 60_000); // 60 req/min
    if (!result.allowed) {
      reportRateLimitEvent("catalog", key, 60);
      return new NextResponse("Too many requests. Please try again later.", {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((result.resetAt - Date.now()) / 1000)),
          "X-RateLimit-Limit": "60",
          "X-RateLimit-Remaining": "0",
        },
      });
    }
  } else if (isApiRoute(request) && !isUploadthingRoute(request) && !isWebhookRoute(request)) {
    const key = getRateLimitKey(request, "api");
    const result = rateLimit(key, 30, 60_000); // 30 req/min
    if (!result.allowed) {
      reportRateLimitEvent("api", key, 30);
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((result.resetAt - Date.now()) / 1000)),
          },
        },
      );
    }
  }

  // Auth protection
  if (!isPublicRoute(request)) {
    await auth.protect();
  }

  // ── Security headers (CSP is handled by Clerk's contentSecurityPolicy option) ──
  const response = NextResponse.next();
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  // HSTS: enforce HTTPS (1 year, include subdomains)
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  // Permissions Policy: restrict browser features not needed by TradeFeed
  // geolocation=(self) allows the GPS detect button on settings page
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(self), payment=()");

  return response;
}, {
  signInUrl: "/sign-in",
  signUpUrl: "/sign-up",
  // ── Clerk Automatic CSP ────────────────────────────────
  // Clerk handles all its own domains + nonce generation automatically.
  // We only list OUR extra domains here — they get merged with Clerk's.
  contentSecurityPolicy: {
    directives: {
      "script-src": [
        "'unsafe-inline'",
        "https://www.googletagmanager.com",
        "https://vercel.live",
      ],
      "style-src": ["'unsafe-inline'"],
      "img-src": [
        "data:",
        "blob:",
        "https://images.unsplash.com",
        "https://utfs.io",
        "https://*.ufs.sh",
        "https://vercel.live",
        "https://vercel.com",
      ],
      "font-src": ["data:", "https://vercel.live"],
      "media-src": ["blob:", "https://utfs.io", "https://*.ufs.sh"],
      "connect-src": [
        "https://www.google-analytics.com",
        "https://www.googletagmanager.com",
        "https://utfs.io",
        "https://*.ufs.sh",
        "https://*.uploadthing.com",
        "https://*.sentry.io",
        "https://*.ingest.sentry.io",
        "https://api.openai.com",
        "https://vercel.live",
        "https://vercel.com",
        "wss://*.pusher.com",
      ],
      "frame-src": [
        "https://www.openstreetmap.org",
        "https://vercel.live",
      ],
      "worker-src": ["blob:"],
    },
  },
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
