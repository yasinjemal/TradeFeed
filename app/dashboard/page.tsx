// ============================================================
// Page — Dashboard Smart Redirect
// ============================================================
// After sign-in, users land here. We check if they have a shop:
//   - Yes → redirect to their first shop's dashboard
//   - No  → redirect to /create-shop
//
// This prevents the old bug where existing users were forced
// to the create-shop page unnecessarily.
// ============================================================

import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export default async function DashboardRedirectPage() {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    redirect("/sign-in");
  }

  // Look up the user's first shop
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

  const existingSlug = user?.shops[0]?.shop.slug;

  if (existingSlug) {
    redirect(`/dashboard/${existingSlug}`);
  }

  // No shop yet — send to create-shop
  redirect("/create-shop");
}
