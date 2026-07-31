"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/admin";
import { SITE_URL } from "@/lib/config/site";
import { db } from "@/lib/db";
import { logAdminAction } from "@/lib/db/admin-audit";
import {
  adminCloseHunt,
  dismissHuntReport,
  markHuntFulfilled,
  publishHuntOffer,
  routeHuntToSeller,
  saveHuntSellerPreference,
  takeDownHunt,
  updateHuntSellerRouteStatus,
  withdrawHuntOffer,
} from "@/lib/db/hunt-operations";
import { deleteHuntMediaOrQueue } from "@/lib/hunt/media-deletion";
import { reportError } from "@/lib/telemetry";
import {
  huntAdminCloseSchema,
  huntAdminOfferSchema,
  huntAdminRouteSchema,
  huntAdminRouteStatusSchema,
  huntAdminDismissReportSchema,
  huntAdminTakedownSchema,
  huntAdminWithdrawOfferSchema,
  huntSellerPreferenceSchema,
} from "@/lib/validation/hunt";

export type AdminHuntActionResult =
  | {
      success: true;
      message: string;
      whatsappUrl?: string;
    }
  | {
      success: false;
      error: string;
    };

const fulfillmentConfirmationSchema = z.literal(true, {
  error: "Confirm that the buyer or seller reported this Hunt fulfilled.",
});
const sellerConsentConfirmationSchema = z.literal(true, {
  error:
    "Confirm that this seller agreed to receive HUNT routes and publish anonymized offer details.",
});
const sellerPublicationConfirmationSchema = z.literal(true, {
  error:
    "Confirm current stock and that the seller approved these anonymized offer details for public publication.",
});

function actionError(error: unknown, fallback: string): AdminHuntActionResult {
  return {
    success: false,
    error: error instanceof Error ? error.message : fallback,
  };
}

function refreshHuntAdmin() {
  revalidatePath("/admin/hunts");
}

function refreshPublicHunts() {
  revalidatePath("/hunt");
  revalidatePath("/hunt/[slug]", "page");
}

function buildSellerRouteWhatsAppUrl(input: {
  whatsappNumber: string | null;
  sellerName: string;
  huntSlug: string;
  publicTitle: string;
  publicDescription: string | null;
  desiredVariant: string | null;
  maxBudgetCents: number | null;
  city: string;
}): string {
  const phone = input.whatsappNumber?.replace(/\D/g, "") ?? "";
  if (!phone) {
    throw new Error("This seller does not have a WhatsApp number.");
  }

  const budget =
    input.maxBudgetCents == null
      ? null
      : new Intl.NumberFormat("en-ZA", {
          style: "currency",
          currency: "ZAR",
          maximumFractionDigits:
            input.maxBudgetCents % 100 === 0 ? 0 : 2,
        }).format(input.maxBudgetCents / 100);
  const publicUrl = `${SITE_URL.replace(/\/$/, "")}/hunt/${input.huntSlug}`;
  const lines = [
    `Hi ${input.sellerName}, TradeFeed HUNT has a buyer request that matches your opt-in preferences.`,
    "",
    `Request: ${input.publicTitle}`,
  ];

  if (input.publicDescription) {
    lines.push(`Details: ${input.publicDescription}`);
  }
  if (input.desiredVariant) {
    lines.push(`Size / variant: ${input.desiredVariant}`);
  }
  if (budget) {
    lines.push(`Maximum budget: ${budget}`);
  }
  lines.push(
    `Area: ${input.city}`,
    `Public Hunt: ${publicUrl}`,
    "",
    "If you genuinely have this item now, reply with the product name, exact price, variant, quantity, and delivery or collection timing.",
    "",
    "By sending an offer, you approve TradeFeed publishing those offer details with an anonymous TradeFeed-seller label. Your business name, logo and WhatsApp number stay private until the buyer chooses your offer.",
    "",
    "You may send proof-of-stock privately for concierge review, but TradeFeed will not publish that media during Beta.",
    "",
    "Reply STOP if you no longer want TradeFeed HUNT requests.",
  );

  return `https://wa.me/${phone}?text=${encodeURIComponent(lines.join("\n"))}`;
}

export async function saveHuntSellerPreferenceAction(
  input: unknown,
  sellerConsentConfirmed: unknown,
): Promise<AdminHuntActionResult> {
  try {
    const admin = await requireAdmin();
    const parsed = huntSellerPreferenceSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid seller preference.",
      };
    }
    if (parsed.data.isOptedIn) {
      const confirmation = sellerConsentConfirmationSchema.safeParse(
        sellerConsentConfirmed,
      );
      if (!confirmation.success) {
        return {
          success: false,
          error:
            confirmation.error.issues[0]?.message ??
            "Seller consent confirmation is required.",
        };
      }
    }

    const result = await saveHuntSellerPreference(parsed.data, admin.id);
    await logAdminAction({
      adminId: admin.id,
      adminEmail: admin.email,
      action: parsed.data.isOptedIn
        ? "HUNT_SELLER_OPT_IN"
        : "HUNT_SELLER_PAUSE",
      entityType: "shop",
      entityId: result.shop.id,
      entityName: result.shop.name,
      details: {
        cities: parsed.data.cities,
        categories: parsed.data.categories,
      },
    });

    refreshHuntAdmin();
    return {
      success: true,
      message: parsed.data.isOptedIn
        ? `${result.shop.name} is opted into HUNT routing.`
        : `${result.shop.name} is paused from HUNT routing.`,
    };
  } catch (error) {
    await reportError("saveHuntSellerPreferenceAction", error);
    return actionError(error, "Could not update seller HUNT preferences.");
  }
}

/**
 * Creates a route record and returns a prefilled wa.me link. It never sends
 * the message automatically: a TradeFeed operator must review and tap it.
 */
export async function routeHuntToSellerAction(
  input: unknown,
): Promise<AdminHuntActionResult> {
  try {
    const admin = await requireAdmin();
    const parsed = huntAdminRouteSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid seller route.",
      };
    }

    const routableSeller = await db.shop.findFirst({
      where: { id: parsed.data.shopId, isActive: true },
      select: { whatsappNumber: true },
    });
    if (!routableSeller?.whatsappNumber) {
      return {
        success: false,
        error: "This seller does not have a WhatsApp number.",
      };
    }

    const result = await routeHuntToSeller(parsed.data, admin.id);
    const whatsappUrl = buildSellerRouteWhatsAppUrl({
      whatsappNumber: routableSeller.whatsappNumber,
      sellerName: result.shop.name,
      huntSlug: result.hunt.slug,
      publicTitle: result.hunt.publicTitle,
      publicDescription: result.hunt.publicDescription,
      desiredVariant: result.hunt.desiredVariant,
      maxBudgetCents: result.hunt.maxBudgetCents,
      city: result.hunt.city,
    });

    await logAdminAction({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "HUNT_SELLER_ROUTE",
      entityType: "huntSellerRoute",
      entityId: result.route.id,
      entityName: result.hunt.publicTitle,
      details: {
        huntId: result.hunt.id,
        shopId: result.shop.id,
        sellerName: result.shop.name,
      },
    });

    refreshHuntAdmin();
    return {
      success: true,
      message:
        "Route saved. Review the prefilled message, then contact the seller manually.",
      whatsappUrl,
    };
  } catch (error) {
    await reportError("routeHuntToSellerAction", error);
    return actionError(error, "Could not route this Hunt.");
  }
}

export async function updateHuntSellerRouteStatusAction(
  input: unknown,
): Promise<AdminHuntActionResult> {
  try {
    const admin = await requireAdmin();
    const parsed = huntAdminRouteStatusSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid route update.",
      };
    }

    const route = await updateHuntSellerRouteStatus(
      parsed.data.routeId,
      parsed.data.status,
    );
    await logAdminAction({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "HUNT_SELLER_ROUTE_STATUS",
      entityType: "huntSellerRoute",
      entityId: route.id,
      details: { status: parsed.data.status },
    });

    refreshHuntAdmin();
    return {
      success: true,
      message: `Seller route marked ${parsed.data.status.toLowerCase()}.`,
    };
  } catch (error) {
    await reportError("updateHuntSellerRouteStatusAction", error);
    return actionError(error, "Could not update the seller route.");
  }
}

export async function publishHuntOfferAction(
  input: unknown,
  sellerPublicationConfirmed: unknown,
): Promise<AdminHuntActionResult> {
  try {
    const admin = await requireAdmin();
    const parsed = huntAdminOfferSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid offer.",
      };
    }
    const publicationConfirmation =
      sellerPublicationConfirmationSchema.safeParse(
        sellerPublicationConfirmed,
      );
    if (!publicationConfirmation.success) {
      return {
        success: false,
        error:
          publicationConfirmation.error.issues[0]?.message ??
          "Seller publication approval is required.",
      };
    }

    const offer = await publishHuntOffer(parsed.data, admin.id);
    await logAdminAction({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "HUNT_OFFER_PUBLISH",
      entityType: "huntOffer",
      entityId: offer.id,
      entityName: parsed.data.publicProductName,
      details: {
        huntId: parsed.data.huntId,
        shopId: parsed.data.shopId,
        matchType: parsed.data.matchType,
        priceCents: parsed.data.priceCents,
        genuineStockConfirmed: true,
        sellerPublicationConfirmed: true,
        publicSellerIdentityWithheld: true,
        publicProofMediaWithheld: true,
      },
    });

    refreshHuntAdmin();
    refreshPublicHunts();
    return {
      success: true,
      message: "The seller's genuine offer is now visible on the Hunt.",
    };
  } catch (error) {
    await reportError("publishHuntOfferAction", error);
    return actionError(error, "Could not publish the offer.");
  }
}

export async function withdrawHuntOfferAdminAction(
  input: unknown,
): Promise<AdminHuntActionResult> {
  try {
    const admin = await requireAdmin();
    const parsed = huntAdminWithdrawOfferSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error:
          parsed.error.issues[0]?.message ?? "Invalid offer withdrawal.",
      };
    }

    const offer = await withdrawHuntOffer(parsed.data, admin.id);
    await logAdminAction({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "HUNT_OFFER_WITHDRAW",
      entityType: "huntOffer",
      entityId: offer.id,
      entityName: offer.publicProductName,
      details: {
        huntId: offer.huntId,
        reason: parsed.data.reason,
      },
    });

    refreshHuntAdmin();
    refreshPublicHunts();
    return { success: true, message: "Offer withdrawn from the public Hunt." };
  } catch (error) {
    await reportError("withdrawHuntOfferAdminAction", error);
    return actionError(error, "Could not withdraw this offer.");
  }
}

export async function dismissHuntReportAdminAction(
  input: unknown,
): Promise<AdminHuntActionResult> {
  try {
    const admin = await requireAdmin();
    const parsed = huntAdminDismissReportSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid report resolution.",
      };
    }

    const report = await dismissHuntReport(parsed.data, admin.id);
    await logAdminAction({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "HUNT_REPORT_DISMISS",
      entityType: "huntReport",
      entityId: report.id,
      entityName: report.hunt.publicTitle,
      details: { resolutionNote: parsed.data.resolutionNote },
    });

    refreshHuntAdmin();
    return { success: true, message: "Report reviewed and dismissed." };
  } catch (error) {
    await reportError("dismissHuntReportAdminAction", error);
    return actionError(error, "Could not resolve this report.");
  }
}

export async function closeHuntAdminAction(
  input: unknown,
): Promise<AdminHuntActionResult> {
  try {
    const admin = await requireAdmin();
    const parsed = huntAdminCloseSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid close request.",
      };
    }

    const closableHunt = await db.hunt.findUnique({
      where: { id: parsed.data.huntId },
      select: { status: true },
    });
    if (
      !closableHunt ||
      !["LIVE", "FOUND"].includes(closableHunt.status)
    ) {
      return {
        success: false,
        error: "Only a live or found Hunt can be closed.",
      };
    }

    const hunt = await adminCloseHunt(parsed.data.huntId, admin.id);
    await logAdminAction({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "HUNT_CLOSE",
      entityType: "hunt",
      entityId: hunt.id,
      entityName: hunt.publicTitle,
      details: parsed.data.reason ? { reason: parsed.data.reason } : undefined,
    });

    refreshHuntAdmin();
    refreshPublicHunts();
    return { success: true, message: "Hunt closed." };
  } catch (error) {
    await reportError("closeHuntAdminAction", error);
    return actionError(error, "Could not close this Hunt.");
  }
}

export async function takeDownHuntAdminAction(
  input: unknown,
): Promise<AdminHuntActionResult> {
  try {
    const admin = await requireAdmin();
    const parsed = huntAdminTakedownSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid takedown request.",
      };
    }

    const hunt = await takeDownHunt({
      ...parsed.data,
      adminId: admin.id,
    });
    await logAdminAction({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "HUNT_TAKEDOWN",
      entityType: "hunt",
      entityId: hunt.id,
      entityName: hunt.publicTitle,
      details: {
        reason: parsed.data.reason,
        reportId: parsed.data.reportId,
      },
    });

    let mediaWarning = "";
    if (hunt.publicImageKey) {
      const deleted = await deleteHuntMediaOrQueue(
        hunt.publicImageKey,
        "hunt-takedown",
      );
      if (deleted) {
        await db.hunt.updateMany({
          where: { id: hunt.id, publicImageKey: hunt.publicImageKey },
          data: { publicImageKey: null, publicImageUrl: "" },
        });
      } else {
        mediaWarning =
          " The Hunt is hidden; media deletion is queued for automatic retry.";
        await reportError("takeDownHuntAdminAction.mediaDelete", new Error(
          "HUNT media deletion was queued for retry",
        ), {
          huntId: hunt.id,
        });
      }
    }

    refreshHuntAdmin();
    refreshPublicHunts();
    return {
      success: true,
      message: `Hunt taken down.${mediaWarning}`,
    };
  } catch (error) {
    await reportError("takeDownHuntAdminAction", error);
    return actionError(error, "Could not take down this Hunt.");
  }
}

export async function markHuntFulfilledAdminAction(
  input: unknown,
  fulfillmentConfirmed: unknown,
): Promise<AdminHuntActionResult> {
  try {
    const admin = await requireAdmin();
    const parsed = huntAdminCloseSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid Hunt.",
      };
    }
    const confirmation = fulfillmentConfirmationSchema.safeParse(
      fulfillmentConfirmed,
    );
    if (!confirmation.success) {
      return {
        success: false,
        error:
          confirmation.error.issues[0]?.message ??
          "Fulfilment confirmation is required.",
      };
    }

    const handoff = await db.hunt.findUnique({
      where: { id: parsed.data.huntId },
      select: {
        status: true,
        selectedOfferId: true,
        fulfillmentStatus: true,
      },
    });
    if (
      !handoff?.selectedOfferId ||
      handoff.status !== "FOUND" ||
      handoff.fulfillmentStatus !== "HANDOFF_SENT"
    ) {
      return {
        success: false,
        error:
          "A buyer-selected offer and WhatsApp handoff are required before fulfilment.",
      };
    }

    const hunt = await markHuntFulfilled(parsed.data.huntId, admin.id);
    await logAdminAction({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "HUNT_FULFILLED",
      entityType: "hunt",
      entityId: hunt.id,
      entityName: hunt.publicTitle,
    });

    refreshHuntAdmin();
    refreshPublicHunts();
    return {
      success: true,
      message: "Hunt marked fulfilled after operator confirmation.",
    };
  } catch (error) {
    await reportError("markHuntFulfilledAdminAction", error);
    return actionError(error, "Could not mark this Hunt fulfilled.");
  }
}
