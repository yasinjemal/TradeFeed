// ============================================================
// Playwright E2E Test Configuration
// ============================================================
// Smoke tests for critical user paths.
// Runs against a local Next.js dev server on port 3000.
//
// Usage:
//   npx playwright test           # run all e2e tests
//   npx playwright test --ui      # interactive UI mode
//   npx playwright show-report    # view last HTML report
// ============================================================

import { defineConfig, devices } from "@playwright/test";

const PORT = process.env.PORT ?? "3000";
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "html",

  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // Start the dev server automatically when running tests locally
  webServer: {
    command: "npm run dev",
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000, // 2 min — Turbopack first compile can be slow
  },
});
