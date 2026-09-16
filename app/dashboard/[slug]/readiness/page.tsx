import Link from "next/link";
import { notFound } from "next/navigation";
import { requireShopAccess } from "@/lib/auth";
import { db } from "@/lib/db";
import { listingDiscoveryIssues } from "@/lib/marketplace/listing-readiness";
export default async function Readiness({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const access = await requireShopAccess(slug, "catalog:manage");
  if (!access) notFound();
  const shop = await db.shop.findUniqueOrThrow({
    where: { id: access.shopId },
    include: {
      products: {
        take: 200,
        orderBy: { updatedAt: "desc" },
        include: {
          images: { select: { url: true } },
          variants: {
            select: { isActive: true, stock: true, priceInCents: true },
          },
        },
      },
    },
  });
  const checks = [
    {
      done: Boolean(shop.description?.trim()),
      label: "Introduce your business",
      href: "settings",
    },
    {
      done: Boolean(shop.whatsappNumber && shop.city && shop.province),
      label: "Confirm your contact details and location",
      href: "settings",
    },
    {
      done: shop.deliveryEnabled || shop.collectionEnabled,
      label: "Offer delivery or collection",
      href: "settings",
    },
    {
      done: Boolean(shop.returnPolicy?.trim()),
      label: "Explain returns, refunds and how buyers can reach you",
      href: "settings",
    },
  ];
  const products = shop.products.map((p) => ({
    ...p,
    issues: [
      ...listingDiscoveryIssues(p),
      ...(!p.description?.trim()
        ? ["Describe the product and its condition"]
        : []),
      ...(!p.globalCategoryId ? ["Choose a marketplace category"] : []),
    ],
  }));
  const ready = products.filter((p) => p.issues.length === 0).length;
  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-3xl font-semibold">Get your shop ready for buyers</h1>
      <p>
        Complete your shop details, then prepare three clear product listings.
        Your draft text is saved in this browser tab as you work.
      </p>
      <ol className="space-y-3">
        {checks.map((c) => (
          <li
            key={c.label}
            className="flex items-center justify-between gap-4 rounded-xl border p-4"
          >
            <span>
              {c.done ? "✓" : "○"} {c.label}
            </span>
            <Link
              className="font-semibold text-emerald-700"
              href={"/dashboard/" + slug + "/" + c.href}
            >
              {c.done ? "Review" : "Complete"}
            </Link>
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-semibold">
          {ready} complete product{ready === 1 ? "" : "s"}
        </h2>
        <Link
          className="rounded-lg bg-emerald-700 px-4 py-3 text-white"
          href={"/dashboard/" + slug + "/products/new"}
        >
          Add a product
        </Link>
      </div>
      {products.map((p) => (
        <article key={p.id} className="rounded-xl border p-5">
          <h3 className="font-semibold">{p.name}</h3>
              {p.discoveryGraceUntil && p.issues.length > 0 && <p className="mt-2 text-sm">Complete these details by {p.discoveryGraceUntil.toLocaleDateString("en-ZA")} to keep this product in marketplace discovery. Your shop and draft remain accessible.</p>}
          {p.issues.length > 0 ? (
            <ul className="my-3 list-disc pl-5 text-sm">
              {p.issues.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          ) : (
            <p className="my-3 text-emerald-700">Ready for buyers</p>
          )}
          <Link
            className="font-semibold underline"
            href={"/dashboard/" + slug + "/products/" + p.id}
          >
            Review listing →
          </Link>
        </article>
      ))}
      <Link
        className="inline-block rounded-lg border px-5 py-3"
        href={"/catalog/" + slug}
      >
        Preview your shop as a buyer →
      </Link>
    </section>
  );
}
