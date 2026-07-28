import { expect, test, type Page } from "@playwright/test";
import { signInDedicatedClerkUser } from "./clerk-auth";
import {
  assertSuccessfulNavigation,
  errorMessage,
  installSyntheticSignals,
  requiredEnvironmentVariable,
  requiredHttpsBaseUrl,
  requiredPathSegment,
  syntheticUrl,
} from "./runtime";

const SYNTHETIC_PRODUCT_PREFIX = "CHECKLY SYNTHETIC -";
const MUTATION_ACKNOWLEDGEMENT = "I_UNDERSTAND_THIS_MUTATES_STAGING";
const MAX_STALE_PRODUCTS = 20;

function assertSafeSellerTarget(options: {
  baseUrl: URL;
  expectedHost: string;
  shopSlug: string;
  emailAddress: string;
  mutationAcknowledgement: string;
}): void {
  const {
    baseUrl,
    expectedHost,
    shopSlug,
    emailAddress,
    mutationAcknowledgement,
  } = options;

  if (mutationAcknowledgement !== MUTATION_ACKNOWLEDGEMENT) {
    throw new Error(
      `CHECKLY_SELLER_MUTATION_ACK must equal ${MUTATION_ACKNOWLEDGEMENT}.`,
    );
  }

  if (baseUrl.hostname !== expectedHost) {
    throw new Error(
      `Seller target host ${baseUrl.hostname} does not match CHECKLY_SELLER_EXPECTED_HOST (${expectedHost}).`,
    );
  }

  if (["tradefeed.co.za", "www.tradefeed.co.za"].includes(baseUrl.hostname)) {
    throw new Error("The mutating seller journey is forbidden on production.");
  }

  if (
    !/(?:^|[.-])(staging|preview|checkly|synthetic)(?:[.-]|$)/i.test(
      baseUrl.hostname,
    )
  ) {
    throw new Error(
      "CHECKLY_SELLER_BASE_URL must use a hostname explicitly marked staging, preview, checkly, or synthetic.",
    );
  }

  if (!/(checkly|synthetic)/i.test(shopSlug)) {
    throw new Error(
      "CHECKLY_SELLER_SHOP_SLUG must include 'checkly' or 'synthetic' to identify a dedicated tenant.",
    );
  }

  if (!/(\+clerk_test|\+checkly|synthetic)/i.test(emailAddress)) {
    throw new Error(
      "CHECKLY_SELLER_EMAIL must identify a dedicated synthetic user (+clerk_test, +checkly, or synthetic).",
    );
  }
}

async function productDashboardLinks(
  page: Page,
  shopSlug: string,
): Promise<string[]> {
  const links = page
    .locator(`a[href^="/dashboard/${shopSlug}/products/"]`)
    .filter({ hasText: SYNTHETIC_PRODUCT_PREFIX });

  return links.evaluateAll((elements) =>
    Array.from(
      new Set(
        elements
          .map((element) => element.getAttribute("href"))
          .filter((href): href is string => Boolean(href)),
      ),
    ),
  );
}

async function deleteProduct(
  page: Page,
  baseUrl: URL,
  shopSlug: string,
  dashboardPath: string,
): Promise<void> {
  const response = await page.goto(syntheticUrl(baseUrl, dashboardPath), {
    waitUntil: "domcontentloaded",
  });
  assertSuccessfulNavigation(response, `Synthetic product ${dashboardPath}`);

  await page.getByText("Danger Zone", { exact: true }).click();
  const deleteButton = page.getByRole("button", {
    name: "Delete Product",
    exact: true,
  });
  await expect(deleteButton).toBeVisible();

  page.once("dialog", async (dialog) => {
    await dialog.accept();
  });
  await deleteButton.click();

  const productsPath = `/dashboard/${shopSlug}/products`;
  await page.waitForURL(
    (url) => url.pathname === productsPath,
    { timeout: 30_000 },
  );
}

async function removeStaleSyntheticProducts(
  page: Page,
  baseUrl: URL,
  shopSlug: string,
): Promise<void> {
  const productsPath = `/dashboard/${shopSlug}/products`;

  for (let removed = 0; removed < MAX_STALE_PRODUCTS; removed += 1) {
    const response = await page.goto(syntheticUrl(baseUrl, productsPath), {
      waitUntil: "domcontentloaded",
    });
    assertSuccessfulNavigation(response, "Synthetic seller product list");

    const links = await productDashboardLinks(page, shopSlug);
    if (links.length === 0) return;

    await deleteProduct(page, baseUrl, shopSlug, links[0]!);
  }

  const remaining = await productDashboardLinks(page, shopSlug);
  if (remaining.length > 0) {
    throw new Error(
      `More than ${MAX_STALE_PRODUCTS} stale synthetic products exist; refusing an unbounded cleanup.`,
    );
  }
}

async function expectPublicProductName(
  page: Page,
  publicUrl: string,
  productName: string,
): Promise<void> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await page.goto(publicUrl, {
      waitUntil: "domcontentloaded",
    });

    if (
      response?.status() === 200 &&
      (await page
        .getByRole("heading", {
          level: 1,
          name: productName,
          exact: true,
        })
        .isVisible()
        .catch(() => false))
    ) {
      return;
    }

    await page.waitForTimeout(1_500);
  }

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: productName,
      exact: true,
    }),
  ).toBeVisible();
}

test("dedicated seller can publish, edit, expose, and clean up a product", async ({
  page,
}) => {
  const baseUrl = requiredHttpsBaseUrl("CHECKLY_SELLER_BASE_URL");
  const expectedHost = requiredEnvironmentVariable(
    "CHECKLY_SELLER_EXPECTED_HOST",
  );
  const shopSlug = requiredPathSegment("CHECKLY_SELLER_SHOP_SLUG");
  const emailAddress = requiredEnvironmentVariable("CHECKLY_SELLER_EMAIL");
  const mutationAcknowledgement = requiredEnvironmentVariable(
    "CHECKLY_SELLER_MUTATION_ACK",
  );
  const clerkFrontendApiUrl = requiredEnvironmentVariable(
    "CHECKLY_CLERK_FRONTEND_API_URL",
  );
  const clerkSecretKey = requiredEnvironmentVariable("CLERK_SECRET_KEY");

  assertSafeSellerTarget({
    baseUrl,
    expectedHost,
    shopSlug,
    emailAddress,
    mutationAcknowledgement,
  });
  await installSyntheticSignals(page, baseUrl);

  let signedIn = false;
  let createdDashboardPath: string | undefined;
  let runError: unknown;

  try {
    await signInDedicatedClerkUser({
      page,
      emailAddress,
      secretKey: clerkSecretKey,
      frontendApiUrl: clerkFrontendApiUrl,
      appHomeUrl: syntheticUrl(baseUrl, "/"),
    });
    signedIn = true;

    await removeStaleSyntheticProducts(page, baseUrl, shopSlug);

    const runId = [
      Date.now().toString(36),
      (process.env.CHECK_ID ?? "local").slice(-6),
    ].join("-");
    const originalName = `${SYNTHETIC_PRODUCT_PREFIX} ${runId}`;
    const editedName = `${originalName} edited`;
    const newProductPath = `/dashboard/${shopSlug}/products/new`;

    const createResponse = await page.goto(
      syntheticUrl(baseUrl, newProductPath),
      { waitUntil: "domcontentloaded" },
    );
    assertSuccessfulNavigation(createResponse, "New product page");
    expect(new URL(page.url()).pathname).toBe(newProductPath);

    await page.locator("#name").fill(originalName);
    await page.locator("#priceInRands").fill("12.34");
    await page.locator("#stock").fill("3");

    const activeCheckbox = page.locator("#isActive");
    if (!(await activeCheckbox.isChecked())) {
      await activeCheckbox.check({ force: true });
    }

    await page
      .getByRole("button", {
        name: `Publish ${originalName}`,
        exact: true,
      })
      .click();

    await expect(
      page.getByRole("heading", {
        level: 2,
        name: `${originalName} is live`,
        exact: true,
      }),
    ).toBeVisible({ timeout: 30_000 });

    const editLink = page.getByRole("link", {
      name: /Edit details/i,
    });
    const editHref = await editLink.getAttribute("href");
    if (!editHref) {
      throw new Error("Published product did not expose its Edit details URL.");
    }
    createdDashboardPath = new URL(editHref, baseUrl).pathname;

    const productId = createdDashboardPath.split("/").at(-1);
    if (!productId || !/^[a-zA-Z0-9_-]+$/.test(productId)) {
      throw new Error("Could not derive a safe product ID from the edit URL.");
    }

    const publicProductUrl = syntheticUrl(
      baseUrl,
      `/catalog/${shopSlug}/products/${productId}`,
    );
    await expectPublicProductName(page, publicProductUrl, originalName);

    const editResponse = await page.goto(
      syntheticUrl(baseUrl, createdDashboardPath),
      { waitUntil: "domcontentloaded" },
    );
    assertSuccessfulNavigation(editResponse, "Product edit page");

    await page
      .locator("button")
      .filter({ hasText: "Product Details" })
      .click();
    await page.locator("#edit-name").fill(editedName);
    await page
      .getByRole("button", { name: "Save Changes", exact: true })
      .click();

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: editedName,
        exact: true,
      }),
    ).toBeVisible({ timeout: 30_000 });

    await expectPublicProductName(page, publicProductUrl, editedName);
  } catch (error) {
    runError = error;
  }

  let cleanupError: unknown;
  if (signedIn) {
    try {
      if (createdDashboardPath) {
        await deleteProduct(
          page,
          baseUrl,
          shopSlug,
          createdDashboardPath,
        );
      } else {
        await removeStaleSyntheticProducts(page, baseUrl, shopSlug);
      }

      const productsPath = `/dashboard/${shopSlug}/products`;
      await page.goto(syntheticUrl(baseUrl, productsPath), {
        waitUntil: "domcontentloaded",
      });
      await expect(
        page
          .locator(`a[href^="${productsPath}/"]`)
          .filter({ hasText: SYNTHETIC_PRODUCT_PREFIX }),
      ).toHaveCount(0);
    } catch (error) {
      cleanupError = error;
    }
  }

  if (runError && cleanupError) {
    throw new Error(
      `Seller journey failed: ${errorMessage(runError)} Cleanup also failed: ${errorMessage(cleanupError)}`,
      { cause: runError },
    );
  }
  if (runError) throw runError;
  if (cleanupError) throw cleanupError;
});
