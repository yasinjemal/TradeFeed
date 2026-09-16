import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";
import { db } from "@/lib/db";
export default async function SupportQueue() {
  await requireAdmin();
  const [cases, payments] = await Promise.all([
    db.supportCase.findMany({
      where: { status: { not: "RESOLVED" } },
      orderBy: { updatedAt: "asc" },
      take: 100,
      include: {
        order: {
          select: { orderNumber: true, shop: { select: { name: true } } },
        },
      },
    }),
    db.order.findMany({
      where: { paymentReviewRequired: true },
      select: { id: true, orderNumber: true, shop: { select: { slug: true } } },
      take: 100,
    }),
  ]);
  return (
    <section className="space-y-5 text-stone-100">
      <h1 className="text-2xl font-semibold">Support operations</h1>
      <h2 className="font-semibold">
        Payments requiring reconciliation ({payments.length})
      </h2>
      {payments.map((o) => (
        <p key={o.id}>
          {o.orderNumber} · {o.shop.slug} — verify the provider payment and
          refund or arrange fulfilment before clearing the hold.
        </p>
      ))}
      <h2 className="font-semibold">Open cases ({cases.length})</h2>
      {cases.length === 0 && <p>No open cases.</p>}
      {cases.map((c) => (
        <Link
          className="block rounded-xl border border-stone-700 p-5 hover:bg-stone-900"
          key={c.id}
          href={"/support/cases/" + c.id}
        >
          {c.order.orderNumber} · {c.order.shop.name}
          <span className="block text-sm text-stone-300">
            {c.category} · {c.status} · Updated{" "}
            {c.updatedAt.toLocaleDateString("en-ZA")}
          </span>
        </Link>
      ))}
    </section>
  );
}
