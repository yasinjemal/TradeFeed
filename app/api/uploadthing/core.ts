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
}

export const ourFileRouter = {
  /**
   * Product image uploader.
   * - Max 8 images per upload batch
   * - Max 4MB each (already compressed client-side)
   * - JPEG/PNG/WebP only
   * - Must be authenticated
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
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
