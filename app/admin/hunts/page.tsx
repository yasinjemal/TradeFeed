import { AdminHuntQueue } from "@/components/admin/admin-hunt-queue";
import { requireAdmin } from "@/lib/auth/admin";
import {
  getHuntAdminQueue,
  getHuntSellerRoster,
} from "@/lib/db/hunt-operations";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "HUNT Operations | Admin | TradeFeed",
};

export default async function AdminHuntsPage() {
  // The layout already hides the admin area. This second check keeps the
  // sensitive queue protected even if the page is rendered independently.
  await requireAdmin();

  const [hunts, sellers] = await Promise.all([
    getHuntAdminQueue({ limit: 50 }),
    getHuntSellerRoster(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
            Concierge beta
          </p>
          <h1 className="mt-1 text-2xl font-bold text-white">
            TradeFeed HUNT operations
          </h1>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-stone-400">
            Route live requests only to opted-in sellers, publish seller-supplied
            stock offers, hand genuine matches back to buyers, and moderate
            unsafe requests.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl border border-stone-800 bg-stone-900 px-3 py-2">
            <p className="text-lg font-bold text-white">
              {hunts.filter((hunt) => hunt.status === "LIVE").length}
            </p>
            <p className="text-[10px] uppercase tracking-wide text-stone-600">
              Live
            </p>
          </div>
          <div className="rounded-xl border border-stone-800 bg-stone-900 px-3 py-2">
            <p className="text-lg font-bold text-white">
              {hunts.reduce((sum, hunt) => sum + hunt.reports.length, 0)}
            </p>
            <p className="text-[10px] uppercase tracking-wide text-stone-600">
              Reports
            </p>
          </div>
          <div className="rounded-xl border border-stone-800 bg-stone-900 px-3 py-2">
            <p className="text-lg font-bold text-white">
              {
                sellers.filter(
                  (seller) =>
                    seller.huntSellerPreference?.isOptedIn &&
                    !seller.huntSellerPreference.pausedAt,
                ).length
              }
            </p>
            <p className="text-[10px] uppercase tracking-wide text-stone-600">
              Sellers
            </p>
          </div>
        </div>
      </div>

      <AdminHuntQueue
        hunts={hunts}
        sellers={sellers}
      />
    </div>
  );
}
