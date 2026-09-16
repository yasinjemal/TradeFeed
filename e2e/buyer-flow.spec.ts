import { test, expect } from "@playwright/test";
// This fixture is seeded in CI. Missing products are failures, never silent skips.
test("buyer can discover a product, select retail and inspect the real cart", async ({
  page,
}) => {
  await page.goto("/marketplace");
  await page.getByRole("button", { name: "Reject non-essential", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const product = page
    .locator('a[href="/catalog/quality-fixture/products/everyday-sneakers"]')
    .first();
  await expect(product).toBeVisible();
  await product.click();
  await expect(
    page.getByRole("heading", { name: "Everyday Sneakers", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Add to cart", exact: true })
    .filter({ visible: true })
    .click();
  await page.getByRole("button", { name: /Open cart, 1 items/ }).click();
  const cart = page.getByRole("dialog", { name: "Your order", exact: true });
  await expect(cart).toBeVisible();
  await expect(
    cart.getByText("Everyday Sneakers", { exact: true }),
  ).toBeVisible();
  await expect(
    cart.getByText(/arranged with the seller/i),
  ).toBeVisible();
});
test("support is reachable without an account and explains order verification", async ({
  page,
}) => {
  await page.goto("/support/order");
  await expect(
    page.getByRole("heading", { name: "Help with your order" }),
  ).toBeVisible();
  await expect(page.getByLabel("Order number", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Open support case" }),
  ).toBeVisible();
});
