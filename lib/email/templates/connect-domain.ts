// ============================================================
// Email Template — Connect Your Domain (Pro Sellers)
// ============================================================
// Sent to Pro/Pro AI sellers who haven't set up a custom domain yet.
// Encourages them to connect their own domain for brand credibility.
// ============================================================

interface ConnectDomainEmailData {
  sellerName: string;
  shopName: string;
  shopSlug: string;
  settingsUrl: string;
}

export function connectDomainEmailHtml(data: ConnectDomainEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background-color: #fafaf9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 24px;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #2563eb, #4f46e5); border-radius: 16px 16px 0 0; padding: 40px 32px; text-align: center;">
      <div style="font-size: 48px; margin-bottom: 12px;">🌐</div>
      <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 700;">Your Brand Deserves Its Own Domain</h1>
      <p style="margin: 12px 0 0; color: #bfdbfe; font-size: 15px;">Connect a custom domain to ${data.shopName}</p>
    </div>

    <!-- Body -->
    <div style="background: white; padding: 32px; border-radius: 0 0 16px 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <p style="color: #44403c; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
        Hi ${data.sellerName},
      </p>
      <p style="color: #44403c; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
        You&rsquo;re on the <strong style="color: #2563eb;">Pro plan</strong> &mdash; which means you can connect your own domain to your shop. Instead of sharing <code style="background: #f5f5f4; padding: 2px 6px; border-radius: 4px; font-size: 13px;">tradefeed.co.za/s/${data.shopSlug}</code>, your customers will see:
      </p>

      <!-- Before/After -->
      <div style="margin-bottom: 24px;">
        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 12px 16px; margin-bottom: 8px;">
          <p style="margin: 0; color: #991b1b; font-size: 13px; font-weight: 600;">Before</p>
          <p style="margin: 4px 0 0; color: #7f1d1d; font-size: 15px; font-family: monospace;">tradefeed.co.za/s/${data.shopSlug}</p>
        </div>
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 12px 16px;">
          <p style="margin: 0; color: #166534; font-size: 13px; font-weight: 600;">After</p>
          <p style="margin: 4px 0 0; color: #14532d; font-size: 15px; font-family: monospace;">shop.yourbrand.co.za</p>
        </div>
      </div>

      <!-- Benefits -->
      <p style="color: #1c1917; font-size: 15px; font-weight: 600; margin: 0 0 12px;">Why connect your domain?</p>
      <div style="margin-bottom: 24px;">
        <div style="display: flex; align-items: flex-start; margin-bottom: 10px;">
          <div style="width: 24px; height: 24px; border-radius: 50%; background: #dbeafe; color: #2563eb; font-size: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-right: 10px;">✓</div>
          <p style="margin: 0; color: #44403c; font-size: 14px; line-height: 1.5;"><strong>Build brand trust</strong> &mdash; customers see your name, not ours</p>
        </div>
        <div style="display: flex; align-items: flex-start; margin-bottom: 10px;">
          <div style="width: 24px; height: 24px; border-radius: 50%; background: #dbeafe; color: #2563eb; font-size: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-right: 10px;">✓</div>
          <p style="margin: 0; color: #44403c; font-size: 14px; line-height: 1.5;"><strong>Free SSL certificate</strong> &mdash; secure padlock in the browser bar</p>
        </div>
        <div style="display: flex; align-items: flex-start; margin-bottom: 10px;">
          <div style="width: 24px; height: 24px; border-radius: 50%; background: #dbeafe; color: #2563eb; font-size: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-right: 10px;">✓</div>
          <p style="margin: 0; color: #44403c; font-size: 14px; line-height: 1.5;"><strong>Better SEO</strong> &mdash; your domain ranks in Google for your brand</p>
        </div>
        <div style="display: flex; align-items: flex-start;">
          <div style="width: 24px; height: 24px; border-radius: 50%; background: #dbeafe; color: #2563eb; font-size: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-right: 10px;">✓</div>
          <p style="margin: 0; color: #44403c; font-size: 14px; line-height: 1.5;"><strong>5-minute setup</strong> &mdash; step-by-step DNS guide included</p>
        </div>
      </div>

      <!-- How it works -->
      <div style="background: #f8fafc; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
        <p style="color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 10px;">How it works</p>
        <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0;">
          1. Buy a domain from any registrar (1-grid, Afrihost, Domains.co.za)<br>
          2. Go to Settings → Custom Domain in your dashboard<br>
          3. Enter your domain and copy the DNS record<br>
          4. Paste it at your registrar — done!
        </p>
      </div>

      <!-- CTA -->
      <div style="text-align: center;">
        <a href="${data.settingsUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px;">
          Connect Your Domain →
        </a>
        <p style="color: #a8a29e; font-size: 12px; margin: 12px 0 0;">Takes less than 5 minutes</p>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 24px; color: #a8a29e; font-size: 12px;">
      <p>Need help choosing a domain? Reply to this email — we&rsquo;ll help you pick one.</p>
      <p style="margin-top: 4px;">TradeFeed — Your brand, your domain, your shop.</p>
    </div>
  </div>
</body>
</html>`;
}

export function connectDomainEmailText(data: ConnectDomainEmailData): string {
  return [
    `YOUR BRAND DESERVES ITS OWN DOMAIN`,
    "",
    `Hi ${data.sellerName},`,
    "",
    `You're on the Pro plan — which means you can connect your own domain to ${data.shopName}.`,
    "",
    `Before: tradefeed.co.za/s/${data.shopSlug}`,
    `After:  shop.yourbrand.co.za`,
    "",
    `Why connect your domain?`,
    `• Build brand trust — customers see your name, not ours`,
    `• Free SSL certificate — secure padlock in the browser bar`,
    `• Better SEO — your domain ranks in Google for your brand`,
    `• 5-minute setup — step-by-step DNS guide included`,
    "",
    `How it works:`,
    `1. Buy a domain from any registrar (1-grid, Afrihost, Domains.co.za)`,
    `2. Go to Settings → Custom Domain in your dashboard`,
    `3. Enter your domain and copy the DNS record`,
    `4. Paste it at your registrar — done!`,
    "",
    `Connect your domain: ${data.settingsUrl}`,
    "",
    `Need help? Just reply to this email.`,
    "",
    `— TradeFeed`,
  ].join("\n");
}
