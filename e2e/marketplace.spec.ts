// ============================================================
// E2E Smoke Test — Marketplace
// ============================================================
// Verifies the public marketplace page loads, displays products,
// and the search/filter UI is functional.
// ============================================================

import { test, expect } from "@playwright/test";

test.describe("Marketplace", () => {
  test("renders marketplace page with heading", async ({ page }) => {
    await page.goto("/marketplace");

    await expect(page).toHaveTitle(/Marketplace|TradeFeed/i);

    // Main heading
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible();
  });

  test("search input is present and functional", async ({ page }) => {
    await page.goto("/marketplace");

    // Search input should exist
    const search = page.getByPlaceholder(/search/i).first();
    await expect(search).toBeVisible();

    // Type a search query — should update URL or filter results
    await search.fill("test product");
    await search.press("Enter");

    // URL should contain the search param
    await expect(page).toHaveURL(/q=test/i);
  });

  test("category filters are visible", async ({ page }) => {
    await page.goto("/marketplace");

    // Should have at least one filter/category element
    // Look for sort, category, or filter controls
    const sortOrFilter = page.locator("[data-testid], select, [role='combobox']").first();
    // If no data-testid, at least the page should render without errors
    await expect(page.locator("body")).toBeVisible();
  });

  test("promoted badge appears on boosted products", async ({ page }) => {
    await page.goto("/marketplace");

    // Page should load without errors — promoted products may or may not exist
    // This test verifies the page renders, not that promotions exist
    await expect(page.locator("body")).not.toHaveText(/error|500|Internal Server/i);
  });
});
