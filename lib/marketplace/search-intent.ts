/** Keep explicit product-name matches separate from incidental description hits.
 * Preserve the search engine's stemming/fuzzy fallback when no title matches.
 */
export function primarySearchMatches<T extends { name: string }>(items: T[], query?: string): T[] {
  const words = query?.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
  if (!words.length) return items;
  const normalize = (word: string) => word.length > 3 ? word.replace(/s$/, "") : word;
  const matches = items.filter(item => {
    const title = (item.name.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []).map(normalize);
    return words.every(word => title.includes(normalize(word)));
  });
  return matches.length ? matches : items;
}
