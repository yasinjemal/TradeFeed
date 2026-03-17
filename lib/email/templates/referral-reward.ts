// ============================================================
// Email Template — Referral Reward Notification
// ============================================================
// Sent to the referrer when a referred seller qualifies
// and they earn 1 free month of Pro.
// ============================================================

interface ReferralRewardEmailData {
  referrerName: string;
  referredShopName: string;
  newEndDate: string;
  dashboardUrl: string;
}

export function referralRewardEmailHtml(data: ReferralRewardEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background-color: #fafaf9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 24px;">
    <div style="background: linear-gradient(135deg, #059669, #10b981); border-radius: 16px 16px 0 0; padding: 40px 32px; text-align: center;">
      <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">🎉 You earned a free month!</h1>
      <p style="margin: 12px 0 0; color: #d1fae5; font-size: 15px;">Your referral just paid off</p>
    </div>
    <div style="background: white; padding: 32px; border-radius: 0 0 16px 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <p style="color: #44403c; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">
        Hi ${data.referrerName},
      </p>
      <p style="color: #44403c; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">
        Great news! <strong>${data.referredShopName}</strong> — a seller you referred — just qualified, and we&rsquo;ve added <strong>1 free month</strong> to your Pro subscription.
      </p>
      <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
        <p style="font-size: 13px; color: #059669; margin: 0 0 4px; font-weight: 600;">Your new Pro expiry date</p>
        <p style="font-size: 20px; color: #065f46; margin: 0; font-weight: 700;">${data.newEndDate}</p>
      </div>
      <p style="color: #78716c; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
        Keep inviting sellers — every referral who qualifies earns you another free month.
      </p>
      <a href="${data.dashboardUrl}" style="display: inline-block; background: #059669; color: white; padding: 12px 28px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 14px;">
        View Referrals Dashboard
      </a>
    </div>
    <p style="text-align: center; color: #a8a29e; font-size: 12px; margin-top: 24px;">
      TradeFeed &mdash; Sell smarter via WhatsApp
    </p>
  </div>
</body>
</html>`;
}

export function referralRewardEmailText(data: ReferralRewardEmailData): string {
  return `Hi ${data.referrerName},

Great news! ${data.referredShopName} — a seller you referred — just qualified, and we've added 1 free month to your Pro subscription.

Your new Pro expiry date: ${data.newEndDate}

Keep inviting sellers — every referral who qualifies earns you another free month.

View your referrals: ${data.dashboardUrl}

— TradeFeed`;
}
