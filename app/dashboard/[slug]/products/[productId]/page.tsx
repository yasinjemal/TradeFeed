// ============================================================
// Page — Product Detail (/dashboard/[slug]/products/[productId])
// ============================================================
// Shows product info, variant table, and add-variant form.
// Redirects from product creation land here.
// ============================================================

import { getProduct } from "@/lib/db/products";
import { getShopBySlug } from "@/lib/db/shops";
import { getDevUserId } from "@/lib/auth/dev";
import { db } from "@/lib/db";
import { formatZAR } from "@/types";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VariantList } from "@/components/product/variant-list";
import { AddVariantForm } from "@/components/product/add-variant-form";
import { DeleteProductButton } from "@/components/product/delete-product-button";

interface ProductDetailPageProps {
  params: Promise<{ slug: string; productId: string }>;
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { slug, productId } = await params;

  // ── Resolve shop ────────────────────────────────────────
  const userId = await getDevUserId();
  if (!userId) return notFound();

  const shop = await getShopBySlug(slug);
  if (!shop) return notFound();

  // Verify membership via ShopUser table
  const membership = await db.shopUser.findUnique({
    where: { userId_shopId: { userId, shopId: shop.id } },
    select: { id: true },
  });
  if (!membership) return notFound();

  // ── Fetch product with variants ─────────────────────────
  const product = await getProduct(productId, shop.id);
  if (!product) return notFound();

  // ── Price range from variants ───────────────────────────
  const prices = product.variants.map((v) => v.priceInCents);
  const minPrice = prices.length > 0 ? Math.min(...prices) : null;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : null;
  const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);

  return (
    <div className="space-y-6">
      {/* ── Header ───────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href={`/dashboard/${slug}/products`}
            className="text-sm text-muted-foreground hover:text-foreground mb-1 inline-block"
          >
            ← Back to Products
          </Link>
          <h1 className="text-2xl font-bold">{product.name}</h1>
          {product.description && (
            <p className="text-muted-foreground mt-1">{product.description}</p>
          )}
        </div>
        <Badge variant={product.isActive ? "default" : "secondary"}>
          {product.isActive ? "Active" : "Draft"}
        </Badge>
      </div>

      {/* ── Stats Cards ──────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Variants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{product.variants.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Price Range
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
              {minPrice !== null && maxPrice !== null
                ? minPrice === maxPrice
                  ? formatZAR(minPrice)
                  : `${formatZAR(minPrice)} – ${formatZAR(maxPrice)}`
                : "—"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                totalStock === 0 ? "text-red-600" : ""
              }`}
            >
              {totalStock}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Variant Table ────────────────────────────────── */}
      <VariantList
        variants={product.variants}
        shopSlug={slug}
        productId={product.id}
      />

      {/* ── Add Variant Form ─────────────────────────────── */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Add Variant</h2>
        <AddVariantForm shopSlug={slug} productId={product.id} />
      </div>

      {/* ── Danger Zone ──────────────────────────────────── */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-base text-red-700">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Deleting this product will also remove all its variants and images.
            This action cannot be undone.
          </p>
          <DeleteProductButton shopSlug={slug} productId={product.id} />
        </CardContent>
      </Card>
    </div>
  );
}
