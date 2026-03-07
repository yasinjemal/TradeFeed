#!/usr/bin/env tsx
// ============================================================
// One-Time Migration Script — Base64 Images → Uploadthing CDN
// ============================================================
//
// WHAT: Finds all ProductImage rows where `url` starts with "data:",
//       uploads the decoded image to Uploadthing CDN, and updates
//       the DB row with the new CDN URL + file key.
//
// WHY:  Phase 2-3 stored images as base64 data URIs in the DB.
//       Phase 4 switched to Uploadthing CDN. Old images need migrating.
//
// USAGE:
//   npx tsx scripts/migrate-images.ts
//
// PREREQUISITES:
//   - UPLOADTHING_TOKEN must be set in .env
//   - DATABASE_URL must be set in .env
//
// SAFETY:
//   - Processes images one at a time to avoid rate limits
//   - Logs every step for auditability
//   - Skips images that fail (logs error, continues)
//   - Idempotent: re-running skips already-migrated images
// ============================================================

import { PrismaClient } from "@prisma/client";
import { UTApi } from "uploadthing/server";

const db = new PrismaClient();
const utapi = new UTApi();

// ── Helpers ──────────────────────────────────────────────────

function base64ToFile(dataUri: string, filename: string): File {
  // Parse "data:image/jpeg;base64,/9j/4AAQ..."
  const [meta, base64Data] = dataUri.split(",");
  if (!meta || !base64Data) {
    throw new Error("Invalid data URI format");
  }

  const mimeMatch = meta.match(/data:([^;]+)/);
  const mime = mimeMatch?.[1] ?? "image/jpeg";

  // Decode base64 to binary
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Extension from MIME
  const ext = mime.split("/")[1] ?? "jpg";
  const finalName = `${filename}.${ext}`;

  return new File([bytes], finalName, { type: mime });
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Main ─────────────────────────────────────────────────────

async function main() {
  console.log("🔍 Scanning for base64 images in the database...\n");

  // Find all images with base64 data URIs
  const base64Images = await db.productImage.findMany({
    where: {
      url: { startsWith: "data:" },
    },
    select: {
      id: true,
      url: true,
      altText: true,
      productId: true,
    },
  });

  if (base64Images.length === 0) {
    console.log("✅ No base64 images found. Database is clean!");
    return;
  }

  console.log(`📦 Found ${base64Images.length} base64 image(s) to migrate.\n`);

  let success = 0;
  let failed = 0;
  let skipped = 0;

  for (let i = 0; i < base64Images.length; i++) {
    const img = base64Images[i]!;
    const progress = `[${i + 1}/${base64Images.length}]`;

    try {
      // Skip if somehow the URL is too short to be valid base64
      if (img.url.length < 50) {
        console.log(`${progress} ⏭️  Skipping ${img.id} — URL too short to be valid base64`);
        skipped++;
        continue;
      }

      const sizeBytes = Math.ceil((img.url.length * 3) / 4); // Approximate decoded size
      console.log(
        `${progress} 📤 Uploading ${img.id} (~${formatBytes(sizeBytes)})...`
      );

      // Convert base64 data URI to a File object
      const filename = `migrated-${img.productId}-${img.id}`;
      const file = base64ToFile(img.url, filename);

      // Upload to Uploadthing
      const response = await utapi.uploadFiles(file);

      if (response.error) {
        throw new Error(response.error.message);
      }

      const { url: cdnUrl, key } = response.data;

      // Update DB with CDN URL and file key
      await db.productImage.update({
        where: { id: img.id },
        data: {
          url: cdnUrl,
          key: key,
        },
      });

      console.log(`${progress} ✅ Migrated → ${cdnUrl}`);
      success++;

      // Small delay between uploads to be kind to the API
      if (i < base64Images.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`${progress} ❌ Failed ${img.id}: ${message}`);
      failed++;
    }
  }

  // ── Summary ──────────────────────────────────────────────
  console.log("\n" + "═".repeat(50));
  console.log("📊 Migration Summary");
  console.log("═".repeat(50));
  console.log(`  ✅ Migrated: ${success}`);
  console.log(`  ❌ Failed:   ${failed}`);
  console.log(`  ⏭️  Skipped:  ${skipped}`);
  console.log(`  📦 Total:    ${base64Images.length}`);
  console.log("═".repeat(50));

  if (failed > 0) {
    console.log("\n⚠️  Some images failed. Re-run the script to retry them.");
    process.exit(1);
  }

  console.log("\n🎉 All images migrated to Uploadthing CDN!");
}

main()
  .catch((err) => {
    console.error("💥 Migration failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
