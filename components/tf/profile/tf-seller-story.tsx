import * as React from "react";
import { Facebook, Globe, Instagram, MapPin, Music2, Users } from "lucide-react";

import { TfReveal } from "@/components/tf/motion/tf-reveal";

// ============================================================
// TfSellerStory — the seller in their own words.
//
// Every field below already crosses the wire on this page today
// and is discarded before render. Editorial serif on the bare
// surface, no card chrome: this is the one place on the profile
// where the seller, not the platform, is talking.
// ============================================================

export interface TfSellerStoryProps {
  shopName: string;
  aboutText: string | null;
  /** Published location only — POPIA gates this upstream. */
  locationLine: string | null;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  website: string | null;
  whatsappGroupLink: string | null;
}

function socialHref(kind: "instagram" | "facebook" | "tiktok", handle: string) {
  if (/^https?:\/\//i.test(handle)) return handle;
  const user = handle.replace(/^@/, "");
  if (kind === "instagram") return `https://instagram.com/${user}`;
  if (kind === "facebook") return `https://facebook.com/${user}`;
  return `https://tiktok.com/@${user}`;
}

export function TfSellerStory({
  shopName,
  aboutText,
  locationLine,
  instagram,
  facebook,
  tiktok,
  website,
  whatsappGroupLink,
}: TfSellerStoryProps) {
  const about = aboutText?.trim() || null;
  const links: { key: string; href: string; label: string; icon: typeof Globe }[] = [];

  if (instagram?.trim())
    links.push({
      key: "ig",
      href: socialHref("instagram", instagram.trim()),
      label: "Instagram",
      icon: Instagram,
    });
  if (facebook?.trim())
    links.push({
      key: "fb",
      href: socialHref("facebook", facebook.trim()),
      label: "Facebook",
      icon: Facebook,
    });
  if (tiktok?.trim())
    links.push({
      key: "tt",
      href: socialHref("tiktok", tiktok.trim()),
      label: "TikTok",
      icon: Music2,
    });
  if (website?.trim())
    links.push({ key: "web", href: website.trim(), label: "Website", icon: Globe });
  if (whatsappGroupLink?.trim())
    links.push({
      key: "wag",
      href: whatsappGroupLink.trim(),
      label: "WhatsApp group",
      icon: Users,
    });

  // Nothing to say is not a hole — the section simply is not there.
  if (!about && !locationLine && links.length === 0) return null;

  return (
    <TfReveal as="section" aria-label={`About ${shopName}`} className="py-2">
      <h2 className="font-tf-display text-xl font-semibold text-tf-ink">
        About {shopName}
      </h2>

      {about && (
        <p className="mt-3 max-w-prose whitespace-pre-line font-tf-editorial text-[17px] leading-relaxed text-tf-stone-700">
          {about}
        </p>
      )}

      {locationLine && (
        <p className="mt-4 inline-flex items-center gap-2 text-sm text-tf-stone-600">
          <MapPin aria-hidden="true" className="size-4 text-tf-stone-400" />
          {locationLine}
        </p>
      )}

      {links.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {links.map((link) => (
            <li key={link.key}>
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-tf-stone-200 bg-tf-raised px-4 text-sm text-tf-stone-700 outline-none hover:border-tf-stone-400 focus-visible:ring-2 focus-visible:ring-tf-primary"
              >
                <link.icon aria-hidden="true" className="size-4 text-tf-stone-500" />
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </TfReveal>
  );
}
