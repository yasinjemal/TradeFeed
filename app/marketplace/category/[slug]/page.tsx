import { allowDiscoveryPromotions } from "@/lib/marketplace/promoted-context";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getMarketplaceProducts,
  getPromotedProducts,
  getGlobalCategories,
  getTrendingProducts,
  getNewArrivals,
  interleavePromotedProducts,
  type CategoryWithCount,
} from "@/lib/db/marketplace";
import { MarketplaceShellSwitch } from "@/components/marketplace/marketplace-shell-switch";
import { generateMarketplaceJsonLd, generateCategoryPageJsonLd } from "@/lib/seo/json-ld";
import { categoryIndexable, robotsFor } from "@/lib/seo/should-index";
import { expirePromotedListings } from "@/lib/db/promotions";

// ============================================================
// /marketplace/category/[slug] — Category SEO Landing Page
// ============================================================
// Clean path-based category pages (vs old ?category=slug query params).
// Targets "clothing suppliers South Africa", "buy hoodies online SA".
// ============================================================

export const revalidate = 300;

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    search?: string;
    sort?: string;
    province?: string;
    minPrice?: string;
    maxPrice?: string;
    verified?: string;
    page?: string;
  }>;
}

// Static generation removed — ISR via revalidate = 300 handles caching.
// Categories are generated on first request and cached for 5 minutes.

/** Recursively find a category by slug in the tree */
function findCategory(
  categories: CategoryWithCount[],
  slug: string,
): CategoryWithCount | undefined {
  for (const cat of categories) {
    if (cat.slug === slug) return cat;
    if (cat.children) {
      const found = findCategory(cat.children, slug);
      if (found) return found;
    }
  }
  return undefined;
}

// ── SEO Metadata ────────────────────────────────────────────
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const categories = await getGlobalCategories();
  const category = findCategory(categories, slug);
  if (!category) return { title: "Not Found" };

  const title = `${category.name} Suppliers South Africa — Wholesale & Retail | TradeFeed`;
  const description = category.description
    ? `${category.description} Browse ${category.name.toLowerCase()} from South African sellers. Wholesale & retail prices. Order via WhatsApp.`
    : `Shop ${category.name.toLowerCase()} from South Africa's top sellers on TradeFeed. Wholesale & retail prices. Compare products from Johannesburg, Durban, Cape Town & more. Order via WhatsApp.`;

  return {
    title,
    description,
    keywords: [
      category.name.toLowerCase(),
      `${category.name.toLowerCase()} suppliers South Africa`,
      `${category.name.toLowerCase()} wholesale`,
      `buy ${category.name.toLowerCase()} South Africa`,
      `buy ${category.name.toLowerCase()} online`,
      `cheap ${category.name.toLowerCase()} South Africa`,
      `${category.name.toLowerCase()} Johannesburg`,
      `${category.name.toLowerCase()} wholesale South Africa`,
      "wholesale South Africa",
      "TradeFeed",
    ],
    ...robotsFor(categoryIndexable(category)),
    alternates: { canonical: `${APP_URL}/marketplace/category/${slug}` },
    openGraph: {
      title,
      description,
      url: `${APP_URL}/marketplace/category/${slug}`,
      siteName: "TradeFeed",
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

// ── Page Component ──────────────────────────────────────────
export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;

  const allCategories = await getGlobalCategories();
  const category = findCategory(allCategories, slug);
  if (!category) return notFound();

  // Determine if this is a parent category — if so, include children
  const isParent = category.children && category.children.length > 0;

  const filters = {
    ...(isParent ? { parentCategory: slug } : { category: slug }),
    search: sp.search,
    sortBy:
      (sp.sort as
        | "newest"
        | "trending"
        | "price_asc"
        | "price_desc"
        | "popular"
        | "top_rated"
        | "quality") || "quality",
    province: sp.province,
    minPrice: sp.minPrice ? parseInt(sp.minPrice, 10) : undefined,
    maxPrice: sp.maxPrice ? parseInt(sp.maxPrice, 10) : undefined,
    verifiedOnly: sp.verified === "true",
    page: sp.page ? parseInt(sp.page, 10) : 1,
    pageSize: 24,
  };

  await expirePromotedListings();

  const [productsResult, promoted, categories, trending, newArrivals] =
    await Promise.all([
      getMarketplaceProducts(filters),
      allowDiscoveryPromotions(filters) ? getPromotedProducts(12) : Promise.resolve([]),
      Promise.resolve(allCategories),
      getTrendingProducts(12),
      getNewArrivals(8),
    ]);

  const interleavedProducts = interleavePromotedProducts(
    productsResult.products,
    promoted,
  );

  const jsonLd = generateMarketplaceJsonLd(
    interleavedProducts.slice(0, 20).map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      shopSlug: p.shop.slug,
      image: p.imageUrl,
      priceInCents: p.minPriceCents,
    })),
    category.name,
  );

  // Find parent for breadcrumb (if this is a child category)
  const parentCategory = category.parentId
    ? allCategories.find((c) => c.id === category.parentId)
    : undefined;

  const categoryJsonLd = generateCategoryPageJsonLd({
    categoryName: category.name,
    categorySlug: slug,
    parentCategoryName: parentCategory?.name,
    parentCategorySlug: parentCategory?.slug,
    productCount: productsResult.total,
  });

  return (
    <>
      {[...jsonLd, ...categoryJsonLd].map((ld, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
        />
      ))}

      <MarketplaceShellSwitch
        introduction={<>
      {/* Category hero */}
      <div className="bg-tf-surface border-b border-tf-stone-200">
        <div className="max-w-6xl mx-auto px-4 py-4 sm:px-6">
          <nav className="flex items-center gap-1.5 text-xs text-stone-500 mb-2">
            <Link href="/marketplace" className="hover:text-emerald-400 transition-colors">
              Marketplace
            </Link>
            <span>/</span>
            {parentCategory && (
              <>
                <Link
                  href={`/marketplace/category/${parentCategory.slug}`}
                  className="hover:text-emerald-400 transition-colors"
                >
                  {parentCategory.name}
                </Link>
                <span>/</span>
              </>
            )}
            <span className="text-tf-stone-600">{category.name}</span>
          </nav>

          <div className="flex items-center gap-4">
            {category.icon && (
              <span className="text-4xl">{category.icon}</span>
            )}
            <div>
              <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-tf-ink">
                {category.name}
              </h1>
              <p className="mt-2 text-stone-500 text-sm">
                {category.productCount} product{category.productCount !== 1 ? "s" : ""} from South African sellers
              </p>
            </div>
          </div>

          <p className="hidden sm:block mt-2 text-tf-stone-600 text-sm max-w-2xl leading-relaxed">
            {category.description ||
              `Browse ${category.name.toLowerCase()} from South Africa's top sellers. Wholesale & retail prices. Order via WhatsApp.`}
          </p>

          {/* Sub-category pills for parent categories */}
          {isParent && category.children && (
            <details className="mt-3"><summary className="cursor-pointer py-2 text-sm font-medium text-tf-primary">Browse subcategories</summary><div className="mt-2 flex flex-wrap gap-2">
              {category.children.filter(child => child.productCount > 0).map((child) => (
                <Link
                  key={child.slug}
                  href={`/marketplace/category/${child.slug}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium bg-tf-raised border border-tf-stone-200 text-tf-stone-600 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-400 transition-all"
                >
                  {child.icon && <span>{child.icon}</span>}
                  {child.name}
                  <span className="text-stone-500 text-xs">
                    ({child.productCount})
                  </span>
                </Link>
              ))}
            </div></details>
          )}
        </div>
      </div>

        </>}
        products={interleavedProducts}
        totalProducts={productsResult.total}
        totalPages={productsResult.totalPages}
        currentPage={productsResult.page}
        categories={categories}
        trendingProducts={trending}
        newArrivals={newArrivals}
        featuredShops={[]}
        promotedProducts={promoted}
        currentFilters={filters}
      />
    </>
  );
}
