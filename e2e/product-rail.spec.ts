import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const slug = `motion-test-${Date.now()}`;
let safeDatabase = false;
test.describe.configure({ mode: "serial" });
test.use({ viewport: { width: 390, height: 844 } });

test.beforeAll(async () => {
  const url = new URL(process.env.DATABASE_URL!);
  if (!["localhost", "127.0.0.1"].includes(url.hostname) || !/test|quality/.test(url.pathname)) throw new Error("Local test database required");
  safeDatabase = true;
  await db.shop.create({ data: {
    slug, name: "Motion Test Shop", whatsappNumber: "27820000000",
    products: { create: Array.from({ length: 8 }, (_, index) => ({
      name: `Motion product ${index}`, slug: `item-${index}`,
      minPriceCents: 10000, maxPriceCents: 10000,
      images: { create: { url: "/landing/demo-sneakers.webp" } },
      variants: { create: { size: "M", stock: 10, priceInCents: 10000 } },
    })) },
  } });
});
test.afterAll(async () => {
  if (safeDatabase) await db.shop.deleteMany({ where: { slug } });
  await db.$disconnect();
});

test("seller products advance and stop when the buyer pauses them", async ({ page }) => {
  test.setTimeout(45000);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(`/catalog/${slug}/products/item-0`);
  await page.getByRole("button", { name: "Reject non-essential", exact: true }).click();
  const section = page.getByRole("region", { name: "More from Motion Test Shop" });
  await section.evaluate(element => element.scrollIntoView({ behavior: "instant", block: "center" }));
  await page.mouse.move(0, 0);
  const rail = section.getByRole("list");
  await expect.poll(() => rail.evaluate(element => element.scrollLeft), { timeout: 8000 }).toBeGreaterThan(100);
  await section.hover();
  await page.waitForTimeout(800);
  const hoveredAt = await rail.evaluate(element => element.scrollLeft);
  await page.waitForTimeout(4800);
  expect(await rail.evaluate(element => element.scrollLeft)).toBeCloseTo(hoveredAt, 0);
  await section.getByRole("button", { name: "Pause product carousel" }).click();
  await page.mouse.move(0, 0);
  await section.getByRole("button", { name: "Play product carousel" }).blur();
  // Let the in-flight smooth scroll settle before checking the next interval.
  await page.waitForTimeout(800);
  const pausedAt = await rail.evaluate(element => element.scrollLeft);
  await page.waitForTimeout(4800);
  expect(await rail.evaluate(element => element.scrollLeft)).toBeCloseTo(pausedAt, 0);
  await page.screenshot({ path: "node_modules/.cache/product-rail-mobile.png" });
});

test("reduced motion keeps manual controls, links and native scrolling", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`/catalog/${slug}/products/item-0`);
  await page.getByRole("button", { name: "Reject non-essential", exact: true }).click();
  const section = page.getByRole("region", { name: "More from Motion Test Shop" });
  await section.evaluate(element => element.scrollIntoView({ behavior: "instant", block: "center" }));
  await expect(section.getByRole("button", { name: /Pause product|Play product/ })).toHaveCount(0);
  await expect(section.getByRole("button", { name: "Previous products" })).toBeDisabled();
  await section.getByRole("button", { name: "Next products" }).click();
  const rail = section.getByRole("list");
  await expect.poll(() => rail.evaluate(element => element.scrollLeft)).toBeGreaterThan(100);
  await section.getByRole("button", { name: "Previous products" }).click();
  await expect.poll(() => rail.evaluate(element => element.scrollLeft)).toBeLessThan(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await expect(section.getByRole("link").first()).toHaveAttribute("href", new RegExp(`/catalog/${slug}/products/item-`));
  await page.setViewportSize({ width: 1280, height: 900 });
  await section.evaluate(element => element.scrollIntoView({ behavior: "instant", block: "center" }));
  await page.screenshot({ path: "node_modules/.cache/product-rail-desktop.png" });
});
