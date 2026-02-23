// ============================================================
// Page — Product List
// ============================================================
// Shows all products for a shop with quick stats.
// Empty state guides seller to add their first product.
//
// ROUTE: /dashboard/[slug]/products
// MULTI-TENANT: Products fetched by shopId from layout-verified shop.
// ============================================================

import Link from "next/link";
import { getShopBySlug } from "@/lib/db/shops";
import { getProducts } from "@/lib/db/products";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatZAR } from "@/types";

interface ProductsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductsPage({ params }: ProductsPageProps) {
  const { slug } = await params;
  const shop = await getShopBySlug(slug);

  if (!shop) {
    notFound();
  }

  const products = await getProducts(shop.id);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-sm text-muted-foreground">
            {products.length} product{products.length !== 1 ? "s" : ""} in your
            catalog
          </p>
        </div>
        <Button asChild>
          <Link href={`/dashboard/${slug}/products/new`}>+ Add Product</Link>
        </Button>
      </div>

      {/* Empty State */}
      {products.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-4xl mb-4">📦</div>
            <h2 className="text-lg font-semibold">No products yet</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Add your first product to start building your catalog. Buyers will
              see these on your public catalog page.
            </p>
            <Button asChild className="mt-4">
              <Link href={`/dashboard/${slug}/products/new`}>
                Add Your First Product
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Product List */}
      {products.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => {
            // Calculate price range from variants
            const prices = product.variants.map((v) => v.priceInCents);
            const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
            const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
            const totalStock = product.variants.reduce(
              (sum, v) => sum + v.stock,
              0
            );

            return (
              <Link
                key={product.id}
                href={`/dashboard/${slug}/products/${product.id}`}
              >
                <Card className="hover:border-green-300 hover:shadow-sm transition-all cursor-pointer h-full">
                  <CardContent className="p-4 space-y-3">
                    {/* Product Image Placeholder */}
                    {product.images.length > 0 ? (
                      <div className="aspect-square rounded-md bg-gray-100 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={product.images[0]?.url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="aspect-square rounded-md bg-gray-100 flex items-center justify-center">
                        <span className="text-3xl">📷</span>
                      </div>
                    )}

                    {/* Product Info */}
                    <div>
                      <h3 className="font-semibold truncate">{product.name}</h3>
                      {product.category && (
                        <p className="text-xs text-muted-foreground">
                          {product.category.name}
                        </p>
                      )}
                    </div>

                    {/* Price & Stock */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-green-700">
                        {prices.length === 0
                          ? "No variants"
                          : minPrice === maxPrice
                            ? formatZAR(minPrice)
                            : `${formatZAR(minPrice)} – ${formatZAR(maxPrice)}`}
                      </span>
                      <span className="text-muted-foreground">
                        {totalStock} in stock
                      </span>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          product.isActive
                            ? "bg-green-50 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {product.isActive ? "Active" : "Hidden"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {product.variants.length} variant
                        {product.variants.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
