import { getWholesaleBuyers } from "@/lib/db/wholesale";
import { WholesaleBuyerList } from "@/components/admin/wholesale-buyer-list";

export const metadata = {
  title: "Wholesale Buyers | Admin | TradeFeed",
};

export default async function AdminWholesalePage(props: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const searchParams = await props.searchParams;
  const status = searchParams.status as "PENDING" | "VERIFIED" | "REJECTED" | undefined;
  const page = parseInt(searchParams.page || "1", 10);

  const data = await getWholesaleBuyers({ status, page });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Wholesale Buyers</h1>
        <p className="text-sm text-stone-400 mt-1">
          Review and manage wholesale buyer applications.
        </p>
      </div>
      <WholesaleBuyerList data={data} currentStatus={status} currentPage={page} />
    </div>
  );
}
