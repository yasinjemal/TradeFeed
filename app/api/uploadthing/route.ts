// ============================================================
// Uploadthing — Route Handler (Next.js App Router)
// ============================================================
// Exposes the file router at /api/uploadthing.
// This endpoint must be public in Clerk middleware.
// ============================================================

import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "./core";

// Pass token explicitly — Vercel serverless can miss auto-detected env vars
export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
  config: {
    token: process.env.UPLOADTHING_TOKEN,
    isDev: process.env.NODE_ENV === "development",
  },
});
