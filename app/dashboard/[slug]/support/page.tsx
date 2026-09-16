import Link from "next/link";
import { notFound } from "next/navigation";
import { requireShopAccess } from "@/lib/auth";
import { db } from "@/lib/db";
export default async function SellerSupport({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const access = await requireShopAccess(slug, "orders:update");
  if (!access) notFound();
  const cases = await db.supportCase.findMany({
    where: { order: { shopId: access.shopId } },
    include: { order: { select: { orderNumber: true } } },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });
  return (
    <section className="space-y-5">
      <h1 className="text-2xl font-semibold">Order support</h1>
      <p>
        Reply to buyer requests here. TradeFeed support can review and resolve
        cases.
      </p>
      {cases.length === 0 && <p>No support cases yet.</p>}
      {cases.map((c) => (
        <Link
          key={c.id}
          href={"/support/cases/" + c.id}
          className="block rounded-xl border p-5"
        >
          {c.order.orderNumber} · {c.category} · {c.status}
        </Link>
      ))}
    </section>
  );
}
