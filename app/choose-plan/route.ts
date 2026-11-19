// ============================================================
// GET /choose-plan?plan=<slug> — keep a chosen plan from getting lost
// ============================================================
// "Choose Pro" on /pricing used to drop the visitor on /sign-up with
// no memory of what they picked. Now it points at
//   /sign-up?redirect_url=/choose-plan?plan=pro
// and Clerk brings them here once they are signed in (new account,
// existing account, or already signed in — all three).
//
//   has a shop → /dashboard/<slug>/billing?plan=pro  (plan highlighted)
//   no shop    → onboarding; the plan waits in a 14-day cookie and is
//                picked up by the dashboard and the billing page
//
// Not in the proxy's public-route list on purpose: a signed-out
// visitor who lands here directly is sent to sign in and returned.
// ============================================================

import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import {
  PICKED_PLAN_COOKIE,
  PICKED_PLAN_COOKIE_MAX_AGE,
  choosePlanDestination,
  choosePlanHref,
  parseHighlightPlan,
} from "@/lib/billing/upgrade-copy";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const plan = parseHighlightPlan(request.nextUrl.searchParams.get("plan") ?? undefined);
  const { userId: clerkId } = await auth();

  // Defensive: the proxy normally handles this before we run.
  if (!clerkId) {
    return NextResponse.redirect(new URL(plan ? choosePlanHref(plan) : "/sign-up", request.url));
  }

  const user = await db.user.findUnique({
    where: { clerkId },
    select: {
      shops: {
        select: { shop: { select: { slug: true } } },
        where: { shop: { isActive: true } },
        take: 1,
        orderBy: { createdAt: "asc" },
      },
    },
  });

  const { path, rememberPlan } = choosePlanDestination({
    plan,
    shopSlug: user?.shops[0]?.shop.slug ?? null,
  });

  const response = NextResponse.redirect(new URL(path, request.url));

  if (rememberPlan) {
    response.cookies.set(PICKED_PLAN_COOKIE, rememberPlan, {
      maxAge: PICKED_PLAN_COOKIE_MAX_AGE,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }

  return response;
}
