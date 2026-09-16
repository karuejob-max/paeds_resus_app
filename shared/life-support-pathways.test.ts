import { describe, expect, it } from "vitest";
import {
  getLifeSupportRequiredPhases,
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

  it("marks supporting records as non-final and the final record as the credential", () => {
    const pathway = getLifeSupportPathway("bls");
    expect(pathway?.phases.find((phase) => phase.key === "phase1")?.recordKind).toBe("gatepass");
    expect(pathway?.phases.find((phase) => phase.key === "phase3")?.recordKind).toBe("completion");
    expect(pathway?.phases.find((phase) => phase.key === "final")?.recordKind).toBe("credential");
  });
});
