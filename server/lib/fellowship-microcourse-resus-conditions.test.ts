import { describe, it, expect } from "vitest";
import {
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

  it("exposes 15 foundational micro-course conditions (incl. seriously ill child)", () => {
    expect(getFellowshipMicrocourseResusConditionCount()).toBe(15);
  });
});
