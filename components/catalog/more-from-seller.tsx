import Image from "next/image";
import Link from "next/link";
import { SHIMMER_LIGHT } from "@/lib/image-placeholder";

interface SellerProduct {
  id: string;
  slug: string | null;
  name: string;
  imageUrl: string | null;
  minPriceCents: number;
}

interface MoreFromSellerProps {
  products: SellerProduct[];
  shopName: string;
  shopSlug: string;
}

const formatZAR = (cents: number) =>
  new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);

export function MoreFromSeller({ products, shopName, shopSlug }: MoreFromSellerProps) {
  if (products.length === 0) return null;

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">More from {shopName}</h2>
          <p className="mt-1 text-sm text-slate-500">Other products from this seller</p>
        </div>
        <Link
          href={`/catalog/${shopSlug}`}
          className="text-sm font-medium text-emerald-600 transition-colors hover:text-emerald-500"
        >
          View all
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/catalog/${shopSlug}/products/${product.slug ?? product.id}`}
            className="group"
          >
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/60 transition-all hover:border-emerald-200 hover:shadow-md">
              <div className="relative aspect-square bg-slate-100">
                {product.imageUrl ? (
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    placeholder="blur"
                    blurDataURL={SHIMMER_LIGHT}
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-300">
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.4} stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="text-sm font-bold text-slate-900">{formatZAR(product.minPriceCents)}</p>
                <p className="mt-1 line-clamp-2 text-xs font-medium text-slate-700">{product.name}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
