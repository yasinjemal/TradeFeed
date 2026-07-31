import { expect, test } from "@playwright/test";

test.describe("TradeFeed HUNT", () => {
  test("authorizes every inline script with the response CSP nonce", async ({
    page,
  }) => {
    const cspConsoleErrors: string[] = [];
    page.on("console", (message) => {
      const text = message.text();
      if (
        message.type() === "error" &&
        /Content Security Policy|Refused to execute inline script|violates.*script-src/i.test(
          text,
        )
      ) {
        cspConsoleErrors.push(text);
      }
    });

    const response = await page.goto("/hunt");
    const csp = response?.headers()["content-security-policy"] ?? "";
    const scriptSource =
      csp
        .split(";")
        .map((directive) => directive.trim())
        .find((directive) => directive.startsWith("script-src ")) ?? "";
    const nonce = scriptSource.match(/'nonce-([^']+)'/)?.[1];

    expect(nonce, "script-src must contain a per-request nonce").toBeTruthy();
    expect(scriptSource).not.toContain("'unsafe-inline'");

    const inlineScripts = await page
      .locator("script:not([src])")
      .evaluateAll((scripts) =>
        scripts
          .map((script, index) => ({
            index,
            nonce: (script as HTMLScriptElement).nonce,
            type: (script as HTMLScriptElement).type || "text/javascript",
            content: script.textContent?.trim() ?? "",
          }))
          .filter((script) => script.content.length > 0),
      );
    const unauthorizedScripts = inlineScripts
      .filter((script) => script.nonce !== nonce)
      .map(({ index, nonce: scriptNonce, type, content }) => ({
        index,
        nonce: scriptNonce,
        type,
        preview: content.slice(0, 80),
      }));

    expect(inlineScripts.length).toBeGreaterThan(0);
    expect(
      unauthorizedScripts,
      "Every non-empty inline script must use the nonce from script-src",
    ).toEqual([]);
    expect(cspConsoleErrors).toEqual([]);
  });

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
