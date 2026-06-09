// ============================================================
// Email Template — Seller Re-engagement
// ============================================================
// Sent via the admin bulk email tool to inactive sellers.
// ============================================================

interface ReengagementEmailData {
  shopName: string;
  sellerName: string;
  catalogUrl: string;
  dashboardUrl: string;
  communityUrl: string;
  customMessage?: string;
}

export function reengagementEmailHtml(data: ReengagementEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background-color: #fafaf9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 24px;">

    <div style="background: linear-gradient(135deg, #059669, #10b981); border-radius: 16px 16px 0 0; padding: 36px 32px; text-align: center;">
      <div style="font-size: 36px; margin-bottom: 12px;">👋</div>
      <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 700;">Your shop is waiting for buyers</h1>
      <p style="margin: 10px 0 0; color: #d1fae5; font-size: 14px;">${data.shopName} on TradeFeed</p>
    </div>

    <div style="background: white; padding: 32px; border-radius: 0 0 16px 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <p style="color: #44403c; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
        Hi ${data.sellerName},
      </p>

      ${data.customMessage ? `
      <p style="color: #44403c; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
        ${data.customMessage}
      </p>
      ` : `
      <p style="color: #44403c; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
        Your <strong style="color: #1c1917;">${data.shopName}</strong> shop is live on TradeFeed — but buyers can't find you yet. Just a few minutes is all it takes to get your first sale.
      </p>
      `}

      <!-- CTA buttons -->
      <div style="margin: 0 0 28px;">
        <a href="${data.catalogUrl}" style="display: block; text-align: center; background: #059669; color: white; padding: 14px 24px; border-radius: 12px; font-weight: 600; font-size: 15px; text-decoration: none; margin-bottom: 10px;">
          View My Shop →
        </a>
        <a href="${data.dashboardUrl}" style="display: block; text-align: center; background: #f5f5f4; color: #44403c; padding: 12px 24px; border-radius: 12px; font-weight: 500; font-size: 14px; text-decoration: none;">
          Go to Dashboard
        </a>
      </div>

      <!-- Quick tips -->
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <p style="margin: 0 0 12px; font-size: 13px; font-weight: 600; color: #166534;">Quick wins to get buyers today:</p>
        <div style="margin-bottom: 8px; display: flex; align-items: flex-start;">
          <span style="color: #16a34a; margin-right: 8px; font-size: 13px;">✓</span>
          <span style="color: #166534; font-size: 13px;">Add at least 3 products — shops with 3+ products get 5× more views</span>
        </div>
        <div style="margin-bottom: 8px; display: flex; align-items: flex-start;">
          <span style="color: #16a34a; margin-right: 8px; font-size: 13px;">✓</span>
          <span style="color: #166534; font-size: 13px;">Share your catalog link in your WhatsApp groups</span>
        </div>
        <div style="display: flex; align-items: flex-start;">
          <span style="color: #16a34a; margin-right: 8px; font-size: 13px;">✓</span>
          <span style="color: #166534; font-size: 13px;">Use AI listing — upload a photo and let it write the description for you</span>
        </div>
      </div>

      <!-- Community -->
      <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 12px; padding: 18px; margin-bottom: 24px; text-align: center;">
        <p style="margin: 0 0 6px; font-size: 14px; font-weight: 600; color: #166534;">💬 Join our seller WhatsApp community</p>
        <p style="margin: 0 0 14px; font-size: 13px; color: #4ade80;">Tips, updates and fellow sellers to help you grow</p>
        <a href="${data.communityUrl}" style="display: inline-block; background: #25D366; color: white; padding: 10px 20px; border-radius: 8px; font-weight: 600; font-size: 13px; text-decoration: none;">
          Join the Group
        </a>
      </div>

      <p style="color: #a8a29e; font-size: 12px; margin: 0; text-align: center; line-height: 1.5;">
        You're receiving this because you have a shop on TradeFeed.<br>
        <a href="${data.dashboardUrl}" style="color: #a8a29e;">Manage your shop</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

export function reengagementEmailText(data: ReengagementEmailData): string {
  return `Hi ${data.sellerName},

${data.customMessage ?? `Your ${data.shopName} shop is live on TradeFeed — but buyers can't find you yet.`}

View your shop: ${data.catalogUrl}
Dashboard: ${data.dashboardUrl}

Quick wins to get buyers today:
- Add at least 3 products
- Share your catalog link in your WhatsApp groups
- Use AI listing to create listings from photos

Join our seller WhatsApp community: ${data.communityUrl}

TradeFeed Team
`;
}
