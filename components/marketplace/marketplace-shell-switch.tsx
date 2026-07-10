import { FEATURE_FLAGS } from "@/lib/config/feature-flags";
import type { CategoryWithCount, FeaturedShop, MarketplaceProduct, MarketplaceSortBy } from "@/lib/db/marketplace";
import { MarketplaceShell } from "./marketplace-shell";
import { TfMarketplaceShell } from "@/components/tf/marketplace/tf-marketplace-shell";

// ============================================================
// MarketplaceShellSwitch — one gate for every marketplace SEO
// subroute (category / province / city / city+category). Keeps
// the legacy and TF shells in lock-step so a flag flip restyles
// all marketplace surfaces at once, not just /marketplace.
// Legacy branch is deleted with the rest of the old system.
// ============================================================

export interface MarketplaceShellSwitchProps {
  products: MarketplaceProduct[];
  totalProducts: number;
  totalPages: number;
  currentPage: number;
  categories: CategoryWithCount[];
  trendingProducts: MarketplaceProduct[];
  newArrivals: MarketplaceProduct[];
  featuredShops: FeaturedShop[];
  promotedProducts: MarketplaceProduct[];
  currentFilters: {
    category?: string;
    search?: string;
    sortBy: MarketplaceSortBy;
    province?: string;
    minPrice?: number;
    maxPrice?: number;
    verifiedOnly: boolean;
    page: number;
    pageSize: number;
  };
}

export function MarketplaceShellSwitch(props: MarketplaceShellSwitchProps) {
  if (FEATURE_FLAGS.UI_REDESIGN) {
    return (
      <TfMarketplaceShell
        products={props.products}
        totalProducts={props.totalProducts}
        totalPages={props.totalPages}
        currentPage={props.currentPage}
        categories={props.categories}
        featuredShops={props.featuredShops}
        promotedProducts={props.promotedProducts}
        currentFilters={props.currentFilters}
      />
    );
  }
  return <MarketplaceShell {...props} />;
}
