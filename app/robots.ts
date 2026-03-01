// ============================================================
// robots.txt — /robots.txt
// ============================================================
// Controls search engine crawling behavior.
// Allows all crawlers on public pages, blocks dashboard/admin.
// ============================================================

import type { MetadataRoute } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/catalog/", "/marketplace/", "/privacy", "/terms"],
        disallow: ["/dashboard/", "/admin/", "/create-shop", "/api/", "/sign-in", "/sign-up"],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
