import { describe, expect, it } from "vitest";
import { validateSecondAdminSelection } from "./institutionOnboardingValidation";

describe("validateSecondAdminSelection", () => {
  it("requires a selected existing account", () => {
    expect(
      validateSecondAdminSelection({ primaryAdminUserId: 1, secondAdminUserId: null }),
    ).toBe("Select the second administrator from the existing Paeds Resus accounts.");
  });

  it("rejects selecting the primary administrator again", () => {
    expect(
      validateSecondAdminSelection({ primaryAdminUserId: 1, secondAdminUserId: 1 }),
    ).toBe("Select a different Paeds Resus account for the second administrator.");
  });

  it("accepts a different existing account", () => {
    expect(
      validateSecondAdminSelection({ primaryAdminUserId: 1, secondAdminUserId: 2 }),
    ).toBeNull();
  });
});
