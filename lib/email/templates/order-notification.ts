// ============================================================
// Email Templates — Order Notification
// ============================================================
// HTML email sent to sellers when a new order is placed.
// Styled inline for maximum email client compatibility.
// ============================================================

interface OrderEmailData {
  shopName: string;
  orderNumber: string;
  buyerName?: string;
  buyerPhone?: string;
  deliveryAddress?: string;
  deliveryCity?: string;
  deliveryProvince?: string;
  deliveryPostalCode?: string;
  totalCents: number;
  itemCount: number;
  items: {
    productName: string;
    option1Label: string;
    option1Value: string;
    option2Label: string;
    option2Value: string | null;
    priceInCents: number;
    quantity: number;
  }[];
  dashboardUrl: string;
}

function formatRands(cents: number): string {
  return `R${(cents / 100).toFixed(2)}`;
}

export function newOrderEmailHtml(data: OrderEmailData): string {
  const itemRows = data.items
    .map(
      (item) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e7e5e4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
            <strong style="color: #1c1917;">${item.productName}</strong><br>
            <span style="color: #78716c; font-size: 13px;">
              ${item.option1Label}: ${item.option1Value}${item.option2Value ? ` · ${item.option2Label}: ${item.option2Value}` : ""}
            </span>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e7e5e4; text-align: center; color: #44403c; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
            ${item.quantity}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e7e5e4; text-align: right; color: #1c1917; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
            ${formatRands(item.priceInCents * item.quantity)}
          </td>
        </tr>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background-color: #fafaf9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 24px;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #059669, #10b981); border-radius: 16px 16px 0 0; padding: 32px; text-align: center;">
      <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 700;">🛒 New Order Received!</h1>
      <p style="margin: 8px 0 0; color: #d1fae5; font-size: 14px;">${data.shopName}</p>
    </div>

    <!-- Body -->
    <div style="background: white; padding: 32px; border-radius: 0 0 16px 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <!-- Order Info -->
      <div style="background: #f5f5f4; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="color: #78716c; font-size: 13px; padding: 4px 0;">Order Number</td>
            <td style="text-align: right; font-weight: 600; color: #1c1917;">${data.orderNumber}</td>
          </tr>
          ${data.buyerName ? `<tr><td style="color: #78716c; font-size: 13px; padding: 4px 0;">Buyer</td><td style="text-align: right; color: #1c1917;">${data.buyerName}</td></tr>` : ""}
          ${data.buyerPhone ? `<tr><td style="color: #78716c; font-size: 13px; padding: 4px 0;">WhatsApp</td><td style="text-align: right; color: #1c1917;">${data.buyerPhone}</td></tr>` : ""}
          ${data.deliveryAddress ? `<tr><td style="color: #78716c; font-size: 13px; padding: 4px 0;">📍 Delivery</td><td style="text-align: right; color: #1c1917;">${data.deliveryAddress}${data.deliveryCity ? `, ${data.deliveryCity}` : ""}${data.deliveryProvince ? `, ${data.deliveryProvince}` : ""}${data.deliveryPostalCode ? ` ${data.deliveryPostalCode}` : ""}</td></tr>` : ""}
          <tr>
            <td style="color: #78716c; font-size: 13px; padding: 4px 0;">Items</td>
            <td style="text-align: right; color: #1c1917;">${data.itemCount}</td>
          </tr>
          <tr>
            <td style="color: #78716c; font-size: 13px; padding: 4px 0;">Total</td>
            <td style="text-align: right; font-weight: 700; color: #059669; font-size: 18px;">${formatRands(data.totalCents)}</td>
          </tr>
        </table>
      </div>

      <!-- Items Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <thead>
          <tr style="background: #f5f5f4;">
            <th style="padding: 10px 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #78716c; letter-spacing: 0.5px;">Product</th>
            <th style="padding: 10px 12px; text-align: center; font-size: 12px; text-transform: uppercase; color: #78716c; letter-spacing: 0.5px;">Qty</th>
            <th style="padding: 10px 12px; text-align: right; font-size: 12px; text-transform: uppercase; color: #78716c; letter-spacing: 0.5px;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>

      <!-- CTA -->
      <div style="text-align: center; margin-top: 24px;">
        <a href="${data.dashboardUrl}" style="display: inline-block; background: #059669; color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px;">
          View Order Details →
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 24px; color: #a8a29e; font-size: 12px;">
      <p>You received this email because you have a shop on TradeFeed.</p>
      <p>Manage your notification preferences in your dashboard settings.</p>
    </div>
  </div>
</body>
</html>`;
}
