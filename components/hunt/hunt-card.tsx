import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, MapPin, Users } from "lucide-react";

import { TfBadge } from "@/components/tf/badge";
import { formatHuntBudget } from "@/lib/validation/hunt";

interface HuntCardProps {
  hunt: {
    slug: string;
    publicTitle: string;
    publicImageUrl: string;
    city: string;
    maxBudgetCents: number | null;
    _count: { participants: number };
  };
}

export function HuntCard({ hunt }: HuntCardProps) {
  const budget = formatHuntBudget(hunt.maxBudgetCents);
  return (
    <Link
      href={`/hunt/${hunt.slug}`}
      className="group overflow-hidden rounded-2xl border border-tf-stone-200 bg-tf-raised shadow-tf-sm outline-none transition-all hover:-translate-y-0.5 hover:border-tf-stone-300 hover:shadow-tf-md focus-visible:ring-2 focus-visible:ring-tf-primary motion-reduce:transform-none"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-tf-stone-100">
        <Image
          src={hunt.publicImageUrl}
          alt=""
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.02] motion-reduce:transform-none"
        />
        <TfBadge className="absolute left-3 top-3 border border-emerald-500/20 bg-emerald-950/85 text-emerald-300 backdrop-blur">
          <span
            className="size-1.5 rounded-full bg-emerald-400"
            aria-hidden="true"
          />
          LIVE
        </TfBadge>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-tf-display text-base font-semibold leading-snug text-tf-ink">
            {hunt.publicTitle}
          </h3>
          <ArrowUpRight
            className="mt-0.5 size-4 shrink-0 text-tf-stone-400 transition-colors group-hover:text-tf-primary"
            aria-hidden="true"
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-tf-stone-600">
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3.5" aria-hidden="true" />
            {hunt.city}
          </span>
          {budget && <span>Under {budget}</span>}
          <span className="inline-flex items-center gap-1">
            <Users className="size-3.5" aria-hidden="true" />
            {hunt._count.participants} interested
          </span>
        </div>
      </div>
    </Link>
  );
}
