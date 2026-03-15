// ============================================================
// Page — AI Conversations (/dashboard/[slug]/conversations)
// ============================================================
// Shows AI-powered WhatsApp conversations for the shop.
// Gated behind pro-ai / business plans.
// ============================================================

import { requireShopAccess } from "@/lib/auth";
import { getShopBySlug } from "@/lib/db/shops";
import { getShopSubscription, isTrialActive } from "@/lib/db/subscriptions";
import { getShopConversations } from "@/lib/whatsapp/ai-sales";
import { ProFeatureGate } from "@/components/billing/pro-feature-gate";
import { notFound } from "next/navigation";
import Link from "next/link";

type ConversationItem = Awaited<ReturnType<typeof getShopConversations>>["conversations"][number];

const AI_PLANS = ["pro-ai", "business"];

interface ConversationsPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export default async function ConversationsPage({
  params,
  searchParams,
}: ConversationsPageProps) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;

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

  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const data = hasAI
    ? await getShopConversations(shop.id, page)
    : { conversations: [], total: 0, pages: 0 };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900">
          🤖 AI Conversations
        </h1>
        <p className="text-stone-500 mt-1">
          WhatsApp conversations handled by your AI sales assistant
        </p>
      </div>

      <ProFeatureGate
        feature="AI Sales Assistant"
        shopSlug={slug}
        hasAccess={hasAI}
        description="Upgrade to Pro AI to let your AI assistant handle buyer WhatsApp messages 24/7 with product-aware replies."
      >
        {data.conversations.length === 0 ? (
          <div className="rounded-2xl border border-stone-200 bg-white p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-stone-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-stone-900 mb-1">
              No conversations yet
            </h3>
            <p className="text-sm text-stone-500">
              When buyers message your WhatsApp number, the AI assistant will
              handle them automatically and conversations will appear here.
            </p>
          </div>
        ) : (
          <>
            {/* Conversation list */}
            <div className="space-y-3">
              {data.conversations.map((convo: ConversationItem) => {
                const lastMsg = convo.messages[0];
                const maskedPhone = convo.buyerPhone.replace(
                  /(\d{2})\d+(\d{4})/,
                  "$1****$2",
                );
                return (
                  <Link
                    key={convo.id}
                    href={`/dashboard/${slug}/conversations/${convo.id}`}
                    className="flex items-start gap-4 rounded-2xl border border-stone-200 bg-white p-4 hover:border-emerald-300 hover:shadow-sm transition-all"
                  >
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center flex-shrink-0">
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

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-stone-900 text-sm">
                          {maskedPhone}
                        </span>
                        <span className="text-xs text-stone-400 flex-shrink-0">
                          {new Date(convo.lastMessageAt).toLocaleDateString(
                            "en-ZA",
                            {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </span>
                      </div>
                      <p className="text-sm text-stone-500 truncate mt-0.5">
                        {lastMsg?.role === "assistant" && (
                          <span className="text-emerald-600 font-medium">
                            AI:{" "}
                          </span>
                        )}
                        {lastMsg?.content ?? "No messages"}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-stone-400">
                          {convo._count.messages} messages
                        </span>
                        {lastMsg?.aiGenerated && (
                          <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-full">
                            🤖 AI
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Chevron */}
                    <svg
                      className="w-5 h-5 text-stone-300 flex-shrink-0 mt-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8.25 4.5l7.5 7.5-7.5 7.5"
                      />
                    </svg>
                  </Link>
                );
              })}
            </div>

            {/* Pagination */}
            {data.pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                {page > 1 && (
                  <Link
                    href={`/dashboard/${slug}/conversations?page=${page - 1}`}
                    className="px-4 py-2 text-sm rounded-xl border border-stone-200 hover:bg-stone-50 transition-colors"
                  >
                    Previous
                  </Link>
                )}
                <span className="text-sm text-stone-500">
                  Page {page} of {data.pages}
                </span>
                {page < data.pages && (
                  <Link
                    href={`/dashboard/${slug}/conversations?page=${page + 1}`}
                    className="px-4 py-2 text-sm rounded-xl border border-stone-200 hover:bg-stone-50 transition-colors"
                  >
                    Next
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </ProFeatureGate>
    </div>
  );
}
