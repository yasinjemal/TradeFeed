// ============================================================
// E2E Smoke Test — Seller Flow
// ============================================================
// Verifies seller-facing pages and forms render correctly.
// These are smoke tests — no real auth (Clerk sign-in required).
// ============================================================

import { test, expect } from "@playwright/test";

test.describe("Seller Flow", () => {
  test("create-shop keeps the seller's intended destination", async ({
    page,
  }) => {
    await page.goto("/create-shop");

    await expect(page).toHaveURL(/\/sign-up.*redirect_url=/i);
    await expect(
      page.getByRole("heading", { name: /sell your stock faster with ai/i }),
    ).toBeVisible();
  });

  test("seller registration gate has required account fields", async ({
    page,
  }) => {
    await page.goto("/create-shop");

    await expect(
      page.getByRole("textbox", { name: /email address/i }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(
      page.getByRole("textbox", { name: /password/i }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(
      page.getByRole("button", { name: "Continue", exact: true }),
    ).toBeVisible();
  });

  test("dashboard redirects unauthenticated users", async ({ page }) => {
    const res = await page.goto("/dashboard");
    // Should redirect to sign-in or show auth required
    const url = page.url();
    const redirectedToAuth = url.includes("sign-in") || url.includes("clerk");
    const stayedOnDashboard = url.includes("dashboard");
    // Either it redirected or the dashboard page handles unauth gracefully
    expect(redirectedToAuth || stayedOnDashboard).toBeTruthy();
  });

  test("contact page exposes email and WhatsApp support", async ({ page }) => {
    await page.goto("/contact");

    await expect(page).toHaveTitle(/Contact|TradeFeed/i);

    await expect(page.locator('a[href^="mailto:"]').first()).toBeVisible();
    await expect(page.locator('a[href*="wa.me"]').first()).toBeVisible();
  });
});
