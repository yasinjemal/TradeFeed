// ============================================================
// Page — Get Started (Product-First Onboarding)
// ============================================================
// New users land here after signup. Single page, 3 inline steps:
//   Step 1: WhatsApp number + shop name
//   Step 2: Upload product photo + name + price
//   Step 3: 🎉 Celebration — your shop is live!
//
// Replaces the old flow: /create-shop → empty dashboard → /products/new
// ============================================================

import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { GetStartedFlow } from "@/components/shop/get-started-flow";

export const metadata = {
  title: "Get Started — List Your First Product | TradeFeed",
  description:
    "Upload your first product and get your online shop link in under 60 seconds. Sell via WhatsApp on TradeFeed.",
};

export default async function GetStartedPage() {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    redirect("/sign-in");
  }

  // If user already has a shop, go to dashboard
  const user = await db.user.findUnique({
    where: { clerkId },
    select: {
      id: true,
      firstName: true,
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

  // Track that user started onboarding
  if (user) {
    await db.onboardingEvent.create({
      data: { userId: user.id, step: "started", metadata: { source: "get-started" } },
    }).catch(() => {});
  }

  // Pre-fill shop name from Clerk user's first name
  const clerkUser = await currentUser();
  const suggestedName = clerkUser?.firstName
    ? `${clerkUser.firstName}'s Shop`
    : "";

  return (
    <main className="min-h-screen bg-stone-950 text-stone-100">
      <GetStartedFlow suggestedShopName={suggestedName} />
    </main>
  );
}
