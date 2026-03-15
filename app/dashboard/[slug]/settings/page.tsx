// ============================================================
// Page — Shop Settings (/dashboard/[slug]/settings)
// ============================================================
// Mind-blowing smooth settings page with animated completeness
// ring, section navigation, and live catalog preview.
// ============================================================

import { getShopBySlug } from "@/lib/db/shops";
import { getShopGallery } from "@/lib/db/gallery";
import { getSellerPreferences } from "@/lib/db/seller-preferences";
import { requireShopAccess } from "@/lib/auth";
import { notFound } from "next/navigation";
import { ShopSettingsForm } from "@/components/shop/shop-settings-form";
import { ShopGalleryUpload } from "@/components/shop/shop-gallery-upload";
import { SellerPreferencesForm } from "@/components/shop/seller-preferences-form";
import { DeleteShopButton } from "@/components/shop/delete-shop-button";
import { SettingsSidebar } from "@/components/shop/settings-sidebar";
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

  const galleryItems = await getShopGallery(shop.id);
  const sellerPrefs = await getSellerPreferences(shop.id);

  // Calculate profile completeness
  const checks = [
    { key: "logo", label: "Profile picture", icon: "📸", done: !!shop.logoUrl },
    { key: "banner", label: "Banner image", icon: "🖼️", done: !!shop.bannerUrl },
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
    <div className="max-w-5xl mx-auto">
      {/* ── Hero Header ──────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-stone-950 via-stone-900 to-emerald-950 p-8 sm:p-10">
        {/* Animated decorative orbs */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-emerald-500/15 rounded-full blur-[100px]" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-teal-400/10 rounded-full blur-[80px]" />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-emerald-600/5 rounded-full blur-[60px]" />
        {/* Subtle dot grid overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-8">
          {/* Completeness Ring */}
          <div className="relative flex-shrink-0">
            <svg className="w-28 h-28 -rotate-90 drop-shadow-2xl" viewBox="0 0 100 100">
              <circle
                cx="50" cy="50" r="42"
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="5"
              />
              <circle
                cx="50" cy="50" r="42"
                fill="none"
                stroke="url(#ring-gradient)"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={`${percentage * 2.64} ${264 - percentage * 2.64}`}
                className="transition-all duration-[1.5s] ease-out"
              />
              <defs>
                <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="50%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-white tracking-tight">{percentage}%</span>
              <span className="text-[9px] text-emerald-300/50 font-semibold uppercase tracking-[0.15em] mt-0.5">Complete</span>
            </div>
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Shop Settings
            </h1>
            <p className="text-emerald-200/60 text-sm mt-2 max-w-lg leading-relaxed">
              {percentage === 100
                ? "Your profile is complete! Buyers can fully trust your shop. 🎉"
                : `Complete your profile to build buyer trust. ${total - completed} section${total - completed === 1 ? "" : "s"} remaining.`}
            </p>

            {/* Missing sections as pills */}
            {percentage < 100 && (
              <div className="flex flex-wrap gap-2 mt-5">
                {checks
                  .filter((c) => !c.done)
                  .map((c) => (
                    <span
                      key={c.key}
                      className="inline-flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-full bg-white/[0.07] text-emerald-200/80 backdrop-blur-sm border border-white/[0.06] hover:bg-white/[0.12] transition-colors cursor-default"
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
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] backdrop-blur-sm text-white text-sm font-medium transition-all duration-300 border border-white/[0.08] hover:border-white/[0.15] group"
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

      {/* ── Content Grid ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-8 items-start mt-8">
        <SettingsSidebar className="hidden lg:block sticky top-24" />
        <div className="space-y-6 min-w-0">
          {/* ── Form ───────────────────────────────────── */}
          <ShopSettingsForm
            shopSlug={slug}
            initialData={{
              name: shop.name,
              description: shop.description,
              whatsappNumber: shop.whatsappNumber,
              retailWhatsappNumber: shop.retailWhatsappNumber,
              aboutText: shop.aboutText,
              logoUrl: shop.logoUrl,
              bannerUrl: shop.bannerUrl,
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
              whatsappGroupLink: shop.whatsappGroupLink,
            }}
          />

          {/* ── AI Preferences ─────────────────────────── */}
          <SellerPreferencesForm
            shopSlug={slug}
            initialData={sellerPrefs ? {
              brandTone: sellerPrefs.brandTone,
              brandDescription: sellerPrefs.brandDescription,
              defaultCategory: sellerPrefs.defaultCategory,
              preferredTags: sellerPrefs.preferredTags,
              priceRange: sellerPrefs.priceRange,
              targetAudience: sellerPrefs.targetAudience,
              languagePreference: sellerPrefs.languagePreference,
              aiToneNotes: sellerPrefs.aiToneNotes,
              autoReplyEnabled: sellerPrefs.autoReplyEnabled,
            } : null}
          />

          {/* ── Gallery ────────────────────────────────── */}
          <div id="section-gallery" className="scroll-mt-28 relative rounded-2xl border border-stone-200/60 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all duration-500 overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-pink-200 rounded-l-2xl" />
            <div className="pl-2">
              <ShopGalleryUpload
                shopSlug={slug}
                initialItems={galleryItems.map((item) => ({
                  id: item.id,
                  url: item.url,
                  key: item.key,
                  type: item.type,
                  caption: item.caption,
                  position: item.position,
                }))}
              />
            </div>
          </div>

          {/* ── Danger Zone ────────────────────────────── */}
          <div className="relative rounded-2xl border border-red-200/40 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-red-400 rounded-l-2xl" />
            <div className="pl-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-red-500">🗑️</span>
                <h2 className="text-sm font-bold text-red-700">Danger Zone</h2>
              </div>
              <p className="text-xs text-stone-500 mb-4">
                Permanently delete this shop and all its products, orders, and data. This action cannot be undone.
              </p>
              <DeleteShopButton shopSlug={slug} shopName={shop.name} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
