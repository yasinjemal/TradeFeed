// ============================================================
// Page — Shop Settings (/dashboard/[slug]/settings)
// ============================================================
// Mind-blowing smooth settings page with animated completeness
// ring, section navigation, and live catalog preview.
// ============================================================

import { getShopBySlug } from "@/lib/db/shops";
import { requireShopAccess } from "@/lib/auth";
import { notFound } from "next/navigation";
import { ShopSettingsForm } from "@/components/shop/shop-settings-form";
import Link from "next/link";

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

  // Calculate profile completeness
  const checks = [
    { key: "description", label: "Description", icon: "📝", done: !!shop.description },
    { key: "aboutText", label: "About story", icon: "💬", done: !!shop.aboutText },
    { key: "address", label: "Address", icon: "🏠", done: !!shop.address },
    { key: "city", label: "City", icon: "🏙️", done: !!shop.city },
    { key: "map", label: "Map pin", icon: "📍", done: shop.latitude !== null },
    { key: "hours", label: "Business hours", icon: "🕐", done: !!shop.businessHours },
    { key: "social", label: "Social links", icon: "🔗", done: !!shop.instagram || !!shop.facebook || !!shop.tiktok },
  ];
  const completed = checks.filter((c) => c.done).length;
  const total = checks.length;
  const percentage = Math.round((completed / total) * 100);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* ── Hero Header ──────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-stone-900 via-stone-800 to-emerald-900 p-8 sm:p-10">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-400/5 rounded-full blur-2xl" />
        
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Completeness Ring */}
          <div className="relative flex-shrink-0">
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50" cy="50" r="42"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="6"
              />
              <circle
                cx="50" cy="50" r="42"
                fill="none"
                stroke="url(#ring-gradient)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${percentage * 2.64} ${264 - percentage * 2.64}`}
                className="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-white">{percentage}%</span>
            </div>
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Shop Settings
            </h1>
            <p className="text-emerald-200/80 text-sm mt-1.5 max-w-lg">
              {percentage === 100
                ? "Your profile is complete! Buyers can fully trust your shop. 🎉"
                : `Complete your profile to build buyer trust. ${total - completed} section${total - completed === 1 ? "" : "s"} remaining.`}
            </p>

            {/* Missing sections as pills */}
            {percentage < 100 && (
              <div className="flex flex-wrap gap-1.5 mt-4">
                {checks
                  .filter((c) => !c.done)
                  .map((c) => (
                    <span
                      key={c.key}
                      className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-white/10 text-emerald-200 backdrop-blur-sm border border-white/5"
                    >
                      <span>{c.icon}</span> {c.label}
                    </span>
                  ))}
              </div>
            )}
          </div>

          {/* Preview link */}
          <Link
            href={`/catalog/${slug}`}
            target="_blank"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white text-sm font-medium transition-all border border-white/10 hover:border-white/20 group"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="hidden sm:inline">Preview</span>
            <svg className="w-3 h-3 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
            </svg>
          </Link>
        </div>
      </div>

      {/* ── Form ─────────────────────────────────────────── */}
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
