import { requireAdmin } from "@/lib/auth/admin";
import { getSellerAssistanceReview } from "@/lib/db/seller-assistance";
import { AssistanceControl } from "./seller-assistance-controls";

export async function SellerAssistancePanel() {
  await requireAdmin();
  const review = await getSellerAssistanceReview();
  return <section aria-label="Seller assistance emails" className="rounded-2xl border border-stone-800 bg-stone-900 p-6 space-y-5">
    <div><h2 className="text-lg font-bold text-white">Seller assistance emails</h2>
      <p className="mt-2 text-sm text-stone-400">Review each recipient, reason and exact message before approving. The daily delivery job checks consent and their situation again. One assistance email per seven days; the same advice is not sent repeatedly.</p>
      <p className="mt-2 text-xs text-stone-500">Preview checks up to 500 opted-in owner memberships and shows up to 20 suggestions. Refresh this page for current situations.</p>
    </div>
    {review.locks.blockers.length > 0 && <div className="rounded-xl border border-amber-800 bg-amber-950/30 p-4 text-sm text-amber-200">
      <p className="font-semibold">Sending is paused</p><p className="mt-1">Approvals remain queued until delivery settings are ready.</p>
      <ul className="mt-2 list-inside list-disc">{review.locks.blockers.map((blocker) => <li key={blocker}>{blocker.replaceAll("_", " ")}</li>)}</ul>
    </div>}
    {review.suggestions.length === 0 && <p className="text-sm text-stone-400">No eligible suggestions right now. Sellers need explicit email opt-in and must pass the situation, suppression and frequency checks.</p>}
    {review.suggestions.map((item) => <article key={`${item.userId}:${item.shopId}`} className="rounded-xl border border-stone-700 p-4">
      <h3 className="font-semibold text-white">{item.shopName}</h3>
      <p className="text-sm text-stone-400">To: {item.email}</p>
      <p className="mt-2 text-sm text-amber-200">Why: {item.decision.reason}</p>
      <p className="mt-3 font-semibold text-stone-200">Subject: {item.subject}</p>
      <pre className="mt-2 whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-stone-300">{item.text.replace(/Unsubscribe: .+$/, "Unsubscribe: a personal unsubscribe link is added at delivery")}</pre>
      <AssistanceControl approval={{ userId: item.userId, shopId: item.shopId, fingerprint: item.fingerprint }} />
    </article>)}
    {review.history.length > 0 && <div>
      <h3 className="font-semibold text-white">Recent approvals and outcomes</h3>
      <p className="mt-1 text-xs text-stone-400">SENT means provider accepted, not delivered. “Situation resolved” is current product/share state after a send, not proof the email caused it. FAILED or PROCESSING require provider reconciliation; they are never automatically retried.</p>
      <ul className="mt-3 space-y-3">{review.history.map((item) => <li key={item.id} className="rounded-lg bg-stone-950 p-3 text-sm text-stone-300">
        {item.shopName} · {item.kind.replaceAll("_", " ")} · {item.status}
        {item.sentAt && <span> · {new Date(item.sentAt).toLocaleDateString("en-ZA")}</span>}
        {item.resolved && <span className="ml-2 text-emerald-400">Situation resolved</span>}
        {item.status === "PENDING" && <AssistanceControl campaignId={item.campaignId} />}
      </li>)}</ul>
    </div>}
  </section>;
}
