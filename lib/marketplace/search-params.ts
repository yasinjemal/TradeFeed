export function buildMarketplaceSearchParams(
  currentParams: string,
  updates: Record<string, string | undefined>
): string {
  const params = new URLSearchParams(currentParams);

  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined || value === "") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
  }

  // Reset to page 1 when filters change (unless page is being set)
  if (!("page" in updates)) {
    params.delete("page");
  }

  return params.toString();
}
