import { describe, expect, it } from "vitest";
import {
  INSTITUTION_PLATFORM_NEED_OPTIONS,
  INSTITUTION_TYPE_OPTIONS,
} from "./institution-onboarding";

describe("institution onboarding options", () => {
  it("includes broader organization audiences", () => {
    const values = INSTITUTION_TYPE_OPTIONS.map((option) => option.value);

    expect(values).toContain("faith_based_hospital");
    expect(values).toContain("training_provider");
    expect(values).toContain("professional_association_ngo");
    expect(values).toContain("government_health_program");
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
