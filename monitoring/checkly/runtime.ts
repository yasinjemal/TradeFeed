import type { Page, Response } from "@playwright/test";

export const SYNTHETIC_HEADER = "x-tradefeed-synthetic";
export const SYNTHETIC_VALUE = "checkly";

const unresolvedAccountVariable = /^\{\{[^{}]+\}\}$/;

export function requiredEnvironmentVariable(name: string): string {
  const value = process.env[name]?.trim();

  if (!value || unresolvedAccountVariable.test(value)) {
    throw new Error(
      `Missing ${name}. Configure it as a Checkly account environment variable or pass it with --env-file.`,
    );
  }

  return value;
}

export function requiredPathSegment(name: string): string {
  const value = requiredEnvironmentVariable(name);

  if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
    throw new Error(
      `${name} must contain only letters, numbers, underscores, and hyphens.`,
    );
  }

  return value;
}

export function requiredHttpsBaseUrl(name: string): URL {
  const raw = requiredEnvironmentVariable(name);
  let url: URL;

  try {
    url = new URL(raw);
  } catch {
    throw new Error(`${name} must be an absolute URL.`);
  }

  if (url.protocol !== "https:") {
    throw new Error(`${name} must use HTTPS because Checkly runs from the public cloud.`);
  }

  if (
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error(`${name} must contain only an HTTPS origin, without credentials or a path.`);
  }

  return url;
}

export function syntheticUrl(baseUrl: URL, pathname: string): string {
  const url = new URL(pathname, baseUrl);
  url.searchParams.set("synthetic", SYNTHETIC_VALUE);
  url.searchParams.set("utm_source", "synthetic");
  url.searchParams.set("utm_medium", "monitoring");
  url.searchParams.set("utm_campaign", "checkly");
  return url.toString();
}

export async function installSyntheticSignals(
  page: Page,
  baseUrl: URL,
): Promise<void> {
  const escapedOrigin = baseUrl.origin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const sameOriginRequest = new RegExp(`^${escapedOrigin}(?:/|$)`);

  await page.route(sameOriginRequest, async (route) => {
    await route.continue({
      headers: {
        ...route.request().headers(),
        [SYNTHETIC_HEADER]: SYNTHETIC_VALUE,
      },
    });
  });

  await page.addInitScript(
    ({ expectedHost, marker }) => {
      if (window.location.host !== expectedHost) return;

      window.localStorage.setItem("tradefeed.synthetic", marker);
      window.sessionStorage.setItem("tradefeed.synthetic", marker);
      document.cookie =
        `tradefeed_synthetic=${marker}; Path=/; SameSite=Lax; Secure`;
    },
    {
      expectedHost: baseUrl.host,
      marker: SYNTHETIC_VALUE,
    },
  );
}

export function assertSuccessfulNavigation(
  response: Response | null,
  label: string,
): void {
  if (!response) {
    throw new Error(`${label} did not produce a main-document response.`);
  }

  if (response.status() >= 400) {
    throw new Error(`${label} returned HTTP ${response.status()}.`);
  }
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
