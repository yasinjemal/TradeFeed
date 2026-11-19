// ============================================================
// /create-shop — retired. Redirects to /get-started.
// ============================================================
// There is one onboarding flow: /get-started, which ends with a
// live product instead of an empty dashboard. This route stays so
// old links, bookmarks and shared messages keep working.
//
// /get-started handles every visitor state itself (guest → sign-up,
// existing seller → their dashboard), so nothing is checked here.
// ============================================================

import { permanentRedirect } from "next/navigation";

import { SELLER_ONBOARDING_PATH } from "@/lib/config/seller-cta";

export default function CreateShopPage() {
  permanentRedirect(SELLER_ONBOARDING_PATH);
}
