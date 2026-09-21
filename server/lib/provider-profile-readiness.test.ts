import { describe, expect, it } from "vitest";
import { calculateProviderIdentityReadiness } from "../routers/provider";

describe("provider identity readiness", () => {
  it("allows a non-licensed provider to reach 100% with the four identity fields", () => {
    expect(calculateProviderIdentityReadiness({
      specialization: "Paediatrics",
      yearsOfExperience: 3,
      bio: "Paediatric emergency care provider",
      languages: "[\"English\"]",
    }, false, false)).toEqual({
      completionPercentage: 100,
      identityComplete: true,
    });
  });

  it("keeps current license evidence in the completion score for licensed providers", () => {
    expect(calculateProviderIdentityReadiness({
      specialization: "Emergency Medicine",
      yearsOfExperience: 2,
      bio: "Emergency care provider",
      languages: "[\"English\"]",
    }, true, false)).toEqual({
      completionPercentage: 80,
      identityComplete: true,
    });
  });
});
