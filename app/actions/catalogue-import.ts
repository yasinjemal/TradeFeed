// ============================================================
// Server Actions — Catalogue Import (Phase 4)
// ============================================================
// Lifecycle: start (create job + drafts) → process chunks
// (client-driven loop, quota-aware) → review (edit/skip) →
// publish → complete (POPIA purge + cleanup).
//
// All actions tenant-scoped via requireShopAccess.
// Gated behind FEATURE_FLAGS.CATALOGUE_IMPORT.
// ============================================================

"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireShopAccess } from "@/lib/auth";
import { FEATURE_FLAGS } from "@/lib/config/feature-flags";
import { reportError } from "@/lib/telemetry";
import { checkAiAccess, trackAiGeneration } from "@/lib/db/ai";
import { checkProductLimit } from "@/lib/db/subscriptions";
import { generateImportDraft } from "@/lib/ai/import-draft";
import {
  IMPORT_CHUNK_SIZE,
  planAiBudget,
  assessDraft,
  titleSimilarity,
  DUPLICATE_SIMILARITY_THRESHOLD,
} from "@/lib/imports/import-logic";
import { buildProductPlan, isMappingError } from "@/lib/imports/publish-mapper";

type ActionResult<T extends object | undefined = undefined> =
  | ([T] extends [undefined] ? { success: true } : { success: true } & T)
  | { success: false; error: string };

function flagGate(): { success: false; error: string } | null {
  if (!FEATURE_FLAGS.CATALOGUE_IMPORT) {
    return { success: false, error: "Catalogue import isn't available yet." };
  }
  return null;
}

// ── Start: create job + one draft per photo ──────────────────

const startSchema = z.object({
  photos: z
    .array(z.object({ url: z.string().url(), key: z.string().min(1) }))
    .min(1, "Add at least one photo")
    .max(50, "Maximum 50 photos per import"),
  globalContext: z.string().trim().max(2000).optional(),
});

export async function startPhotoImportAction(
  shopSlug: string,
  input: { photos: { url: string; key: string }[]; globalContext?: string }
): Promise<ActionResult<{ jobId: string }>> {
  const gate = flagGate();
  if (gate) return gate;

  try {
    const access = await requireShopAccess(shopSlug);
    if (!access) return { success: false, error: "Shop not found or access denied." };

    const parsed = startSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
    }

    const job = await db.importJob.create({
      data: {
        shopId: access.shopId,
        source: "PHOTOS",
        status: "PROCESSING",
        globalContext: parsed.data.globalContext || null,
        totalItems: parsed.data.photos.length,
        drafts: {
          create: parsed.data.photos.map((photo) => ({
            shopId: access.shopId,
            status: "PROCESSING" as const,
            photoUrls: [photo.url],
            photoKeys: [photo.key],
          })),
        },
      },
      select: { id: true },
    });

    return { success: true, jobId: job.id };
  } catch (error) {
    await reportError("startPhotoImportAction", error, { shopSlug });
    return { success: false, error: "Failed to start the import. Please try again." };
  }
}

// ── Process: one chunk of AI generations ─────────────────────
// Client calls this in a loop until done=true. Each call is
// small (≤ IMPORT_CHUNK_SIZE vision calls) to stay inside
// serverless timeouts. State lives in the DB, so a closed tab
// resumes cleanly.

export interface ChunkProgress {
  done: boolean;
  totalItems: number;
  readyItems: number;
  quotaExceededCount: number;
}

export async function processImportChunkAction(
  shopSlug: string,
  jobId: string
): Promise<ActionResult<ChunkProgress>> {
  const gate = flagGate();
  if (gate) return gate;

  try {
    const access = await requireShopAccess(shopSlug);
    if (!access) return { success: false, error: "Shop not found or access denied." };

    const job = await db.importJob.findUnique({
      where: { id: jobId, shopId: access.shopId },
      select: { id: true, status: true, globalContext: true, totalItems: true },
    });
    if (!job) return { success: false, error: "Import not found." };

    const pending = await db.draftListing.findMany({
      where: { importJobId: jobId, status: "PROCESSING" },
      orderBy: { createdAt: "asc" },
      take: IMPORT_CHUNK_SIZE,
      select: { id: true, photoUrls: true },
    });

    if (pending.length === 0) {
      // Nothing left — flip job to REVIEW if not already past it
      if (job.status === "PROCESSING") {
        await db.importJob.update({ where: { id: jobId }, data: { status: "REVIEW" } });
      }
      const counts = await getJobCounts(jobId);
      return { success: true, done: true, totalItems: job.totalItems, ...counts };
    }

    // ── Quota plan for this chunk ────────────────────────
    const aiAccess = await checkAiAccess(access.shopId);
    const budget = planAiBudget(
      pending.length,
      aiAccess.creditsRemaining ?? 0,
      aiAccess.hasUnlimitedAi
    );

    // Existing product names for duplicate detection (capped)
    const existing = await db.product.findMany({
      where: { shopId: access.shopId, isActive: true },
      select: { name: true },
      take: 300,
      orderBy: { createdAt: "desc" },
    });
    const existingNames = existing.map((p) => p.name);

    // ── AI portion (sequential — bounded by chunk size) ──
    for (let i = 0; i < budget.withAi; i++) {
      const draft = pending[i]!;
      const result = await generateImportDraft(draft.photoUrls[0] ?? "", job.globalContext);

      if (result) {
        await trackAiGeneration(access.shopId);

        const isDuplicate = existingNames.some(
          (name) => titleSimilarity(name, result.title) >= DUPLICATE_SIMILARITY_THRESHOLD
        );
        const assessment = assessDraft({
          confidence: result.confidence,
          modelFlags: isDuplicate ? [...result.flags, "possible_duplicate"] : result.flags,
          hasPrice: result.priceMinCents !== null,
          hasTitle: result.title.length >= 2,
        });

        await db.draftListing.update({
          where: { id: draft.id },
          data: {
            status: assessment.status,
            aiTitle: result.title,
            aiDescription: result.description || null,
            aiCategory: result.category || null,
            aiPriceMinCents: result.priceMinCents,
            aiPriceMaxCents: result.priceMaxCents,
            aiAttributes: result.attributes,
            confidence: result.confidence,
            flags: assessment.flags,
          },
        });
      } else {
        // AI failed for this photo — seller fills it in manually
        await db.draftListing.update({
          where: { id: draft.id },
          data: { status: "NEEDS_REVIEW", confidence: 0, flags: ["low_confidence"] },
        });
      }
    }

    // ── Quota-exceeded remainder: no AI, never silently fail ──
    if (budget.withoutAi > 0) {
      const remainderIds = pending.slice(budget.withAi).map((d) => d.id);
      await db.draftListing.updateMany({
        where: { id: { in: remainderIds } },
        data: { status: "NEEDS_REVIEW", flags: ["ai_quota_exceeded"] },
      });
    }

    // ── Update progress counters ─────────────────────────
    const counts = await getJobCounts(jobId);
    await db.importJob.update({
      where: { id: jobId },
      data: { readyItems: counts.readyItems },
    });

    const stillPending = await db.draftListing.count({
      where: { importJobId: jobId, status: "PROCESSING" },
    });
    if (stillPending === 0) {
      await db.importJob.update({ where: { id: jobId }, data: { status: "REVIEW" } });
    }

    return {
      success: true,
      done: stillPending === 0,
      totalItems: job.totalItems,
      ...counts,
    };
  } catch (error) {
    await reportError("processImportChunkAction", error, { shopSlug, jobId });
    return { success: false, error: "Processing hiccup — tap retry to continue." };
  }
}

async function getJobCounts(jobId: string) {
  const [readyItems, quotaExceededCount] = await Promise.all([
    db.draftListing.count({
      where: { importJobId: jobId, status: { notIn: ["PROCESSING"] } },
    }),
    db.draftListing.count({
      where: { importJobId: jobId, flags: { has: "ai_quota_exceeded" } },
    }),
  ]);
  return { readyItems, quotaExceededCount };
}

// ── Fetch drafts for the review grid ─────────────────────────

export interface ReviewDraft {
  id: string;
  status: string;
  aiTitle: string | null;
  aiDescription: string | null;
  aiCategory: string | null;
  aiPriceMinCents: number | null;
  sizes: string[];
  photoUrl: string | null;
  confidence: number;
  flags: string[];
}

export async function getImportDraftsAction(
  shopSlug: string,
  jobId: string
): Promise<ActionResult<{ drafts: ReviewDraft[] }>> {
  const gate = flagGate();
  if (gate) return gate;

  try {
    const access = await requireShopAccess(shopSlug);
    if (!access) return { success: false, error: "Access denied." };

    const drafts = await db.draftListing.findMany({
      where: { importJobId: jobId, shopId: access.shopId },
      orderBy: { createdAt: "asc" },
    });

    return {
      success: true,
      drafts: drafts.map((d) => ({
        id: d.id,
        status: d.status,
        aiTitle: d.aiTitle,
        aiDescription: d.aiDescription,
        aiCategory: d.aiCategory,
        aiPriceMinCents: d.aiPriceMinCents,
        sizes:
          ((d.aiAttributes as { sizes?: string[] } | null)?.sizes ?? []).filter(
            (s) => typeof s === "string"
          ),
        photoUrl: d.photoUrls[0] ?? null,
        confidence: d.confidence,
        flags: d.flags,
      })),
    };
  } catch (error) {
    await reportError("getImportDraftsAction", error, { shopSlug, jobId });
    return { success: false, error: "Failed to load drafts." };
  }
}

// ── Edit a draft inline ──────────────────────────────────────

const editSchema = z.object({
  title: z.string().trim().min(2).max(200).optional(),
  description: z.string().trim().max(2000).optional(),
  priceInRands: z.string().trim().optional(),
  sizes: z.array(z.string().trim().min(1).max(20)).max(15).optional(),
});

export async function updateDraftAction(
  shopSlug: string,
  draftId: string,
  input: { title?: string; description?: string; priceInRands?: string; sizes?: string[] }
): Promise<ActionResult> {
  const gate = flagGate();
  if (gate) return gate;

  try {
    const access = await requireShopAccess(shopSlug);
    if (!access) return { success: false, error: "Access denied." };

    const parsed = editSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
    }

    const draft = await db.draftListing.findFirst({
      where: { id: draftId, shopId: access.shopId },
      select: { id: true, status: true, aiAttributes: true, flags: true },
    });
    if (!draft || draft.status === "PUBLISHED") {
      return { success: false, error: "Draft not found or already published." };
    }

    let priceCents: number | undefined;
    if (parsed.data.priceInRands !== undefined && parsed.data.priceInRands !== "") {
      const value = parseFloat(parsed.data.priceInRands);
      if (!Number.isFinite(value) || value <= 0) {
        return { success: false, error: "Enter a valid price." };
      }
      priceCents = Math.round(value * 100);
    }

    const attributes =
      (draft.aiAttributes as { sizes?: string[]; colours?: string[]; material?: string } | null) ?? {};

    await db.draftListing.update({
      where: { id: draft.id },
      data: {
        ...(parsed.data.title !== undefined ? { aiTitle: parsed.data.title } : {}),
        ...(parsed.data.description !== undefined
          ? { aiDescription: parsed.data.description || null }
          : {}),
        ...(priceCents !== undefined
          ? {
              aiPriceMinCents: priceCents,
              aiPriceMaxCents: priceCents,
              flags: draft.flags.filter((f) => f !== "no_price_detected"),
            }
          : {}),
        ...(parsed.data.sizes !== undefined
          ? { aiAttributes: { ...attributes, sizes: parsed.data.sizes } }
          : {}),
        status: "READY", // seller touched it — treat as reviewed
      },
    });

    return { success: true };
  } catch (error) {
    await reportError("updateDraftAction", error, { shopSlug, draftId });
    return { success: false, error: "Failed to save. Please try again." };
  }
}

// ── Publish selected drafts ──────────────────────────────────

export async function publishDraftsAction(
  shopSlug: string,
  jobId: string,
  draftIds: string[]
): Promise<ActionResult<{ published: number; failed: { draftId: string; reason: string }[] }>> {
  const gate = flagGate();
  if (gate) return gate;

  try {
    const access = await requireShopAccess(shopSlug);
    if (!access) return { success: false, error: "Access denied." };

    if (draftIds.length === 0) {
      return { success: false, error: "Select at least one listing to publish." };
    }

    const drafts = await db.draftListing.findMany({
      where: {
        id: { in: draftIds.slice(0, 50) },
        importJobId: jobId,
        shopId: access.shopId,
        status: { in: ["READY", "NEEDS_REVIEW"] },
      },
    });

    let published = 0;
    const failed: { draftId: string; reason: string }[] = [];

    for (const draft of drafts) {
      // Plan limit checked per product — stop cleanly when full
      const limit = await checkProductLimit(access.shopId);
      if (!limit.allowed) {
        failed.push({
          draftId: draft.id,
          reason: `Product limit reached (${limit.current}/${limit.limit}). Upgrade to publish more.`,
        });
        continue;
      }

      const plan = buildProductPlan({
        aiTitle: draft.aiTitle,
        aiDescription: draft.aiDescription,
        aiPriceMinCents: draft.aiPriceMinCents,
        aiAttributes: draft.aiAttributes as { sizes?: string[]; colours?: string[]; material?: string } | null,
        photoUrls: draft.photoUrls,
      });

      if (isMappingError(plan)) {
        failed.push({
          draftId: draft.id,
          reason: plan.error === "missing_price" ? "Needs a price before publishing." : "Needs a title before publishing.",
        });
        continue;
      }

      const product = await db.product.create({
        data: {
          shopId: access.shopId,
          name: plan.name,
          description: plan.description,
          isActive: true,
          source: "IMPORT",
          aiGenerated: true,
          minPriceCents: plan.minPriceCents,
          maxPriceCents: plan.maxPriceCents,
          images: {
            create: plan.imageUrls.map((url, i) => {
              const key = draft.photoKeys[draft.photoUrls.indexOf(url)] ?? null;
              return { url, key, position: i };
            }),
          },
          variants: { create: plan.variants },
        },
        select: { id: true },
      });

      await db.draftListing.update({
        where: { id: draft.id },
        data: { status: "PUBLISHED", publishedProductId: product.id },
      });
      published++;

      // Listing translations (Phase 3 synergy, fire-and-forget)
      if (FEATURE_FLAGS.LISTING_TRANSLATIONS) {
        import("@/lib/ai/translate-listing")
          .then(({ upsertTranslationsForProduct }) =>
            upsertTranslationsForProduct(product.id, access.shopId)
          )
          .catch(() => {});
      }
    }

    await syncJobCounters(jobId);
    revalidatePath(`/dashboard/${shopSlug}/products`);
    revalidatePath(`/catalog/${shopSlug}`);

    return { success: true, published, failed };
  } catch (error) {
    await reportError("publishDraftsAction", error, { shopSlug, jobId });
    return { success: false, error: "Publishing failed partway. Refresh to see progress." };
  }
}

// ── Skip drafts ──────────────────────────────────────────────

export async function skipDraftsAction(
  shopSlug: string,
  jobId: string,
  draftIds: string[]
): Promise<ActionResult> {
  const gate = flagGate();
  if (gate) return gate;

  try {
    const access = await requireShopAccess(shopSlug);
    if (!access) return { success: false, error: "Access denied." };

    await db.draftListing.updateMany({
      where: {
        id: { in: draftIds.slice(0, 50) },
        importJobId: jobId,
        shopId: access.shopId,
        status: { in: ["READY", "NEEDS_REVIEW"] },
      },
      data: { status: "SKIPPED" },
    });

    await syncJobCounters(jobId);
    return { success: true };
  } catch (error) {
    await reportError("skipDraftsAction", error, { shopSlug, jobId });
    return { success: false, error: "Failed to skip. Please try again." };
  }
}

// ── Complete: POPIA purge + storage cleanup ──────────────────

export async function completeImportJobAction(
  shopSlug: string,
  jobId: string
): Promise<ActionResult> {
  const gate = flagGate();
  if (gate) return gate;

  try {
    const access = await requireShopAccess(shopSlug);
    if (!access) return { success: false, error: "Access denied." };

    // Delete uploaded photos of drafts that were never published
    const unpublished = await db.draftListing.findMany({
      where: {
        importJobId: jobId,
        shopId: access.shopId,
        status: { in: ["SKIPPED", "NEEDS_REVIEW", "READY", "PROCESSING"] },
      },
      select: { id: true, photoKeys: true },
    });

    const keys = unpublished.flatMap((d) => d.photoKeys).filter(Boolean);
    if (keys.length > 0) {
      const { utapi } = await import("@/lib/ut-api");
      utapi.deleteFiles(keys).catch(() => {});
    }

    // Anything not actioned counts as skipped
    await db.draftListing.updateMany({
      where: {
        importJobId: jobId,
        shopId: access.shopId,
        status: { in: ["NEEDS_REVIEW", "READY", "PROCESSING"] },
      },
      data: { status: "SKIPPED" },
    });

    await syncJobCounters(jobId);

    // POPIA: purge pasted captions + batch context, close the job
    await db.$transaction([
      db.draftListing.updateMany({
        where: { importJobId: jobId },
        data: { originalCaption: null },
      }),
      db.importJob.update({
        where: { id: jobId, shopId: access.shopId },
        data: { status: "COMPLETED", globalContext: null, completedAt: new Date() },
      }),
    ]);

    revalidatePath(`/dashboard/${shopSlug}/import`);
    return { success: true };
  } catch (error) {
    await reportError("completeImportJobAction", error, { shopSlug, jobId });
    return { success: false, error: "Failed to finish the import." };
  }
}

async function syncJobCounters(jobId: string) {
  const [publishedItems, skippedItems] = await Promise.all([
    db.draftListing.count({ where: { importJobId: jobId, status: "PUBLISHED" } }),
    db.draftListing.count({ where: { importJobId: jobId, status: "SKIPPED" } }),
  ]);
  await db.importJob.update({
    where: { id: jobId },
    data: { publishedItems, skippedItems },
  });
}
