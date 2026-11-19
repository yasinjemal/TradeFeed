// ============================================================
// robots.txt — /robots.txt
// ============================================================
// Crawl policy (SEO blueprint §11):
// - Public surfaces open; private/transactional surfaces blocked.
// - /api blocked EXCEPT the OG + image proxy endpoints, which
//   must stay crawlable for link previews and Google Images.
// - Filtered marketplace states are handled by canonicals, not
//   robots, so equity consolidates instead of being orphaned.
// ============================================================

import { SITE_ORIGIN } from "@/lib/seo/site-url";
import type { MetadataRoute } from "next";

// Never localhost in production — see lib/seo/site-url.ts.
const APP_URL = SITE_ORIGIN;

const DISALLOW = [
  "/dashboard/",
  "/admin/",
  "/create-shop",
  "/get-started",
  "/sign-in",
  "/sign-up",
  "/orders",
  "/pay/",
  "/track/",
  "/review/",
  "/api/",
];

const ALLOW = [
  "/",
  "/api/og",
  "/api/img/",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ALLOW,
        disallow: DISALLOW,
      },
      {
        userAgent: "Googlebot-Image",
        allow: ["/", "/api/img/"],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
