// ============================================================
// JsonLdScript — a JSON-LD data block that cannot break out of
// its <script> tag.
// ============================================================
// JSON.stringify leaves "<" untouched, so text containing
// "</script>" would end the block early and the rest would be
// parsed as live HTML. "<" is the same character to a JSON
// parser and inert to the HTML parser.
//
// Same escaping as serializeJsonLd in lib/seo/serialize-json-ld.ts
// (added by PR #17). Once that lands, call it from here.
// ============================================================

export function JsonLdScript({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: (JSON.stringify(data) ?? "null").replace(/</g, "\u003c"),
      }}
    />
  );
}
