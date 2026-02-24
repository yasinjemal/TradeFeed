// ============================================================
// Server Action — Shop Creation
// ============================================================
// Next.js Server Action for creating a new shop.
//
// FLOW:
// 1. Receive form data from the client
// 2. Validate with Zod schema
// 3. Get user ID (dev hardcode → Phase 3: Clerk)
// 4. Call data access layer to create shop
// 5. Return result or structured error
//
// RULES:
// - All input validated via Zod BEFORE touching the DB
// - Never call Prisma directly here — use /lib/db/shops.ts
// - Return structured responses, never throw raw errors to client
// - This runs on the SERVER — safe for DB access
// ============================================================

"use server";

import { shopCreateSchema } from "@/lib/validation/shop";
import { createShop } from "@/lib/db/shops";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";

/**
 * Server action result type.
 * WHY: Structured responses so the UI can show proper error messages.
 * Never expose internal errors to the client.
 */
type ActionResult = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  shopSlug?: string;
};

/**
 * Create a new shop.
 *
 * WHAT: Validates input → gets user → creates shop → redirects to dashboard.
 * WHY: This is the genesis event of a new tenant. Must be bulletproof.
 *
 * MULTI-TENANT NOTES:
 * - userId comes from auth (dev: hardcoded, Phase 3: Clerk)
 * - Shop + ShopUser OWNER created atomically in the data access layer
 * - On success, redirects to the new shop's dashboard
 */
export async function createShopAction(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    // 1. Extract raw form data
    const rawInput = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      whatsappNumber: formData.get("whatsappNumber") as string,
    };

    // 2. Validate with Zod — catches bad input before DB
    const parsed = shopCreateSchema.safeParse(rawInput);

    if (!parsed.success) {
      // Return field-level errors for the UI to display
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0]?.toString() ?? "unknown";
        if (!fieldErrors[field]) {
          fieldErrors[field] = [];
        }
        fieldErrors[field].push(issue.message);
      }

      return {
        success: false,
        error: "Please fix the errors below.",
        fieldErrors,
      };
    }

    // 3. Get authenticated user (Clerk → DB)
    const user = await requireAuth();
    const userId = user.id;

    // 4. Create shop via data access layer (NOT direct Prisma call)
    const shop = await createShop(parsed.data, userId);

    // 5. Auto-assign Free subscription to new shop
    const { createFreeSubscription } = await import("@/lib/db/subscriptions");
    await createFreeSubscription(shop.id).catch((err: unknown) => {
      console.error("[createShopAction] Failed to create free subscription:", err);
      // Non-fatal — shop is still created
    });

    // 6. Redirect to the shop dashboard
    // redirect() throws internally — Next.js handles this
    redirect(`/dashboard/${shop.slug}`);
  } catch (error: unknown) {
    // Re-throw redirect (Next.js uses throw for redirects)
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }

    // Log the real error server-side (never expose to client)
    console.error("[createShopAction] Error:", error);

    return {
      success: false,
      error: "Something went wrong. Please try again.",
    };
  }
}
