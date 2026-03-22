// ============================================================
// Uploadthing — File Router (Server-Side)
// ============================================================
// Defines upload endpoints with auth middleware.
// Each endpoint specifies allowed file types, max size, and count.
//
// The middleware runs server-side before upload — perfect for auth.
// onUploadComplete runs after the file lands on CDN.
// ============================================================

import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@clerk/nextjs/server";

const f = createUploadthing();

// Validate that the UPLOADTHING_TOKEN is present at startup
if (!process.env.UPLOADTHING_TOKEN) {
  console.error("[UploadThing] ❌ UPLOADTHING_TOKEN env var is missing! Uploads will fail.");
} else {
  // Token should be a JWT (base64), not the old sk_live_ format
  const token = process.env.UPLOADTHING_TOKEN;
  if (token.startsWith("sk_live_") || token.startsWith("sk_test_")) {
    console.error(
      "[UploadThing] ❌ UPLOADTHING_TOKEN is in the old sk_live/sk_test format.",
      "v7+ requires a JWT token from the UploadThing dashboard.",
    );
  }
}

export const ourFileRouter = {
  /**
   * Product image uploader.
   * - Max 8 images per upload batch
   * - Max 4MB each (already compressed client-side)
   * - JPEG/PNG/WebP only
   */
  productImageUploader: f({
    image: { maxFileSize: "4MB", maxFileCount: 8 },
  })
    .middleware(async () => {
      const { userId } = await auth();
      if (!userId) throw new Error("Unauthorized");
      return { userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // ufsUrl is v7.4+, fall back to url for older versions
      const fileUrl = file.ufsUrl ?? file.url;
      console.log("[UploadThing] Upload complete for user:", metadata.userId);
      console.log("[UploadThing] File URL:", fileUrl);
      // Return data to client's onClientUploadComplete
      return { url: fileUrl, key: file.key, name: file.name };
    }),

  /**
   * Shop gallery uploader (images + videos).
   * - Max 4 files per batch
   * - Max 8MB each (images + short videos)
   * - JPEG/PNG/WebP/MP4 only
   */
  shopGalleryUploader: f({
    image: { maxFileSize: "8MB", maxFileCount: 4 },
    video: { maxFileSize: "16MB", maxFileCount: 2 },
  })
    .middleware(async () => {
      const { userId } = await auth();
      if (!userId) throw new Error("Unauthorized");
      return { userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const fileUrl = file.ufsUrl ?? file.url;
      console.log("[UploadThing] Gallery upload complete for user:", metadata.userId);
      console.log("[UploadThing] File URL:", fileUrl);
      return { url: fileUrl, key: file.key, name: file.name };
    }),

  /**
   * Shop logo (profile picture) uploader.
   * - 1 image only
   * - Max 4MB, JPEG/PNG/WebP
   */
  shopLogoUploader: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .middleware(async () => {
      const { userId } = await auth();
      if (!userId) throw new Error("Unauthorized");
      return { userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const fileUrl = file.ufsUrl ?? file.url;
      console.log("[UploadThing] Logo upload complete for user:", metadata.userId);
      console.log("[UploadThing] File URL:", fileUrl);
      return { url: fileUrl, key: file.key, name: file.name };
    }),

  /**
   * Bulk product image uploader.
   * - Up to 50 images per batch (for bulk import flow)
   * - Max 4MB each (compressed client-side)
   * - JPEG/PNG/WebP only
   */
  bulkProductImageUploader: f({
    image: { maxFileSize: "4MB", maxFileCount: 50 },
  })
    .middleware(async () => {
      const { userId } = await auth();
      if (!userId) throw new Error("Unauthorized");
      return { userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const fileUrl = file.ufsUrl ?? file.url;
      console.log("[UploadThing] Bulk upload complete for user:", metadata.userId);
      return { url: fileUrl, key: file.key, name: file.name };
    }),

  /**
   * Shop banner image uploader.
   * - 1 image only
   * - Max 4MB, JPEG/PNG/WebP
   */
  shopBannerUploader: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .middleware(async () => {
      const { userId } = await auth();
      if (!userId) throw new Error("Unauthorized");
      return { userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const fileUrl = file.ufsUrl ?? file.url;
      console.log("[UploadThing] Banner upload complete for user:", metadata.userId);
      console.log("[UploadThing] File URL:", fileUrl);
      return { url: fileUrl, key: file.key, name: file.name };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
