// ============================================================
// Page — AI Conversation Detail (/dashboard/[slug]/conversations/[conversationId])
// ============================================================
// Shows the full message thread of a WhatsApp conversation
// handled by the AI sales assistant.
// ============================================================

import { requireShopAccess } from "@/lib/auth";
import { getShopBySlug } from "@/lib/db/shops";
import { getShopSubscription, isTrialActive } from "@/lib/db/subscriptions";
import { getConversationMessages } from "@/lib/whatsapp/ai-sales";
import { notFound } from "next/navigation";
import Link from "next/link";

type ConversationData = NonNullable<Awaited<ReturnType<typeof getConversationMessages>>>;
type MessageItem = ConversationData["messages"][number];

const AI_PLANS = ["pro-ai", "business"];

interface ConversationDetailPageProps {
  params: Promise<{ slug: string; conversationId: string }>;
}

export default async function ConversationDetailPage({
  params,
}: ConversationDetailPageProps) {
  const { slug, conversationId } = await params;

  let access: Awaited<ReturnType<typeof requireShopAccess>>;
  try {
    access = await requireShopAccess(slug);
  } catch {
    return notFound();
  }
  if (!access) return notFound();

  const shop = await getShopBySlug(slug);
  if (!shop) return notFound();

  const subscription = await getShopSubscription(shop.id);
  const hasAI =
    !!subscription?.plan.slug &&
    AI_PLANS.includes(subscription.plan.slug) &&
    (subscription.status === "ACTIVE" || isTrialActive(subscription).active);

  if (!hasAI) return notFound();

  const conversation = await getConversationMessages(conversationId, shop.id);
  if (!conversation) return notFound();

  const maskedPhone = conversation.buyerPhone.replace(
    /(\d{2})\d+(\d{4})/,
    "$1****$2",
  );

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/dashboard/${slug}/conversations`}
          className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-700 transition-colors mb-4"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5L8.25 12l7.5-7.5"
            />
          </svg>
          Back to conversations
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-emerald-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-stone-900">{maskedPhone}</h1>
            <p className="text-xs text-stone-400">
              {conversation.messages.length} messages · Last active{" "}
              {new Date(conversation.lastMessageAt).toLocaleDateString("en-ZA", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 sm:p-6">
        <div className="space-y-4">
          {conversation.messages.map((msg: MessageItem) => {
            const isBuyer = msg.role === "buyer";
            const isAI = msg.role === "assistant";
            return (
              <div
                key={msg.id}
                className={`flex ${isBuyer ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    isBuyer
                      ? "bg-white border border-stone-200 text-stone-800"
                      : isAI
                        ? "bg-emerald-600 text-white"
                        : "bg-stone-700 text-white"
                  }`}
                >
                  {/* Role label */}
                  <div
                    className={`text-xs font-medium mb-1 ${
                      isBuyer
                        ? "text-stone-400"
                        : isAI
                          ? "text-emerald-100"
                          : "text-stone-300"
                    }`}
                  >
                    {isBuyer ? "Buyer" : isAI ? "🤖 AI Assistant" : "You"}
                  </div>

                  {/* Message content */}
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>

                  {/* Meta */}
                  <div
                    className={`flex items-center gap-2 mt-2 text-xs ${
                      isBuyer
                        ? "text-stone-400"
                        : isAI
                          ? "text-emerald-200"
                          : "text-stone-400"
                    }`}
                  >
                    <span>
                      {new Date(msg.createdAt).toLocaleTimeString("en-ZA", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {msg.intent && (
                      <span className="bg-black/10 rounded-full px-2 py-0.5">
                        {msg.intent}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
