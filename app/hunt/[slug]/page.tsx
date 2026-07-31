import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { HuntHeader } from "@/components/hunt/hunt-header";
import { HuntLiveRoom } from "@/components/hunt/hunt-live-room";
import { getBuyerFeatureId } from "@/lib/buyer/feature-identity";
import { getPublicHuntBySlug } from "@/lib/db/hunts";
import { formatHuntBudget } from "@/lib/validation/hunt";

export const dynamic = "force-dynamic";

interface HuntRoomPageProps {
  params: Promise<{ slug: string }>;
}

async function loadHunt(slug: string) {
  const viewerFeatureId = await getBuyerFeatureId();
  return getPublicHuntBySlug(slug, viewerFeatureId);
}

export async function generateMetadata({
  params,
}: HuntRoomPageProps): Promise<Metadata> {
  const { slug } = await params;
  const hunt = await getPublicHuntBySlug(slug);
  if (!hunt) {
    return {
      title: "Hunt not found",
      robots: { index: false, follow: false },
    };
  }

  const mayIndex = hunt.status === "FOUND" && hunt.seoApprovedAt != null;
  const canonical = `https://tradefeed.co.za/hunt/${hunt.slug}`;
  return {
    title: `${hunt.publicTitle} — TradeFeed HUNT`,
    description: hunt.publicDescription,
    alternates: { canonical },
    robots: {
      index: mayIndex,
      follow: mayIndex,
      googleBot: { index: mayIndex, follow: mayIndex },
    },
    openGraph: {
      title: `${hunt.publicTitle} — Can TradeFeed find it?`,
      description: `${hunt.publicDescription} Join the live Hunt in ${hunt.city}.`,
      url: canonical,
      type: "website",
      images: [
        {
          url: hunt.publicImageUrl,
          alt: `Reference product for ${hunt.publicTitle}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${hunt.publicTitle} — TradeFeed HUNT`,
      description: `Join this live ${hunt.city} Hunt.`,
      images: [hunt.publicImageUrl],
    },
  };
}

export default async function HuntRoomPage({ params }: HuntRoomPageProps) {
  const { slug } = await params;
  const hunt = await loadHunt(slug);
  if (!hunt) notFound();

  const publishedLabel = new Intl.DateTimeFormat("en-ZA", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Johannesburg",
  }).format(hunt.publishedAt);
  const expiresLabel = new Intl.DateTimeFormat("en-ZA", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Johannesburg",
  }).format(hunt.expiresAt);

  return (
    <>
      <HuntHeader />
      <HuntLiveRoom
        hunt={{
          slug: hunt.slug,
          title: hunt.publicTitle,
          description: hunt.publicDescription,
          imageUrl: hunt.publicImageUrl,
          status: hunt.status,
          city: hunt.city,
          province: hunt.province,
          desiredVariant: hunt.desiredVariant,
          desiredColor: hunt.desiredColor,
          style: hunt.style,
          matchPreference: hunt.matchPreference,
          budgetLabel: formatHuntBudget(hunt.maxBudgetCents),
          participantCount: hunt._count.participants,
          viewerJoined: hunt.viewerJoined,
          viewerIsOwner: hunt.viewerIsOwner,
          selectedOfferId: hunt.selectedOffer?.id ?? null,
          fulfillmentStatus: hunt.fulfillmentStatus,
          offers: hunt.offers.map((offer) => ({
            ...offer,
            publishedAt: offer.publishedAt?.toISOString() ?? null,
          })),
          publishedLabel,
          expiresLabel,
        }}
      />
    </>
  );
}
