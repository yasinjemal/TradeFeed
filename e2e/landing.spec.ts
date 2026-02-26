// ============================================================
// E2E Smoke Test — Landing Page
// ============================================================
// Verifies the public landing page renders correctly with
// key marketing elements and navigation links.
// ============================================================

import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test("renders hero section with branding", async ({ page }) => {
    await page.goto("/");

    // Page should load successfully
    await expect(page).toHaveTitle(/TradeFeed/i);

    // Hero heading should be visible
    const heading = page.locator("h1").first();
    await expect(heading).toBeVisible();

    // Primary CTA should exist (create shop / get started)
    const cta = page.getByRole("link", { name: /create|get started|start/i }).first();
    await expect(cta).toBeVisible();
  });

  test("navigation links are present", async ({ page }) => {
    await page.goto("/");

    // Marketplace link should exist
    const marketplaceLink = page.getByRole("link", { name: /marketplace/i }).first();
    await expect(marketplaceLink).toBeVisible();
  });

  test("footer renders with legal links", async ({ page }) => {
    await page.goto("/");

    // Privacy and Terms links should exist
    const privacy = page.getByRole("link", { name: /privacy/i }).first();
    const terms = page.getByRole("link", { name: /terms/i }).first();
    await expect(privacy).toBeVisible();
    await expect(terms).toBeVisible();
  });
});
