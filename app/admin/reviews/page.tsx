import { requireAdmin } from "@/lib/auth/admin";
import { db } from "@/lib/db";
import { moderateReviewAction } from "@/app/actions/review-moderation";
export default async function ReviewModerationPage() {
  await requireAdmin();
  const reviews = await db.review.findMany({
    where: {
      OR: [
        { isApproved: false, moderatedAt: null },
        { reportedAt: { not: null } },
      ],
    },
    orderBy: { createdAt: "asc" },
    take: 100,
    include: { shop: { select: { name: true } } },
  });
  return (
    <section className="space-y-5 text-stone-100">
      <h1 className="text-2xl font-semibold">Review moderation</h1>
      <p className="text-stone-300">
        Apply the same content rules to positive and negative feedback. Seller
        reports do not automatically remove reviews.
      </p>
      {reviews.length === 0 && <p>No reviews need attention.</p>}
      {reviews.map((r) => (
        <article
          key={r.id}
          className="rounded-xl border border-stone-700 p-5 space-y-3"
        >
          <h2 className="font-semibold">
            {r.shop.name} · {r.rating}/5 ·{" "}
            {r.isVerified ? "Verified purchase" : "Unverified submission"}
          </h2>
          <p>{r.title}</p>
          <p className="whitespace-pre-wrap">{r.comment}</p>
          <form action={moderateReviewAction} className="flex flex-wrap gap-3">
            <input type="hidden" name="id" value={r.id} />
            <input
              name="reason"
              required
              minLength={5}
              maxLength={500}
              placeholder="Moderation reason"
              aria-label="Moderation reason"
              className="min-h-11 rounded-lg bg-stone-900 border border-stone-600 p-2"
            />
            <button
              name="decision"
              value="publish"
              className="rounded-lg bg-emerald-700 px-4 py-3"
            >
              Publish / keep visible
            </button>
            <button
              name="decision"
              value="hide"
              className="rounded-lg bg-stone-700 px-4 py-3"
            >
              Hide with reason
            </button>
          </form>
        </article>
      ))}
    </section>
  );
}
