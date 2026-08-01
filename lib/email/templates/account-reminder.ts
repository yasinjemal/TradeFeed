// ============================================================
// Email Template — Once-only legacy account reminder
// ============================================================
// This is a factual reminder about an existing TradeFeed account/shop.
// It must not be expanded into a feature announcement or sales campaign.
// ============================================================

export const ACCOUNT_REMINDER_EMAIL_SUBJECT =
  "Your TradeFeed shop is still here" as const;

export interface AccountReminderEmailData {
  sellerName: string;
  shopName: string;
  continueShopUrl: string;
  stopRemindersUrl: string;
  senderName: string;
  supportEmail: string;
}

const ACCOUNT_REMINDER_PREHEADER =
  "A once-only reminder about the TradeFeed shop connected to your account.";

function normalizeInlineText(value: string): string {
  return value
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
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

function htmlText(value: string): string {
  return escapeHtml(normalizeInlineText(value));
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

function prepareAccountReminderData(data: AccountReminderEmailData) {
  return {
    sellerName: normalizeInlineText(data.sellerName) || "there",
    shopName:
      normalizeInlineText(data.shopName) || "your TradeFeed shop",
    continueShopUrl: validateWebUrl(
      data.continueShopUrl,
      "continueShopUrl",
    ),
    stopRemindersUrl: validateWebUrl(
      data.stopRemindersUrl,
      "stopRemindersUrl",
    ),
    senderName: normalizeInlineText(data.senderName) || "TradeFeed",
    supportEmail: validateSupportEmail(data.supportEmail),
  };
}

export function accountReminderEmailSubject(): typeof ACCOUNT_REMINDER_EMAIL_SUBJECT {
  return ACCOUNT_REMINDER_EMAIL_SUBJECT;
}

export function accountReminderEmailPreheader(): string {
  return ACCOUNT_REMINDER_PREHEADER;
}

export function accountReminderEmailHtml(
  data: AccountReminderEmailData,
): string {
  const prepared = prepareAccountReminderData(data);
  const {
    sellerName,
    shopName,
    continueShopUrl,
    stopRemindersUrl,
    senderName,
    supportEmail,
  } = prepared;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${ACCOUNT_REMINDER_EMAIL_SUBJECT}</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#292524;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${ACCOUNT_REMINDER_PREHEADER}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f5f5f4;">
    <tr>
      <td align="center" style="padding:28px 12px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:590px;">
          <tr>
            <td style="padding:0 4px 14px;color:#047857;font-size:18px;font-weight:800;letter-spacing:-0.02em;">Trade<span style="color:#10b981;">Feed</span></td>
          </tr>
          <tr>
            <td style="background:#ffffff;border:1px solid #e7e5e4;border-radius:20px;padding:34px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
              <p style="margin:0 0 12px;color:#047857;font-size:11px;font-weight:800;letter-spacing:0.14em;">ACCOUNT REMINDER</p>
              <h1 style="margin:0;color:#1c1917;font-size:30px;line-height:1.12;letter-spacing:-0.03em;">Your TradeFeed shop is still here</h1>

              <p style="margin:24px 0 0;color:#44403c;font-size:15px;line-height:1.65;">Hi ${htmlText(sellerName)},</p>
              <p style="margin:16px 0 0;color:#44403c;font-size:15px;line-height:1.65;">You previously created <strong style="color:#1c1917;">${htmlText(shopName)}</strong> through your TradeFeed account. We are sending this once-only reminder so you know the shop remains associated with that account.</p>
              <p style="margin:16px 0 0;color:#44403c;font-size:15px;line-height:1.65;">If you want to continue working on it, use the button below. There is no deadline, and taking no action will not change your account.</p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:26px 0 12px;">
                <tr>
                  <td align="center">
                    <a data-primary-cta="true" href="${htmlHref(continueShopUrl, "continueShopUrl")}" style="display:block;background:#059669;color:#ffffff;padding:15px 24px;border-radius:12px;font-size:15px;font-weight:800;text-align:center;text-decoration:none;">Continue my shop &rarr;</a>
                  </td>
                </tr>
              </table>

              <div style="margin-top:26px;padding:16px 18px;background:#fafaf9;border:1px solid #e7e5e4;border-radius:12px;">
                <p style="margin:0;color:#57534e;font-size:12px;line-height:1.6;">This reminder does not mean that you previously opted in to marketing, and opening or clicking it will not be treated as marketing consent.</p>
              </div>

              <p style="margin:24px 0 0;color:#78716c;font-size:12px;line-height:1.6;">Need help with your existing account? Email <a href="mailto:${escapeHtml(supportEmail)}" style="color:#047857;">${escapeHtml(supportEmail)}</a>.</p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:22px 18px 6px;color:#78716c;font-size:11px;line-height:1.65;">
              <p style="margin:0 0 8px;">Sent by ${htmlText(senderName)} because this address is linked to an existing TradeFeed account.</p>
              <p style="margin:0;"><a href="${htmlHref(stopRemindersUrl, "stopRemindersUrl")}" style="color:#78716c;text-decoration:underline;">Manage non-essential TradeFeed emails</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function accountReminderEmailText(
  data: AccountReminderEmailData,
): string {
  const prepared = prepareAccountReminderData(data);
  const {
    sellerName,
    shopName,
    continueShopUrl,
    stopRemindersUrl,
    senderName,
    supportEmail,
  } = prepared;

  return [
    ACCOUNT_REMINDER_EMAIL_SUBJECT.toUpperCase(),
    "",
    `Hi ${sellerName},`,
    "",
    `You previously created ${shopName} through your TradeFeed account. We are sending this once-only reminder so you know the shop remains associated with that account.`,
    "",
    "If you want to continue working on it, use the link below. There is no deadline, and taking no action will not change your account.",
    "",
    `Continue my shop: ${continueShopUrl}`,
    "",
    "This reminder does not mean that you previously opted in to marketing, and opening or clicking it will not be treated as marketing consent.",
    "",
    `Need help with your existing account? Email ${supportEmail}.`,
    "",
    `Sent by ${senderName} because this address is linked to an existing TradeFeed account.`,
    `Manage non-essential TradeFeed emails: ${stopRemindersUrl}`,
  ].join("\n");
}
