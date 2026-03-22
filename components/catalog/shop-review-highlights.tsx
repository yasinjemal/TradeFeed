// ============================================================
// Component — Shop Review Highlights
// ============================================================
// Shows recent positive reviews on the shop page as social proof.
// Displayed between the product grid and About section.
// ============================================================

interface ReviewHighlight {
  id: string;
  rating: number;
  comment: string | null;
  buyerName: string;
  isVerified: boolean;
  createdAt: Date;
}

interface ShopReviewHighlightsProps {
  reviews: ReviewHighlight[];
  shopName: string;
}

export function ShopReviewHighlights({ reviews, shopName }: ShopReviewHighlightsProps) {
  if (reviews.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-800">What buyers say about {shopName}</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="rounded-xl border border-slate-200/60 bg-white p-4 shadow-sm"
          >
            {/* Star row */}
            <div className="flex items-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  className={`h-3.5 w-3.5 ${star <= review.rating ? "text-amber-400" : "text-slate-200"}`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.176 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81H7.03a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>

            {/* Comment */}
            {review.comment && (
              <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
                &ldquo;{review.comment}&rdquo;
              </p>
            )}

            {/* Buyer name + verified */}
            <div className="mt-2.5 flex items-center gap-1.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">
                {review.buyerName.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-medium text-slate-500">{review.buyerName}</span>
              {review.isVerified && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Verified buyer
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
