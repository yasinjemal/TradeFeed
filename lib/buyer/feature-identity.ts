import "server-only";

import { cookies } from "next/headers";

export const BUYER_FEATURE_COOKIE = "tf_buyer_feature_id";
export const BUYER_FEATURE_MAX_AGE_SECONDS = 90 * 24 * 60 * 60;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function validFeatureId(value: string | undefined): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

/**
 * Read the on-demand identity used only for anonymous buyer features such as
 * server-side wishlist persistence and restock-alert upserts.
 */
export async function getBuyerFeatureId(): Promise<string | null> {
  const value = (await cookies()).get(BUYER_FEATURE_COOKIE)?.value;
  return validFeatureId(value) ? value : null;
}

/**
 * Create the feature identity only when a person actively saves a product or
 * requests an alert. It is independent of analytics consent and is never
 * copied into AnalyticsEvent.
 */
export async function getOrCreateBuyerFeatureId(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(BUYER_FEATURE_COOKIE)?.value;
  if (validFeatureId(existing)) return existing;

  const featureId = crypto.randomUUID();
  cookieStore.set(BUYER_FEATURE_COOKIE, featureId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: BUYER_FEATURE_MAX_AGE_SECONDS,
  });
  return featureId;
}
