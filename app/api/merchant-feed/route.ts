// ============================================================
// API Route — Google Merchant Center Product Feed
// ============================================================
// GET /api/merchant-feed
//
// Serves a TSV (Tab-Separated Values) product feed that Google
// Merchant Center can fetch automatically every 24 hours.
//
// Google spec: https://support.google.com/merchants/answer/7052112
//
// Fields included:
//   id, title, description, link, image_link, additional_image_link,
//   availability, price, brand, condition, product_type,
//   identifier_exists, item_group_id, size, color, shipping
// ============================================================

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://tradefeed.co.za";

// TSV header row — Google Merchant Center required + recommended fields
const HEADERS = [
  "id",
  "item_group_id",
  "title",
  "description",
  "link",
  "image_link",
  "additional_image_link",
  "availability",
  "price",
  "brand",
  "condition",
  "product_type",
  "identifier_exists",
  "size",
  "color",
  "shipping",
].join("\t");

function escapeField(value: string): string {
  // Remove tabs and newlines from field values
  return value.replace(/[\t\r\n]/g, " ").trim();
}

export async function GET() {
  try {
    // Fetch all active products with their variants, images, and shop info
    const products = await db.product.findMany({
      where: {
        isActive: true,
        isFlagged: false,
        shop: { isActive: true },
        // Must have at least one active variant with price
        variants: { some: { isActive: true, priceInCents: { gt: 0 } } },
      },
      select: {
        id: true,
        name: true,
        description: true,
        shop: {
          select: {
            name: true,
            slug: true,
          },
        },
        globalCategory: {
          select: { name: true },
        },
        category: {
          select: { name: true },
        },
        images: {
          select: { url: true },
          orderBy: { position: "asc" },
          take: 10,
        },
        variants: {
          where: { isActive: true, priceInCents: { gt: 0 } },
          select: {
            id: true,
            size: true,
            color: true,
            priceInCents: true,
            stock: true,
            sku: true,
          },
        },
      },
      take: 10000, // Google supports up to 10M but we cap for performance
    });

    // Build TSV rows — one row per variant (Google wants one row per buyable SKU)
    const rows: string[] = [HEADERS];

    for (const product of products) {
      if (product.variants.length === 0 || product.images.length === 0) continue;

      const productUrl = `${APP_URL}/catalog/${product.shop.slug}/products/${product.id}`;
      const primaryImage = product.images[0]?.url ?? "";
      const additionalImages = product.images
        .slice(1, 10)
        .map((img) => img.url)
        .join(",");

      const title = escapeField(product.name);
      const description = escapeField(
        product.description || `${product.name} from ${product.shop.name} on TradeFeed`
      );
      const brand = escapeField(product.shop.name);
      const productType = product.globalCategory?.name
        || product.category?.name
        || "Other";

      for (const variant of product.variants) {
        const variantId = variant.sku || variant.id;
        const price = `${(variant.priceInCents / 100).toFixed(2)} ZAR`;
        const availability = variant.stock > 0 ? "in_stock" : "out_of_stock";
        const size = escapeField(variant.size === "Default" ? "" : variant.size);
        const color = escapeField(variant.color ?? "");

        const row = [
          variantId,                              // id
          product.id,                             // item_group_id (groups variants)
          title,                                  // title
          description,                            // description
          productUrl,                             // link
          primaryImage,                           // image_link
          additionalImages,                       // additional_image_link
          availability,                           // availability
          price,                                  // price
          brand,                                  // brand
          "new",                                  // condition
          escapeField(productType),               // product_type
          "no",                                   // identifier_exists (no GTIN/MPN)
          size,                                   // size
          color,                                  // color
          "ZA:::0 ZAR",                           // shipping (country:region:service:price)
        ].join("\t");

        rows.push(row);
      }
    }

    const tsv = rows.join("\n");

    return new NextResponse(tsv, {
      status: 200,
      headers: {
        "Content-Type": "text/tab-separated-values; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (error) {
    console.error("[Merchant Feed] Error generating feed:", error);
    return NextResponse.json(
      { error: "Failed to generate product feed" },
      { status: 500 }
    );
  }
}
