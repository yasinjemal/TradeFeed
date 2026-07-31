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
    expect(body).toMatch(/^User-Agent:/im);
  });

  test("sitemap.xml is accessible", async ({ request }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.status()).toBe(200);

    const body = await res.text();
    expect(body).toContain("urlset");
  });

  test("missing public catalog renders a 404", async ({ page }) => {
    const res = await page.goto(
      "/catalog/this-shop-does-not-exist-xyz",
    );
    expect(res?.status()).toBe(404);
  });
});
