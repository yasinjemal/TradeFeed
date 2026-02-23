// ============================================================
// Shared TypeScript Types
// ============================================================
// Types used across layers (API, UI, lib) live here.
// Prisma-generated types are available via @prisma/client.
// Custom types and API response shapes go here.
// ============================================================

/**
 * Standard API error response shape.
 * All API routes return this on error for consistency.
 */
export interface ApiErrorResponse {
  error: string;
  code: string;
}

/**
 * Standard API success response wrapper.
 */
export interface ApiSuccessResponse<T> {
  data: T;
}

/**
 * Format price from cents to ZAR display string.
 * e.g., 29999 → "R 299.99"
 */
export function formatZAR(priceInCents: number): string {
  const rands = priceInCents / 100;
  return `R ${rands.toFixed(2)}`;
}
