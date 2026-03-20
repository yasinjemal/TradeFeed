import Image from "next/image";
import Link from "next/link";
import { SHIMMER_LIGHT } from "@/lib/image-placeholder";

interface SimilarProduct {
  id: string;
  slug: string | null;
  name: string;
  imageUrl: string | null;
  minPriceCents: number;
  shopName: string;
  shopSlug: string;
  isVerified: boolean;
}

interface SimilarProductsProps {
  products: SimilarProduct[];
  categoryName?: string;
}

const formatZAR = (cents: number) =>
  new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);

export function SimilarProducts({ products, categoryName }: SimilarProductsProps) {
  if (products.length === 0) return null;

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Similar products</h2>
          {categoryName ? (
            <p className="mt-1 text-sm text-slate-500">More in {categoryName} from other sellers</p>
          ) : null}
        </div>
        {categoryName ? (
          <Link
            href={`/marketplace?category=${encodeURIComponent(categoryName.toLowerCase().replace(/\s+/g, "-"))}`}
            className="text-sm font-medium text-emerald-600 transition-colors hover:text-emerald-500"
          >
            View all
          </Link>
        ) : null}
      </div>
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide sm:-mx-0 sm:px-0">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/catalog/${product.shopSlug}/products/${product.slug ?? product.id}`}
            className="group w-44 shrink-0 sm:w-48"
          >
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/60 transition-all hover:border-emerald-200 hover:shadow-md">
              <div className="relative aspect-square bg-slate-100">
                {product.imageUrl ? (
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    sizes="192px"
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
                {product.isVerified ? (
                  <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 backdrop-blur">
                    <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M16.403 12.652a3 3 0 010-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-2.546-4.46a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                    </svg>
                    Verified
                  </span>
                ) : null}
              </div>
              <div className="p-3">
                <p className="text-sm font-bold text-slate-900">{formatZAR(product.minPriceCents)}</p>
                <p className="mt-1 line-clamp-2 text-xs font-medium text-slate-700">{product.name}</p>
                <p className="mt-1.5 truncate text-[11px] text-slate-500">{product.shopName}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
