import Image from "next/image";
import Link from "next/link";
import { TrustBadge } from "@/components/ui/trust-badge";

interface SellerInfoCardProps {
  shop: {
    name: string;
    slug: string;
    logoUrl: string | null;
    isVerified: boolean;
    city: string | null;
    province: string | null;
    createdAt: Date;
    avgRating: number;
    _count: {
      products: number;
      orders: number;
      reviews: number;
    };
    subscription?: {
      status: string;
      plan: { slug: string; name: string };
    } | null;
  };
}

export function SellerInfoCard({ shop }: SellerInfoCardProps) {
  const location = [shop.city, shop.province].filter(Boolean).join(", ") || "South Africa";
  const memberSince = shop.createdAt.toLocaleDateString("en-ZA", { month: "long", year: "numeric" });
  const isPro = shop.subscription?.status === "ACTIVE" && shop.subscription.plan.slug !== "free";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
      <div className="flex items-start gap-3.5">
        {shop.logoUrl ? (
          <Image
            src={shop.logoUrl}
            alt={shop.name}
            width={48}
            height={48}
            className="h-12 w-12 rounded-xl border border-slate-200 object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-lg font-bold text-slate-600">
            {shop.name.charAt(0)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-semibold text-slate-900">{shop.name}</h3>
            {isPro ? (
              <span className="inline-flex items-center rounded-full bg-gradient-to-r from-purple-100 to-violet-100 border border-purple-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-700">
                Pro
              </span>
            ) : null}
          </div>
          <div className="mt-1 flex flex-wrap gap-2">
            {shop.isVerified ? <TrustBadge variant="verified" small /> : null}
            <TrustBadge variant="response-time" small label="Quick responder" />
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
        <div className="text-center">
          <p className="text-lg font-bold text-slate-900">{shop.avgRating > 0 ? shop.avgRating.toFixed(1) : "—"}</p>
          <p className="text-[11px] text-slate-500">Rating</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-slate-900">{shop._count.products}</p>
          <p className="text-[11px] text-slate-500">Products</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-slate-900">{shop._count.orders}</p>
          <p className="text-[11px] text-slate-500">Completed</p>
        </div>
      </div>

      <div className="mt-4 space-y-2.5">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
          <span>{location}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
          <span>Selling since {memberSince}</span>
        </div>
        {shop._count.reviews > 0 ? (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <svg className="h-4 w-4 shrink-0 text-amber-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.176 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81H7.03a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span>{shop._count.reviews} verified {shop._count.reviews === 1 ? "review" : "reviews"}</span>
          </div>
        ) : null}
      </div>

      <Link
        href={`/catalog/${shop.slug}`}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50"
      >
        View shop
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      </Link>
    </div>
  );
}
