import { defineConfig } from "checkly";

export default defineConfig({
  projectName: "TradeFeed synthetic monitoring",
  logicalId: "tradefeed-synthetic-monitoring",
  repoUrl: "https://github.com/yasinjemal/TradeFeed",
  checks: {
    checkMatch: "monitoring/checkly/**/*.check.ts",
    locations: ["eu-central-1"],
    runtimeId: "2025.04",
    playwrightConfig: {
      timeout: 90_000,
      expect: {
        timeout: 15_000,
      },
      use: {
        actionTimeout: 15_000,
        navigationTimeout: 30_000,
        userAgent: "TradeFeed-Checkly/1.0 (+https://www.checklyhq.com/)",
        viewport: {
          width: 1280,
          height: 900,
        },
      },
    },
  },
  cli: {
    runLocation: "eu-central-1",
    reporters: ["list"],
    retries: 0,
  },
});
