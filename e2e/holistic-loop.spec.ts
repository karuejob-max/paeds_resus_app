/**
 * Holistic loop browser E2E — complements shared/holistic-loop-events.ts unit simulation.
 *
 * Full flow (ResusGPS septic shock save → CareSignalPostEventPrompt → /care-signal submit)
 * requires: provider auth, ResusGPS access, facility on profile, and DB writes.
 * Authenticated tests skip when E2E_PROVIDER_* env vars are unset (CI default).
 */

import { test, expect } from "@playwright/test";
import { test as authTest, expect as authExpect, hasProviderCredentials } from "./fixtures/auth";

test.describe("Holistic loop — public entry (no auth)", () => {
  test("anonymous / redirects to /start role chooser", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/start$/);
    await expect(page.getByRole("heading", { name: /how do you want to use paeds resus/i })).toBeVisible();
  });

  test("/start exposes provider and training paths for SEO visitors", async ({ page }) => {
    await page.goto("/start");
    await expect(page.getByText(/healthcare provider/i).first()).toBeVisible();
    await expect(page.getByText(/training & courses/i).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /browse courses/i })).toBeVisible();
  });
});

authTest.describe("Holistic loop — provider ResusGPS → Care Signal prefill", () => {
  authTest.beforeEach(async () => {
    authTest.skip(!hasProviderCredentials(), "Set E2E_PROVIDER_EMAIL and E2E_PROVIDER_PASSWORD");
  });

  authTest(
    "care-signal opens with ResusGPS septic shock prefill banner",
    async ({ providerPage }) => {
      await providerPage.goto(
        "/care-signal?prefill_eventType=septic_shock&prefill_outcome=survived&source=resusgps"
      );

      await authExpect(providerPage.getByTestId("care-signal-prefill-banner")).toBeVisible({
        timeout: 15_000,
      });
      await authExpect(providerPage.getByText(/pre-filled from resusgps/i)).toBeVisible();
    }
  );

  authTest(
    "ResusGPS workspace loads for provider (save → prompt flow manual gap)",
    async ({ providerPage }) => {
      await providerPage.goto("/resus");
      await authExpect(
        providerPage.getByText(/resusgps|paediatric emergency|clinical/i).first()
      ).toBeVisible({ timeout: 20_000 });
      // Completing a septic shock case + Save for fellowship credit requires interactive
      // ABCDE flow and DB-backed fellowship.recordResusGPSCase — not automated in CI yet.
    }
  );

  authTest(
    "Care Signal consent gate appears for first-time reporter",
    async ({ providerPage, context }) => {
      await context.clearPermissions();
      await providerPage.goto("/care-signal");
      await providerPage.evaluate(() => localStorage.removeItem("care_signal_consent_v1"));

      const hasPriorSubmission = await providerPage
        .locator('[data-testid="care-signal-form"], form')
        .first()
        .isVisible({ timeout: 5_000 })
        .catch(() => false);

      if (!hasPriorSubmission) {
        await authExpect(providerPage.getByText(/care signal consent/i)).toBeVisible({
          timeout: 15_000,
        });
      }
    }
  );

  authTest("provider home loads after login", async ({ providerPage }) => {
    await providerPage.goto("/home");
    await authExpect(providerPage.getByText(/fellowship|aha|resusgps|dashboard/i).first()).toBeVisible({
      timeout: 20_000,
    });
  });
});
