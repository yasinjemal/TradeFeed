// ============================================================
// Page — Shop Settings (/dashboard/[slug]/settings)
// ============================================================

import { getShopBySlug } from "@/lib/db/shops";
import { requireShopAccess } from "@/lib/auth";
import { notFound } from "next/navigation";
import { ShopSettingsForm } from "@/components/shop/shop-settings-form";

interface SettingsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { slug } = await params;

  let access: Awaited<ReturnType<typeof requireShopAccess>>;
  try {
    access = await requireShopAccess(slug);
  } catch {
    return notFound();
  }
  if (!access) return notFound();

  const shop = await getShopBySlug(slug);
  if (!shop) return notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Shop Settings</h1>
        <p className="text-sm text-stone-500 mt-1">
          Complete your profile to build buyer trust and get discovered
        </p>
      </div>

      {/* Profile completeness hint */}
      <ProfileCompleteness shop={shop} />

      <ShopSettingsForm
        shopSlug={slug}
        initialData={{
          name: shop.name,
          description: shop.description,
          aboutText: shop.aboutText,
          address: shop.address,
          city: shop.city,
          province: shop.province,
          latitude: shop.latitude,
          longitude: shop.longitude,
          businessHours: shop.businessHours,
          instagram: shop.instagram,
          facebook: shop.facebook,
          tiktok: shop.tiktok,
          website: shop.website,
        }}
      />
    </div>
  );
}

/* ── Profile Completeness Indicator ──────────────────────── */
function ProfileCompleteness({
  shop,
}: {
  shop: {
    description: string | null;
    aboutText: string | null;
    address: string | null;
    city: string | null;
    latitude: number | null;
    businessHours: string | null;
    instagram: string | null;
    facebook: string | null;
  };
}) {
  const checks = [
    { label: "Description", done: !!shop.description },
    { label: "About text", done: !!shop.aboutText },
    { label: "Address", done: !!shop.address },
    { label: "City", done: !!shop.city },
    { label: "Map pin", done: shop.latitude !== null },
    { label: "Business hours", done: !!shop.businessHours },
    { label: "Social links", done: !!shop.instagram || !!shop.facebook },
  ];

  const completed = checks.filter((c) => c.done).length;
  const total = checks.length;
  const percentage = Math.round((completed / total) * 100);

  if (percentage === 100) return null;

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-amber-800">
          Profile {percentage}% complete
        </p>
        <span className="text-xs text-amber-600">
          {completed}/{total} sections
        </span>
      </div>
      <div className="h-2 rounded-full bg-amber-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-500 transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {checks
          .filter((c) => !c.done)
          .map((c) => (
            <span
              key={c.label}
              className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700"
            >
              + {c.label}
            </span>
          ))}
      </div>
    </div>
  );
}
