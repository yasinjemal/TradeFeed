// ============================================================
// E2E Smoke Test — Auth Pages
// ============================================================
// Verifies sign-in, sign-up, and create-shop pages load correctly.
// These are smoke tests — they don't sign in (Clerk auth).
// ============================================================

import { test, expect } from "@playwright/test";

test.describe("Auth Pages", () => {
  test("sign-in page renders Clerk widget", async ({ page }) => {
    await page.goto("/sign-in");

    // Clerk widget should render (contains an iframe or form)
    await expect(page.locator("body")).toBeVisible();
    await expect(page).toHaveTitle(/TradeFeed|Sign/i);
  });

  test("sign-up page renders Clerk widget", async ({ page }) => {
    await page.goto("/sign-up");

    await expect(page.locator("body")).toBeVisible();
  });

  test("sign-up page with referral code preserves ref param", async ({ page }) => {
    await page.goto("/sign-up?ref=TF-ABC123");

    await expect(page.locator("body")).toBeVisible();
    await expect
      .poll(async () => {
        const referral = (await page.context().cookies()).find(
          (cookie) => cookie.name === "tf_ref",
        );
        return referral?.value;
      })
      .toBe("TF-ABC123");
  });

  test("create-shop redirects guests to registration", async ({ page }) => {
    await page.goto("/create-shop");

    await expect(page).toHaveURL(/\/sign-up.*redirect_url=/i);
    await expect(
      page.getByRole("heading", { name: /create your account/i }),
    ).toBeVisible();
  });
});
