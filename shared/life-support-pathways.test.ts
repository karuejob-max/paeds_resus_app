import { describe, expect, it } from "vitest";
import {
  getLifeSupportCognitiveProgramType,
  getLifeSupportRequiredPhases,
  isLifeSupportCertificateProgramType,
  getLifeSupportPathway,
  requiresLifeSupportPhase,
} from "./life-support-pathways";

describe("Life Support pathway definitions", () => {
  it("does not include Phase 2 for BLS or Heartsaver", () => {
    expect(requiresLifeSupportPhase("bls", "phase2")).toBe(false);
    expect(requiresLifeSupportPhase("heartsaver", "phase2")).toBe(false);
    expect(getLifeSupportRequiredPhases("bls")).toEqual(["phase1", "phase3", "final"]);
    expect(getLifeSupportRequiredPhases("heartsaver")).toEqual(["phase1", "phase3", "final"]);
  });

  it("requires Phase 2 for advanced pathways", () => {
    expect(requiresLifeSupportPhase("acls", "phase2")).toBe(true);
    expect(requiresLifeSupportPhase("pals", "phase2")).toBe(true);
    expect(requiresLifeSupportPhase("nrp", "phase2")).toBe(true);
    expect(getLifeSupportPathway("acls")?.phases.map((phase) => phase.applicable)).toEqual([true, true, true, true]);
  });

  it("maps cognitive completion to the stored certificate program type", () => {
    expect(getLifeSupportCognitiveProgramType("bls")).toBe("bls_cognitive");
    expect(getLifeSupportCognitiveProgramType("acls")).toBe("acls_cognitive");
    expect(getLifeSupportCognitiveProgramType("instructor")).toBe("instructor");
  });

  it("classifies supporting and final Life Support certificates together", () => {
    expect(isLifeSupportCertificateProgramType("bls_cognitive")).toBe(true);
    expect(isLifeSupportCertificateProgramType("paeds_resus_bls_phase3")).toBe(true);
    expect(isLifeSupportCertificateProgramType("paeds_resus_acls_provider")).toBe(true);
    expect(isLifeSupportCertificateProgramType("paeds_resus_acls_phase3")).toBe(true);
    expect(isLifeSupportCertificateProgramType("paeds_resus_pals_phase3")).toBe(true);
    expect(isLifeSupportCertificateProgramType("fellowship_diploma")).toBe(false);
  });

  it("keeps a downloadable Phase 3 progress record in every displayed pathway", () => {
    for (const course of ["bls", "acls", "pals", "nrp", "heartsaver", "instructor"] as const) {
      const phase3 = getLifeSupportPathway(course)?.phases.find((phase) => phase.key === "phase3");
      expect(phase3?.applicable).toBe(true);
      expect(phase3?.recordKind).toBe("completion");
    }
  });

  it("marks supporting records as non-final and the final record as the credential", () => {
    const pathway = getLifeSupportPathway("bls");
    expect(pathway?.phases.find((phase) => phase.key === "phase1")?.recordKind).toBe("gatepass");
    expect(pathway?.phases.find((phase) => phase.key === "phase3")?.recordKind).toBe("completion");
    expect(pathway?.phases.find((phase) => phase.key === "final")?.recordKind).toBe("credential");
  });
});
