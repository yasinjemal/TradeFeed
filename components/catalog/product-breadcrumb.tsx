import Link from "next/link";

interface ProductBreadcrumbProps {
  category?: { name: string; slug: string } | null;
  productName: string;
}

export function ProductBreadcrumb({ category, productName }: ProductBreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-5">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-slate-500">
        <li>
          <Link href="/marketplace" className="transition-colors hover:text-emerald-600">
            Marketplace
          </Link>
        </li>
        <li aria-hidden="true">
          <svg className="h-3.5 w-3.5 text-slate-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </li>
        {category ? (
          <>
            <li>
              <Link
                href={`/marketplace?category=${encodeURIComponent(category.slug)}`}
                className="transition-colors hover:text-emerald-600"
              >
                {category.name}
              </Link>
            </li>
            <li aria-hidden="true">
              <svg className="h-3.5 w-3.5 text-slate-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </li>
          </>
        ) : null}
        <li className="truncate font-medium text-slate-900" aria-current="page">
          {productName}
        </li>
      </ol>
    </nav>
  );
}
