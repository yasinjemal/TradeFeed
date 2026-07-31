// ============================================================
// Email Template — Seller Re-engagement
// ============================================================
// Sent through the admin campaign tool to existing TradeFeed sellers.
// Every external value is either escaped for HTML or validated as a URL.
// ============================================================

export type ReengagementSegment = "zero" | "starter" | "stale" | "active";

export interface ReengagementEmailData {
  shopName: string;
  sellerName: string;
  catalogUrl: string;
  dashboardUrl: string;
  huntUrl: string;
  growthUrl: string;
  unsubscribeUrl: string;
  senderName: string;
  supportEmail: string;
  segment: ReengagementSegment;
  customMessage?: string;
  /**
   * Kept temporarily for callers migrating from the previous template.
   * The campaign deliberately gives TradeFeed Growth—not the community
   * group—the tertiary CTA.
   */
  communityUrl?: string;
}

interface SegmentContent {
  intro: (shopName: string) => string;
  ctaLabel: string;
  ctaPath: "" | "/products" | "/products/new";
  ctaNote: string;
}

const SEGMENT_CONTENT: Record<ReengagementSegment, SegmentContent> = {
  zero: {
    intro: (shopName) =>
      `You started ${shopName} for a reason. If business got busy before your first product went live, there is no guilt trip here. We kept building—and coming back now takes one product photo.`,
    ctaLabel: "Add my first product",
    ctaPath: "/products/new",
    ctaNote: "No credit card. Start with one product; finish the rest later.",
  },
  starter: {
    intro: (shopName) =>
      `You already made a start with ${shopName}. You do not need to finish the whole catalogue today—one more strong product is enough to restart the momentum.`,
    ctaLabel: "Add another product",
    ctaPath: "/products/new",
    ctaNote: "Add one product today; the rest can follow when you are ready.",
  },
  stale: {
    intro: (shopName) =>
      `${shopName} does not need a full rebuild. Update what changed, publish your best current stock, and share the same catalogue link again.`,
    ctaLabel: "Refresh my catalogue",
    ctaPath: "/products",
    ctaNote: "Update only what changed; your existing shop link stays the same.",
  },
  active: {
    intro: (shopName) =>
      `You have already been building ${shopName}. We have kept building too—here is what TradeFeed can now do around your catalogue and WhatsApp orders.`,
    ctaLabel: "Open my dashboard",
    ctaPath: "",
    ctaNote: "You stay in control and review every product before it is published.",
  },
};

const PREHEADERS: Record<ReengagementSegment, string> = {
  zero:
    "Come back with one product photo: AI drafts the listing, buyers order on WhatsApp.",
  starter:
    "Add one more product and share your TradeFeed catalogue link again.",
  stale:
    "Refresh your catalogue, keep the same shop link, and make WhatsApp orders clearer.",
  active:
    "See AI listings, marketplace discovery, organised WhatsApp carts and HUNT Beta.",
};

function normalizeInlineText(value: string): string {
  return value
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeMultilineText(value: string): string {
  return value
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .replace(/\r\n?/g, "\n")
    .trim();
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function htmlInline(value: string): string {
  return escapeHtml(normalizeInlineText(value));
}

function htmlMultiline(value: string): string {
  return escapeHtml(normalizeMultilineText(value)).replaceAll("\n", "<br>");
}

function validateWebUrl(value: string, fieldName: string): string {
  const candidate = normalizeInlineText(value);
  let url: URL;

  try {
    url = new URL(candidate);
  } catch {
    throw new TypeError(`${fieldName} must be a valid web URL.`);
  }

  const isLocalDevelopmentUrl =
    url.protocol === "http:" &&
    (url.hostname === "localhost" ||
      url.hostname === "127.0.0.1" ||
      url.hostname === "::1");

  if (url.protocol !== "https:" && !isLocalDevelopmentUrl) {
    throw new TypeError(`${fieldName} must use HTTPS.`);
  }

  if (url.username || url.password) {
    throw new TypeError(`${fieldName} must not contain URL credentials.`);
  }

  return url.toString();
}

function htmlHref(value: string, fieldName: string): string {
  return escapeHtml(validateWebUrl(value, fieldName));
}

function validateSupportEmail(value: string): string {
  const email = normalizeInlineText(value).toLowerCase();

  if (
    email.length > 254 ||
    !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i.test(
      email,
    )
  ) {
    throw new TypeError("supportEmail must be a valid email address.");
  }

  return email;
}

function getPrimaryCtaUrl(
  dashboardUrl: string,
  segment: ReengagementSegment,
): string {
  const url = new URL(validateWebUrl(dashboardUrl, "dashboardUrl"));
  const basePath = url.pathname.replace(/\/+$/, "");

  url.pathname = `${basePath}${SEGMENT_CONTENT[segment].ctaPath}`;
  url.search = "";
  url.hash = "";

  return url.toString();
}

function getPreparedData(data: ReengagementEmailData) {
  const segmentContent = SEGMENT_CONTENT[data.segment];

  if (!segmentContent) {
    throw new TypeError("segment must be zero, starter, stale, or active.");
  }

  return {
    segmentContent,
    sellerName: normalizeInlineText(data.sellerName) || "there",
    shopName: normalizeInlineText(data.shopName) || "your TradeFeed shop",
    catalogUrl: validateWebUrl(data.catalogUrl, "catalogUrl"),
    dashboardUrl: validateWebUrl(data.dashboardUrl, "dashboardUrl"),
    primaryCtaUrl: getPrimaryCtaUrl(data.dashboardUrl, data.segment),
    huntUrl: validateWebUrl(data.huntUrl, "huntUrl"),
    growthUrl: validateWebUrl(data.growthUrl, "growthUrl"),
    unsubscribeUrl: validateWebUrl(data.unsubscribeUrl, "unsubscribeUrl"),
    senderName: normalizeInlineText(data.senderName) || "TradeFeed",
    supportEmail: validateSupportEmail(data.supportEmail),
    customMessage: data.customMessage
      ? normalizeMultilineText(data.customMessage)
      : undefined,
  };
}

export function reengagementEmailSubject(
  data: Pick<ReengagementEmailData, "shopName">,
): string {
  const shopName =
    normalizeInlineText(data.shopName) || "Your TradeFeed shop";
  return `${shopName} is still here—and TradeFeed has changed`;
}

export function reengagementEmailPreheader(
  data: Pick<ReengagementEmailData, "segment">,
): string {
  return PREHEADERS[data.segment] ?? PREHEADERS.active;
}

export function reengagementEmailHtml(data: ReengagementEmailData): string {
  const prepared = getPreparedData(data);
  const {
    segmentContent,
    sellerName,
    shopName,
    catalogUrl,
    dashboardUrl,
    primaryCtaUrl,
    huntUrl,
    growthUrl,
    unsubscribeUrl,
    senderName,
    supportEmail,
    customMessage,
  } = prepared;
  const preheader = reengagementEmailPreheader(data);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${htmlInline(reengagementEmailSubject(data))}</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#292524;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${htmlInline(preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f5f5f4;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:620px;">
          <tr>
            <td style="padding:0 4px 14px;color:#047857;font-size:18px;font-weight:800;letter-spacing:-0.02em;">Trade<span style="color:#10b981;">Feed</span></td>
          </tr>
          <tr>
            <td style="background:#071a0f;border-radius:20px 20px 0 0;padding:42px 34px;">
              <p style="margin:0 0 13px;color:#6ee7b7;font-size:11px;font-weight:800;letter-spacing:0.18em;">A LOT HAS CHANGED</p>
              <h1 style="margin:0;color:#ffffff;font-size:34px;line-height:1.08;letter-spacing:-0.035em;">Your shop is still here.<br><span style="color:#34d399;">The hard work got smaller.</span></h1>
              <p style="margin:16px 0 0;color:#a7f3d0;font-size:14px;">${htmlInline(shopName)} on TradeFeed</p>
            </td>
          </tr>
          <tr>
            <td style="background:#ffffff;border-radius:0 0 20px 20px;padding:34px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
              <p style="margin:0 0 18px;color:#44403c;font-size:15px;line-height:1.65;">Hi ${htmlInline(sellerName)},</p>
              <p style="margin:0 0 22px;color:#44403c;font-size:15px;line-height:1.65;">${htmlInline(segmentContent.intro(shopName))}</p>

              ${
                customMessage
                  ? `<div style="margin:0 0 24px;padding:16px 18px;border-left:3px solid #10b981;background:#f0fdf4;border-radius:4px 12px 12px 4px;">
                <p style="margin:0 0 5px;color:#047857;font-size:11px;font-weight:800;letter-spacing:0.08em;">A NOTE FROM TRADEFEED</p>
                <p style="margin:0;color:#3f6212;font-size:14px;line-height:1.6;">${htmlMultiline(customMessage)}</p>
              </div>`
                  : ""
              }

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 26px;border:1px solid #d1fae5;background:#f0fdf4;border-radius:14px;">
                <tr>
                  <td align="center" style="padding:18px 10px;color:#065f46;font-size:12px;font-weight:800;">PHOTO</td>
                  <td align="center" style="color:#10b981;font-size:18px;">&rarr;</td>
                  <td align="center" style="padding:18px 10px;color:#065f46;font-size:12px;font-weight:800;">AI DRAFT</td>
                  <td align="center" style="color:#10b981;font-size:18px;">&rarr;</td>
                  <td align="center" style="padding:18px 10px;color:#065f46;font-size:12px;font-weight:800;">SHOP LINK</td>
                  <td align="center" style="color:#10b981;font-size:18px;">&rarr;</td>
                  <td align="center" style="padding:18px 10px;color:#065f46;font-size:12px;font-weight:800;">WHATSAPP ORDER</td>
                </tr>
              </table>

              <p style="margin:0 0 24px;color:#57534e;font-size:14px;line-height:1.65;">Upload a product photo and TradeFeed drafts the title, description, category and SEO tags, often in about 10 seconds. You review it, add the correct price and stock, then publish. The Free plan includes up to 20 products and 10 AI listings a month.</p>

              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 8px;">
                <tr>
                  <td align="center">
                    <a href="${htmlHref(primaryCtaUrl, "primaryCtaUrl")}" style="display:block;background:#059669;color:#ffffff;padding:15px 24px;border-radius:12px;font-size:15px;font-weight:800;text-align:center;text-decoration:none;">${htmlInline(segmentContent.ctaLabel)} &rarr;</a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 32px;color:#a8a29e;font-size:12px;line-height:1.5;text-align:center;">${htmlInline(segmentContent.ctaNote)}</p>

              <p style="margin:0 0 14px;color:#1c1917;font-size:17px;font-weight:800;">What is waiting for you</p>

              <div style="margin:0 0 12px;padding:17px;background:#fafaf9;border:1px solid #e7e5e4;border-radius:12px;">
                <p style="margin:0 0 5px;color:#1c1917;font-size:14px;font-weight:800;">Less typing</p>
                <p style="margin:0;color:#57534e;font-size:13px;line-height:1.55;">AI drafts the listing from your photo. You stay in control and review it before publishing.</p>
              </div>
              <div style="margin:0 0 12px;padding:17px;background:#fafaf9;border:1px solid #e7e5e4;border-radius:12px;">
                <p style="margin:0 0 5px;color:#1c1917;font-size:14px;font-weight:800;">A clearer WhatsApp order</p>
                <p style="margin:0;color:#57534e;font-size:13px;line-height:1.55;">Customers choose size, colour and quantity, add products from your shop to one cart, and send one organised order to your WhatsApp.</p>
              </div>
              <div style="margin:0 0 12px;padding:17px;background:#fafaf9;border:1px solid #e7e5e4;border-radius:12px;">
                <p style="margin:0 0 5px;color:#1c1917;font-size:14px;font-weight:800;">More ways to be found</p>
                <p style="margin:0;color:#57534e;font-size:13px;line-height:1.55;">Active published products with available variants can appear in the TradeFeed marketplace, while your full catalogue stays on one shareable link.</p>
              </div>
              <div style="margin:0 0 24px;padding:17px;background:#071a0f;border-radius:12px;">
                <p style="margin:0 0 5px;color:#6ee7b7;font-size:11px;font-weight:800;letter-spacing:0.08em;">NEW: TRADEFEED HUNT BETA</p>
                <p style="margin:0 0 10px;color:#d1fae5;font-size:13px;line-height:1.55;">In the limited Johannesburg fashion and sneaker pilot, buyers can upload a screenshot, size and budget to start a live request. If a seller makes an offer, it appears only after the TradeFeed pilot team checks it.</p>
                <p style="margin:0 0 11px;color:#86efac;font-size:11px;line-height:1.5;">HUNT does not guarantee a request, offer or sale.</p>
                <a href="${htmlHref(huntUrl, "huntUrl")}" style="color:#6ee7b7;font-size:12px;font-weight:800;text-decoration:underline;">Explore HUNT Beta</a>
              </div>

              <p style="margin:0 0 22px;color:#44403c;font-size:14px;line-height:1.65;">You do not need to rebuild everything today. Publish your best product, share your catalogue link on WhatsApp Status, and let that be your comeback.</p>

              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 10px;">
                <tr>
                  <td align="center">
                    <a href="${htmlHref(primaryCtaUrl, "primaryCtaUrl")}" style="display:block;background:#059669;color:#ffffff;padding:15px 24px;border-radius:12px;font-size:15px;font-weight:800;text-align:center;text-decoration:none;">${htmlInline(segmentContent.ctaLabel)} &rarr;</a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 30px;text-align:center;font-size:12px;">
                <a href="${htmlHref(catalogUrl, "catalogUrl")}" style="color:#047857;text-decoration:underline;">See what buyers see</a>
                <span style="color:#d6d3d1;">&nbsp;&middot;&nbsp;</span>
                <a href="${htmlHref(dashboardUrl, "dashboardUrl")}" style="color:#047857;text-decoration:underline;">Manage my shop</a>
              </p>

              <div style="padding:16px 18px;background:#fffbeb;border:1px solid #fde68a;border-radius:12px;">
                <p style="margin:0;color:#78350f;font-size:12px;line-height:1.6;"><strong>Want the setup handled?</strong> <a href="${htmlHref(growthUrl, "growthUrl")}" style="color:#92400e;font-weight:800;">TradeFeed Growth</a> is our paid done-for-you shop service, with Shop Launch from R5,000.</p>
              </div>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:24px 20px 8px;color:#78716c;font-size:11px;line-height:1.65;">
              <p style="margin:0 0 8px;">Questions? Email <a href="mailto:${escapeHtml(supportEmail)}" style="color:#57534e;">${escapeHtml(supportEmail)}</a>.</p>
              <p style="margin:0 0 8px;">Sent by ${htmlInline(senderName)} because you opted in to TradeFeed product updates.</p>
              <p style="margin:0;"><a href="${htmlHref(unsubscribeUrl, "unsubscribeUrl")}" style="color:#78716c;text-decoration:underline;">Unsubscribe from TradeFeed product updates</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function reengagementEmailText(data: ReengagementEmailData): string {
  const prepared = getPreparedData(data);
  const {
    segmentContent,
    sellerName,
    shopName,
    catalogUrl,
    dashboardUrl,
    primaryCtaUrl,
    huntUrl,
    growthUrl,
    unsubscribeUrl,
    senderName,
    supportEmail,
    customMessage,
  } = prepared;

  return [
    "A LOT HAS CHANGED",
    "",
    "YOUR SHOP IS STILL HERE. THE HARD WORK GOT SMALLER.",
    "",
    `Hi ${sellerName},`,
    "",
    segmentContent.intro(shopName),
    ...(customMessage
      ? ["", "A note from TradeFeed:", customMessage]
      : []),
    "",
    "PHOTO -> AI DRAFT -> SHOP LINK -> WHATSAPP ORDER",
    "",
    "Upload a product photo and TradeFeed drafts the title, description, category and SEO tags, often in about 10 seconds. You review it, add the correct price and stock, then publish. The Free plan includes up to 20 products and 10 AI listings a month.",
    "",
    `${segmentContent.ctaLabel}: ${primaryCtaUrl}`,
    segmentContent.ctaNote,
    "",
    "WHAT IS WAITING FOR YOU",
    "",
    "- Less typing: AI drafts the listing from your photo. You review it before publishing.",
    "- A clearer WhatsApp order: customers choose size, colour and quantity, add products from your shop to one cart, and send one organised order to your WhatsApp.",
    "- More ways to be found: active published products with available variants can appear in the TradeFeed marketplace, while your full catalogue stays on one shareable link.",
    "",
    "NEW: TRADEFEED HUNT BETA",
    "In the limited Johannesburg fashion and sneaker pilot, buyers can upload a screenshot, size and budget to start a live request. If a seller makes an offer, it appears only after the TradeFeed pilot team checks it.",
    "HUNT does not guarantee a request, offer or sale.",
    `Explore HUNT Beta: ${huntUrl}`,
    "",
    "You do not need to rebuild everything today. Publish your best product, share your catalogue link on WhatsApp Status, and let that be your comeback.",
    "",
    `${segmentContent.ctaLabel}: ${primaryCtaUrl}`,
    `See what buyers see: ${catalogUrl}`,
    `Manage my shop: ${dashboardUrl}`,
    "",
    `Want the setup handled? TradeFeed Growth is our paid done-for-you shop service, with Shop Launch from R5,000: ${growthUrl}`,
    "",
    `Questions? Email ${supportEmail}.`,
    `Sent by ${senderName} because you opted in to TradeFeed product updates.`,
    `Unsubscribe from TradeFeed product updates: ${unsubscribeUrl}`,
  ].join("\n");
}
