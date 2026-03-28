// ============================================================
// Google Merchant Center — Product Feed (RSS 2.0 / XML)
// ============================================================
// Endpoint: GET /api/feeds/google
//
// Outputs an RSS 2.0 XML feed compatible with Google Merchant
// Center's "Website crawl" or "Scheduled fetches" intake.
// Products include: title, description, price, availability,
// image, link, condition, brand, GTIN placeholder, and more.
//
// SETUP: In Merchant Center → Products → Feeds → Add feed:
//   URL: https://tradefeed.co.za/api/feeds/google
//   Type: Scheduled fetch (daily)
//
// REF: https://support.google.com/merchants/answer/7052112
// ============================================================

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://tradefeed.co.za";

// Dynamic route — rendered on demand, cached at edge for 6 hours
export const dynamic = "force-dynamic";
export const revalidate = 21600;

/**
 * Convert an UploadThing CDN URL to our image proxy URL.
 * Google Merchant Center rejects raw UT URLs (wrong Content-Type, redirects).
 * Our /api/img/[key] proxy serves guaranteed image/jpeg from our domain.
 */
function toProxyImageUrl(rawUrl: string): string {
  if (!rawUrl) return `${APP_URL}/icon.svg`;
  // Extract UT file key from URLs like:
  //   https://utfs.io/f/abc123
  //   https://xxx.ufs.sh/f/abc123/original-name.jpg
  const match = rawUrl.match(/\/f\/([a-zA-Z0-9_-]+)/);
  if (!match) return rawUrl; // Not a UT URL — return as-is
  return `${APP_URL}/api/img/${match[1]}`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  // Fetch active products with their shop + variants + images + category
  const products = await db.product.findMany({
    where: {
      isActive: true,
      shop: { isActive: true },
    },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      images: { select: { url: true, key: true }, orderBy: { position: "asc" as const }, take: 10 },
      category: { select: { name: true } },
      shop: { select: { name: true, slug: true } },
      variants: {
        where: { isActive: true },
        select: {
          priceInCents: true,
          retailPriceCents: true,
          stock: true,
          sku: true,
          size: true,
          color: true,
        },
        orderBy: { priceInCents: "asc" },
        take: 1, // Lowest-priced active variant
      },
    },
    take: 5000, // Google Merchant allows up to 150k, but keep it reasonable
    orderBy: { createdAt: "desc" },
  });

  const items = products
    .filter((p) => p.variants.length > 0)
    .map((p) => {
      const v = p.variants[0]!;
      const price = (v.priceInCents / 100).toFixed(2);
      const primaryImage = toProxyImageUrl(p.images[0]?.url ?? "");
      const additionalImageLinks = p.images
        .slice(1, 10)
        .map((img) => toProxyImageUrl(img.url))
        .filter(Boolean);
      const link = `${APP_URL}/catalog/${p.shop.slug}/products/${p.slug ?? p.id}`;
      const availability = v.stock > 0 ? "in_stock" : "out_of_stock";
      const category = p.category?.name || "Apparel & Accessories";

      return `    <item>
      <g:id>${escapeXml(p.id)}</g:id>
      <title>${escapeXml(p.name)}</title>
      <description>${escapeXml(p.description || p.name)}</description>
      <link>${escapeXml(link)}</link>
      <g:image_link>${escapeXml(primaryImage)}</g:image_link>
${additionalImageLinks.map((url) => `      <g:additional_image_link>${escapeXml(url)}</g:additional_image_link>`).join("\n")}
      <g:price>${price} ZAR</g:price>
      <g:availability>${availability}</g:availability>
      <g:condition>new</g:condition>
      <g:brand>${escapeXml(p.shop.name)}</g:brand>
      <g:google_product_category>${escapeXml(category)}</g:google_product_category>
      ${v.sku ? `<g:mpn>${escapeXml(v.sku)}</g:mpn>` : ""}
      ${v.size ? `<g:size>${escapeXml(v.size)}</g:size>` : ""}
      ${v.color ? `<g:color>${escapeXml(v.color)}</g:color>` : ""}
      <g:shipping>
        <g:country>ZA</g:country>
        <g:service>Standard</g:service>
        <g:price>0.00 ZAR</g:price>
      </g:shipping>
    </item>`;
    });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>TradeFeed — South Africa Marketplace</title>
    <link>${APP_URL}</link>
    <description>Products from South Africa's top sellers on TradeFeed — wholesale and retail.</description>
${items.join("\n")}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=3600",
    },
  });
}
