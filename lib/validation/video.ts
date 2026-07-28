// ============================================================
// Validation — Product Videos
// ============================================================
// Thin Zod schemas only. Source classification (YouTube vs
// direct link) is NOT done here — the server action re-runs
// lib/video/parse.ts as the authority so a client can never
// mislabel a URL's source.
// ============================================================

import { z } from "zod";

/** v1 cap — schema supports more via position, UI/actions enforce 1 */
export const MAX_VIDEOS_PER_PRODUCT = 1;

/** A pasted video link (YouTube or direct file URL) */
export const addVideoLinkSchema = z.object({
  url: z.string().trim().min(1, "Paste a video link first.").max(2048),
});

/** UploadThing callback payload for a hosted video upload */
export const saveVideoUploadSchema = z.object({
  url: z.string().url().max(2048),
  key: z.string().min(1).max(256),
  name: z.string().max(256),
});
