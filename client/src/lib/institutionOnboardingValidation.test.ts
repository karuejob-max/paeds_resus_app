import { describe, expect, it } from "vitest";
import { validateSecondAdminContact } from "./institutionOnboardingValidation";

describe("validateSecondAdminContact", () => {
  const primary = "primary@hospital.example";

  it("requires both second-administrator name and email", () => {
    expect(
      validateSecondAdminContact({
        secondAdminName: "",
        secondAdminEmail: "",
        contactEmail: primary,
      })
    ).toContain("second named administrator before creating");
  });

  it("rejects an invalid second-administrator email", () => {
    expect(
      validateSecondAdminContact({
        secondAdminName: "Second Admin",
        secondAdminEmail: "not-an-email",
        contactEmail: primary,
      })
    ).toBe("Enter a valid email address for the second administrator.");
  });

  it("rejects the primary contact email as the second administrator", () => {
    expect(
      validateSecondAdminContact({
        secondAdminName: "Second Admin",
        secondAdminEmail: ` ${primary.toUpperCase()} `,
        contactEmail: primary,
      })
    ).toContain("Use a different email address");
  });

  it("accepts a distinct second administrator", () => {
    expect(
      validateSecondAdminContact({
        secondAdminName: " Second Admin ",
        secondAdminEmail: " second@hospital.example ",
        contactEmail: primary,
      })
    ).toBeNull();
  });
});
