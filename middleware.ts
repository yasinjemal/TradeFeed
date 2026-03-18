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
  } catch (err: unknown) {
    // Re-throw Clerk / Next.js redirect errors (auth.protect() throws
    // NEXT_HTTP_ERROR_FALLBACK to trigger the sign-in redirect).
    // Swallowing it would let unauthenticated users into protected routes.
    if (err instanceof Error && (err as Error & { digest?: string }).digest?.includes("NEXT_HTTP_ERROR_FALLBACK")) {
      throw err;
    }
    // Fail open only for truly unexpected errors (rate-limit failures, etc.)
    console.error("[middleware] invocation error, failing open", err);
  }

  // ── Security headers ──────────────────────────────────────
  // Generate CSP nonce for inline scripts (replaces 'unsafe-inline')
  const nonce = crypto.randomUUID();

  const response = NextResponse.next({
    headers: {
      // Pass nonce to layout.tsx via custom header
      "x-nonce": nonce,
    },
  });

  // Build CSP header with nonce for inline scripts + explicit host allowlists
  // NOTE: 'strict-dynamic' was removed because Clerk injects its browser SDK
  // via a <script src> tag that doesn't carry the nonce, and 'strict-dynamic'
  // disables all host-based allowlists per CSP Level 3 spec.
  const csp = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' https://www.googletagmanager.com https://vercel.live https://*.clerk.accounts.dev https://*.tradefeed.co.za https://*.clerk.com https://challenges.cloudflare.com https://translate.google.com https://translate.googleapis.com`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://www.gstatic.com`,
    `img-src 'self' data: blob: https://images.unsplash.com https://utfs.io https://*.ufs.sh https://vercel.live https://vercel.com https://img.clerk.com https://*.clerk.com`,
    `font-src 'self' data: https://vercel.live https://fonts.gstatic.com`,
    `media-src 'self' blob: https://utfs.io https://*.ufs.sh`,
    `connect-src 'self' https://www.google-analytics.com https://www.googletagmanager.com https://utfs.io https://*.ufs.sh https://*.uploadthing.com https://*.sentry.io https://*.ingest.sentry.io https://api.openai.com https://vercel.live https://vercel.com wss://*.pusher.com https://*.clerk.accounts.dev https://*.clerk.com https://*.tradefeed.co.za https://challenges.cloudflare.com https://translate.googleapis.com`,
    `frame-src 'self' https://www.openstreetmap.org https://vercel.live https://*.clerk.accounts.dev https://*.tradefeed.co.za https://challenges.cloudflare.com`,
    `worker-src 'self' blob:`,
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
