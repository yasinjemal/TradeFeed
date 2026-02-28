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

  // ── Content Security Policy (with per-request nonce) ────
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  // Forward nonce to server components via request header
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  const csp = [
    "default-src 'self'",
    // Scripts: nonce-based CSP Level 2.
    // 'unsafe-inline' is a fallback for CSP Level 1 browsers only —
    // modern browsers (Chrome 69+, Firefox 68+, Safari 15.4+) ignore
    // 'unsafe-inline' when a nonce is present. This is per W3C spec.
    `script-src 'self' 'unsafe-inline' 'nonce-${nonce}' https://www.googletagmanager.com https://*.clerk.accounts.dev https://clerk.tradefeed.co.za https://challenges.cloudflare.com`,
    // Styles: own + inline (Tailwind JIT injects inline styles)
    "style-src 'self' 'unsafe-inline'",
    // Images: own, Unsplash, Clerk, UploadThing CDN, data URIs
    "img-src 'self' data: blob: https://images.unsplash.com https://img.clerk.com https://images.clerk.dev https://clerk.tradefeed.co.za https://utfs.io https://*.ufs.sh",
    // Fonts: own
    "font-src 'self' data:",
    // Media (video/audio): own + UploadThing CDN
    "media-src 'self' blob: https://utfs.io https://*.ufs.sh",
    // Connect: own, GA4, Clerk, UploadThing, Sentry
    "connect-src 'self' https://www.google-analytics.com https://www.googletagmanager.com https://*.clerk.accounts.dev https://clerk.tradefeed.co.za https://api.clerk.com https://utfs.io https://*.ufs.sh https://*.uploadthing.com https://*.sentry.io https://*.ingest.sentry.io https://api.openai.com",
    // Frames: Clerk challenges, Cloudflare, OpenStreetMap embed
    "frame-src 'self' https://*.clerk.accounts.dev https://clerk.tradefeed.co.za https://challenges.cloudflare.com https://www.openstreetmap.org",
    // Workers: own (service worker)
    "worker-src 'self' blob:",
    // Form actions: own
    "form-action 'self'",
    // Base URI
    "base-uri 'self'",
  ].join("; ");

  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  // HSTS: enforce HTTPS (1 year, include subdomains)
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  // Permissions Policy: restrict browser features not needed by TradeFeed
  // geolocation=(self) allows the GPS detect button on settings page
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(self), payment=()");


  return response;
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
