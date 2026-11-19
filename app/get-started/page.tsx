// ============================================================
// Page — Get Started (Product-First Onboarding)
// ============================================================
// New users land here after signup. Single page, 3 inline steps:
//   Step 1: WhatsApp number + shop name
//   Step 2: Upload product photo + name + price
//   Step 3: 🎉 Celebration — your shop is live!
//
// The only onboarding flow. /create-shop (shop first, empty dashboard,
// then /products/new) redirects here.
// ============================================================

import { SELLER_ONBOARDING_PATH, SELLER_SIGN_UP_PATH } from "@/lib/config/seller-cta";
import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { GetStartedFlow } from "@/components/shop/get-started-flow";
import { recordSellerMilestone } from "@/lib/analytics/seller-lifecycle";

export const metadata = {
  // The root layout appends the brand — don't repeat it here.
  title: "Get Started — List Your First Product",
  description:
    "Upload your first product and get your online shop link in under 60 seconds. Sell via WhatsApp on TradeFeed.",
};

export default async function GetStartedPage() {
  const { userId: clerkId } = await auth();

  // Guests are almost always new sellers (this is where every "create
  // your shop" link ends up), so send them to sign-up — which links to
  // sign-in — and bring them back here afterwards.
  if (!clerkId) {
    redirect(`${SELLER_SIGN_UP_PATH}?redirect_url=${SELLER_ONBOARDING_PATH}`);
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
    await recordSellerMilestone({
      userId: user.id,
      step: "started",
      source: "get-started",
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
