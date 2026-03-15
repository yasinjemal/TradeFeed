// ============================================================
// Zod Validation Schemas — Centralized
// ============================================================
// All input validation schemas live here.
// Import from "@/lib/validation" in API routes and server actions.
// Never validate inline. Always use .parse() or .safeParse().
// ============================================================

// AI Product Generation
export {
  aiProductResponseSchema,
  aiGenerateRequestSchema,
  sanitizeAIOutput,
  moderateContent,
  limitTags,
  applyAISafety,
  type AiProductResponse,
  type AiGenerateRequest,
} from "./ai-product";

// Phase 2 — Shop schemas
export { shopCreateSchema, type ShopCreateInput } from "./shop";

// Checkout validation
export { checkoutSchema, checkoutItemSchema, type CheckoutInput } from "./checkout";

// Shop settings
export { shopSettingsSchema, type ShopSettingsInput, SA_PROVINCES } from "./shop-settings";

// Product schemas
export {
  productCreateSchema,
  type ProductCreateInput,
  productUpdateSchema,
  type ProductUpdateInput,
  variantCreateSchema,
  type VariantCreateInput,
  variantUpdateSchema,
  type VariantUpdateInput,
} from "./product";
