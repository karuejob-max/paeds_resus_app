/**
 * E2E tests for complete enrollment flow
 * Tests: course selection → enrollment modal → payment → certificate
 */

import { test, expect, Page } from "@playwright/test";

// Helper to login user
async function loginUser(page: Page, role: "admin" | "user" = "user") {
  // Navigate to home
  await page.goto("/");

  // Click login button
  const loginButton = page.locator("button:has-text('Login')");
  if (await loginButton.isVisible()) {
    await loginButton.click();
    // Wait for OAuth redirect
    await page.waitForURL(/oauth|auth/);
    // In real scenario, this would complete OAuth flow
    // For testing, we mock the auth state
  }
}

// Helper to navigate to courses
async function navigateToCourses(page: Page) {
  await page.goto("/courses");
  await page.waitForSelector("[data-testid='course-card']", { timeout: 5000 });
}

// Helper to select a course
async function selectCourse(page: Page, courseTitle: string) {
  const courseCard = page.locator(`[data-testid='course-card']:has-text("${courseTitle}")`);
  await courseCard.click();
  await page.waitForSelector("[data-testid='enrollment-modal']", { timeout: 5000 });
}

test.describe("Enrollment Flow E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Set auth state for tests
    await page.context().addCookies([
      {
        name: "auth_token",
        value: "test_token",
        domain: "localhost",
        path: "/",
      },
    ]);
  });

  test.describe("Admin-Free Enrollment Path", () => {
    test("should complete admin enrollment without payment", async ({ page }) => {
      // Navigate to courses
      await navigateToCourses(page);

      // Select a course
      await selectCourse(page, "Asthma Management I");

      // Verify enrollment modal is open
      const modal = page.locator("[data-testid='enrollment-modal']");
      await expect(modal).toBeVisible();

      // For admin user, should see admin-free button
      const adminButton = page.locator("button:has-text('Enroll (Admin - Free)')");
      await expect(adminButton).toBeVisible();

      // Click admin-free button
      await adminButton.click();

      // Wait for success message
      await page.waitForSelector("text=Enrollment Successful", { timeout: 5000 });
      await expect(page.locator("text=Enrollment Successful")).toBeVisible();

      // Close modal
      const closeButton = page.locator("button:has-text('Close')");
      await closeButton.click();

      // Verify enrollment appears in user's courses
      await page.goto("/my-courses");
      await expect(page.locator("text=Asthma Management I")).toBeVisible();
    });

    test("should not show admin-free button for regular users", async ({ page }) => {
      // Navigate to courses
      await navigateToCourses(page);

      // Select a course
      await selectCourse(page, "Asthma Management I");

      // For regular user, should NOT see admin-free button
      const adminButton = page.locator("button:has-text('Enroll (Admin - Free)')");
      await expect(adminButton).not.toBeVisible();

      // Should see promo code and payment options
      await expect(page.locator("button:has-text('Have a Promo Code?')")).toBeVisible();
      await expect(page.locator("button:has-text('Continue to Payment')")).toBeVisible();
    });
  });

  test.describe("Promo Code Enrollment Path", () => {
    test("should apply valid promo code and complete enrollment", async ({ page }) => {
      // Navigate to courses
      await navigateToCourses(page);

      // Select a course
      await selectCourse(page, "Asthma Management I");

      // Click "Have a Promo Code?"
      const promoButton = page.locator("button:has-text('Have a Promo Code?')");
      await promoButton.click();

      // Enter promo code
      const promoInput = page.locator("input[placeholder='PROMO123']");
      await promoInput.fill("HALF50");

      // Click validate
      const validateButton = page.locator("button:has-text('Validate Code')");
      await validateButton.click();

      // Wait for discount message
      await page.waitForSelector("text=Discount Applied: 50%", { timeout: 5000 });
      await expect(page.locator("text=Discount Applied: 50%")).toBeVisible();

      // Verify discounted price is shown
      const discountedPrice = page.locator("text=KES 100.00"); // 50% of 200
      await expect(discountedPrice).toBeVisible();

      // Close modal (promo-only enrollment is complete)
      const closeButton = page.locator("button:has-text('Close')");
      await closeButton.click();

      // Verify enrollment appears in user's courses
      await page.goto("/my-courses");
      await expect(page.locator("text=Asthma Management I")).toBeVisible();
    });

    test("should handle 100% discount promo code (free)", async ({ page }) => {
      // Navigate to courses
      await navigateToCourses(page);

      // Select a course
      await selectCourse(page, "Asthma Management I");

      // Click "Have a Promo Code?"
      const promoButton = page.locator("button:has-text('Have a Promo Code?')");
      await promoButton.click();

      // Enter 100% discount promo code
      const promoInput = page.locator("input[placeholder='PROMO123']");
      await promoInput.fill("FREE100");

      // Click validate
      const validateButton = page.locator("button:has-text('Validate Code')");
      await validateButton.click();

      // Should complete enrollment immediately (free)
      await page.waitForSelector("text=Enrollment Successful", { timeout: 5000 });
      await expect(page.locator("text=Enrollment Successful")).toBeVisible();

      // Close modal
      const closeButton = page.locator("button:has-text('Close')");
      await closeButton.click();

      // Verify enrollment appears in user's courses
      await page.goto("/my-courses");
      await expect(page.locator("text=Asthma Management I")).toBeVisible();
    });

    test("should reject invalid promo code", async ({ page }) => {
      // Navigate to courses
      await navigateToCourses(page);

      // Select a course
      await selectCourse(page, "Asthma Management I");

      // Click "Have a Promo Code?"
      const promoButton = page.locator("button:has-text('Have a Promo Code?')");
      await promoButton.click();

      // Enter invalid promo code
      const promoInput = page.locator("input[placeholder='PROMO123']");
      await promoInput.fill("INVALID");

      // Click validate
      const validateButton = page.locator("button:has-text('Validate Code')");
      await validateButton.click();

      // Should show error message
      await page.waitForSelector("text=Invalid promo code", { timeout: 5000 });
      await expect(page.locator("text=Invalid promo code")).toBeVisible();
    });
  });

  test.describe("M-Pesa Payment Path", () => {
    test("should initiate M-Pesa payment with phone number", async ({ page }) => {
      // Navigate to courses
      await navigateToCourses(page);

      // Select a course
      await selectCourse(page, "Asthma Management I");

      // Click "Continue to Payment"
      const paymentButton = page.locator("button:has-text('Continue to Payment')");
      await paymentButton.click();

      // Verify payment step is shown
      await expect(page.locator("text=Amount to Pay: KES 200.00")).toBeVisible();

      // Enter phone number
      const phoneInput = page.locator("input[placeholder='0712345678']");
      await phoneInput.fill("0712345678");

      // Click "Pay with M-Pesa"
      const payButton = page.locator("button:has-text('Pay with M-Pesa')");
      await payButton.click();

      // Should show STK push message
      await page.waitForSelector("text=STK Push sent", { timeout: 5000 });
      await expect(page.locator("text=STK Push sent")).toBeVisible();

      // Wait for success (simulated webhook)
      await page.waitForSelector("text=Enrollment Successful", { timeout: 10000 });
      await expect(page.locator("text=Enrollment Successful")).toBeVisible();
    });

    test("should require phone number for M-Pesa payment", async ({ page }) => {
      // Navigate to courses
      await navigateToCourses(page);

      // Select a course
      await selectCourse(page, "Asthma Management I");

      // Click "Continue to Payment"
      const paymentButton = page.locator("button:has-text('Continue to Payment')");
      await paymentButton.click();

      // Pay button should be disabled without phone
      const payButton = page.locator("button:has-text('Pay with M-Pesa')");
      await expect(payButton).toBeDisabled();

      // Enter phone number
      const phoneInput = page.locator("input[placeholder='0712345678']");
      await phoneInput.fill("0712345678");

      // Pay button should now be enabled
      await expect(payButton).toBeEnabled();
    });

    test("should handle M-Pesa payment failure gracefully", async ({ page }) => {
      // Navigate to courses
      await navigateToCourses(page);

      // Select a course
      await selectCourse(page, "Asthma Management I");

      // Click "Continue to Payment"
      const paymentButton = page.locator("button:has-text('Continue to Payment')");
      await paymentButton.click();

      // Enter invalid phone number (should fail)
      const phoneInput = page.locator("input[placeholder='0712345678']");
      await phoneInput.fill("invalid");

      // Click "Pay with M-Pesa"
      const payButton = page.locator("button:has-text('Pay with M-Pesa')");
      await payButton.click();

      // Should show error message
      await page.waitForSelector("text=Failed to initiate", { timeout: 5000 });
      await expect(page.locator("text=Failed to initiate")).toBeVisible();
    });
  });

  test.describe("Certificate Issuance", () => {
    test("should issue certificate after successful enrollment", async ({ page }) => {
      // Complete enrollment flow
      await navigateToCourses(page);
      await selectCourse(page, "Asthma Management I");

      // Use admin-free path for quick completion
      const adminButton = page.locator("button:has-text('Enroll (Admin - Free)')");
      if (await adminButton.isVisible()) {
        await adminButton.click();
      } else {
        // Use promo code path
        const promoButton = page.locator("button:has-text('Have a Promo Code?')");
        await promoButton.click();
        const promoInput = page.locator("input[placeholder='PROMO123']");
        await promoInput.fill("HALF50");
        const validateButton = page.locator("button:has-text('Validate Code')");
        await validateButton.click();
      }

      // Wait for success
      await page.waitForSelector("text=Enrollment Successful", { timeout: 5000 });

      // Close modal
      const closeButton = page.locator("button:has-text('Close')");
      await closeButton.click();

      // Navigate to my courses
      await page.goto("/my-courses");

      // Should see the course with certificate option
      const courseCard = page.locator("text=Asthma Management I");
      await expect(courseCard).toBeVisible();

      // Click on course to view details
      await courseCard.click();

      // Should show certificate download option
      const certificateButton = page.locator("button:has-text('Download Certificate')");
      await expect(certificateButton).toBeVisible();

      // Download certificate
      const downloadPromise = page.waitForEvent("download");
      await certificateButton.click();
      const download = await downloadPromise;

      // Verify PDF was downloaded
      expect(download.suggestedFilename()).toContain(".pdf");
    });
  });

  test.describe("Double Enrollment Prevention", () => {
    test("should prevent user from enrolling twice in same course", async ({ page }) => {
      // First enrollment
      await navigateToCourses(page);
      await selectCourse(page, "Asthma Management I");

      const adminButton = page.locator("button:has-text('Enroll (Admin - Free)')");
      if (await adminButton.isVisible()) {
        await adminButton.click();
        await page.waitForSelector("text=Enrollment Successful", { timeout: 5000 });
      }

      // Close modal
      const closeButton = page.locator("button:has-text('Close')");
      await closeButton.click();

      // Try to enroll again
      await navigateToCourses(page);
      await selectCourse(page, "Asthma Management I");

      // Should show error about already enrolled
      await page.waitForSelector("text=Already enrolled", { timeout: 5000 });
      await expect(page.locator("text=Already enrolled")).toBeVisible();
    });
  });

  test.describe("Course Selection and Navigation", () => {
    test("should display all available courses", async ({ page }) => {
      await navigateToCourses(page);

      // Should see multiple course cards
      const courseCards = page.locator("[data-testid='course-card']");
      const count = await courseCards.count();
      expect(count).toBeGreaterThan(0);
    });

    test("should show course details in enrollment modal", async ({ page }) => {
      await navigateToCourses(page);
      await selectCourse(page, "Asthma Management I");

      // Should show course title
      await expect(page.locator("text=Enroll in Asthma Management I")).toBeVisible();

      // Should show course cost
      await expect(page.locator("text=Course Cost: KES")).toBeVisible();

      // Should show course level
      await expect(page.locator("text=Level:")).toBeVisible();
    });

    test("should allow back navigation from enrollment modal", async ({ page }) => {
      await navigateToCourses(page);
      await selectCourse(page, "Asthma Management I");

      // Close modal
      const modal = page.locator("[data-testid='enrollment-modal']");
      const closeButton = modal.locator("button").first();
      await closeButton.click();

      // Should be back on courses page
      await expect(page.locator("[data-testid='course-card']")).toBeVisible();
    });
  });
});
