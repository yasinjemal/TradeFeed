// ============================================================
// Page — New Stock Drop (/dashboard/[slug]/drops/new)
// ============================================================

import { getShopBySlug } from "@/lib/db/shops";
import { getShopProductsForDrop } from "@/lib/db/drops";
import { requireShopAccess } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { DropForm } from "@/components/drops/drop-form";
import Link from "next/link";

interface NewDropPageProps {
  params: Promise<{ slug: string }>;
}

export default async function NewDropPage({ params }: NewDropPageProps) {
  const { slug } = await params;

  let access: Awaited<ReturnType<typeof requireShopAccess>>;
  try {
    access = await requireShopAccess(slug);
  } catch {
    redirect("/sign-in");
  }
  if (!access) return notFound();

  const shop = await getShopBySlug(slug);
  if (!shop) return notFound();

  const products = await getShopProductsForDrop(shop.id);

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <Link
          href={`/dashboard/${slug}/drops`}
          className="text-sm text-stone-500 hover:text-stone-700 transition-colors mb-2 inline-block"
        >
          ← Back to Drops
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">
          🔥 New Stock Drop
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          Select products, preview your announcement, and share to WhatsApp in
          seconds
        </p>
      </div>

      {/* Form */}
      <DropForm
        shopSlug={slug}
        shopName={shop.name}
        whatsappNumber={shop.whatsappNumber}
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          minPriceCents: p.minPriceCents,
          images: p.images,
        }))}
      />
    </div>
  );
}
