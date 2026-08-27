import { describe, expect, it } from "vitest";
import {
  canEnterNerpNurseCampaign,
  isNerpNurseCandidate,
  requiresExternalCandidateCadre,
} from "./nerp-external-candidate";

describe("external NERP candidate policy", () => {
  it("keeps existing nurse cases in the NERP nurse category", () => {
    expect(isNerpNurseCandidate("nerp_nurse")).toBe(true);
    expect(requiresExternalCandidateCadre("nerp_nurse")).toBe(false);
    expect(canEnterNerpNurseCampaign("nerp_nurse")).toBe(true);
  });

  it("requires a cadre and excludes non-nurse outside-pathway cases from NERP campaigns", () => {
    expect(isNerpNurseCandidate("non_nurse_external")).toBe(false);
    expect(requiresExternalCandidateCadre("non_nurse_external")).toBe(true);
    expect(canEnterNerpNurseCampaign("non_nurse_external")).toBe(false);
  });
});
