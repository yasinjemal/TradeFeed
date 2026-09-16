import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";
import { getSellerAssistanceReview } from "@/lib/db/seller-assistance";
import {
  assistanceBlocker,
  assistanceStatus,
  assistanceTitle,
} from "@/lib/email/assistance-presentation";
import {
  AssistanceControl,
  AssistanceRefresh,
} from "./seller-assistance-controls";

export async function SellerAssistancePanel() {
  await requireAdmin();
  const review = await getSellerAssistanceReview();
  const queued = review.history.filter(
    (item) => item.status === "PENDING",
  ).length;
  return (
    <section
      aria-label="Seller assistance emails"
      className="space-y-6 rounded-2xl border border-stone-700 bg-stone-900 p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-white">Who needs help?</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-300">
            We find a useful next step and prepare the email. Open a preview,
            check it, then approve. The daily job handles delivery and checks
            that the help is still needed.
          </p>
        </div>
        <AssistanceRefresh />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["Ready to review", review.suggestions.length],
          ["Queued in recent activity", queued],
          [
            "Recent situations resolved",
            review.history.filter((item) => item.resolved).length,
          ],
        ].map(([label, count]) => (
          <div key={label} className="rounded-xl bg-stone-950 p-4">
            <p className="text-sm text-stone-400">{label}</p>
            <p className="mt-1 text-2xl font-semibold text-white">{count}</p>
          </div>
        ))}
      </div>
      {!review.locks.sendAllowed && (
        <div
          role="status"
          className="rounded-xl border border-amber-800 bg-amber-950/30 p-4 text-sm text-amber-100"
        >
          <p className="font-semibold">Email delivery needs setup</p>
          <p className="mt-1">
            Eligible emails can be queued when preview is available, but sending
            stays paused until these settings are ready.
          </p>
          <details className="mt-2">
            <summary className="cursor-pointer underline">
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
        <div className="rounded-xl border border-stone-700 p-6">
          <h3 className="font-semibold text-white">
            No emails ready for review
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-stone-300">
            This does not mean every shop is complete. Emails appear only when a
            seller has opted in, needs one of the supported next steps, and
            passes the timing and address checks. Recent messages and repeated
            advice are excluded.
          </p>
          <p className="mt-2 text-sm text-stone-400">
            Sellers control assistance email consent in their own account
            settings. Shop checklists and internal notes are available on the
            Seller assistant page under More details.
          </p>
        </div>
      )}
      <div className="space-y-4">
        {review.suggestions.map((item) => (
          <article
            key={`${item.userId}:${item.shopId}`}
            className="rounded-xl border border-stone-700 bg-stone-950 p-5"
          >
            <p className="text-sm font-medium text-emerald-300">
              {assistanceTitle(item.decision.kind)}
            </p>
            <h3 className="mt-1 text-xl font-semibold text-white">
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
            <details className="mt-4 rounded-lg border border-stone-700 p-4">
              <summary className="cursor-pointer font-semibold text-emerald-300">
                Review email
              </summary>
              <p className="mt-4 break-words text-sm text-stone-400">
                To: {item.email}
              </p>
              <p className="mt-3 font-semibold text-white">{item.subject}</p>
              <pre className="mt-3 whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-stone-300">
                {item.text.replace(
                  /Unsubscribe: .+$/,
                  "Unsubscribe: a personal unsubscribe link is added at delivery",
                )}
              </pre>
              <AssistanceControl
                approval={{
                  userId: item.userId,
                  shopId: item.shopId,
                  fingerprint: item.fingerprint,
                }}
              />
              <p className="mt-2 text-xs text-stone-400">
                {review.locks.sendAllowed
                  ? "Approval queues this exact email for the daily delivery check."
                  : "Approval saves this email to the queue. Sending is currently paused."}
              </p>
            </details>
          </article>
        ))}
      </div>
      <div>
        <h3 className="text-lg font-semibold text-white">
          Email activity and progress
        </h3>
        <p className="mt-1 text-sm text-stone-400">
          Latest 50 approvals. Progress is checked when this page loads or
          refreshes; a resolved situation does not prove the email caused it.
        </p>
        {review.history.length === 0 ? (
          <p className="mt-3 text-sm text-stone-300">
            No assistance emails have been approved yet.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {review.history.map((item) => {
              const state = assistanceStatus(item.status);
              return (
                <li
                  key={item.id}
                  className="rounded-xl border border-stone-700 p-4"
                >
                  <div className="flex flex-wrap justify-between gap-2">
                    <p className="font-semibold text-white">{item.shopName}</p>
                    <span className="rounded-full bg-stone-800 px-3 py-1 text-xs font-medium text-stone-200">
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
                  {item.status === "PENDING" && (
                    <AssistanceControl campaignId={item.campaignId} />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <details className="text-sm text-stone-400">
        <summary className="cursor-pointer underline">
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
        <Link href="/admin/activation" className="mt-3 inline-block underline">
          Open activation reports and account reminders
        </Link>
      </details>
    </section>
  );
}
