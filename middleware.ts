// ============================================================
// Clerk Proxy â€” Route Protection + Rate Limiting
// ============================================================
// Protects private routes (dashboard, create-shop, API).
// Public routes: home, catalog, sign-in, sign-up, webhooks.
// Rate limits public routes to prevent abuse.
// ============================================================

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit-upstash";

// Routes that DON'T require authentication
const isPublicRoute = createRouteMatcher([
  "/",                              // Landing page
  "/sign-in(.*)",                   // Clerk sign-in
  "/sign-up(.*)",                   // Clerk sign-up
  "/catalog/(.*)",                  // Public storefront (buyer-facing)
  "/s/(.*)",                        // Vanity short link → redirects to catalog
  "/marketplace(.*)",               // Public marketplace (discovery)
  "/track(.*)",                     // Public order tracking (buyer-facing)
  "/orders",                        // Buyer order history (optional auth — shows sign-in CTA for guests)
  "/api/webhooks/(.*)",             // Clerk webhooks (server-to-server)
  "/api/uploadthing(.*)",           // Uploadthing CDN upload endpoint
  "/api/og(.*)",                    // Dynamic OG image generation
  "/api/health",                    // Health check (uptime monitoring)
  "/api/cron/(.*)",                  // Vercel Cron jobs (server-to-server)
  "/api/merchant-feed",              // Google Merchant Center product feed
  "/import-whatsapp-catalogue",      // WhatsApp import SEO landing page
  "/privacy",                       // Privacy policy (POPIA)
  "/terms",                         // Terms of service
  "/contact",                       // Contact / help center
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
  try {
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
        return NextResponse.redirect(
          new URL(`/marketplace/category/${encodeURIComponent(cat)}`, request.url),
          301,
        );
      }
    }

    // Skip rate limiting for Uploadthing (server callbacks) and webhooks
    const ip = getClientIp(request);

    if (isCatalogRoute(request) || isMarketplaceRoute(request)) {
      const result = await checkRateLimit("catalog", ip);
      if (!result.allowed) {
        console.warn("[middleware] rate_limit catalog", { ip, limit: 60 });
        return new NextResponse("Too many requests. Please try again later.", {
          status: 429,
          headers: {
            "Retry-After": String(result.retryAfterSeconds),
            "X-RateLimit-Limit": "60",
            "X-RateLimit-Remaining": "0",
          },
        });
      }
    } else if (isApiRoute(request) && !isUploadthingRoute(request) && !isWebhookRoute(request)) {
      const result = await checkRateLimit("api", ip);
      if (!result.allowed) {
        console.warn("[middleware] rate_limit api", { ip, limit: 30 });
        return NextResponse.json(
          { error: "Rate limit exceeded" },
          {
            status: 429,
            headers: {
              "Retry-After": String(result.retryAfterSeconds),
            },
          },
        );
      }
    }

    // Auth protection
    if (!isPublicRoute(request)) {
      await auth.protect();
    }
  } catch (err) {
    // Fail open — never block legitimate users because middleware crashed
    console.error("[middleware] invocation error, failing open", err);
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

export const runtime = "edge";

export const config = {
  // Match all routes except static files and Next.js internals
  // NOTE: /api/uploadthing must NOT be excluded here — Clerk middleware
  // needs to run so auth() has context. The route is in isPublicRoute
  // so it won't require login, but auth() will work when a session exists.
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|json)).*)",
  ],
};
