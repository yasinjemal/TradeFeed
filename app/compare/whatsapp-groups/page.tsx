import type { Metadata } from "next";
import Link from "next/link";

import { SeoPageShell, SeoSection, SeoCta } from "@/components/seo/seo-page";
import { SeoFaq } from "@/components/seo/faq";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://tradefeed.co.za";

export const metadata: Metadata = {
  title: "Selling in WhatsApp Groups vs a Catalogue Link — Which Wins?",
  description:
    "Group posts vanish in minutes; a catalogue link sells around the clock. The honest comparison for SA sellers — and why the answer is to keep your groups AND add a link.",
  alternates: { canonical: `${APP_URL}/compare/whatsapp-groups` },
  openGraph: {
    title: "Selling in WhatsApp Groups vs a Catalogue Link",
    description: "Keep your groups. Add a link. Here's the maths.",
    url: `${APP_URL}/compare/whatsapp-groups`,
    siteName: "TradeFeed",
    type: "article",
  },
};

const FAQ = [
  { q: "Should I stop posting in WhatsApp groups?", a: "No — groups are your distribution. The change is what you post: instead of product photos that expire, you post your catalogue link, which keeps selling after the post scrolls away." },
  { q: "Won't a link get less engagement than photos?", a: "Post both: one great product photo plus your link. The photo earns the tap; the link converts it into a structured order instead of a 'how much?' thread." },
  { q: "What about group rules against links?", a: "Most groups that ban links ban them because of spam. A single pinned catalogue link from an active, trusted member is usually welcomed — it reduces repost noise. When in doubt, share it in your status and one-to-one replies." },
  { q: "How fast can I set this up?", a: "Under 3 minutes for your first product, or import your whole WhatsApp catalogue in one go." },
];

export default function VsWhatsappGroupsPage() {
  return (
    <SeoPageShell breadcrumb={{ name: "TradeFeed vs WhatsApp groups", path: "/compare/whatsapp-groups" }}>
      <h1 className="font-tf-display text-4xl font-semibold leading-tight tracking-tight">
        Selling in WhatsApp groups vs a catalogue link
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-tf-stone-600">
        Your biggest competitor isn&apos;t another platform — it&apos;s the way you sell today.
        Groups built your customer base. Here&apos;s where they stop working, and what to add
        (not replace) when they do.
      </p>

      <SeoSection title="What groups are genuinely great at">
        <p>
          Reach and trust. A good group puts your stock in front of hundreds of real local
          buyers, and your name carries weight there. No platform replicates that. Anyone
          telling you to abandon your groups doesn&apos;t understand SA selling.
        </p>
      </SeoSection>

      <SeoSection title="Where sales die in groups">
        <p>
          <strong>The 10-minute shelf life:</strong> your post is buried by lunchtime; the buyer
          who would have ordered tonight never sees it. <strong>The &quot;how much?&quot;
          tax:</strong> every sale costs a thread of size, price, and availability questions —
          multiplied by every interested buyer. <strong>The trust ceiling:</strong> a new buyer
          sees a phone number and a photo; they have no way to check you&apos;re real, so the
          high-value sale goes to a store instead. <strong>The admin black hole:</strong> orders
          live in scrollback; stock counts live in your head.
        </p>
      </SeoSection>

      <SeoSection title="The same day with a catalogue link">
        <p>
          You post once: photo + link. The post scrolls away; the link doesn&apos;t. Buyers
          browse every product with prices and sizes, day or night, and tap{" "}
          <strong>Order on WhatsApp</strong> — the order lands in your chat pre-filled: item,
          variant, quantity, total, order number. New buyers see your{" "}
          <strong>Verified Seller card</strong> — orders fulfilled, reply time, reviews from
          confirmed orders — before they commit. The method in full:{" "}
          <Link href="/sell-on-whatsapp" className="text-tf-primary underline underline-offset-2">
            how to sell on WhatsApp
          </Link>.
        </p>
      </SeoSection>

      <SeoSection title="Keep your groups. Add a link.">
        <p>
          This isn&apos;t either/or. Groups stay your megaphone; the link becomes your shop.
          Setup takes minutes —{" "}
          <Link href="/create-online-shop" className="text-tf-primary underline underline-offset-2">
            create a free shop
          </Link>{" "}
          or{" "}
          <Link href="/import-whatsapp-catalogue" className="text-tf-primary underline underline-offset-2">
            import your existing WhatsApp catalogue
          </Link>{" "}
          — and your next group post starts working around the clock.
        </p>
      </SeoSection>

      <SeoCta label="Get your catalogue link — free" />
      <SeoFaq items={FAQ} />
    </SeoPageShell>
  );
}
