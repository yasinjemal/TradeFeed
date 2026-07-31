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

    // HUNT must be discoverable from the homepage, not only by direct URL.
    const huntLink = page.getByRole("link", { name: /HUNT/i }).first();
    await expect(huntLink).toBeVisible();
    await expect(huntLink).toHaveAttribute("href", "/hunt#start-hunt");
  });

  test("HUNT is discoverable on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    const directHuntLink = page.getByRole("link", {
      name: "Start a TradeFeed HUNT",
    });

    if (await directHuntLink.isVisible()) {
      await expect(directHuntLink).toHaveAttribute(
        "href",
        "/hunt#start-hunt",
      );
      return;
    }

    await page.getByRole("button", { name: "Open menu" }).click();
    const drawerHuntLink = page.getByRole("link", {
      name: /TradeFeed HUNT/i,
    }).last();
    await expect(drawerHuntLink).toBeVisible();
    await expect(drawerHuntLink).toHaveAttribute(
      "href",
      "/hunt#start-hunt",
    );
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
