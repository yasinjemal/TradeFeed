import { notFound } from "next/navigation";
import { supportCaseAccess } from "@/lib/support/access";
import { db } from "@/lib/db";
import { replySupportCaseAction } from "@/app/actions/support-cases";
import { CommerceHeader } from "@/components/commerce/header";
export const metadata = {
  title: {absolute:"Support case | TradeFeed"},
  robots: { index: false, follow: false },
  referrer: "no-referrer" as const,
};
export default async function CasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const access = await supportCaseAccess(id);
  if (!access) notFound();
  const messages = await db.supportCaseMessage.findMany({
    where: { caseId: id },
    orderBy: { createdAt: "asc" },
    take: 200,
  });
  const input = "w-full rounded-lg border border-tf-stone-300 bg-tf-raised p-3";
  return (
    <div className="min-h-screen bg-tf-surface text-tf-ink">
      <CommerceHeader compact />
      <main className="mx-auto max-w-2xl px-5 pt-10 pb-28 space-y-5">
        <h1 className="text-3xl font-semibold">Order support</h1>
        <p>
          {access.record.order.orderNumber} · {access.record.order.shop.name}
        </p>
        <p>Status: {access.record.status.replaceAll("_", " ")}</p>
        <p className="text-sm text-tf-stone-600">
          Case {id}. Keep this link. Guest access is available in this browser
          for 30 days; contact support if you lose access.
        </p>
        {messages.map((m) => (
          <article
            key={m.id}
            className="rounded-xl border border-tf-stone-200 bg-tf-raised p-5"
          >
            <p className="text-sm font-semibold">
              {m.actor} · {m.createdAt.toLocaleDateString("en-ZA")}
            </p>
            <p className="mt-2 whitespace-pre-wrap">{m.body}</p>
          </article>
        ))}
        <form action={replySupportCaseAction} className="space-y-3">
          <input type="hidden" name="id" value={id} />
          <label className="block">
            Reply
            <textarea
              name="body"
              required
              minLength={10}
              maxLength={4000}
              rows={4}
              className={input}
            />
          </label>
          {access.actor === "ADMIN" && (
            <label className="block">
              Status
              <select
                name="status"
                defaultValue={access.record.status}
                className={input}
              >
                {["OPEN", "WAITING_BUYER", "WAITING_SELLER", "RESOLVED"].map(
                  (s) => (
                    <option key={s}>{s}</option>
                  ),
                )}
              </select>
            </label>
          )}
          <button className="rounded-lg bg-tf-primary px-5 py-3 text-white">
            Send reply
          </button>
        </form>
      </main>
    </div>
  );
}
