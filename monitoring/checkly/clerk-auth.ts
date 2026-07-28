import type { BrowserContext, Page } from "@playwright/test";

const CLERK_API_URL = "https://api.clerk.com/v1";
const CLERK_TESTING_TOKEN_PARAM = "__clerk_testing_token";

type ClerkUser = {
  id: string;
};

type ClerkTestingToken = {
  token: string;
};

type ClerkSignInToken = {
  token: string;
};

type ClerkUserList =
  | ClerkUser[]
  | {
      data?: ClerkUser[];
    };

async function clerkApiRequest<T>(
  pathname: string,
  secretKey: string,
  init: RequestInit = {},
): Promise<T> {
  let lastStatus = 0;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(`${CLERK_API_URL}${pathname}`, {
      ...init,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
        ...init.headers,
      },
    });

    lastStatus = response.status;
    if (response.ok) {
      return (await response.json()) as T;
    }

    if (![429, 500, 502, 503, 504].includes(response.status) || attempt === 2) {
      const body = (await response.text()).slice(0, 300);
      throw new Error(
        `Clerk Backend API ${pathname} returned HTTP ${response.status}: ${body}`,
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt));
  }

  throw new Error(`Clerk Backend API ${pathname} returned HTTP ${lastStatus}.`);
}

function validateFrontendApiUrl(frontendApiUrl: string): void {
  if (
    frontendApiUrl.includes("://") ||
    frontendApiUrl.includes("/") ||
    !/^[a-zA-Z0-9.-]+$/.test(frontendApiUrl)
  ) {
    throw new Error(
      "CHECKLY_CLERK_FRONTEND_API_URL must be a hostname without a protocol or path.",
    );
  }
}

async function addClerkTestingToken(
  context: BrowserContext,
  frontendApiUrl: string,
  testingToken: string,
): Promise<void> {
  const escapedHost = frontendApiUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const frontendApiRequest = new RegExp(
    `^https://${escapedHost}/v1/.*?(?:\\?.*)?$`,
  );

  await context.route(frontendApiRequest, async (route) => {
    const url = new URL(route.request().url());
    url.searchParams.set(CLERK_TESTING_TOKEN_PARAM, testingToken);

    const response = await route.fetch({ url: url.toString() });
    const contentType = response.headers()["content-type"] ?? "";

    if (!contentType.includes("application/json")) {
      await route.fulfill({ response });
      return;
    }

    const json = (await response.json()) as {
      response?: { captcha_bypass?: boolean };
      client?: { captcha_bypass?: boolean };
    };

    if (json.response?.captcha_bypass === false) {
      json.response.captcha_bypass = true;
    }
    if (json.client?.captcha_bypass === false) {
      json.client.captcha_bypass = true;
    }

    await route.fulfill({ response, json });
  });
}

export async function signInDedicatedClerkUser(options: {
  page: Page;
  emailAddress: string;
  secretKey: string;
  frontendApiUrl: string;
  appHomeUrl: string;
}): Promise<void> {
  const {
    page,
    emailAddress,
    secretKey,
    frontendApiUrl,
    appHomeUrl,
  } = options;

  validateFrontendApiUrl(frontendApiUrl);

  const testingToken = await clerkApiRequest<ClerkTestingToken>(
    "/testing_tokens",
    secretKey,
    {
      method: "POST",
      body: "{}",
    },
  );

  await addClerkTestingToken(
    page.context(),
    frontendApiUrl,
    testingToken.token,
  );

  const userList = await clerkApiRequest<ClerkUserList>(
    `/users?email_address=${encodeURIComponent(emailAddress)}&limit=2`,
    secretKey,
  );
  const users = Array.isArray(userList) ? userList : (userList.data ?? []);

  if (users.length !== 1 || !users[0]?.id) {
    throw new Error(
      `Expected exactly one dedicated Clerk user for ${emailAddress}, found ${users.length}.`,
    );
  }

  const signInToken = await clerkApiRequest<ClerkSignInToken>(
    "/sign_in_tokens",
    secretKey,
    {
      method: "POST",
      body: JSON.stringify({
        user_id: users[0].id,
        expires_in_seconds: 300,
      }),
    },
  );

  await page.goto(appHomeUrl, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(
    () => {
      const clerk = (
        window as unknown as {
          Clerk?: {
            loaded?: boolean;
          };
        }
      ).Clerk;
      return clerk?.loaded === true;
    },
    undefined,
    { timeout: 30_000 },
  );

  await page.evaluate(async (ticket) => {
    const clerk = (
      window as unknown as {
        Clerk?: {
          client?: {
            signIn?: {
              create: (input: {
                strategy: "ticket";
                ticket: string;
              }) => Promise<{
                status: string;
                createdSessionId?: string | null;
              }>;
            };
          };
          setActive: (input: { session: string }) => Promise<void>;
        };
      }
    ).Clerk;

    if (!clerk?.client?.signIn) {
      throw new Error("Clerk did not load on the application home page.");
    }

    const attempt = await clerk.client.signIn.create({
      strategy: "ticket",
      ticket,
    });

    if (attempt.status !== "complete" || !attempt.createdSessionId) {
      throw new Error(`Clerk ticket sign-in ended with status ${attempt.status}.`);
    }

    await clerk.setActive({ session: attempt.createdSessionId });
  }, signInToken.token);

  await page.waitForFunction(
    () => {
      const clerk = (
        window as unknown as {
          Clerk?: {
            user?: unknown;
          };
        }
      ).Clerk;
      return Boolean(clerk?.user);
    },
    undefined,
    { timeout: 30_000 },
  );
}
