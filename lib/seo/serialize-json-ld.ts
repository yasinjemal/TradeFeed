// ============================================================
// JSON-LD serialisation for <script type="application/ld+json">
// ============================================================
// JSON.stringify leaves "<" untouched, so any text containing
// "</script>" (a review, a shop description) would end the data
// block early and the remainder would be parsed as live HTML.
// "<" is the same character to a JSON parser and inert to the
// HTML parser, so the structured data is unchanged for crawlers.
//
// Always use this instead of JSON.stringify when writing JSON-LD
// through dangerouslySetInnerHTML.
// ============================================================

export function serializeJsonLd(value: unknown): string {
  return (JSON.stringify(value) ?? "null").replace(/</g, "\\u003c");
}
