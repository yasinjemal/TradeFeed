// ============================================================
// Vanity short URL — /s/[slug] → /catalog/[slug]
// ============================================================
// Sellers can share tradefeed.co.za/s/my-shop for a shorter link.
// Redirects to the full catalog URL.
// ============================================================

import { redirect } from "next/navigation";

interface VanityPageProps {
  params: Promise<{ slug: string }>;
}

export default async function VanityRedirectPage({ params }: VanityPageProps) {
  const { slug } = await params;
  if (!slug || slug.trim() === "") {
    redirect("/");
  }
  redirect(`/catalog/${encodeURIComponent(slug.trim())}`);
}
