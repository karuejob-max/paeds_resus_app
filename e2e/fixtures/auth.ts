import { test as base, expect, type Page } from "@playwright/test";

export type AuthFixtures = {
  providerPage: Page;
};

async function loginProvider(page: Page): Promise<void> {
  const email = process.env.E2E_PROVIDER_EMAIL;
  const password = process.env.E2E_PROVIDER_PASSWORD;
  if (!email || !password) {
    throw new Error("E2E_PROVIDER_EMAIL and E2E_PROVIDER_PASSWORD are required for authenticated E2E");
  }

  await page.goto("/login");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL(/\/(home|resus|fellowship)/, { timeout: 30_000 });
}

export const test = base.extend<AuthFixtures>({
  providerPage: async ({ page }, use) => {
    await loginProvider(page);
    await use(page);
  },
});

export { expect };

export function hasProviderCredentials(): boolean {
  return Boolean(process.env.E2E_PROVIDER_EMAIL && process.env.E2E_PROVIDER_PASSWORD);
}
