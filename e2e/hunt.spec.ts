import { expect, test } from "@playwright/test";

test.describe("TradeFeed HUNT", () => {
  test("renders the public beta entry point and creation form", async ({
    page,
  }) => {
    const response = await page.goto("/hunt");

    expect(response?.status()).toBeLessThan(500);
    await expect(page).toHaveTitle(/HUNT.*TradeFeed/i);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /Screenshot it.*SA finds it/i,
      }),
    ).toBeVisible();
    await expect(page.locator("#start-hunt")).toBeVisible();
    await expect(page.getByRole("button", { name: /Start my Hunt/i })).toBeVisible();
    await expect(page.getByText(/Your number is never shown/i)).toBeVisible();
  });

  test("marketplace request text is carried into the HUNT form", async ({
    page,
  }) => {
    await page.goto("/hunt?request=black%20sneakers#start-hunt");

    await expect(page.locator('textarea[name="requestText"]')).toHaveValue(
      "black sneakers",
    );
  });

  test("mobile HUNT controls remain usable without horizontal overflow", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/hunt");

    const startButton = page.getByRole("button", { name: /Start my Hunt/i });
    await expect(startButton).toBeVisible();
    const box = await startButton.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
