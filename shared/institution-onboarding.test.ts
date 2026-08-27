import { describe, expect, it } from "vitest";
import {
  CARE_FACILITY_LEVEL_OPTIONS,
  INSTITUTION_PLATFORM_NEED_OPTIONS,
  INSTITUTION_TYPE_OPTIONS,
  requiresCareFacilityClassification,
} from "./institution-onboarding";

describe("institution onboarding options", () => {
  it("includes broader organization audiences", () => {
    const values = INSTITUTION_TYPE_OPTIONS.map((option) => option.value);

    expect(values).toContain("healthcare_facility");
    expect(values).toContain("teaching_and_referral_facility");
    expect(values).toContain("health_professional_training_institution");
    expect(values).toContain("continuing_professional_development_provider");
    expect(values).toContain("professional_association_or_ngo");
    expect(values).toContain("public_health_programme");
  });

  it("requires care classification only for care-delivery organizations", () => {
    const levels = CARE_FACILITY_LEVEL_OPTIONS.map((option) => option.value);

    expect(requiresCareFacilityClassification("healthcare_facility")).toBe(true);
    expect(requiresCareFacilityClassification("teaching_and_referral_facility")).toBe(true);
    expect(requiresCareFacilityClassification("health_professional_training_institution")).toBe(false);
    expect(levels).toEqual([
      "primary_level_1",
      "primary_level_2",
      "primary_level_3",
      "primary_level_4",
      "secondary_level_5",
      "tertiary_level_6",
      "quaternary",
      "other_or_not_sure",
    ]);
  });

  it("collects current platform needs rather than course selections", () => {
    const values = INSTITUTION_PLATFORM_NEED_OPTIONS.map((option) => option.value);

    expect(values).toContain("cpd_portal");
    expect(values).toContain("iers_readiness");
    expect(values).toContain("paeds_resus_training");
    expect(values).not.toContain("bls");
    expect(values).not.toContain("acls");
    expect(values).not.toContain("pals");
    expect(values).not.toContain("nrp");
  });
});
