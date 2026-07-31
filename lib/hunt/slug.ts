import { randomBytes } from "node:crypto";

import { generateSlug } from "@/lib/utils/slug";

/**
 * Human-readable prefix plus 80 random bits. The slug is a public identifier,
 * never an ownership or management credential.
 */
export function generateHuntSlug(title: string): string {
  const base = generateSlug(title).slice(0, 60) || "hunt";
  const suffix = randomBytes(10).toString("base64url").toLowerCase();
  return `${base}-${suffix}`;
}
