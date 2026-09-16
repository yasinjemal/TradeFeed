import { CaseForm } from "@/components/support/case-form";
import { CommerceHeader } from "@/components/commerce/header";
export const metadata = {
  title: {absolute:"Order help | TradeFeed"},
  robots: { index: false, follow: false },
};
export default async function OrderHelp({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order } = await searchParams;
  return (
    <div className="min-h-screen bg-tf-surface text-tf-ink">
      <CommerceHeader compact />
      <main className="mx-auto max-w-xl px-5 pt-10 pb-28">
        <h1 className="text-3xl font-semibold">Help with your order</h1>
        <p className="my-5 text-tf-stone-600">
          Keep your order, seller response and support updates together.
        </p>
        <CaseForm orderNumber={order} />
      </main>
    </div>
  );
}
