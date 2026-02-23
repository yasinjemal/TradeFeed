// ============================================================
// Zod Validation Schemas — Centralized
// ============================================================
// All input validation schemas live here.
// Import from "@/lib/validation" in API routes and server actions.
// Never validate inline. Always use .parse() or .safeParse().
// ============================================================

// Phase 2 — Shop schemas
export { shopCreateSchema, type ShopCreateInput } from "./shop";

// Future:
// export { productCreateSchema } from "./product";
