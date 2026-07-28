import { expect, test, type Locator, type Page } from "@playwright/test";
import {
  assertSuccessfulNavigation,
  installSyntheticSignals,
  requiredHttpsBaseUrl,
  requiredPathSegment,
  syntheticUrl,
} from "./runtime";

async function selectPurchasableVariant(page: Page): Promise<Locator> {
  const addToCartButton = page
    .getByRole("button", { name: /^Add to cart\b/i })
    .first();
  const completedClassicSections = new Set<string>();

  for (let attempt = 0; attempt < 6; attempt += 1) {
    if (
      (await addToCartButton.isVisible().catch(() => false)) &&
      (await addToCartButton.isEnabled())
    ) {
      return addToCartButton;
    }

    // TF redesign: each size/colour fieldset exposes pressed state.
    const tfVariantFieldsets = page.locator("fieldset").filter({
      has: page.locator("button[aria-pressed]"),
    });
    let selectedOption = false;

    for (let index = 0; index < (await tfVariantFieldsets.count()); index += 1) {
      const fieldset = tfVariantFieldsets.nth(index);
      if (
        (await fieldset.locator('button[aria-pressed="true"]').count()) > 0
      ) {
        continue;
      }

      const option = fieldset
        .locator('button[aria-pressed="false"]:not([disabled]):visible')
        .first();
      if ((await option.count()) > 0) {
        await option.click();
        selectedOption = true;
        break;
      }
    }

    if (selectedOption) continue;

    // Classic UI: option sections are headed "Select Size/Color" inside
    // #add-to-cart and do not expose aria-pressed.
    const classicHeadings = page
      .locator("#add-to-cart h3")
      .filter({ hasText: /^Select /i });

    for (let index = 0; index < (await classicHeadings.count()); index += 1) {
      const heading = classicHeadings.nth(index);
      const label = (await heading.textContent())?.trim() ?? `section-${index}`;
      if (completedClassicSections.has(label)) continue;

      const option = heading
        .locator("xpath=following-sibling::div[1]")
        .locator("button:not([disabled]):visible")
        .first();
      if ((await option.count()) > 0) {
        await option.click();
        completedClassicSections.add(label);
        selectedOption = true;
        break;
      }
    }

    if (!selectedOption) {
      throw new Error(
        "Configured product has no selectable in-stock variant for the buyer monitor.",
      );
    }
  }

  await expect(addToCartButton).toBeEnabled();
  return addToCartButton;
}

test("buyer can browse a known product and reach a valid WhatsApp order link", async ({
  page,
}) => {
  const baseUrl = requiredHttpsBaseUrl("CHECKLY_BUYER_BASE_URL");
  const shopSlug = requiredPathSegment("CHECKLY_BUYER_SHOP_SLUG");
  const productRef = requiredPathSegment("CHECKLY_BUYER_PRODUCT_REF");
  const marketplaceSearch = requiredPathSegment(
    "CHECKLY_BUYER_MARKETPLACE_SEARCH",
  );

  await installSyntheticSignals(page, baseUrl);

  const marketplaceResponse = await page.goto(
    syntheticUrl(
      baseUrl,
      `/marketplace?search=${encodeURIComponent(marketplaceSearch)}`,
    ),
    { waitUntil: "domcontentloaded" },
  );
  assertSuccessfulNavigation(marketplaceResponse, "Marketplace");
  await expect(page).toHaveTitle(/Marketplace|TradeFeed/i);
  await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();

  const cataloguePath = `/catalog/${shopSlug}`;
  const productPath = `${cataloguePath}/products/${productRef}`;
  const marketplaceProductLink = page
    .locator(`a[href="${productPath}"], a[href^="${productPath}?"]`)
    .first();
  await expect(marketplaceProductLink).toBeVisible();
  await marketplaceProductLink.click();
  expect(new URL(page.url()).pathname).toBe(productPath);

  const catalogueResponse = await page.goto(
    syntheticUrl(baseUrl, cataloguePath),
    { waitUntil: "domcontentloaded" },
  );
  assertSuccessfulNavigation(catalogueResponse, "Configured catalogue");
  await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();

  const productLink = page
    .locator(`a[href="${productPath}"], a[href^="${productPath}?"]`)
    .first();
  await expect(productLink).toBeVisible();
  await productLink.click();

  expect(new URL(page.url()).pathname).toBe(productPath);
  const productHeading = page.getByRole("heading", { level: 1 }).first();
  await expect(productHeading).toBeVisible();
  const productName = (await productHeading.textContent())?.trim();
  expect(productName).toBeTruthy();

  const addToCartButton = await selectPurchasableVariant(page);

  const orderLink = page
    .getByRole("link", { name: /Order on WhatsApp/i })
    .first();
  await expect(orderLink).toBeVisible();

  const href = await orderLink.getAttribute("href");
  expect(href, "Order on WhatsApp must have a destination").toBeTruthy();

  const whatsappUrl = new URL(href!);
  expect(whatsappUrl.protocol).toBe("https:");
  expect(whatsappUrl.hostname).toBe("wa.me");
  expect(whatsappUrl.searchParams.get("text")).toContain(productName!);

  // Adding to the cart changes browser-local state only. The synthetic
  // markers exclude the accompanying analytics event.
  await addToCartButton.click();

  const viewCartButton = page.getByRole("button", {
    name: /View Cart/i,
  });
  await expect(viewCartButton).toBeVisible();
  await viewCartButton.click();

  const cartDialog = page.getByRole("dialog").first();
  await expect(cartDialog).toBeVisible();
  await expect(cartDialog.getByText(productName!, { exact: true })).toBeVisible();

  const checkoutButton = cartDialog.getByRole("button", {
    name: /^(?:Order|Send Order) on WhatsApp$/i,
  });
  await expect(checkoutButton).toBeVisible();
  await expect(checkoutButton).toBeEnabled();

  const cartPreview = await checkoutButton.getAttribute(
    "data-checkly-checkout-url-preview",
  );
  expect(cartPreview, "Cart checkout must expose a read-only preview").toBeTruthy();
  const cartWhatsAppUrl = new URL(cartPreview!);
  expect(cartWhatsAppUrl.protocol).toBe("https:");
  expect(cartWhatsAppUrl.hostname).toBe("wa.me");
  const cartMessage = cartWhatsAppUrl.searchParams.get("text");
  expect(cartMessage).toContain(productName!);
  expect(cartMessage).toContain("New Order from TradeFeed");

  // Deliberate boundary: do not click either WhatsApp control. Checkout
  // creates a real Order before opening WhatsApp. The read-only preview above
  // proves URL/message generation without a database mutation or third-party
  // navigation.
});
