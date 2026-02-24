// ============================================================
// Uploadthing — Client Helpers (Typed)
// ============================================================
// Generates typed React hooks and components bound to our FileRouter.
// useUploadThing — for custom upload UI (our preferred approach)
// UploadButton/UploadDropzone — pre-built components (backup)
// ============================================================

import {
  generateUploadButton,
  generateUploadDropzone,
  generateReactHelpers,
} from "@uploadthing/react";

import type { OurFileRouter } from "@/app/api/uploadthing/core";

export const UploadButton = generateUploadButton<OurFileRouter>();
export const UploadDropzone = generateUploadDropzone<OurFileRouter>();

export const { useUploadThing } = generateReactHelpers<OurFileRouter>();
