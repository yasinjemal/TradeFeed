// ============================================================
// Clerk Middleware — Route Protection + Rate Limiting
// ============================================================
// Protects private routes (dashboard, create-shop, API).
// Public routes: home, catalog, sign-in, sign-up, webhooks.
// Rate limits public routes to prevent abuse.
//
// HOW IT WORKS:
// - clerkMiddleware() runs on every request
// - We define public route matchers for unauthenticated access
// - Everything else requires auth (dashboard, create-shop, etc.)
// - Unauthenticated users hitting private routes get redirected to /sign-in
// - Public catalog/API routes are rate-limited per IP
// ============================================================

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { rateLimit, getRateLimitKey } from "@/lib/rate-limit";

// Routes that DON'T require authentication
const isPublicRoute = createRouteMatcher([
  "/",                              // Landing page
  "/sign-in(.*)",                   // Clerk sign-in
  "/sign-up(.*)",                   // Clerk sign-up
  "/catalog/(.*)",                  // Public storefront (buyer-facing)
  "/marketplace(.*)",               // Public marketplace (discovery)
  "/api/webhooks/(.*)",             // Clerk webhooks (server-to-server)
  "/api/uploadthing(.*)",           // Uploadthing CDN upload endpoint
  "/api/og(.*)",                    // Dynamic OG image generation
  "/privacy",                       // Privacy policy (POPIA)
  "/terms",                         // Terms of service
  "/sitemap.xml",                   // SEO sitemap
]);

// Routes that should be rate-limited
const isCatalogRoute = createRouteMatcher(["/catalog/(.*)"]);
const isMarketplaceRoute = createRouteMatcher(["/marketplace(.*)"]);
const isApiRoute = createRouteMatcher(["/api/(.*)"]);
// Routes that should SKIP rate limiting (Uploadthing needs unrestricted callback access)
const isUploadthingRoute = createRouteMatcher(["/api/uploadthing(.*)"]);
const isWebhookRoute = createRouteMatcher(["/api/webhooks/(.*)"]);

export default clerkMiddleware(async (auth, request) => {
  // ── Rate limiting on public routes ──────────────────────
  // Skip rate limiting for Uploadthing (server callbacks) and webhooks
  if (isCatalogRoute(request) || isMarketplaceRoute(request)) {
    const key = getRateLimitKey(request, "catalog");
    const result = rateLimit(key, 60, 60_000); // 60 req/min
    if (!result.allowed) {
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

  // ── Auth protection ─────────────────────────────────────
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  // Match all routes except static files and Next.js internals
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
