import { serializeJsonLd } from "@/lib/seo/serialize-json-ld";

// ============================================================
// JsonLdScript — the <script type="application/ld+json"> wrapper.
// ============================================================
// Escaping lives in one place, serializeJsonLd: it turns "<" into
// "<" so text containing "</script>" can not end the data
// block early. This component only saves repeating the tag and
// the dangerouslySetInnerHTML boilerplate at each call site.
// ============================================================

export function JsonLdScript({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
