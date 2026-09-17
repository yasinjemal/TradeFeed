import { test, expect } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 } });
test("sort and rand filters use retail prices", async ({ page }) => {
  await page.goto("/marketplace");
  await page.getByRole("button", { name: "Reject non-essential", exact: true }).click();
  await page.getByRole("combobox", { name: "Sort products" }).selectOption("price_asc");
  await expect(page).toHaveURL(/sort=price_asc/);
  await page.getByRole("button", { name: "R100–R500", exact: true }).click();
  await expect(page).toHaveURL(/minPrice=10000/);
  await expect(page.getByRole("link", { name: "Everyday Sneakers", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Striped Polo S-XXL", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Cotton Polo", exact: true })).toHaveCount(0);
});
test("sneakers excludes incidental clothing descriptions", async ({ page }) => {
  await page.goto("/marketplace?search=sneakers");
  await expect(page.getByRole("link", { name: "Everyday Sneakers", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Cotton Polo", exact: true })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Striped Polo S-XXL", exact: true })).toHaveCount(0);
});
test("unconfirmed sizes cannot enter cart and enquiries are labelled", async ({ page }) => {
  await page.goto("/catalog/quality-fixture/products/unconfirmed-polo");
  await page.getByRole("button", { name: "Reject non-essential", exact: true }).click();
  await expect(page.getByRole("button", { name: "Sizes unconfirmed" })).toBeDisabled();
  await expect(page.getByRole("link", { name: "Ask about sizes" }).filter({visible:true})).toBeVisible();
  await expect(page.getByText("No reviews for this product yet.", {exact:false})).toBeVisible();
  const link = page.getByRole("link", { name: "Ask about sizes" }).filter({visible:true});
  expect(decodeURIComponent((await link.getAttribute("href"))!)).not.toContain("Size: Default");
});
test("category sort preserves its scope and first product fits mobile viewport", async ({ page }) => {
  await page.goto("/marketplace/category/quality-clothing");
  await page.getByRole("button", { name: "Reject non-essential", exact: true }).click();
  const first = page.locator('[data-slot="tf-product-card"]').first();
  await expect(first).toBeVisible();
  const box = await first.boundingBox();
  expect(box!.y).toBeLessThan(600);
  await page.getByRole("combobox", { name: "Sort products" }).selectOption("price_asc");
  await expect(page).toHaveURL(/category=quality-clothing/);
  await expect(page.getByRole("link", { name: "Everyday Sneakers", exact: true })).toHaveCount(0);
});
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";

test("guest without a phone can use checkout proof, but a stranger cannot", async ({page, context, baseURL}) => {
  const url = new URL(process.env.DATABASE_URL!);
  expect(["localhost", "127.0.0.1"]).toContain(url.hostname);
  expect(url.pathname).toMatch(/test|quality/);
  const db = new PrismaClient();
  const shop = await db.shop.findUniqueOrThrow({where:{slug:"quality-fixture"}});
  const key = randomUUID();
  const order = await db.order.create({data:{shopId:shop.id, orderNumber:`TF-TEST-${randomUUID()}`.toUpperCase(), checkoutKey:key, totalCents:19900, itemCount:1}});
  try {
    await page.goto("/support/order");
    await page.getByRole("button", {name:"Reject non-essential", exact:true}).click();
    await page.getByLabel("Order number",{exact:true}).fill(order.orderNumber);
    await page.getByLabel("Tell us what happened").fill("Local test: need delivery information for this order.");
    await page.getByRole("button",{name:"Open support case"}).click();
    await expect(page.getByRole("alert").filter({hasText:"We could not verify"})).toBeVisible();
    await expect(page.getByLabel("Order number",{exact:true})).toHaveValue(order.orderNumber);
    await expect(page.getByLabel("Tell us what happened")).toHaveValue("Local test: need delivery information for this order.");
    await context.addCookies([{name:`tf_checkout_${order.orderNumber}`,value:key,url:baseURL!,httpOnly:true,sameSite:"Lax"}]);
    await page.getByRole("button",{name:"Open support case"}).click();
    await expect(page.getByRole("heading",{name:"Order support",exact:true})).toBeVisible();
    await expect(page.getByText("Local test: need delivery information for this order.",{exact:true})).toBeVisible();
    expect(await db.supportCase.count({where:{orderId:order.id}})).toBe(1);
  } finally {
    await db.order.delete({where:{id:order.id}});
    await db.$disconnect();
  }
});
