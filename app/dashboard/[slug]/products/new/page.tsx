// ============================================================
// Page — Create New Product (v2)
// ============================================================

import { CreateProductForm } from "@/components/product/create-product-form";
import { ProductWizard } from "@/components/product/product-wizard";
import { QuickSellForm } from "@/components/product/quick-sell-form";
import { getCategories } from "@/lib/db/categories";
import { getGlobalCategoryTree } from "@/lib/db/global-categories";
import { getShopBySlug } from "@/lib/db/shops";
import { getShopSubscription } from "@/lib/db/subscriptions";
import { requireShopAccess } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";

interface NewProductPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ ai?: string; wizard?: string; quick?: string }>;
}

export default async function NewProductPage({ params, searchParams }: NewProductPageProps) {
  const { slug } = await params;
  const { ai, wizard, quick } = await searchParams;
  const autoOpenAi = ai === "true";
  const useWizard = wizard === "true";
  const useQuickSell = quick === "true";

  // Auth
  let access: Awaited<ReturnType<typeof requireShopAccess>>;
  try {
    access = await requireShopAccess(slug);
  } catch {
    redirect("/sign-in");
  }
  if (!access) return notFound();

  const shop = await getShopBySlug(slug);
  if (!shop) return notFound();

  const [categories, globalCategories, subscription] = await Promise.all([
    getCategories(shop.id),
    getGlobalCategoryTree(),
    getShopSubscription(shop.id),
  ]);

  const planSlug = subscription?.plan.slug ?? "free";

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href={`/dashboard/${slug}/products`}
        className="text-sm text-stone-500 hover:text-stone-800 transition-colors inline-flex items-center gap-1 group"
      >
        <span className="group-hover:-translate-x-0.5 transition-transform">
          ←
        </span>{" "}
        Products
      </Link>

      {useQuickSell ? (
        <QuickSellForm shopSlug={slug} />
      ) : useWizard ? (
        <ProductWizard
          shopSlug={slug}
          categories={categories.map((c) => ({ id: c.id, name: c.name }))}
          globalCategories={globalCategories}
        />
      ) : (
        <CreateProductForm
          shopSlug={slug}
          categories={categories.map((c) => ({ id: c.id, name: c.name }))}
          globalCategories={globalCategories}
          planSlug={planSlug}
          autoOpenAi={autoOpenAi}
        />
      )}
    </div>
  );
}
