// ============================================================
// Email Templates — New Review Notification
// ============================================================
// Sent to sellers when a buyer submits a review.
// ============================================================

interface ReviewEmailData {
  shopName: string;
  productName: string;
  rating: number;
  title?: string;
  comment?: string;
  buyerName: string;
  dashboardUrl: string;
}

export function newReviewEmailHtml(data: ReviewEmailData): string {
  const stars = "★".repeat(data.rating) + "☆".repeat(5 - data.rating);
  const starColor = data.rating >= 4 ? "#059669" : data.rating >= 3 ? "#d97706" : "#dc2626";

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background-color: #fafaf9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 24px;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #7c3aed, #8b5cf6); border-radius: 16px 16px 0 0; padding: 32px; text-align: center;">
      <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 700;">⭐ New Review</h1>
      <p style="margin: 8px 0 0; color: #ede9fe; font-size: 14px;">${data.shopName}</p>
    </div>

    <!-- Body -->
    <div style="background: white; padding: 32px; border-radius: 0 0 16px 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <div style="text-align: center; margin-bottom: 24px;">
        <p style="color: #78716c; font-size: 14px; margin: 0 0 8px;">Review for</p>
        <h2 style="color: #1c1917; margin: 0 0 12px; font-size: 20px;">${data.productName}</h2>
        <div style="font-size: 28px; letter-spacing: 2px; color: ${starColor};">${stars}</div>
      </div>

      <div style="background: #f5f5f4; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        ${data.title ? `<h3 style="color: #1c1917; margin: 0 0 8px; font-size: 16px;">"${data.title}"</h3>` : ""}
        ${data.comment ? `<p style="color: #44403c; margin: 0; line-height: 1.6;">${data.comment}</p>` : `<p style="color: #a8a29e; margin: 0; font-style: italic;">No written review — rating only.</p>`}
        <p style="color: #78716c; margin: 12px 0 0; font-size: 13px;">— ${data.buyerName}</p>
      </div>

      <div style="background: #fffbeb; border: 1px solid #fef3c7; border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: center;">
        <span style="color: #92400e; font-size: 14px;">⏳ This review is <strong>pending your approval</strong> before it appears publicly.</span>
      </div>

      <div style="text-align: center;">
        <a href="${data.dashboardUrl}" style="display: inline-block; background: #7c3aed; color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px;">
          Review & Approve →
        </a>
      </div>
    </div>

    <div style="text-align: center; margin-top: 24px; color: #a8a29e; font-size: 12px;">
      <p>Manage notification preferences in your dashboard settings.</p>
    </div>
  </div>
</body>
</html>`;
}

export function newReviewEmailText(data: ReviewEmailData): string {
  const stars = "★".repeat(data.rating) + "☆".repeat(5 - data.rating);

  return [
    `NEW REVIEW — ${data.shopName}`,
    "",
    `Product: ${data.productName}`,
    `Rating: ${stars} (${data.rating}/5)`,
    data.title ? `Title: "${data.title}"` : "",
    data.comment ? `Comment: ${data.comment}` : "No written review — rating only.",
    `By: ${data.buyerName}`,
    "",
    "This review is pending your approval before it appears publicly.",
    "",
    `Review & approve: ${data.dashboardUrl}`,
    "",
    "— TradeFeed",
  ]
    .filter(Boolean)
    .join("\n");
}
