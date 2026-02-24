// ============================================================
// Dashboard — Reviews Page (Server Component)
// ============================================================
// Shows all reviews for the shop with approval controls.
// ============================================================

import { requireShopAccess } from "@/lib/auth";
import { notFound } from "next/navigation";
import { getShopReviews, getReviewStats } from "@/lib/db/reviews";
import { ReviewsDashboard } from "@/components/reviews/reviews-dashboard";

interface ReviewsPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ filter?: string }>;
}

export default async function ReviewsPage({ params, searchParams }: ReviewsPageProps) {
  const { slug } = await params;
  const query = await searchParams;

  const access = await requireShopAccess(slug);
  if (!access) notFound();

  const filter = query.filter === "pending" ? false : query.filter === "approved" ? true : undefined;

  const [reviews, stats] = await Promise.all([
    getShopReviews(access.shopId, { isApproved: filter }),
    getReviewStats(access.shopId),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Reviews</h1>
        <p className="text-sm text-stone-500 mt-1">
          Manage customer reviews and ratings for your products
        </p>
      </div>

      <ReviewsDashboard
        reviews={JSON.parse(JSON.stringify(reviews))}
        stats={stats}
        shopSlug={slug}
        currentFilter={query.filter}
      />
    </div>
  );
}
