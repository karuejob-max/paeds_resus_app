import { describe, it, expect } from "vitest";
import {
  computeResusGpsPillarPercentage,
  normalizeToFellowshipResusConditionId,
  resolveFellowshipDiagnosisFromSession,
  getFellowshipMicrocourseResusConditionCount,
} from "../../shared/fellowship-microcourse-resus-conditions";

describe("fellowship-microcourse-resus-conditions", () => {
  it("maps ResusGPS protocol ids to fellowship condition slugs", () => {
    expect(normalizeToFellowshipResusConditionId("septic_shock")).toBe("septic_shock");
    expect(normalizeToFellowshipResusConditionId("severe_asthma")).toBe("severe_asthma");
    expect(normalizeToFellowshipResusConditionId("asthma-i")).toBe("severe_asthma");
    expect(normalizeToFellowshipResusConditionId("seriously-ill-child-i")).toBe("seriously_ill_child");
    expect(normalizeToFellowshipResusConditionId("dka")).toBe("dka");
    expect(normalizeToFellowshipResusConditionId("DKA")).toBe("dka");
    expect(normalizeToFellowshipResusConditionId("diabetic_ketoacidosis")).toBe("dka");
    expect(normalizeToFellowshipResusConditionId("hyperglycaemia")).toBe("dka");
    expect(normalizeToFellowshipResusConditionId("Hyperglycemia — Rule Out DKA")).toBe("dka");
  });

  it("reflects partial pillar progress after one credited case", () => {
    const pct = computeResusGpsPillarPercentage({ dka: 1 }, 15);
    expect(pct).toBeGreaterThan(0);
    expect(pct).toBeLessThan(100);
  });

  it("resolves primary diagnosis from session for fellowship credit", () => {
    const id = resolveFellowshipDiagnosisFromSession({
      definitiveDiagnosis: "septic_shock",
      concurrentDiagnoses: [],
      phase: "SECONDARY_SURVEY",
      activeThreat: { id: "warm_shock" },
    });
    expect(id).toBe("septic_shock");
  });

  it("uses primary DKA over sepsis co-diagnosis for fellowship credit", () => {
    const id = resolveFellowshipDiagnosisFromSession({
      definitiveDiagnosis: "dka",
      concurrentDiagnoses: ["sepsis"],
      phase: "DEFINITIVE_CARE",
      activeThreat: null,
    });
    expect(id).toBe("dka");
  });

  it("exposes 15 foundational micro-course conditions (incl. seriously ill child)", () => {
    expect(getFellowshipMicrocourseResusConditionCount()).toBe(15);
  });
});
