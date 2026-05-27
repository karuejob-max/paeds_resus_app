import { defineConfig, devices } from "@playwright/test";

/**
 * Browser E2E for holistic loop and public entry flows.
 * Requires E2E_PROVIDER_EMAIL + E2E_PROVIDER_PASSWORD for authenticated tests.
 * Set PLAYWRIGHT_SKIP_WEBSERVER=1 when the dev server is already running.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    ...devices["Desktop Chrome"],
  },
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
    ? undefined
    : {
        command: "pnpm run dev",
        url: "http://localhost:3000",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
