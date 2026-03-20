// ============================================================
// Component — Quick Reply Templates
// ============================================================
// Pre-written WhatsApp reply messages for SA informal sellers.
// Copy-to-clipboard with visual feedback. Grouped by category.
// ============================================================

"use client";

import { useState, useCallback } from "react";

interface Template {
  id: string;
  label: string;
  message: string;
  emoji: string;
}

interface TemplateGroup {
  title: string;
  icon: string;
  templates: Template[];
}

const TEMPLATE_GROUPS: TemplateGroup[] = [
  {
    title: "Stock & Availability",
    icon: "📦",
    templates: [
      {
        id: "in-stock",
        label: "Item in stock",
        emoji: "✅",
        message:
          "Hi! ✅ Yes, this item is in stock and ready to go. Would you like to place an order?",
      },
      {
        id: "out-of-stock",
        label: "Out of stock",
        emoji: "😔",
        message:
          "Hi! Unfortunately this item is currently out of stock 😔 I'll let you know as soon as it's back. Can I suggest something similar?",
      },
      {
        id: "sizes-available",
        label: "Available sizes",
        emoji: "📏",
        message:
          "Hi! Here are the sizes currently in stock:\n\n• S — available ✅\n• M — available ✅\n• L — available ✅\n• XL — available ✅\n\nWhich size would you like?",
      },
      {
        id: "last-one",
        label: "Last one left",
        emoji: "🔥",
        message:
          "Hi! 🔥 Great choice — this is the last one in stock! Shall I reserve it for you?",
      },
    ],
  },
  {
    title: "Pricing & Payment",
    icon: "💰",
    templates: [
      {
        id: "price-info",
        label: "Price details",
        emoji: "💵",
        message:
          "Hi! The price is R[AMOUNT]. This includes [details]. Would you like to order?",
      },
      {
        id: "payment-methods",
        label: "Payment methods",
        emoji: "💳",
        message:
          "Hi! We accept the following payment methods:\n\n• Cash on delivery 💵\n• EFT / Bank transfer 🏦\n• eWallet (Capitec Pay, FNB) 📱\n\nWhich works best for you?",
      },
      {
        id: "bulk-discount",
        label: "Bulk discount",
        emoji: "🏷️",
        message:
          "Hi! Great news — we offer bulk discounts:\n\n• 3+ items: 10% off\n• 5+ items: 15% off\n• 10+ items: 20% off\n\nHow many were you looking at?",
      },
      {
        id: "banking-details",
        label: "Banking details",
        emoji: "🏦",
        message:
          "Hi! Here are our banking details:\n\n🏦 Bank: [Bank Name]\n👤 Account Name: [Name]\n🔢 Account Number: [Number]\n📋 Reference: [Your Name]\n\nPlease send proof of payment once done ✅",
      },
    ],
  },
  {
    title: "Delivery & Collection",
    icon: "🚚",
    templates: [
      {
        id: "delivery-options",
        label: "Delivery options",
        emoji: "📍",
        message:
          "Hi! Here are our delivery options:\n\n🚚 Courier: R[AMOUNT] (2-3 days)\n🏪 Collection: FREE (from [location])\n📦 Paxi: R[AMOUNT] (to your nearest PEP)\n\nWhich option suits you?",
      },
      {
        id: "order-shipped",
        label: "Order shipped",
        emoji: "📬",
        message:
          "Hi! Great news — your order has been shipped! 📦\n\n🚚 Tracking: [TRACKING NUMBER]\n📅 Expected delivery: [DATE]\n\nI'll keep you updated!",
      },
      {
        id: "collection-ready",
        label: "Ready for collection",
        emoji: "🏪",
        message:
          "Hi! Your order is packed and ready for collection! 🎉\n\n📍 Address: [ADDRESS]\n🕐 Hours: [HOURS]\n\nPlease bring your order reference. See you soon!",
      },
      {
        id: "delivery-delay",
        label: "Delivery delay",
        emoji: "⏳",
        message:
          "Hi! I wanted to update you — there's a small delay on your delivery ⏳\n\nNew expected date: [DATE]\n\nSorry for the wait, and thank you for your patience! 🙏",
      },
    ],
  },
  {
    title: "Customer Service",
    icon: "🤝",
    templates: [
      {
        id: "thank-you",
        label: "Thank you",
        emoji: "🙏",
        message:
          "Thank you so much for your order! 🎉 We really appreciate your support. Enjoy your purchase and don't hesitate to reach out if you need anything! 💚",
      },
      {
        id: "review-request",
        label: "Ask for review",
        emoji: "⭐",
        message:
          "Hi! Hope you're loving your purchase! 😊 If you have a moment, we'd really appreciate a review on our catalog — it helps other buyers trust us! ⭐\n\nThank you! 🙏",
      },
      {
        id: "return-policy",
        label: "Return policy",
        emoji: "🔄",
        message:
          "Hi! Our return policy:\n\n• Returns accepted within 7 days\n• Item must be unused and in original packaging\n• Buyer covers return shipping\n\nPlease send photos of any issues and we'll sort it out 🤝",
      },
      {
        id: "new-arrivals",
        label: "New arrivals",
        emoji: "🆕",
        message:
          "Hi! 🆕 Just wanted to let you know we've got new stock in! Check out our latest products on our catalog. Let me know if anything catches your eye! 👀",
      },
    ],
  },
];

export function QuickReplyTemplates({ shopSlug }: { shopSlug: string }) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = useCallback(async (id: string, message: string) => {
    try {
      await navigator.clipboard.writeText(message);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = message;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }, []);

  return (
    <div className="space-y-6">
      {TEMPLATE_GROUPS.map((group) => (
        <div key={group.title} className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <span>{group.icon}</span>
            {group.title}
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {group.templates.map((template) => {
              const isCopied = copiedId === template.id;
              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => handleCopy(template.id, template.message)}
                  className={`group relative rounded-xl border-2 p-3 text-left transition-all duration-200 ${
                    isCopied
                      ? "border-emerald-400 bg-emerald-50 shadow-md shadow-emerald-100"
                      : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/30 hover:shadow-sm active:scale-[0.98]"
                  }`}
                >
                  {/* Header */}
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-sm font-medium text-slate-800">
                      <span>{template.emoji}</span>
                      {template.label}
                    </span>
                    <span
                      className={`flex-shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-semibold transition-all ${
                        isCopied
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-100 text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-600"
                      }`}
                    >
                      {isCopied ? "✓ Copied!" : "TAP TO COPY"}
                    </span>
                  </div>
                  {/* Preview */}
                  <p className="line-clamp-2 text-xs leading-relaxed text-slate-500">
                    {template.message}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Tip */}
      <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/40 p-4 text-center">
        <p className="text-xs text-slate-500">
          💡 <span className="font-medium text-slate-700">Pro tip:</span> Replace the
          [BRACKETED] placeholders with your actual details before sending
        </p>
      </div>
    </div>
  );
}
