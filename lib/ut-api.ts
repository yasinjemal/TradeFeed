// ============================================================
// Uploadthing — Server-Side API (UTApi)
// ============================================================
// Used for server-side file operations like deletion.
// Import this in server actions, NOT in client components.
// ============================================================

import { UTApi } from "uploadthing/server";

export const utapi = new UTApi();
