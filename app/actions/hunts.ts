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
  countRecentHuntsForPhone,
  createHuntRecord,
  joinPublicHunt,
} from "@/lib/db/hunts";
import { checkRateLimit, getActionClientIp } from "@/lib/rate-limit-upstash";
import { utapi } from "@/lib/ut-api";
import {
  HUNT_LIFETIME_HOURS,
  HUNT_MAX_IMAGE_BYTES,
  HUNT_PILOT_PROVINCE,
  HUNT_PRIVATE_RETENTION_DAYS,
  detectHuntImageMime,
  formCheckbox,
  huntCreateFieldsSchema,
  imageExtensionForMime,
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
  const ip = await getActionClientIp();
  const featureId = await getOrCreateBuyerFeatureId();
  const [ipLimit, deviceLimit] = await Promise.all([
    checkRateLimit("huntCreate", `ip:${ip}`),
    checkRateLimit("huntCreate", `device:${featureId}`),
  ]);
  if (!ipLimit.allowed || !deviceLimit.allowed) {
    return {
      success: false,
      error: "Too many Hunts were started from this device. Try again later.",
    };
  }

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

  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentHunts = await countRecentHuntsForPhone(
      normalizedPhone,
      oneDayAgo,
    );
    if (recentHunts >= 3) {
      return {
        success: false,
        error:
          "This WhatsApp number already started three Hunts today. Try again tomorrow.",
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

  const imageDataUrl = `data:${detectedMime};base64,${Buffer.from(bytes).toString("base64")}`;

  try {
    await moderateHuntReference(imageDataUrl, parsed.data.requestText);
    const analysis = await analyzeHuntReference(
      imageDataUrl,
      parsed.data.requestText,
    );

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

    const extension = imageExtensionForMime(detectedMime);
    const safeFile = new File(
      [bytes],
      `hunt-${randomUUID()}.${extension}`,
      { type: detectedMime },
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
    const desiredVariant =
      parsed.data.desiredVariant ?? analysis.inferredVariant;

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
      await utapi.deleteFiles(uploaded.data.key).catch(() => undefined);
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
  const [ipLimit, deviceLimit] = await Promise.all([
    checkRateLimit("huntJoin", `ip:${ip}`),
    checkRateLimit("huntJoin", `device:${featureId}`),
  ]);
  if (!ipLimit.allowed || !deviceLimit.allowed) {
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
