// ============================================================
// Page — Shop Dashboard Overview
// ============================================================
// Landing page for the seller dashboard. Shows shop info + quick actions.
//
// ROUTE: /dashboard/[slug]
// MULTI-TENANT: Layout already verifies shop exists.
// ============================================================

import Link from "next/link";
import { getShopBySlug } from "@/lib/db/shops";
import { countProducts } from "@/lib/db/products";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface DashboardPageProps {
  params: Promise<{ slug: string }>;
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { slug } = await params;
  const shop = await getShopBySlug(slug);

  if (!shop) {
    notFound();
  }

  const productCount = await countProducts(shop.id);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">{shop.name}</h1>
        <p className="text-muted-foreground">Shop dashboard</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{productCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Catalog URL
            </CardTitle>
          </CardHeader>
          <CardContent>
            <code className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded">
              /catalog/{shop.slug}
            </code>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              WhatsApp
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">{shop.whatsappNumber}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href={`/dashboard/${slug}/products/new`}>
              + Add Product
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/dashboard/${slug}/products`}>
              View All Products
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/catalog/${slug}`} target="_blank">
              View Public Catalog ↗
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
