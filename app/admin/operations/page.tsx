import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";
import { getActivationOperations } from "@/lib/db/activation-operations";
import {
  saveSellerFollowup,
  saveOrderFollowup,
} from "@/app/actions/activation-operations";
import { OperationsForm } from "@/components/admin/operations-form";
import { SellerAssistancePanel } from "@/app/admin/activation/seller-assistance-panel";
import { orderFollowupSummary } from "@/lib/activation/operations-policy";

const field =
  "mt-1 block min-h-11 w-full rounded-lg border border-stone-600 bg-stone-950 p-2 text-stone-100";
export default async function Operations({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireAdmin();
  const query = await searchParams;
  const data = await getActivationOperations();
  const pages = Math.max(1, Math.ceil(data.sellers.length / 10));
  const page = Math.min(
    pages,
    Math.max(1, Number.parseInt(query.page ?? "1", 10) || 1),
  );
  const sellers = data.sellers.slice((page - 1) * 10, page * 10);
  const due = new Date(data.asOf + 3 * 86400000).toISOString().slice(0, 10);
  const complete = data.sellers.filter(
    (s) =>
      s.ready >= 3 &&
      s.shopIssues.length === 0 &&
      s.shared &&
      s.followup?.enquiry === "SELLER_CONFIRMED",
  ).length;
  const unverified =
    data.reviewCounts.find((r) => !r.isVerified)?._count._all ?? 0;
  return (
    <section className="space-y-8 text-stone-100">
      <header>
        <h1 className="text-3xl font-semibold">Seller support assistant</h1>
        <p className="mt-2 text-stone-300">
          Review helpful emails, approve the ones you want sent, and check
          seller progress. No support forms needed to approve an email.
        </p>
      </header>
      <SellerAssistancePanel />
      <details className="rounded-2xl border border-stone-700 p-5">
        <summary className="cursor-pointer text-lg font-semibold">
          More details: shop checklists and internal follow-up
        </summary>
        <div className="mt-6 space-y-6">
          <div className="grid gap-3 sm:grid-cols-4">
            {[
              ["Enabled shops", data.sellers.length],
              [
                "Empty shops",
                data.sellers.filter((s) => !s.products.length).length,
              ],
              [
                "Listings needing repair",
                data.sellers.reduce(
                  (n, s) =>
                    n + s.products.filter((p) => p.issues.length).length,
                  0,
                ),
              ],
              ["Activation goals evidenced", complete],
            ].map(([label, n]) => (
              <div
                key={label}
                className="rounded-xl border border-stone-700 p-4"
              >
                <p className="text-sm text-stone-300">{label}</p>
                <strong className="text-3xl">{n}</strong>
              </div>
            ))}
          </div>
          <p className="text-sm text-stone-300">
            Complete listings need an image, category, a factual description of
            at least 40 characters, a positive price and an active option in
            stock. The temporary discovery grace does not count as completeness.
            Clicks are consent-dependent intent signals, not enquiries or sales.
            Missing tracking is unknown.
          </p>
          <div className="flex flex-wrap gap-5 underline">
            <Link href="/admin/reviews?filter=unverified">
              Review {unverified} unverified submissions
            </Link>
            <Link href="/admin/verifications">Seller verification</Link>
            <Link href="/admin/activation">
              Activation funnel and email review
            </Link>
          </div>
          <h2 className="text-xl font-semibold">
            Suggested priorities · page {page} of {pages}
          </h2>
          <p className="text-sm text-stone-300">
            Recent incomplete shops come first. Saving a follow-up assigns it to
            you. These optional notes are internal; use the email approval cards
            above to queue a message to a seller.
          </p>
          {sellers.map((s) => (
            <article
              key={s.id}
              className="space-y-4 rounded-xl border border-stone-700 p-5"
            >
              <h3 className="text-xl font-semibold">{s.name}</h3>
              <p className="text-sm text-stone-300">
                Created {s.createdAt.toLocaleDateString("en-ZA")} · {s.ready}/
                {s.products.length} complete listings · Share/copy action:{" "}
                {s.shared ? "recorded" : "not recorded"} · {s.intentCount}{" "}
                recorded WhatsApp intent events in 30 days
              </p>
              <p className="text-sm">
                Owner: {s.owner ?? "Unassigned"} ·{" "}
                {s.followup?.status.replaceAll("_", " ") ?? "Not started"}{" "}
                {s.followup && `· Follow up ${s.followup.due}`}
              </p>
              {s.followup && (
                <p className="rounded-lg bg-stone-900 p-3 text-sm">
                  Latest evidence: {s.followup.evidence}
                </p>
              )}
              {s.shopIssues.length > 0 && (
                <ul className="list-disc pl-5 text-amber-200">
                  {s.shopIssues.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
              )}
              <details>
                <summary className="cursor-pointer py-2 underline">
                  Listing repair checklist (
                  {s.products.filter((p) => p.issues.length).length})
                </summary>
                <ul className="space-y-3 py-3">
                  {s.products
                    .filter((p) => p.issues.length)
                    .map((p) => (
                      <li key={p.id}>
                        <strong>{p.name}</strong>
                        <p className="text-sm text-stone-300">
                          {p.issues.join(" · ")}
                        </p>
                        {p.discoveryGraceUntil && (
                          <p className="text-xs text-amber-200">
                            Discovery repair deadline:{" "}
                            {p.discoveryGraceUntil.toLocaleDateString("en-ZA")}
                          </p>
                        )}
                      </li>
                    ))}
                </ul>
              </details>
              <div className="flex flex-wrap gap-4 text-sm underline">
                <Link href={`/catalog/${s.slug}`}>View public shop</Link>
                <Link href={`/dashboard/${s.slug}/readiness`}>
                  Seller readiness page (requires shop access)
                </Link>
              </div>
              <details>
                <summary className="cursor-pointer py-2 underline">
                  Internal notes and follow-up
                </summary>
                <OperationsForm action={saveSellerFollowup}>
                  <input type="hidden" name="shopId" value={s.id} />
                  <label>
                    Status
                    <select
                      name="status"
                      defaultValue={s.followup?.status ?? "IN_PROGRESS"}
                      className={field}
                    >
                      <option value="IN_PROGRESS">In progress</option>
                      <option value="WAITING_SELLER">Waiting for seller</option>
                      <option value="CLOSED">
                        Follow-up closed (does not mark activated)
                      </option>
                    </select>
                  </label>
                  <label>
                    Next action
                    <input
                      name="nextAction"
                      required
                      minLength={10}
                      maxLength={500}
                      defaultValue={s.followup?.nextAction}
                      className={field}
                    />
                  </label>
                  <label>
                    Follow-up date
                    <input
                      type="date"
                      name="due"
                      required
                      defaultValue={s.followup?.due ?? due}
                      className={field}
                    />
                  </label>
                  <label>
                    Buyer enquiry evidence
                    <select
                      name="enquiry"
                      defaultValue={s.followup?.enquiry ?? "UNCONFIRMED"}
                      className={field}
                    >
                      <option value="UNCONFIRMED">
                        Not confirmed by seller
                      </option>
                      <option value="SELLER_CONFIRMED">
                        Seller confirmed a genuine buyer enquiry
                      </option>
                    </select>
                  </label>
                  <label>
                    Evidence / seller response
                    <textarea
                      name="evidence"
                      required
                      minLength={10}
                      maxLength={1500}
                      className={field}
                      placeholder="What was confirmed, by whom and when? Avoid unnecessary personal information."
                    />
                  </label>
                </OperationsForm>
              </details>
            </article>
          ))}
          <nav className="flex gap-5">
            {page > 1 && (
              <Link className="underline" href={`?page=${page - 1}`}>
                Previous ten
              </Link>
            )}
            {page < pages && (
              <Link className="underline" href={`?page=${page + 1}`}>
                Next ten
              </Link>
            )}
          </nav>
        </div>
      </details>
      <details className="rounded-2xl border border-stone-700 p-5">
        <summary className="cursor-pointer text-lg font-semibold">
          Order follow-up: {data.staleOrders.length} old pending orders
        </summary>
        <section className="mt-5 space-y-4">
          <h2 className="text-xl font-semibold">
            Old pending orders · oldest 100
          </h2>
          <p className="text-stone-300">
            Confirm the real outcome with the seller. These notes do not change
            order status, record payment, release stock or issue refunds.
            Reconcile those separately from evidence.
          </p>
          {data.staleOrders.map((o) => (
            <details
              key={o.id}
              className="rounded-xl border border-stone-700 p-4"
            >
              <summary className="cursor-pointer">
                {o.orderNumber} · {o.shop.name} ·{" "}
                {Math.floor((data.asOf - o.createdAt.getTime()) / 86400000)}{" "}
                days old
              </summary>
              <p className="my-3 text-sm">
                {o.stockReservedAt
                  ? "Reservation-aware order"
                  : "Legacy inventory: manual reconciliation required"}{" "}
                ·{" "}
                {o.paidAt
                  ? "Payment recorded: refund review required"
                  : "No payment recorded; off-platform outcome unknown"}
              </p>
              {data.orderNotes.get(o.id) && (
                <p className="mb-3 break-words text-sm text-stone-300">
                  Last follow-up by {data.orderNotes.get(o.id)?.adminEmail}:{" "}
                  {orderFollowupSummary(
                    data.orderNotes.get(o.id)?.details ?? null,
                  )}
                </p>
              )}
              <OperationsForm action={saveOrderFollowup}>
                <input type="hidden" name="orderId" value={o.id} />
                <label>
                  Seller-reported outcome
                  <select name="outcome" className={field}>
                    <option value="AWAITING_SELLER">Awaiting seller</option>
                    <option value="SELLER_CONFIRMED_FULFILLED">
                      Seller confirmed fulfilment
                    </option>
                    <option value="SELLER_CONFIRMED_CANCELLED">
                      Seller confirmed cancellation
                    </option>
                    <option value="UNRESOLVED">Unresolved</option>
                  </select>
                </label>
                <label>
                  Evidence and next action
                  <textarea
                    name="evidence"
                    required
                    minLength={20}
                    maxLength={1500}
                    className={field}
                  />
                </label>
              </OperationsForm>
            </details>
          ))}
          {data.staleOrders.length === 0 && (
            <p>No pending orders older than seven days.</p>
          )}
        </section>
      </details>
      <details className="rounded-2xl border border-stone-700 p-5">
        <summary className="cursor-pointer text-lg font-semibold">
          Measurement details
        </summary>
        <section className="mt-5 space-y-3">
          <h2 className="text-xl font-semibold">Measurement health</h2>
          <p className="text-sm text-stone-300">
            Milestones record the first action per seller/shop, not every
            product save. The funnel uses stored shop and product records.
            “completed” means the legacy onboarding celebration was seen; it is
            not the activation goal above. Historical events are not invented or
            backfilled.
          </p>
          <ul className="space-y-2">
            {data.milestones.map((m) => (
              <li key={m.step}>
                {m.step}: {m._count._all} recorded · latest{" "}
                {m._max.createdAt?.toLocaleDateString("en-ZA") ?? "never"}
              </li>
            ))}
          </ul>
        </section>
      </details>
      <p className="rounded-lg border border-stone-700 p-4 text-sm">
        HUNT stays a small experiment. Prioritise these seller and catalogue
        tasks before adding more HUNT features.
      </p>
    </section>
  );
}
