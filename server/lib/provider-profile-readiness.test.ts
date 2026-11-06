import { describe, expect, it } from "vitest";
import {
  calculateLicenceExperienceYears,
  calculateProviderIdentityReadiness,
  selectEffectiveRegulatoryLicence,
} from "../routers/provider";

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

  it("calculates completed years from the first verified licence anniversary", () => {
    expect(calculateLicenceExperienceYears(new Date("2020-11-07T00:00:00Z"), new Date("2026-11-06T00:00:00Z"))).toBe(5);
    expect(calculateLicenceExperienceYears(new Date("2020-11-06T00:00:00Z"), new Date("2026-11-06T00:00:00Z"))).toBe(6);
  });

  it("selects the newest verified regulatory licence by issue date", () => {
    const base = { credentialType: "regulatory_license", status: "verified", updatedAt: new Date("2026-01-01T00:00:00Z") } as any;
    const selected = selectEffectiveRegulatoryLicence([
      { ...base, id: 1, issuedAt: new Date("2019-01-01T00:00:00Z") },
      { ...base, id: 2, issuedAt: new Date("2021-01-01T00:00:00Z") },
    ]);
    expect(selected?.id).toBe(2);
  });
});
