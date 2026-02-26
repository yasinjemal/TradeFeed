// ============================================================
// E2E Smoke Test — Static & Legal Pages
// ============================================================
// Verifies static pages render correctly.
// ============================================================

import { test, expect } from "@playwright/test";

test.describe("Static Pages", () => {
  test("privacy policy page loads", async ({ page }) => {
    await page.goto("/privacy");

    await expect(page).toHaveTitle(/Privacy|TradeFeed/i);
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible();
  });

  test("terms of service page loads", async ({ page }) => {
    await page.goto("/terms");

    await expect(page).toHaveTitle(/Terms|TradeFeed/i);
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible();
  });

  test("robots.txt is accessible", async ({ request }) => {
    const res = await request.get("/robots.txt");
    expect(res.status()).toBe(200);

    const body = await res.text();
    expect(body).toContain("User-agent");
  });

  test("sitemap.xml is accessible", async ({ request }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.status()).toBe(200);

    const body = await res.text();
    expect(body).toContain("urlset");
  });

  test("404 page renders for unknown routes", async ({ page }) => {
    const res = await page.goto("/this-page-does-not-exist-xyz");
    // Should get a 404 status
    expect(res?.status()).toBe(404);
  });
});
