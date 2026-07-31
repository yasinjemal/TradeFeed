import "server-only";

import { db } from "@/lib/db";
import { utapi } from "@/lib/ut-api";

const MAX_ERROR_LENGTH = 500;
const MAX_BACKOFF_HOURS = 24;

function retryAt(attempts: number): Date {
  const hours = Math.min(2 ** Math.max(attempts, 0), MAX_BACKOFF_HOURS);
  return new Date(Date.now() + hours * 60 * 60 * 1_000);
}

async function deleteHuntFileFromStorage(fileKey: string): Promise<void> {
  const result = await utapi.deleteFiles(fileKey);
  if (!result.success) {
    throw new Error("Storage provider reported an unsuccessful deletion");
  }
}

export async function queueHuntMediaDeletion(
  fileKey: string,
  reason: string,
) {
  return db.huntMediaDeletionJob.upsert({
    where: { fileKey },
    create: {
      fileKey,
      reason: reason.slice(0, 120),
    },
    update: {
      reason: reason.slice(0, 120),
      nextAttemptAt: new Date(),
    },
  });
}

/**
 * Attempt one queued deletion. UploadThing can return success=false without
 * throwing, so both the result and exceptions must be handled.
 */
export async function attemptQueuedHuntMediaDeletion(
  fileKey: string,
): Promise<boolean> {
  try {
    await deleteHuntFileFromStorage(fileKey);
    await db.huntMediaDeletionJob.deleteMany({ where: { fileKey } });
    return true;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown media deletion error";
    const job = await db.huntMediaDeletionJob.findUnique({
      where: { fileKey },
      select: { attempts: true },
    });
    if (job) {
      await db.huntMediaDeletionJob.update({
        where: { fileKey },
        data: {
          attempts: { increment: 1 },
          lastError: message.slice(0, MAX_ERROR_LENGTH),
          nextAttemptAt: retryAt(job.attempts + 1),
        },
      });
    }
    return false;
  }
}

export async function deleteHuntMediaOrQueue(
  fileKey: string,
  reason: string,
): Promise<boolean> {
  try {
    await queueHuntMediaDeletion(fileKey, reason);
  } catch (queueError) {
    // A create rollback can coincide with a database outage. In that case
    // there is no Hunt row for retention to rediscover, so still attempt the
    // provider deletion before surfacing the loss of durable retry state.
    try {
      await deleteHuntFileFromStorage(fileKey);
      return true;
    } catch (storageError) {
      throw new AggregateError(
        [queueError, storageError],
        "Could not queue or directly delete HUNT media",
      );
    }
  }

  return attemptQueuedHuntMediaDeletion(fileKey);
}

export async function processQueuedHuntMediaDeletions(limit = 200) {
  const jobs = await db.huntMediaDeletionJob.findMany({
    where: { nextAttemptAt: { lte: new Date() } },
    select: { fileKey: true },
    orderBy: [{ nextAttemptAt: "asc" }, { createdAt: "asc" }],
    take: Math.min(Math.max(limit, 1), 500),
  });

  let deleted = 0;
  let failed = 0;
  const concurrency = 10;
  for (let index = 0; index < jobs.length; index += concurrency) {
    const batch = jobs.slice(index, index + concurrency);
    const results = await Promise.all(
      batch.map((job) => attemptQueuedHuntMediaDeletion(job.fileKey)),
    );
    deleted += results.filter(Boolean).length;
    failed += results.filter((result) => !result).length;
  }

  return { due: jobs.length, deleted, failed };
}
