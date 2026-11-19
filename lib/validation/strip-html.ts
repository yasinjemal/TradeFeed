/**
 * Strip HTML/script tags from user-provided text.
 *
 * Input hygiene only. It removes complete `<...>` tags, so it is not a
 * substitute for escaping on output: React escapes text it renders, and
 * JSON-LD goes through `serializeJsonLd`.
 */
export function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, "");
}
