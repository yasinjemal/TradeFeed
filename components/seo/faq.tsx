import * as React from "react";

// ============================================================
// SeoFaq — visible FAQ block + FAQPage JSON-LD, kept in lockstep
// (Google requires the marked-up Q&A to be visible on the page).
// ============================================================

export interface FaqItem {
  q: string;
  a: string;
}

export function SeoFaq({ items, title = "Frequently asked questions" }: { items: FaqItem[]; title?: string }) {
  const ld = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({
      "@type": "Question",
      name: i.q,
      acceptedAnswer: { "@type": "Answer", text: i.a },
    })),
  };

  return (
    <section className="mt-12" aria-label={title}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <h2 className="font-tf-display text-2xl font-semibold tracking-tight">{title}</h2>
      <dl className="mt-4 divide-y divide-tf-stone-200 rounded-xl border border-tf-stone-200 bg-tf-raised">
        {items.map((i) => (
          <div key={i.q} className="p-5">
            <dt className="font-medium text-tf-ink">{i.q}</dt>
            <dd className="mt-1.5 text-sm leading-relaxed text-tf-stone-600">{i.a}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
