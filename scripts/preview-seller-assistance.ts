import { mkdirSync, writeFileSync } from "node:fs";
import { sellerAssistanceEmail } from "@/lib/email/templates/seller-assistance";
import { ASSISTANCE_VERSION, type AssistanceDecision } from "@/lib/email/seller-assistance-policy";

const examples: AssistanceDecision[] = [
  { kind: "first_product", reason: "No saved products after 48 hours", productId: null, productName: null, issues: [], actionPath: "/dashboard/preview-shop/products/new?ai=true" },
  { kind: "incomplete_listing", reason: "Missing details after 24 hours", productId: "preview-product", productName: "Blue cotton dress", issues: ["a clear product photo", "a marketplace category"], actionPath: "/dashboard/preview-shop/products/preview-product" },
  { kind: "share_catalogue", reason: "Three ready listings, no tracked share", productId: null, productName: null, issues: [], actionPath: "/dashboard/preview-shop/products" },
];
mkdirSync("test-results/seller-assistance", { recursive: true });
for (const decision of examples) {
  const email = sellerAssistanceEmail({ version: ASSISTANCE_VERSION, shopId: "preview", shopName: "Thandi’s Fashion", shopSlug: "preview-shop", decision }, "https://tradefeed.co.za/email/unsubscribe?token=preview-not-live");
  writeFileSync(`test-results/seller-assistance/${decision.kind}.html`, email.html);
}
console.log("Created three local email previews in test-results/seller-assistance. No emails sent.");
