export function isPlaceholderOption(value: string): boolean {
  return /^default$/i.test(value.trim());
}

/** A title advertising a size range must not silently order a placeholder size. */
export function needsSizeConfirmation(name: string, variants: readonly { size: string }[]): boolean {
  const advertisesSizes = /\b(?:[2-4]?X{0,2}[SML]|\d{1,3})\s*(?:[-–—]|to)\s*(?:[2-4]?X{0,2}[SML]|\d{1,3})\b/i.test(name);
  return advertisesSizes && !variants.some(v => !isPlaceholderOption(v.size));
}

/** Once real options exist, the initial placeholder is not a buyer choice. */
export function buyerOptions<T extends { size: string }>(variants: readonly T[]): T[] {
  const actual = variants.filter(v => !isPlaceholderOption(v.size));
  return actual.length ? actual : [...variants];
}
