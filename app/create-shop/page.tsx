// ============================================================
// Page — Create Shop
// ============================================================
// Public page for creating a new shop.
// Phase 3: This becomes a protected route (requires auth).
//
// ROUTE: /create-shop
// ============================================================

import { CreateShopForm } from "@/components/shop/create-shop-form";

export const metadata = {
  title: "Create Your Shop — TradeFeed",
  description: "Set up your digital catalog for WhatsApp selling in minutes.",
};

export default function CreateShopPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
      {/* Logo / Branding */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          Trade<span className="text-green-600">Feed</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your digital catalog starts here
        </p>
      </div>

      {/* Shop creation form */}
      <CreateShopForm />
    </main>
  );
}
