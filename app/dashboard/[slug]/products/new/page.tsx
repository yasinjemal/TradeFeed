// ============================================================
// Page — Add product (one screen)
// ============================================================
// The single create path: photo → AI listing → price → publish.
// The old ?wizard=true and ?quick=true screens are gone; their
// URLs redirect here so saved links and bookmarks keep working.
// ?ai=true is still accepted (emails and WhatsApp nudges use it)
// and needs no special handling: this screen is photo-first.
// ============================================================

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { UpgradeGate } from "@/components/billing/upgrade-gate";
import { TfAddProduct } from "@/components/tf/dashboard/add-product/tf-add-product";
import { requireShopAccess } from "@/lib/auth";
import { SITE_URL } from "@/lib/config/site";
import { checkAiAccess } from "@/lib/db/ai";
import { getCategories } from "@/lib/db/categories";
import { getGlobalCategoryTree } from "@/lib/db/global-categories";
import { getShopBySlug } from "@/lib/db/shops";
import { shopMeetsMarketplaceStandard } from "@/lib/marketplace/shop-eligibility";
import { checkProductLimit } from "@/lib/db/subscriptions";

interface NewProductPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ ai?: string; wizard?: string; quick?: string }>;
}

function BackToProducts({ slug }: { slug: string }) {
  return (
    <Link
      href={`/dashboard/${slug}/products`}
      className="-ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-[10px] px-2 text-sm font-medium text-tf-stone-600 outline-none hover:text-tf-ink focus-visible:ring-2 focus-visible:ring-tf-primary"
    >
      <ArrowLeft aria-hidden="true" className="size-4" />
      Products
    </Link>
  );
}

export default async function NewProductPage({ params, searchParams }: NewProductPageProps) {
  const { slug } = await params;
  const { wizard, quick } = await searchParams;

  // Retired entry points — same destination, one screen.
  if (wizard !== undefined || quick !== undefined) {
    redirect(`/dashboard/${slug}/products/new`);
  }

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

  const [categories, globalCategories, productLimit, aiAccess, shopMarketplaceReady] = await Promise.all([
    getCategories(shop.id),
    getGlobalCategoryTree(),
    checkProductLimit(shop.id),
    checkAiAccess(shop.id),
    // A failed check must never block adding a product; it only hides a note.
    shopMeetsMarketplaceStandard(shop.id).catch(() => true),
  ]);

  // Hard gate: block product creation if limit reached
  if (!productLimit.unlimited && !productLimit.allowed) {
    return (
      <div className="space-y-4">
        <BackToProducts slug={slug} />
        <UpgradeGate
          current={productLimit.current}
          limit={productLimit.limit}
          shopSlug={slug}
          mode="hard"
        />
      </div>
    );
  }

  // Soft gate threshold: 80% of limit
  const showSoftGate = !productLimit.unlimited && productLimit.current >= Math.floor(productLimit.limit * 0.8);

  return (
    <div className="space-y-4">
      <BackToProducts slug={slug} />

      {showSoftGate && (
        <UpgradeGate
          current={productLimit.current}
          limit={productLimit.limit}
          shopSlug={slug}
          mode="soft"
        />
      )}

      <TfAddProduct
        shopSlug={slug}
        shopName={shop.name}
        catalogUrl={`${SITE_URL}/catalog/${slug}`}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        globalCategories={globalCategories}
        ai={{
          unlimited: aiAccess.hasUnlimitedAi,
          creditsRemaining: aiAccess.hasUnlimitedAi ? 0 : aiAccess.creditsRemaining,
        }}
        shopMarketplaceReady={shopMarketplaceReady}
      />
    </div>
  );
}
