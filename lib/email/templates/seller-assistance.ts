import { SITE_URL, SUPPORT_EMAIL } from "@/lib/config/site";
import type { AssistanceSnapshot } from "@/lib/email/seller-assistance-policy";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
}

export function sellerAssistanceEmail(snapshot: AssistanceSnapshot, unsubscribeUrl: string) {
  const { decision } = snapshot;
  const subject = decision.kind === "first_product" ? "Need a hand adding your first product?"
    : decision.kind === "incomplete_listing" ? "A small update could help buyers understand your listing"
    : "Your catalogue is ready to share";
  const introduction = decision.kind === "first_product"
    ? "Your shop is set up. The next step is adding one product. Upload a clear photo and TradeFeed can help write the listing. Check the details, price and stock before publishing."
    : decision.kind === "incomplete_listing"
      ? `Your listing “${decision.productName}” is missing ${new Intl.ListFormat("en-ZA", { style: "long", type: "conjunction" }).format(decision.issues)}. Open it below to add the details so customers can make an informed enquiry.`
      : "You have at least three listings ready. If you have not shared your catalogue yet, try the Share catalog button in your dashboard and send it to customers who already buy from you. You may already have shared your link elsewhere; we only see shares through TradeFeed.";
  const label = decision.kind === "first_product" ? "Add my first product" : decision.kind === "incomplete_listing" ? "Finish my listing" : "Share my catalogue";
  const actionUrl = `${SITE_URL.replace(/\/$/, "")}${decision.actionPath}`;
  const greeting = `Hi ${snapshot.shopName},`;
  const help = "Stuck somewhere? Reply and tell us what happened. We can help with the next step.";
  const footer = "You receive seller assistance because you opted in to TradeFeed emails. You can unsubscribe at any time.";
  const text = `${greeting}\n\n${introduction}\n\n${label}: ${actionUrl}\n\n${help}\n\nTradeFeed\n${SUPPORT_EMAIL}\n\n${footer}\nUnsubscribe: ${unsubscribeUrl}`;
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0;background:#f5f5f4;font-family:Arial,sans-serif;color:#1c1917"><main style="max-width:560px;margin:32px auto;padding:28px;background:white;border-radius:16px"><h1 style="font-size:20px">TradeFeed</h1><p>${escapeHtml(greeting)}</p><p style="line-height:1.6">${escapeHtml(introduction)}</p><p style="margin:28px 0"><a href="${escapeHtml(actionUrl)}" style="display:inline-block;background:#047857;color:white;padding:14px 20px;border-radius:8px;text-decoration:none">${escapeHtml(label)}</a></p><p style="line-height:1.6">${escapeHtml(help)}</p><p>TradeFeed · <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p><hr><p style="font-size:12px;color:#57534e">${escapeHtml(footer)} <a href="${escapeHtml(unsubscribeUrl)}">Unsubscribe</a></p></main></body></html>`;
  return { subject, text, html, actionUrl };
}
