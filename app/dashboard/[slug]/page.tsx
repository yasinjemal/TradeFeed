// ============================================================
// Page — Shop Dashboard (Placeholder)
// ============================================================
// After shop creation, users land here.
// This will become the full seller dashboard in later steps.
//
// ROUTE: /dashboard/[slug]
// MULTI-TENANT: slug identifies the shop. Access checked in Phase 3.
// ============================================================

import { getShopBySlug } from "@/lib/db/shops";
import { notFound } from "next/navigation";

interface DashboardPageProps {
  params: Promise<{ slug: string }>;
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { slug } = await params;
  const shop = await getShopBySlug(slug);

  if (!shop) {
    notFound();
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="max-w-md text-center space-y-4">
        {/* Success state */}
        <div className="text-5xl">🎉</div>

        <h1 className="text-2xl font-bold">{shop.name}</h1>

        <p className="text-muted-foreground">
          Your shop is live! Your public catalog will be at:
        </p>

        <div className="rounded-lg bg-green-50 border border-green-200 p-3">
          <code className="text-sm text-green-800 font-mono">
            tradefeed.co.za/catalog/{shop.slug}
          </code>
        </div>

        <div className="pt-4 space-y-2 text-sm text-muted-foreground">
          <p>
            📱 WhatsApp:{" "}
            <span className="font-medium text-foreground">
              {shop.whatsappNumber}
            </span>
          </p>
          {shop.description && (
            <p>
              📝{" "}
              <span className="text-foreground">{shop.description}</span>
            </p>
          )}
        </div>

        <div className="pt-6 text-xs text-muted-foreground">
          <p>🚧 Dashboard coming next — product upload is the next step.</p>
        </div>
      </div>
    </main>
  );
}
