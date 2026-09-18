import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const prefix = `gallery-test-${Date.now()}`;
let safeDatabase = false;
test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  const url = new URL(process.env.DATABASE_URL!);
  if (!["localhost", "127.0.0.1"].includes(url.hostname) || !/test|quality/.test(url.pathname)) throw new Error("Gallery fixtures require a local test database");
  safeDatabase = true;
  for (let index = 0; index < 13; index++) {
    await db.shop.create({ data: {
      slug: `${prefix}-${index}`, name: `Gallery Studio ${String(index).padStart(2, "0")}`,
      whatsappNumber: "27820000000", city: index % 2 ? "Cape Town" : "Johannesburg",
      province: index % 2 ? "Western Cape" : "Gauteng", isActive: index !== 10,
      products: { create: Array.from({ length: index === 9 ? 2 : 3 }, (_, slot) => ({
        name: `Gallery piece ${slot}`, isActive: !(index === 11 && slot === 2),
        isFlagged: index === 12 && slot === 2,
        minPriceCents: 10000, maxPriceCents: 10000,
        images: { create: { url: "/landing/demo-sneakers.webp" } },
      })) },
    } });
  }
});
test.afterAll(async () => {
  if (safeDatabase) await db.shop.deleteMany({ where: { slug: { startsWith: prefix } } });
  await db.$disconnect();
});

test("all qualifying shops are selectable, searchable and available beyond the first page", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Reject non-essential", exact: true }).click();
  const gallery = page.locator("#meet-the-shops");
  await gallery.getByRole("heading", { name: "Meet the shops." }).scrollIntoViewIfNeeded();
  await expect(gallery.getByRole("link", { name: "Visit Gallery Studio 00, 3 products", exact: true })).toBeVisible();
  await expect(gallery.getByRole("link", { name: /Visit Gallery Studio 08/ })).toHaveCount(0);
  await gallery.getByRole("button", { name: "Explore more shops" }).click();
  await expect(gallery.getByRole("link", { name: /Visit Gallery Studio 08/ })).toBeVisible();
  for (const index of ["09", "10", "11", "12"]) await expect(gallery.getByRole("link", { name: new RegExp(`Visit Gallery Studio ${index}`) })).toHaveCount(0);
  await gallery.getByRole("combobox", { name: "Filter shops by province" }).selectOption("Western Cape");
  await expect(gallery.getByRole("link", { name: /Visit Gallery Studio 00/ })).toHaveCount(0);
  await gallery.getByRole("searchbox", { name: "Find a shop" }).fill("Studio 01");
  await expect(gallery.getByRole("link")).toHaveCount(1);
  await expect(gallery.getByRole("link")).toHaveAttribute("href", `/catalog/${prefix}-1`);
  await gallery.getByRole("searchbox", { name: "Find a shop" }).fill("no such shop");
  await expect(gallery.getByText("No shops match just yet.")).toBeVisible();
  await gallery.getByRole("button", { name: "Show all shops" }).click();
  await gallery.evaluate(element => element.scrollIntoView({ behavior: "instant", block: "start" }));
  await page.screenshot({ path: "node_modules/.cache/shop-gallery-desktop.png", fullPage: false });
});

test("mobile cards fit the screen and respect reduced motion", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: "Reject non-essential", exact: true }).click();
  const gallery = page.locator("#meet-the-shops");
  await gallery.scrollIntoViewIfNeeded();
  await gallery.evaluate(element => element.scrollIntoView({ behavior: "instant", block: "start" }));
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const card = gallery.getByRole("link").first();
  await expect(card).toBeVisible();
  expect(await card.evaluate(element => getComputedStyle(element).transitionDuration)).toBe("0s");
  await page.screenshot({ path: "node_modules/.cache/shop-gallery-mobile.png" });
});
