// ============================================================
// Server-side request analytics
// ============================================================
// Reads the first-party visitor identity injected by proxy.ts and enriches
// browser events with bounded request metadata. Request IP addresses are
// intentionally never read here or passed to AnalyticsEvent.
// ============================================================

import { auth } from "@clerk/nextjs/server";
import type { EventType } from "@prisma/client";
import { after } from "next/server";
import { headers } from "next/headers";

import {
  buildAnalyticsRequestContext,
  shouldTrackBuyerView,
  type AnalyticsRequestContext,
} from "@/lib/analytics/visitor";
import { db } from "@/lib/db";
import { trackEvent } from "@/lib/db/analytics";

interface RequestAnalyticsEvent {
  type: EventType;
  shopId: string;
  productId?: string;
}

interface TrackRequestEventOptions {
  excludeSignedInShopOwners?: boolean;
  defer?: boolean;
}

export async function getAnalyticsRequestContext(): Promise<AnalyticsRequestContext | null> {
  return buildAnalyticsRequestContext(await headers());
}

export async function getRequestVisitorId(): Promise<string | null> {
  // Keep every caller behind the same consent, bot, and synthetic-monitor
  // policy as AnalyticsEvent. Reading the raw cookie here would let a
  // previously consented browser identity leak into a synthetic request.
  return (await getAnalyticsRequestContext())?.visitorId ?? null;
}

async function isSignedInShopOwner(): Promise<boolean> {
  try {
    const { userId } = await auth();
    if (!userId) return false;

    const membership = await db.shopUser.findFirst({
      where: {
        role: "OWNER",
        user: { clerkId: userId },
      },
      select: { id: true },
    });

    return membership !== null;
  } catch {
    // If identity cannot be resolved, fail closed for buyer-view metrics.
    return true;
  }
}

export async function trackRequestEvent(
  input: RequestAnalyticsEvent,
  options: TrackRequestEventOptions = {},
): Promise<void> {
  const context = await getAnalyticsRequestContext();
  if (!context) return;

  const shopOwner = options.excludeSignedInShopOwners
    ? await isSignedInShopOwner()
    : false;

  if (
    options.excludeSignedInShopOwners &&
    !shouldTrackBuyerView(context, shopOwner)
  ) {
    return;
  }

  const record = () => trackEvent({ ...input, ...context });
  if (options.defer) {
    after(record);
    return;
  }

  await record();
}
