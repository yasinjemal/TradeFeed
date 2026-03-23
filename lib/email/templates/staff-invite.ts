// ============================================================
// Email Templates — Staff Invitation
// ============================================================

interface StaffInviteEmailData {
  shopName: string;
  role: string;
  acceptUrl: string;
  expiresInDays: number;
}

export function staffInviteEmailHtml(data: StaffInviteEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background-color: #fafaf9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 24px;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #059669, #10b981); border-radius: 16px 16px 0 0; padding: 40px 32px; text-align: center;">
      <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">You&rsquo;re Invited!</h1>
      <p style="margin: 12px 0 0; color: #d1fae5; font-size: 15px;">Join <strong>${data.shopName}</strong> on TradeFeed</p>
    </div>

    <!-- Body -->
    <div style="background: white; padding: 32px; border-radius: 0 0 16px 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <p style="color: #44403c; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
        You&rsquo;ve been invited to join <strong style="color: #1c1917;">${data.shopName}</strong> as a
        <strong style="color: #059669;">${data.role}</strong> on TradeFeed.
      </p>

      <p style="color: #44403c; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
        As a ${data.role.toLowerCase()}, you&rsquo;ll be able to help manage products, orders,
        and the day-to-day of the shop.
      </p>

      <!-- CTA -->
      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${data.acceptUrl}" style="display: inline-block; background: #059669; color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px;">
          Accept Invitation &rarr;
        </a>
      </div>

      <div style="background: #f5f5f4; border-radius: 12px; padding: 16px; text-align: center;">
        <p style="color: #78716c; font-size: 12px; margin: 0;">
          This invitation expires in ${data.expiresInDays} days. If the button doesn&rsquo;t work, copy this link:
        </p>
        <p style="margin: 8px 0 0;">
          <a href="${data.acceptUrl}" style="color: #059669; font-size: 13px; text-decoration: none; word-break: break-all;">${data.acceptUrl}</a>
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 24px; color: #a8a29e; font-size: 12px;">
      <p>If you weren&rsquo;t expecting this invitation, you can safely ignore this email.</p>
      <p style="margin-top: 4px;">TradeFeed &mdash; AI-powered catalogs for SA wholesalers</p>
    </div>
  </div>
</body>
</html>`;
}

export function staffInviteEmailText(data: StaffInviteEmailData): string {
  return [
    `YOU'RE INVITED TO JOIN ${data.shopName.toUpperCase()} ON TRADEFEED`,
    "",
    `You've been invited to join ${data.shopName} as a ${data.role}.`,
    "",
    `As a ${data.role.toLowerCase()}, you'll be able to help manage products, orders,`,
    `and the day-to-day of the shop.`,
    "",
    `Accept the invitation: ${data.acceptUrl}`,
    "",
    `This invitation expires in ${data.expiresInDays} days.`,
    "",
    `If you weren't expecting this invitation, you can safely ignore this email.`,
    "",
    `— TradeFeed`,
  ].join("\n");
}
