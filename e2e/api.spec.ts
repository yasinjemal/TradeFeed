// ============================================================
// E2E Smoke Test — Health & API
// ============================================================
// Verifies API endpoints return correct responses
// and the application is healthy.
// ============================================================

import { test, expect } from "@playwright/test";

test.describe("Health & API", () => {
  test("GET /api/health returns 200 with ok status", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.status).toBe("ok");
  });

  test("GET /api/og returns an image", async ({ request }) => {
    const res = await request.get("/api/og?title=Test");

    // OG image endpoint should return 200 with an image content type
    expect(res.status()).toBe(200);
    const contentType = res.headers()["content-type"];
    expect(contentType).toMatch(/image\//);
  });

  test("protected API returns 401 without auth", async ({ request }) => {
    // Cron endpoint requires CRON_SECRET header
    const res = await request.get("/api/cron/data-retention");
    expect(res.status()).toBe(401);
  });
});
