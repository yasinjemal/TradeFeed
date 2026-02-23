// ============================================================
// Script — Seed product images from Unsplash
// ============================================================
// Adds real clothing photos to existing products using
// Unsplash CDN URLs (free, stable, no API key needed).
// Run: npx tsx scripts/seed-images.ts
// ============================================================

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// ── Curated Unsplash photos for each product ────────────────
// Using direct Unsplash CDN URLs with resize params
const PRODUCT_IMAGES: Record<string, { url: string; alt: string }[]> = {
  "Premium Cotton T-Shirt": [
    {
      url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=800&fit=crop&q=80",
      alt: "White cotton t-shirt flat lay",
    },
    {
      url: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&h=800&fit=crop&q=80",
      alt: "Black cotton t-shirt on hanger",
    },
    {
      url: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800&h=800&fit=crop&q=80",
      alt: "Cotton t-shirt close-up fabric detail",
    },
  ],
  "Fleece-Lined Hoodie": [
    {
      url: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&h=800&fit=crop&q=80",
      alt: "Grey hoodie front view",
    },
    {
      url: "https://images.unsplash.com/photo-1509942774463-acf339cf87d5?w=800&h=800&fit=crop&q=80",
      alt: "Hoodie lifestyle shot",
    },
    {
      url: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&h=800&fit=crop&q=80",
      alt: "Folded hoodies stack",
    },
  ],
  "Relaxed Fit Cargo Pants": [
    {
      url: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&h=800&fit=crop&q=80",
      alt: "Cargo pants front view",
    },
    {
      url: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&h=800&fit=crop&q=80",
      alt: "Cargo pants styled outfit",
    },
    {
      url: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&h=800&fit=crop&q=80",
      alt: "Folded pants detail",
    },
  ],
  "Structured Snapback Cap": [
    {
      url: "https://images.unsplash.com/photo-1556306535-0f09a537f0a3?w=800&h=800&fit=crop&q=80",
      alt: "Black snapback cap front view",
    },
    {
      url: "https://images.unsplash.com/photo-1521369909029-2afed882baee?w=800&h=800&fit=crop&q=80",
      alt: "Cap collection display",
    },
    {
      url: "https://images.unsplash.com/photo-1575428652377-a2d80e2277fc?w=800&h=800&fit=crop&q=80",
      alt: "Person wearing a cap",
    },
  ],
  "Two-Piece Tracksuit Set": [
    {
      url: "https://images.unsplash.com/photo-1519058082700-08a0b56da9b4?w=800&h=800&fit=crop&q=80",
      alt: "Tracksuit set lifestyle",
    },
    {
      url: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&h=800&fit=crop&q=80",
      alt: "Athletic wear detail",
    },
    {
      url: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=800&h=800&fit=crop&q=80",
      alt: "Sporty outfit on model",
    },
  ],
  "Limited Edition Bomber Jacket": [
    {
      url: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&h=800&fit=crop&q=80",
      alt: "Black bomber jacket front",
    },
    {
      url: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&h=800&fit=crop&q=80",
      alt: "Bomber jacket detail shot",
    },
    {
      url: "https://images.unsplash.com/photo-1548126032-079a0fb0099d?w=800&h=800&fit=crop&q=80",
      alt: "Bomber jacket styled look",
    },
  ],
};

async function main() {
  const products = await db.product.findMany();

  if (products.length === 0) {
    console.error("No products found. Run seed-products.ts first.");
    return;
  }

  console.log("Seeding product images from Unsplash...\n");

  for (const product of products) {
    const images = PRODUCT_IMAGES[product.name];
    if (!images) {
      console.log(`  ⏭ ${product.name} — no images mapped, skipping`);
      continue;
    }

    // Delete existing images first (idempotent)
    await db.productImage.deleteMany({
      where: { productId: product.id },
    });

    // Create new images with position ordering
    for (let i = 0; i < images.length; i++) {
      const img = images[i]!;
      await db.productImage.create({
        data: {
          url: img.url,
          altText: img.alt,
          position: i,
          productId: product.id,
        },
      });
    }

    console.log(`  ✓ ${product.name} — ${images.length} images added`);
  }

  console.log("\nDone! All product images seeded.");
  console.log("Refresh the catalog to see them.");
}

main()
  .then(() => db.$disconnect())
  .catch((e) => {
    console.error(e);
    db.$disconnect();
  });
