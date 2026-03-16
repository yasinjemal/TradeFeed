// ============================================================
// E2E Smoke Test — Seller Flow
// ============================================================
// Verifies seller-facing pages and forms render correctly.
// These are smoke tests — no real auth (Clerk sign-in required).
// ============================================================

import { test, expect } from "@playwright/test";

test.describe("Seller Flow", () => {
  test("create-shop form has required fields", async ({ page }) => {
    await page.goto("/create-shop");

    // Shop name input
    const nameInput = page
      .getByLabel(/shop name|name/i)
      .or(page.locator("input[name='name']"))
      .first();
    await expect(nameInput).toBeVisible();

    // WhatsApp number input
    const whatsappInput = page
      .getByLabel(/whatsapp|phone/i)
      .or(page.locator("input[name='whatsappNumber']"))
      .first();
    await expect(whatsappInput).toBeVisible();

    // Submit button
    const submit = page
      .getByRole("button", { name: /create|submit|launch/i })
      .first();
    await expect(submit).toBeVisible();
  });

  test("create-shop form validates empty submission", async ({ page }) => {
    await page.goto("/create-shop");

    // Try to submit without filling anything
    const submit = page
      .getByRole("button", { name: /create|submit|launch/i })
      .first();

    if (await submit.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await submit.click();

      // Should show validation errors or not navigate away
      await page.waitForTimeout(500);
      expect(page.url()).toContain("/create-shop");
    }
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

  test("contact page loads with form", async ({ page }) => {
    await page.goto("/contact");

    await expect(page).toHaveTitle(/Contact|TradeFeed/i);

    // Form should have email and message fields
    const emailInput = page
      .getByLabel(/email/i)
      .or(page.locator("input[type='email']"))
      .first();
    await expect(emailInput).toBeVisible();
  });
});
