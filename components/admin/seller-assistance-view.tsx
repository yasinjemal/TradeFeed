import React, { type ReactNode } from "react";
import {
  Mail,
  Clock3,
  CheckCheck,
  ArrowUpRight,
  Inbox,
  PauseCircle,
  ShieldCheck,
} from "lucide-react";
import type { getSellerAssistanceReview } from "@/lib/db/seller-assistance";
import {
  assistanceBlocker,
  assistanceStatus,
  assistanceTitle,
} from "@/lib/email/assistance-presentation";

type Review = Awaited<ReturnType<typeof getSellerAssistanceReview>>;
export function SellerAssistanceView({
  review,
  refreshControl,
  approvalControls,
  cancelControls,
}: {
  review: Review;
  refreshControl: ReactNode;
  approvalControls: Record<string, ReactNode>;
  cancelControls: Record<string, ReactNode>;
}) {
  const queued = review.history.filter(
    (item) => item.status === "PENDING",
  ).length;
  return (
    <section aria-label="Seller assistance emails" className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">
            <ShieldCheck size={16} aria-hidden="true" /> Thoughtful support, one
            step at a time
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            Who needs help?
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-stone-400">
            Relevant help, prepared for your review. You approve the email; we
            recheck the seller&apos;s situation before delivery.
          </p>
        </div>
        {refreshControl}
      </div>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {(
          [
            ["Ready to review", review.suggestions.length, Mail],
            ["Recently queued", queued, Clock3],
            [
              "Recent steps completed",
              review.history.filter((item) => item.resolved).length,
              CheckCheck,
            ],
          ] as const
        ).map(([label, count, Icon]) => (
          <div
            key={label}
            className="flex items-center justify-between gap-3 rounded-2xl border border-stone-800 bg-stone-900/70 p-3 sm:p-5"
          >
            <div>
              <p className="text-xs leading-5 text-stone-400 sm:text-sm">{label}</p>
              <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-white">
                {count}
              </p>
            </div>
            <span className="hidden rounded-xl border border-emerald-900/60 bg-emerald-950/40 p-3 text-emerald-300 xl:inline-flex">
              <Icon size={21} strokeWidth={1.7} aria-hidden="true" />
            </span>
          </div>
        ))}
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-5">
          {!review.locks.sendAllowed && (
            <div
              role="status"
              className="rounded-2xl border border-amber-800/50 bg-amber-950/20 p-5 text-sm leading-6 text-amber-100"
            >
              <p className="flex items-center gap-2 font-semibold">
                <PauseCircle size={18} aria-hidden="true" /> Delivery is paused
              </p>
              <p className="mt-1">
                Review any available drafts now. Approved emails will wait in
                the queue until setup is complete.
              </p>
              <details className="mt-2">
                <summary className="cursor-pointer font-medium underline decoration-stone-600 underline-offset-4">
                  Show what needs fixing
                </summary>
                <ul className="mt-2 list-inside list-disc space-y-1">
                  {review.locks.blockers.map((blocker) => (
                    <li key={blocker}>{assistanceBlocker(blocker)}</li>
                  ))}
                </ul>
              </details>
            </div>
          )}
          {review.suggestions.length === 0 && (
            <div className="rounded-2xl border border-dashed border-stone-700 bg-stone-900/30 px-6 py-10 sm:px-8">
              <span className="mb-5 inline-flex rounded-2xl border border-stone-700 bg-stone-900 p-4 text-emerald-300">
                <Inbox size={28} strokeWidth={1.5} aria-hidden="true" />
              </span>
              <h3 className="text-lg font-semibold tracking-tight text-white">
                No emails ready for review
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-300">
                This does not mean every shop is complete. Emails appear only
                when a seller has opted in, needs one of the supported next
                steps, and passes the timing and address checks. Recent messages
                and repeated advice are excluded.
              </p>
              <p className="mt-2 text-sm text-stone-400">
                Sellers control assistance email consent in their own account
                settings. Shop checklists and internal notes are available on
                the Seller assistant page under More details.
              </p>
            </div>
          )}
          <div className="space-y-4">
            {review.suggestions.map((item) => (
              <article
                key={`${item.userId}:${item.shopId}`}
                className="min-w-0 overflow-hidden rounded-2xl border border-stone-700/80 bg-stone-900 p-5 shadow-sm sm:p-6"
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                  {assistanceTitle(item.decision.kind)}
                </p>
                <h3 className="mt-3 break-words text-xl font-semibold tracking-tight text-white">
                  {item.shopName}
                </h3>
                <p className="mt-2 text-sm text-stone-300">
                  {item.decision.reason}
                </p>
                {item.decision.productName && (
                  <p className="mt-1 text-sm text-stone-400">
                    Product: {item.decision.productName}
                  </p>
                )}
                <details className="group mt-5 border-t border-stone-700 pt-4">
                  <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between rounded-lg px-1 font-semibold text-emerald-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400">
                    Review email{" "}
                    <ArrowUpRight
                      size={18}
                      aria-hidden="true"
                      className="transition-transform group-open:rotate-90"
                    />
                  </summary>
                  <div className="mt-3 overflow-hidden rounded-xl border border-stone-200 bg-[#faf9f6] p-5 text-stone-900 sm:p-6">
                    <p className="break-all border-b border-stone-200 pb-4 text-xs text-stone-600">
                      To: {item.email}
                    </p>
                    <p className="mt-5 text-lg font-semibold leading-snug text-stone-900">
                      {item.subject}
                    </p>
                    <pre className="mt-4 whitespace-pre-wrap break-words font-sans text-sm leading-7 text-stone-700 [overflow-wrap:anywhere]">
                      {item.text.replace(
                        /Unsubscribe: .+$/,
                        "Unsubscribe: a personal unsubscribe link is added at delivery",
                      )}
                    </pre>
                  </div>
                  {approvalControls[`${item.userId}:${item.shopId}`]}
                  <p className="mt-2 text-xs text-stone-400">
                    {review.locks.sendAllowed
                      ? "Approval queues this exact email for the daily delivery check."
                      : "Approval saves this email to the queue. Sending is currently paused."}
                  </p>
                </details>
              </article>
            ))}
          </div>
        </div>
        <aside className="min-w-0 rounded-2xl border border-stone-800 bg-stone-900/50 p-5 sm:p-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-white">
            <Clock3 size={18} className="text-stone-400" aria-hidden="true" />
            Email activity and progress
          </h3>
          <p className="mt-1 text-sm text-stone-400">
            Latest 50 approvals. Progress is checked when this page loads or
            refreshes; a resolved situation does not prove the email caused it.
          </p>
          {review.history.length === 0 ? (
            <p className="mt-5 rounded-xl border border-dashed border-stone-700 p-5 text-sm leading-6 text-stone-400">
              No assistance emails have been approved yet.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {review.history.map((item) => {
                const state = assistanceStatus(item.status);
                return (
                  <li
                    key={item.id}
                    className="rounded-xl border border-stone-800 bg-stone-950/50 p-4"
                  >
                    <div className="flex flex-wrap justify-between gap-2">
                      <p className="font-semibold text-white">
                        {item.shopName}
                      </p>
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${item.status === "DELIVERED" ? "border-emerald-800 bg-emerald-950/50 text-emerald-200" : ["FAILED", "BOUNCED", "COMPLAINED"].includes(item.status) ? "border-amber-800 bg-amber-950/40 text-amber-200" : "border-stone-700 bg-stone-800 text-stone-200"}`}
                      >
                        {item.status === "PENDING" && !review.locks.sendAllowed
                          ? "Queued - sending paused"
                          : state.label}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-stone-300">
                      {assistanceTitle(item.kind)}: {state.detail}
                    </p>
                    {item.deliveredAt && (
                      <p className="mt-1 text-xs text-stone-400">
                        Delivered{" "}
                        {new Date(item.deliveredAt).toLocaleString("en-ZA", {
                          timeZone: "Africa/Johannesburg",
                        })}{" "}
                        SAST
                      </p>
                    )}
                    {item.resolved && (
                      <p className="mt-2 text-sm text-emerald-300">
                        The seller has now completed this step.
                      </p>
                    )}
                    {item.status === "PENDING" &&
                      cancelControls[item.campaignId]}
                  </li>
                );
              })}
            </ul>
          )}
        </aside>
      </div>
      <details className="rounded-xl border border-stone-800 px-5 py-4 text-sm leading-6 text-stone-400">
        <summary className="cursor-pointer font-medium underline decoration-stone-600 underline-offset-4">
          How the assistant chooses and sends help
        </summary>
        <p className="mt-3">
          Supported situations: no first product after 48 hours, a published
          listing missing details for 24 hours, or at least three complete
          listings without a recorded catalogue share. It checks up to 500
          opted-in owner memberships and shows up to 20 suggestions.
        </p>
        <p className="mt-2">
          Every email needs your approval. Consent, seller progress and address
          eligibility are checked again before sending. At most one assistance
          email per seven days; the same advice is not repeated. Changed
          situations are skipped. Delivery problems are not automatically
          retried.
        </p>
        <a href="/admin/activation" className="mt-3 inline-block underline">
          Open activation reports and account reminders
        </a>
      </details>
    </section>
  );
}
