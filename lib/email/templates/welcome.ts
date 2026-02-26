// ============================================================
// Email Templates — Welcome (New Seller)
// ============================================================
// Sent when a seller creates their shop on TradeFeed.
// ============================================================

interface WelcomeEmailData {
  shopName: string;
  sellerName: string;
  catalogUrl: string;
  dashboardUrl: string;
}

export function welcomeEmailHtml(data: WelcomeEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background-color: #fafaf9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 24px;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #059669, #10b981); border-radius: 16px 16px 0 0; padding: 40px 32px; text-align: center;">
      <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">Welcome to TradeFeed!</h1>
      <p style="margin: 12px 0 0; color: #d1fae5; font-size: 15px;">Your shop is live and ready for business</p>
    </div>

    <!-- Body -->
    <div style="background: white; padding: 32px; border-radius: 0 0 16px 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <p style="color: #44403c; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
        Hi ${data.sellerName},
      </p>
      <p style="color: #44403c; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
        <strong style="color: #1c1917;">${data.shopName}</strong> is now live on TradeFeed. Here's how to get started:
      </p>

      <!-- Steps -->
      <div style="margin-bottom: 24px;">
        <div style="display: flex; align-items: flex-start; margin-bottom: 16px;">
          <div style="width: 32px; height: 32px; border-radius: 50%; background: #d1fae5; color: #059669; font-weight: 700; font-size: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-right: 12px;">1</div>
          <div>
            <p style="margin: 0; color: #1c1917; font-weight: 600; font-size: 14px;">Upload your products</p>
            <p style="margin: 4px 0 0; color: #78716c; font-size: 13px;">Add photos, sizes, colours, and prices. You can also bulk-import via CSV.</p>
          </div>
        </div>
        <div style="display: flex; align-items: flex-start; margin-bottom: 16px;">
          <div style="width: 32px; height: 32px; border-radius: 50%; background: #d1fae5; color: #059669; font-weight: 700; font-size: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-right: 12px;">2</div>
          <div>
            <p style="margin: 0; color: #1c1917; font-weight: 600; font-size: 14px;">Share your catalog link</p>
            <p style="margin: 4px 0 0; color: #78716c; font-size: 13px;">Send your catalog URL to buyers on WhatsApp — they can browse and order instantly.</p>
          </div>
        </div>
        <div style="display: flex; align-items: flex-start;">
          <div style="width: 32px; height: 32px; border-radius: 50%; background: #d1fae5; color: #059669; font-weight: 700; font-size: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-right: 12px;">3</div>
          <div>
            <p style="margin: 0; color: #1c1917; font-weight: 600; font-size: 14px;">Receive structured orders</p>
            <p style="margin: 4px 0 0; color: #78716c; font-size: 13px;">Orders arrive as organised WhatsApp messages — no more voice notes or confusion.</p>
          </div>
        </div>
      </div>

      <!-- Catalog URL -->
      <div style="background: #f5f5f4; border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: center;">
        <p style="color: #78716c; font-size: 12px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.5px;">Your catalog link</p>
        <a href="${data.catalogUrl}" style="color: #059669; font-weight: 600; font-size: 15px; text-decoration: none; word-break: break-all;">${data.catalogUrl}</a>
      </div>

      <!-- CTAs -->
      <div style="text-align: center;">
        <a href="${data.dashboardUrl}" style="display: inline-block; background: #059669; color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px; margin-bottom: 12px;">
          Go to Dashboard →
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 24px; color: #a8a29e; font-size: 12px;">
      <p>Need help? Reply to this email or visit our support page.</p>
      <p style="margin-top: 4px;">TradeFeed — Structured catalogs for SA wholesalers</p>
    </div>
  </div>
</body>
</html>`;
}

export function welcomeEmailText(data: WelcomeEmailData): string {
  return [
    `WELCOME TO TRADEFEED!`,
    "",
    `Hi ${data.sellerName},`,
    "",
    `${data.shopName} is now live on TradeFeed. Here's how to get started:`,
    "",
    `1. Upload your products`,
    `   Add photos, sizes, colours, and prices. You can also bulk-import via CSV.`,
    "",
    `2. Share your catalog link`,
    `   Send your catalog URL to buyers on WhatsApp — they can browse and order instantly.`,
    "",
    `3. Receive structured orders`,
    `   Orders arrive as organised WhatsApp messages — no more voice notes or confusion.`,
    "",
    `Your catalog link: ${data.catalogUrl}`,
    "",
    `Go to dashboard: ${data.dashboardUrl}`,
    "",
    `Need help? Reply to this email or visit our support page.`,
    "",
    `— TradeFeed`,
  ].join("\n");
}
