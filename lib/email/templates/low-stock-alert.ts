// ============================================================
// Email Templates — Low Stock Alert
// ============================================================
// Sent when product variants drop below the threshold after an order.
// ============================================================

interface LowStockVariant {
  productName: string;
  option1Label: string;
  option1Value: string;
  option2Label: string;
  option2Value: string | null;
  currentStock: number;
  sku: string | null;
}

interface LowStockEmailData {
  shopName: string;
  variants: LowStockVariant[];
  threshold: number;
  dashboardUrl: string;
}

export function lowStockAlertEmailHtml(data: LowStockEmailData): string {
  const variantRows = data.variants
    .map(
      (v) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e7e5e4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
            <strong style="color: #1c1917;">${v.productName}</strong><br>
            <span style="color: #78716c; font-size: 13px;">
              ${v.option1Label}: ${v.option1Value}${v.option2Value ? ` · ${v.option2Label}: ${v.option2Value}` : ""}
              ${v.sku ? ` · SKU: ${v.sku}` : ""}
            </span>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e7e5e4; text-align: right; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
            <span style="display: inline-block; background: ${v.currentStock === 0 ? "#fef2f2" : "#fffbeb"}; color: ${v.currentStock === 0 ? "#dc2626" : "#d97706"}; padding: 4px 12px; border-radius: 20px; font-weight: 600; font-size: 14px;">
              ${v.currentStock === 0 ? "Out of stock" : `${v.currentStock} left`}
            </span>
          </td>
        </tr>`
    )
    .join("");

  const outOfStockCount = data.variants.filter((v) => v.currentStock === 0).length;

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background-color: #fafaf9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 24px;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #d97706, #f59e0b); border-radius: 16px 16px 0 0; padding: 32px; text-align: center;">
      <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 700;">⚠️ Low Stock Alert</h1>
      <p style="margin: 8px 0 0; color: #fef3c7; font-size: 14px;">${data.shopName} · ${data.variants.length} variant${data.variants.length > 1 ? "s" : ""} below threshold</p>
    </div>

    <!-- Body -->
    <div style="background: white; padding: 32px; border-radius: 0 0 16px 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      ${outOfStockCount > 0 ? `
      <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 16px; margin-bottom: 20px; text-align: center;">
        <span style="color: #dc2626; font-weight: 600;">🚨 ${outOfStockCount} variant${outOfStockCount > 1 ? "s are" : " is"} completely out of stock!</span>
      </div>
      ` : ""}

      <p style="color: #78716c; font-size: 14px; margin-bottom: 20px;">
        The following variants have dropped below your threshold of <strong>${data.threshold} units</strong>:
      </p>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <thead>
          <tr style="background: #f5f5f4;">
            <th style="padding: 10px 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #78716c; letter-spacing: 0.5px;">Variant</th>
            <th style="padding: 10px 12px; text-align: right; font-size: 12px; text-transform: uppercase; color: #78716c; letter-spacing: 0.5px;">Stock</th>
          </tr>
        </thead>
        <tbody>
          ${variantRows}
        </tbody>
      </table>

      <div style="text-align: center;">
        <a href="${data.dashboardUrl}" style="display: inline-block; background: #d97706; color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px;">
          Manage Stock →
        </a>
      </div>
    </div>

    <div style="text-align: center; margin-top: 24px; color: #a8a29e; font-size: 12px;">
      <p>Alert threshold: ${data.threshold} units · Manage in Settings → Notifications</p>
    </div>
  </div>
</body>
</html>`;
}

export function lowStockAlertEmailText(data: LowStockEmailData): string {
  const outOfStockCount = data.variants.filter((v) => v.currentStock === 0).length;

  const variantLines = data.variants
    .map(
      (v) =>
        `  - ${v.productName} (${v.option1Label}: ${v.option1Value}${v.option2Value ? `, ${v.option2Label}: ${v.option2Value}` : ""}${v.sku ? `, SKU: ${v.sku}` : ""}) — ${v.currentStock === 0 ? "OUT OF STOCK" : `${v.currentStock} left`}`
    )
    .join("\n");

  return [
    `LOW STOCK ALERT — ${data.shopName}`,
    "",
    `${data.variants.length} variant${data.variants.length > 1 ? "s" : ""} below threshold of ${data.threshold} units.`,
    outOfStockCount > 0
      ? `⚠ ${outOfStockCount} variant${outOfStockCount > 1 ? "s are" : " is"} completely out of stock!`
      : "",
    "",
    "Variants:",
    variantLines,
    "",
    `Manage stock: ${data.dashboardUrl}`,
    "",
    `Alert threshold: ${data.threshold} units — Manage in Settings > Notifications`,
    "",
    "— TradeFeed",
  ]
    .filter(Boolean)
    .join("\n");
}
