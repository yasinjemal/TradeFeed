"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";

import {
  HuntAiUnavailableError,
  HuntContentRejectedError,
  analyzeHuntReference,
  moderateHuntReference,
} from "@/lib/ai/analyze-hunt-reference";
import { getOrCreateBuyerFeatureId } from "@/lib/buyer/feature-identity";
import {
  countRecentHuntsForOwnerFeatureId,
  countRecentHuntsForPhone,
  createHuntRecord,
  HuntDailyLimitError,
  HuntDeviceDailyLimitError,
  joinPublicHunt,
} from "@/lib/db/hunts";
import { checkHuntCreateDatabaseRateLimit } from "@/lib/db/hunt-rate-limit";
import {
  closeHuntForOwner,
  recordPublicHuntShare,
  selectHuntOfferForOwner,
  submitHuntReport,
} from "@/lib/db/hunt-operations";
import { sanitizeHuntPublicImage } from "@/lib/hunt/image-sanitization";
import { buildHuntWhatsAppUrl } from "@/lib/hunt/whatsapp";
import { deleteHuntMediaOrQueue } from "@/lib/hunt/media-deletion";
import { checkRateLimit, getActionClientIp } from "@/lib/rate-limit-upstash";
import { reportError } from "@/lib/telemetry";
import { utapi } from "@/lib/ut-api";
import {
  HUNT_LIFETIME_HOURS,
  HUNT_MAX_IMAGE_BYTES,
  HUNT_PILOT_PROVINCE,
  HUNT_PRIVATE_RETENTION_DAYS,
  detectHuntImageMime,
  formCheckbox,
  huntCreateFieldsSchema,
  huntOwnerSelectOfferSchema,
  huntReportSchema,
} from "@/lib/validation/hunt";
import { normalizeToE164, whatsappLoginSchema } from "@/lib/validation/auth";

type HuntActionResult =
  | { success: true; slug: string }
  | {
      success: false;
      error: string;
      fieldErrors?: Record<string, string[]>;
    };

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function zodFieldErrors(
  issues: { path: PropertyKey[]; message: string }[],
): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of issues) {
    const field = String(issue.path[0] ?? "form");
    fieldErrors[field] ??= [];
    fieldErrors[field].push(issue.message);
  }
  return fieldErrors;
}

export async function createHuntAction(
  formData: FormData,
): Promise<HuntActionResult> {
  const parsed = huntCreateFieldsSchema.safeParse({
    requestText: formString(formData, "requestText"),
    desiredVariant: formString(formData, "desiredVariant"),
    city: formString(formData, "city"),
    maxBudgetCents: formString(formData, "maxBudgetRands"),
    matchPreference: formString(formData, "matchPreference"),
    buyerName: formString(formData, "buyerName"),
    phone: formString(formData, "phone"),
    publicImageConsent: formCheckbox(formData.get("publicImageConsent")),
    huntUpdatesConsent: formCheckbox(formData.get("huntUpdatesConsent")),
    termsAccepted: formCheckbox(formData.get("termsAccepted")),
  });
  if (!parsed.success) {
    return {
      success: false,
      error: "Check the highlighted Hunt details.",
      fieldErrors: zodFieldErrors(parsed.error.issues),
    };
  }

  const phone = whatsappLoginSchema.safeParse({
    phoneNumber: parsed.data.phone,
  });
  if (!phone.success) {
    return {
      success: false,
      error: "Enter a valid South African WhatsApp number.",
      fieldErrors: { phone: [phone.error.issues[0]?.message ?? "Invalid number"] },
    };
  }
  const normalizedPhone = normalizeToE164(phone.data.phoneNumber);
  const featureId = await getOrCreateBuyerFeatureId();

  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [recentPhoneHunts, recentDeviceHunts] = await Promise.all([
      countRecentHuntsForPhone(normalizedPhone, oneDayAgo),
      countRecentHuntsForOwnerFeatureId(featureId, oneDayAgo),
    ]);
    if (recentPhoneHunts >= 3) {
      return {
        success: false,
        error:
          "This WhatsApp number already started three Hunts today. Try again tomorrow.",
      };
    }
    if (recentDeviceHunts >= 3) {
      return {
        success: false,
        error:
          "This browser already started three Hunts today. Try again tomorrow.",
      };
    }
  } catch {
    return {
      success: false,
      error: "HUNT is temporarily unavailable. Please try again shortly.",
    };
  }

  const image = formData.get("referenceImage");
  if (!(image instanceof File) || image.size === 0) {
    return {
      success: false,
      error: "Choose one product screenshot or photo.",
      fieldErrors: { referenceImage: ["A product image is required"] },
    };
  }
  if (image.size > HUNT_MAX_IMAGE_BYTES) {
    return {
      success: false,
      error: "The image is too large after compression. Choose a smaller image.",
      fieldErrors: {
        referenceImage: ["The processed image must be under 850 KB"],
      },
    };
  }

  const bytes = new Uint8Array(await image.arrayBuffer());
  const detectedMime = detectHuntImageMime(bytes);
  if (!detectedMime || image.type !== detectedMime) {
    return {
      success: false,
      error: "Use a genuine JPG, PNG, or WebP product image.",
      fieldErrors: {
        referenceImage: ["Unsupported or mismatched image format"],
      },
    };
  }

  let sanitizedImage: Awaited<ReturnType<typeof sanitizeHuntPublicImage>>;
  try {
    sanitizedImage = await sanitizeHuntPublicImage(bytes);
  } catch {
    return {
      success: false,
      error:
        "The image could not be safely processed. Export or screenshot it again, then retry.",
      fieldErrors: {
        referenceImage: ["The image could not be rebuilt without metadata"],
      },
    };
  }

  if (
    sanitizedImage.bytes.byteLength > HUNT_MAX_IMAGE_BYTES ||
    detectHuntImageMime(sanitizedImage.bytes) !== sanitizedImage.mime
  ) {
    return {
      success: false,
      error: "The safely processed image is invalid. Please try another image.",
      fieldErrors: {
        referenceImage: ["Safe image validation failed"],
      },
    };
  }

  const attemptLimit = await checkHuntCreateDatabaseRateLimit({
    deviceId: featureId,
    ipAddress: await getActionClientIp(),
  });
  if (!attemptLimit.allowed) {
    if (attemptLimit.reason === "unavailable") {
      return {
        success: false,
        error: "HUNT is temporarily unavailable. Please try again shortly.",
      };
    }
    if (attemptLimit.reason === "network") {
      return {
        success: false,
        error:
          "Too many HUNT attempts came from this network. Please try again later.",
      };
    }
    return {
      success: false,
      error:
        "Too many HUNT attempts came from this browser. Please try again later.",
    };
  }

  const imageDataUrl =
    `data:${sanitizedImage.mime};base64,` +
    Buffer.from(sanitizedImage.bytes).toString("base64");

  try {
    await moderateHuntReference(imageDataUrl, parsed.data.requestText);
    const analysis = await analyzeHuntReference(imageDataUrl);

    if (!analysis.isProduct || analysis.multipleProducts) {
      return {
        success: false,
        error:
          "Use one clear image focused on the single product you want us to find.",
        fieldErrors: {
          referenceImage: ["One clearly visible product is required"],
        },
      };
    }
    if (analysis.privacyReviewRequired) {
      return {
        success: false,
        error:
          "Crop out faces, usernames, messages, addresses, or contact details, then try again.",
        fieldErrors: {
          referenceImage: ["This image needs a privacy-safe crop"],
        },
      };
    }
    if (analysis.pilotCategory === "OTHER") {
      return {
        success: false,
        error:
          "The first HUNT pilot supports clothing, shoes, and fashion accessories. More categories are coming.",
      };
    }

    const safeImageBuffer = new ArrayBuffer(sanitizedImage.bytes.byteLength);
    new Uint8Array(safeImageBuffer).set(sanitizedImage.bytes);
    const safeFile = new File(
      [safeImageBuffer],
      `hunt-${randomUUID()}.${sanitizedImage.extension}`,
      { type: sanitizedImage.mime },
    );
    const uploaded = await utapi.uploadFiles(safeFile);
    if (uploaded.error || !uploaded.data) {
      return {
        success: false,
        error: "The screenshot could not be stored. Please try again.",
      };
    }

    const imageUrl = uploaded.data.ufsUrl ?? uploaded.data.url;
    const now = new Date();
    const desiredVariant = parsed.data.desiredVariant;

    try {
      const hunt = await createHuntRecord({
        publicTitle: analysis.publicTitle,
        publicDescription: analysis.publicDescription,
        publicImageUrl: imageUrl,
        publicImageKey: uploaded.data.key,
        category: analysis.itemType,
        desiredVariant: desiredVariant ?? null,
        desiredColor: analysis.primaryColour,
        style: analysis.styleTerms.join(", ") || null,
        matchPreference: parsed.data.matchPreference,
        maxBudgetCents: parsed.data.maxBudgetCents,
        city: parsed.data.city,
        province: HUNT_PILOT_PROVINCE,
        aiConfidence: analysis.confidence,
        ownerFeatureId: featureId,
        whatsappNumber: normalizedPhone,
        buyerName: parsed.data.buyerName ?? null,
        rawRequestText: parsed.data.requestText,
        consentAt: now,
        expiresAt: new Date(
          now.getTime() + HUNT_LIFETIME_HOURS * 60 * 60 * 1000,
        ),
        purgeAfter: new Date(
          now.getTime() +
            HUNT_PRIVATE_RETENTION_DAYS * 24 * 60 * 60 * 1000,
        ),
      });

      return { success: true, slug: hunt.slug };
    } catch (error) {
      try {
        await deleteHuntMediaOrQueue(
          uploaded.data.key,
          "hunt-create-rollback",
        );
      } catch (cleanupError) {
        await reportError(
          "createHuntAction.rollbackMediaDelete",
          cleanupError,
          {
            huntMediaKey: uploaded.data.key,
            status: "orphaned-upload",
          },
        );
      }
      if (error instanceof HuntDailyLimitError) {
        return {
          success: false,
          error:
            "This WhatsApp number already started three Hunts today. Try again tomorrow.",
        };
      }
      if (error instanceof HuntDeviceDailyLimitError) {
        return {
          success: false,
          error:
            "This browser already started three Hunts today. Try again tomorrow.",
        };
      }
      console.error(
        "[hunt] persistence failed:",
        error instanceof Error ? error.message : "unknown error",
      );
      return {
        success: false,
        error: "The Hunt could not be created. Please try again.",
      };
    }
  } catch (error) {
    if (error instanceof HuntContentRejectedError) {
      return {
        success: false,
        error:
          "This image or request cannot be published under the HUNT pilot rules.",
      };
    }
    if (error instanceof HuntAiUnavailableError) {
      return {
        success: false,
        error:
          "HUNT image checks are temporarily unavailable. Please try again shortly.",
      };
    }
    console.error(
      "[hunt] creation failed:",
      error instanceof Error ? error.message : "unknown error",
    );
    return {
      success: false,
      error: "The Hunt could not be created. Please try again.",
    };
  }
}

export async function joinHuntAction(
  slug: string,
): Promise<
  | { success: true; participantCount: number }
  | { success: false; error: string }
> {
  const ip = await getActionClientIp();
  const featureId = await getOrCreateBuyerFeatureId();
  const [networkLimit, deviceLimit] = await Promise.all([
    ip === "unknown"
      ? Promise.resolve(null)
      : checkRateLimit("huntJoin", `ip:${ip}`),
    checkRateLimit("huntJoin", `device:${featureId}`),
  ]);
  if (!deviceLimit.allowed || (networkLimit && !networkLimit.allowed)) {
    return {
      success: false,
      error: "Too many join attempts. Try again in a little while.",
    };
  }

  const result = await joinPublicHunt(slug, featureId);
  if (!result) {
    return {
      success: false,
      error: "This Hunt is no longer accepting new interest.",
    };
  }

  revalidatePath(`/hunt/${slug}`);
  return { success: true, participantCount: result.participantCount };
}

type HuntSimpleActionResult =
  | { success: true }
  | { success: false; error: string };

export async function selectHuntOfferAction(
  huntSlug: string,
  offerId: string,
): Promise<
  | { success: true; whatsappUrl: string }
  | { success: false; error: string }
> {
  const parsed = huntOwnerSelectOfferSchema.safeParse({ huntSlug, offerId });
  if (!parsed.success) {
    return { success: false, error: "This offer link is invalid." };
  }

  const featureId = await getOrCreateBuyerFeatureId();
  const limit = await checkRateLimit("huntJoin", `select:${featureId}`);
  if (!limit.allowed) {
    return {
      success: false,
      error: "Too many offer attempts. Try again in a little while.",
    };
  }

  try {
    const { hunt, offer } = await selectHuntOfferForOwner({
      ...parsed.data,
      ownerFeatureId: featureId,
    });
    const whatsappUrl = buildHuntWhatsAppUrl(
      offer.sellerWhatsappSnapshot!,
      {
        huntSlug: hunt.slug,
        huntTitle: hunt.publicTitle,
        requestedVariant: hunt.desiredVariant,
        sellerName: offer.shop.name,
        offerTitle: offer.publicProductName,
        offerPriceCents: offer.priceCents,
        offerVariant: offer.publicVariant,
        deliveryEstimate: offer.publicDeliveryEstimate,
      },
    );

    revalidatePath(`/hunt/${hunt.slug}`);
    return { success: true, whatsappUrl };
  } catch (error) {
    const message =
      error instanceof Error &&
      [
        "Only the Hunt creator can choose an offer.",
        "This Hunt is unavailable, expired, or you are not its creator.",
        "A different offer has already been selected.",
        "This offer is no longer available.",
      ].includes(error.message)
        ? error.message
        : "The offer could not be selected. Please try again.";
    return { success: false, error: message };
  }
}

export async function closeHuntAction(
  huntSlug: string,
): Promise<HuntSimpleActionResult> {
  const parsed = huntOwnerSelectOfferSchema.shape.huntSlug.safeParse(huntSlug);
  if (!parsed.success) {
    return { success: false, error: "This Hunt link is invalid." };
  }

  const featureId = await getOrCreateBuyerFeatureId();
  try {
    await closeHuntForOwner(parsed.data, featureId);
    revalidatePath(`/hunt/${parsed.data}`);
    return { success: true };
  } catch {
    return {
      success: false,
      error: "Only the creator can close an active Hunt.",
    };
  }
}

export async function reportHuntAction(
  input: unknown,
): Promise<HuntSimpleActionResult> {
  const parsed = huntReportSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Check the report details.",
    };
  }

  const [featureId, ip] = await Promise.all([
    getOrCreateBuyerFeatureId(),
    getActionClientIp(),
  ]);
  const [ipLimit, deviceLimit] = await Promise.all([
    ip === "unknown"
      ? Promise.resolve(null)
      : checkRateLimit("huntReport", `ip:${ip}`),
    checkRateLimit("huntReport", `device:${featureId}`),
  ]);
  if (!deviceLimit.allowed || (ipLimit && !ipLimit.allowed)) {
    return {
      success: false,
      error: "Too many reports were sent. Try again later.",
    };
  }

  try {
    await submitHuntReport({
      ...parsed.data,
      reporterFeatureId: featureId,
    });
    return { success: true };
  } catch {
    return {
      success: false,
      error: "This Hunt is not available for reporting.",
    };
  }
}

export async function trackHuntShareAction(
  huntSlug: string,
  source: string,
): Promise<void> {
  const parsedSlug =
    huntOwnerSelectOfferSchema.shape.huntSlug.safeParse(huntSlug);
  const safeSource = ["native", "copy", "whatsapp"].includes(source)
    ? source
    : null;
  if (!parsedSlug.success || !safeSource) return;

  try {
    const [featureId, ip] = await Promise.all([
      getOrCreateBuyerFeatureId(),
      getActionClientIp(),
    ]);
    const limit = await checkRateLimit(
      "tracking",
      ip === "unknown"
        ? `hunt-share-device:${featureId}`
        : `hunt-share-ip:${ip}`,
    );
    if (!limit.allowed) return;
    await recordPublicHuntShare({
      slug: parsedSlug.data,
      visitorId: featureId,
      source: safeSource,
    });
  } catch {
    // Telemetry must never interfere with sharing.
  }
}
