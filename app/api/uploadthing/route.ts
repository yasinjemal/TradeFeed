// ============================================================
// Uploadthing — Route Handler (Next.js App Router)
// ============================================================
// Exposes the file router at /api/uploadthing.
// This endpoint must be public in Clerk middleware.
// ============================================================

import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "./core";

export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
});
