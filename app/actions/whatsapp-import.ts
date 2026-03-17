"use server";

// ============================================================
// Server Actions — WhatsApp Product Import
// ============================================================
// Dashboard-facing actions for sellers to view their WhatsApp
// product import history and stats.
// ============================================================

import { requireShopAccess } from "@/lib/auth";
import { db } from "@/lib/db";

type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Get WhatsApp import history for a shop.
 * Used on the dashboard to show recent imports and their statuses.
 */
export async function getWhatsAppImportsAction(
  shopSlug: string,
  page = 1,
  pageSize = 20
): Promise<ActionResult<{
  imports: {
    id: string;
    messageId: string;
    status: string;
    captionText: string | null;
    aiProductName: string | null;
    parsedPrice: number | null;
    productId: string | null;
    errorMessage: string | null;
    createdAt: Date;
  }[];
  total: number;
}>> {
  try {
    const access = await requireShopAccess(shopSlug);
    if (!access) return { success: false, error: "Access denied" };

    const [imports, total] = await Promise.all([
      db.whatsAppProductImport.findMany({
        where: { shopId: access.shopId },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          messageId: true,
          status: true,
          captionText: true,
          aiProductName: true,
          parsedPrice: true,
          productId: true,
          errorMessage: true,
          createdAt: true,
        },
      }),
      db.whatsAppProductImport.count({
        where: { shopId: access.shopId },
      }),
    ]);

    return { success: true, data: { imports, total } };
  } catch (error) {
    console.error("[whatsapp-import-action] Error:", error);
    return { success: false, error: "Failed to load import history" };
  }
}

/**
 * Get WhatsApp import stats for a shop.
 * Quick summary for dashboard stat cards.
 */
export async function getWhatsAppImportStatsAction(
  shopSlug: string
): Promise<ActionResult<{
  total: number;
  processed: number;
  failed: number;
  pending: number;
}>> {
  try {
    const access = await requireShopAccess(shopSlug);
    if (!access) return { success: false, error: "Access denied" };

    const [total, processed, failed, pending] = await Promise.all([
      db.whatsAppProductImport.count({ where: { shopId: access.shopId } }),
      db.whatsAppProductImport.count({ where: { shopId: access.shopId, status: "PROCESSED" } }),
      db.whatsAppProductImport.count({ where: { shopId: access.shopId, status: "FAILED" } }),
      db.whatsAppProductImport.count({ where: { shopId: access.shopId, status: "PENDING" } }),
    ]);

    return { success: true, data: { total, processed, failed, pending } };
  } catch (error) {
    console.error("[whatsapp-import-stats] Error:", error);
    return { success: false, error: "Failed to load import stats" };
  }
}
